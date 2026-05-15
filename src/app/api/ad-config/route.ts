import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 兼容参考接口：/api/ad-config?app_id=com.san.test&channel=apple&timestamp=xxx&nonce=xxx
// 原参考路径 /api/san/ad-config 因路由兼容问题调整为此路径

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5分钟容忍窗口
const LOG_RETENTION_HOURS = 24;
const MAIN_QUERY_TIMEOUT_MS = 2000;
const LOG_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const AD_CONFIG_CACHE_TTL_MS = 5000;
const LEVEL_CONFIG_CACHE_TTL_MS = 30 * 1000;
const LOG_REQUEST_ID_MAX_LENGTH = 64;
const LOG_CHANNEL_MAX_LENGTH = 64;
const LOG_NONCE_MAX_LENGTH = 64;
const LOG_IP_MAX_LENGTH = 64;
const LOG_RESPONSE_MSG_MAX_LENGTH = 255;
const LOG_USER_AGENT_MAX_LENGTH = 512;

let lastLogCleanupAt = 0;

type LogEntry = {
  request_id: string;
  app_id: string;
  channel: string | null;
  nonce: string | null;
  response_code: number;
  response_msg: string;
  level: number | null;
  slot_count: number;
  ip: string | null;
  user_agent: string | null;
  latency_ms: number | null;
};

type AppRecord = {
  id: string;
  media_id: string | null;
  level: number;
};

type SlotRecord = {
  slot_name: string;
  ad_slot_id: string | null;
  enabled: boolean;
};

type LevelConfigRecord = {
  open_screen: boolean;
  banner: boolean;
  incentive_video: boolean;
  insert_full_screen: boolean;
};

type QueryError = {
  message: string;
} | null;

type AdConfigData = {
  list: Array<{
    name: string;
    app_id: string | null;
    val: string;
  }>;
  level: number;
};

type CachedAdConfig = {
  expiresAt: number;
  data: AdConfigData;
};

type AdConfigLookupResult =
  | { ok: true; data: AdConfigData }
  | { ok: false; code: number; msg: string };

const adConfigCache = new Map<string, CachedAdConfig>();
const inflightAdConfigRequests = new Map<string, Promise<AdConfigLookupResult>>();
const levelConfigCache = new Map<number, { expiresAt: number; data: LevelConfigRecord | null }>();

function truncate(value: string | null, maxLength: number): string | null {
  return value ? value.slice(0, maxLength) : null;
}

function getCachedAdConfig(appId: string): AdConfigData | null {
  const cached = adConfigCache.get(appId);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    adConfigCache.delete(appId);
    return null;
  }
  return cached.data;
}

function setCachedAdConfig(appId: string, data: AdConfigData) {
  adConfigCache.set(appId, {
    expiresAt: Date.now() + AD_CONFIG_CACHE_TTL_MS,
    data,
  });
}

function getCachedLevelConfig(level: number): LevelConfigRecord | null | undefined {
  const cached = levelConfigCache.get(level);
  if (!cached) {
    return undefined;
  }
  if (cached.expiresAt <= Date.now()) {
    levelConfigCache.delete(level);
    return undefined;
  }
  return cached.data;
}

function setCachedLevelConfig(level: number, data: LevelConfigRecord | null) {
  levelConfigCache.set(level, {
    expiresAt: Date.now() + LEVEL_CONFIG_CACHE_TTL_MS,
    data,
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

async function writeLog(log: LogEntry) {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('ad_config_logs').insert({
      request_id: log.request_id.slice(0, LOG_REQUEST_ID_MAX_LENGTH),
      app_id: log.app_id,
      channel: truncate(log.channel, LOG_CHANNEL_MAX_LENGTH),
      nonce: truncate(log.nonce, LOG_NONCE_MAX_LENGTH),
      response_code: log.response_code,
      response_msg: log.response_msg.slice(0, LOG_RESPONSE_MSG_MAX_LENGTH),
      level: log.level,
      slot_count: log.slot_count,
      ip: truncate(log.ip, LOG_IP_MAX_LENGTH),
      user_agent: truncate(log.user_agent, LOG_USER_AGENT_MAX_LENGTH),
      latency_ms: log.latency_ms,
    });
    if (error) {
      console.error('ad-config log write failed:', error);
    }
  } catch (e) {
    console.error('ad-config log write failed:', e);
  }
}

async function cleanExpiredLogs() {
  try {
    const client = getSupabaseClient();
    const cutoff = new Date(Date.now() - LOG_RETENTION_HOURS * 60 * 60 * 1000).toISOString();
    const { error } = await client.from('ad_config_logs').delete().lt('created_at', cutoff);
    if (error) {
      console.error('ad-config log cleanup failed:', error);
    }
  } catch (e) {
    console.error('ad-config log cleanup failed:', e);
  }
}

function scheduleLog(log: LogEntry) {
  setTimeout(() => {
    void writeLog(log);
  }, 0);
}

function scheduleLogCleanup() {
  const now = Date.now();
  if (now - lastLogCleanupAt < LOG_CLEANUP_INTERVAL_MS) {
    return;
  }
  lastLogCleanupAt = now;
  setTimeout(() => {
    void cleanExpiredLogs();
  }, 0);
}

async function loadAdConfig(appId: string): Promise<AdConfigLookupResult> {
  const cached = getCachedAdConfig(appId);
  if (cached) {
    return { ok: true, data: cached };
  }

  const inflight = inflightAdConfigRequests.get(appId);
  if (inflight) {
    return await inflight;
  }

  const requestPromise = (async (): Promise<AdConfigLookupResult> => {
    const client = getSupabaseClient();

    let app: AppRecord | null;
    let appError: QueryError;
    try {
      const appResult = await withTimeout(
        client
          .from('apps')
          .select('id, media_id, level')
          .eq('package_name', appId)
          .maybeSingle(),
        MAIN_QUERY_TIMEOUT_MS,
        'apps query timed out'
      );
      app = appResult.data;
      appError = appResult.error;
    } catch {
      return { ok: false, code: 50001, msg: '数据库查询超时' };
    }

    if (appError) {
      return { ok: false, code: 50001, msg: '数据库查询失败' };
    }

    if (!app) {
      return { ok: false, code: 40004, msg: '应用不存在' };
    }

    let slots: SlotRecord[] | null;
    let slotsError: QueryError;
    let levelConfig: LevelConfigRecord | null;
    let levelConfigError: QueryError = null;
    const cachedLevelConfig = getCachedLevelConfig(app.level);

    if (cachedLevelConfig !== undefined) {
      try {
        const slotsResult = await withTimeout(
          client
            .from('ad_slots')
            .select('slot_name, ad_slot_id, enabled')
            .eq('app_id', app.id)
            .eq('enabled', true),
          MAIN_QUERY_TIMEOUT_MS,
          'ad-slots query timed out'
        );
        slots = slotsResult.data;
        slotsError = slotsResult.error;
        levelConfig = cachedLevelConfig;
      } catch {
        return { ok: false, code: 50001, msg: '数据库查询超时' };
      }
    } else {
      try {
        const [slotsResult, levelConfigResult] = await withTimeout(
          Promise.all([
            client
              .from('ad_slots')
              .select('slot_name, ad_slot_id, enabled')
              .eq('app_id', app.id)
              .eq('enabled', true),
            client
              .from('ad_levels')
              .select('open_screen, banner, incentive_video, insert_full_screen')
              .eq('level', app.level)
              .maybeSingle(),
          ]),
          MAIN_QUERY_TIMEOUT_MS,
          'ad-config query timed out'
        );
        slots = slotsResult.data;
        slotsError = slotsResult.error;
        levelConfig = levelConfigResult.data;
        levelConfigError = levelConfigResult.error;
        if (!levelConfigError) {
          setCachedLevelConfig(app.level, levelConfig);
        }
      } catch {
        return { ok: false, code: 50001, msg: '数据库查询超时' };
      }
    }

    if (slotsError || levelConfigError) {
      return { ok: false, code: 50001, msg: '数据库查询失败' };
    }

    const levelSlotMap: Record<string, boolean> = {
      openScreenId: levelConfig?.open_screen ?? false,
      bannerId: levelConfig?.banner ?? false,
      IncentiveVideoId: levelConfig?.incentive_video ?? false,
      newInsertFullScreenId: levelConfig?.insert_full_screen ?? false,
    };

    const filteredSlots = (slots || []).filter((slot) => levelSlotMap[slot.slot_name] !== false);
    const data: AdConfigData = {
      list: filteredSlots.map((slot) => ({
        name: slot.slot_name,
        app_id: app.media_id,
        val: slot.ad_slot_id || '',
      })),
      level: app.level,
    };

    setCachedAdConfig(appId, data);
    return { ok: true, data };
  })();

  inflightAdConfigRequests.set(appId, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inflightAdConfigRequests.delete(appId);
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const appId = searchParams.get('app_id') || '';
  const channel = searchParams.get('channel');
  const timestamp = searchParams.get('timestamp');
  const nonce = searchParams.get('nonce');

  // 提取请求信息
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;

  // 后台异步清理过期日志（不阻塞请求）
  scheduleLogCleanup();

  // 参数校验
  if (!appId) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: '', channel, nonce,
      response_code: 40001, response_msg: '缺少app_id参数',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40001, msg: '缺少app_id参数', data: null });
  }

  if (!timestamp) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40001, response_msg: '缺少timestamp参数',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40001, msg: '缺少timestamp参数', data: null });
  }

  if (!nonce) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40001, response_msg: '缺少nonce参数',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40001, msg: '缺少nonce参数', data: null });
  }

  // timestamp 校验
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40002, response_msg: 'timestamp格式无效',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40002, msg: 'timestamp格式无效', data: null });
  }

  const now = Date.now();
  if (Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE_MS) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40003, response_msg: '请求已过期，timestamp超出有效时间窗口',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40003, msg: '请求已过期，timestamp超出有效时间窗口', data: null });
  }

  const configResult = await loadAdConfig(appId);
  if (!configResult.ok) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: configResult.code, response_msg: configResult.msg,
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: configResult.code, msg: configResult.msg, data: null });
  }

  const requestId = crypto.randomUUID();
  const latencyMs = Date.now() - startTime;

  // 记录成功日志
  scheduleLog({
    request_id: requestId, app_id: appId, channel, nonce,
    response_code: 10000, response_msg: 'APP广告配置获取成功',
    level: configResult.data.level, slot_count: configResult.data.list.length, ip, user_agent: userAgent,
    latency_ms: latencyMs,
  });

  return NextResponse.json({
    request_id: requestId,
    code: 10000,
    data: configResult.data,
    msg: 'APP广告配置获取成功',
  });
}
