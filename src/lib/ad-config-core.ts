import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ad-config 共享核心：缓存、日志、鉴权、配置加载。
// 供 V1 (/api/ad-config，query 传参) 与 V2 (/api/v2/ad-config，Header 传参) 复用。

export const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5分钟容忍窗口
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

export type LogEntry = {
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
  report: boolean;
  report_url: string | null;
  splash_url: string | null;
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

// 供 V1/V2 共用的核心数据：包含两版所需的全部字段，由各自路由裁剪响应。
// - report:     0/1，V1 使用（由 apps.report boolean 派生）
// - report_url: 上报地址字符串，V2 使用（apps.report_url，默认 ""）
// - splash_url: 启动页地址字符串，V2 使用（apps.splash_url，默认 ""）
export type AdConfigData = {
  list: Array<{
    name: string;
    app_id: string | null;
    val: string;
  }>;
  level: number;
  report: number;
  report_url: string;
  splash_url: string;
};

type CachedAdConfig = {
  expiresAt: number;
  data: AdConfigData;
};

export type AdConfigLookupResult =
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

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
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

export function scheduleLog(log: LogEntry) {
  setTimeout(() => {
    void writeLog(log);
  }, 0);
}

export function scheduleLogCleanup() {
  const now = Date.now();
  if (now - lastLogCleanupAt < LOG_CLEANUP_INTERVAL_MS) {
    return;
  }
  lastLogCleanupAt = now;
  setTimeout(() => {
    void cleanExpiredLogs();
  }, 0);
}

// 从请求头提取客户端 IP 与 User-Agent。
export function extractClientMeta(request: NextRequest): { ip: string | null; userAgent: string | null } {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;
  return { ip, userAgent };
}

export type AuthParams = {
  timestamp: string | null;
  nonce: string | null;
};

// 校验 timestamp / nonce（鉴权逻辑 V1、V2 共用）。
// 返回 null 表示校验通过，否则返回错误码与提示。
export function validateAuthParams(params: AuthParams): { code: number; msg: string } | null {
  if (!params.timestamp) {
    return { code: 40001, msg: '缺少timestamp参数' };
  }
  if (!params.nonce) {
    return { code: 40001, msg: '缺少nonce参数' };
  }

  const requestTime = parseInt(params.timestamp, 10);
  if (isNaN(requestTime)) {
    return { code: 40002, msg: 'timestamp格式无效' };
  }

  const now = Date.now();
  if (Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE_MS) {
    return { code: 40003, msg: '请求已过期，timestamp超出有效时间窗口' };
  }

  return null;
}

export async function loadAdConfig(appId: string): Promise<AdConfigLookupResult> {
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
          .select('id, media_id, level, report, report_url, splash_url')
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
      report: app.report ? 1 : 0,
      report_url: app.report_url ?? '',
      splash_url: app.splash_url ?? '',
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
