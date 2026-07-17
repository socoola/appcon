import { NextRequest, NextResponse } from 'next/server';
import {
  extractClientMeta,
  loadAdConfig,
  scheduleLog,
  scheduleLogCleanup,
  validateAuthParams,
} from '@/lib/ad-config-core';

// 兼容参考接口：/api/ad-config?app_id=com.san.test&channel=apple&timestamp=xxx&nonce=xxx
// 原参考路径 /api/san/ad-config 因路由兼容问题调整为此路径
// 业务/鉴权逻辑见 @/lib/ad-config-core，与 V2 (/api/v2/cfg) 共用

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const appId = searchParams.get('app_id') || '';
  const channel = searchParams.get('channel');
  const timestamp = searchParams.get('timestamp');
  const nonce = searchParams.get('nonce');

  const { ip, userAgent } = extractClientMeta(request);

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

  // timestamp / nonce 校验（与 V2 共用）
  const authError = validateAuthParams({ timestamp, nonce });
  if (authError) {
    const requestId = crypto.randomUUID();
    scheduleLog({
      request_id: requestId, app_id: appId, channel, nonce,
      response_code: authError.code, response_msg: authError.msg,
      level: null, slot_count: 0, ip, user_agent: userAgent,
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ request_id: requestId, code: authError.code, msg: authError.msg, data: null });
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
    data: {
      list: configResult.data.list,
      level: configResult.data.level,
      report: configResult.data.report,
      report_url: configResult.data.report_url,
      splash_url: configResult.data.splash_url,
      popup_url_1: configResult.data.popup_url_1,
      popup_url_2: configResult.data.popup_url_2,
      popup_url_3: configResult.data.popup_url_3,
      ad_order: configResult.data.ad_order,
    },
    msg: 'APP广告配置获取成功',
  });
}
