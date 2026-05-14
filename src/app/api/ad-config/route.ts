import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 兼容参考接口：/api/ad-config?app_id=com.san.test&channel=apple&timestamp=xxx&nonce=xxx
// 原参考路径 /api/san/ad-config 因路由兼容问题调整为此路径

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5分钟容忍窗口
const LOG_RETENTION_HOURS = 24;

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

async function writeLog(log: LogEntry) {
  try {
    const client = getSupabaseClient();
    await client.from('ad_config_logs').insert({
      request_id: log.request_id,
      app_id: log.app_id,
      channel: log.channel,
      nonce: log.nonce,
      response_code: log.response_code,
      response_msg: log.response_msg,
      level: log.level,
      slot_count: log.slot_count,
      ip: log.ip,
      user_agent: log.user_agent,
      latency_ms: log.latency_ms,
    });
  } catch {
    // 日志写入失败不影响主流程
  }
}

async function cleanExpiredLogs() {
  try {
    const client = getSupabaseClient();
    const cutoff = new Date(Date.now() - LOG_RETENTION_HOURS * 60 * 60 * 1000).toISOString();
    await client.from('ad_config_logs').delete().lt('created_at', cutoff);
  } catch {
    // 清理失败不影响主流程
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
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;

  // 后台异步清理过期日志（不阻塞请求）
  cleanExpiredLogs();

  // 参数校验
  if (!appId) {
    const requestId = crypto.randomUUID();
    writeLog({
      request_id: requestId, app_id: '', channel, nonce,
      response_code: 40001, response_msg: '缺少app_id参数',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40001, msg: '缺少app_id参数', data: null });
  }

  if (!timestamp) {
    const requestId = crypto.randomUUID();
    writeLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40001, response_msg: '缺少timestamp参数',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40001, msg: '缺少timestamp参数', data: null });
  }

  if (!nonce) {
    const requestId = crypto.randomUUID();
    writeLog({
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
    writeLog({
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
    writeLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40003, response_msg: '请求已过期，timestamp超出有效时间窗口',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40003, msg: '请求已过期，timestamp超出有效时间窗口', data: null });
  }

  const client = getSupabaseClient();

  // 查找应用
  const { data: app, error: appError } = await client
    .from('apps')
    .select('id, name, package_name, media_id, level')
    .eq('package_name', appId)
    .maybeSingle();

  if (appError) {
    const requestId = crypto.randomUUID();
    writeLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 50001, response_msg: '数据库查询失败',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 50001, msg: '数据库查询失败', data: null });
  }

  if (!app) {
    const requestId = crypto.randomUUID();
    writeLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 40004, response_msg: '应用不存在',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 40004, msg: '应用不存在', data: null });
  }

  // 查找广告位配置
  const { data: slots, error: slotsError } = await client
    .from('ad_slots')
    .select('slot_name, ad_slot_id, enabled')
    .eq('app_id', app.id)
    .eq('enabled', true);

  if (slotsError) {
    const requestId = crypto.randomUUID();
    writeLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: 50001, response_msg: '数据库查询失败',
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: 50001, msg: '数据库查询失败', data: null });
  }

  // 查找当前等级配置
  const { data: levelConfig } = await client
    .from('ad_levels')
    .select('*')
    .eq('level', app.level)
    .maybeSingle();

  const levelSlotMap: Record<string, boolean> = {
    openScreenId: levelConfig?.open_screen ?? false,
    bannerId: levelConfig?.banner ?? false,
    IncentiveVideoId: levelConfig?.incentive_video ?? false,
    newInsertFullScreenId: levelConfig?.insert_full_screen ?? false,
  };

  const filteredSlots = (slots || []).filter((slot: { slot_name: string }) => levelSlotMap[slot.slot_name] !== false);

  const list = filteredSlots.map((slot: { slot_name: string; ad_slot_id: string | null }) => ({
    name: slot.slot_name,
    app_id: app.media_id,
    val: slot.ad_slot_id || '',
  }));

  const requestId = crypto.randomUUID();
  const latencyMs = Date.now() - startTime;

  // 记录成功日志
  writeLog({
    request_id: requestId, app_id: appId, channel, nonce,
    response_code: 10000, response_msg: 'APP广告配置获取成功',
    level: app.level, slot_count: list.length, ip, user_agent: userAgent,
    latency_ms: latencyMs,
  });

  return NextResponse.json({
    request_id: requestId,
    code: 10000,
    data: { list, level: app.level },
    msg: 'APP广告配置获取成功',
  });
}
