import { NextRequest, NextResponse } from 'next/server';
import {
  extractClientMeta,
  loadAdConfig,
  scheduleLog,
  scheduleLogCleanup,
  validateAuthParams,
} from '@/lib/ad-config-core';

// V2 广告配置接口：/api/v2/cfg?app_id=com.san.test
// 与 V1 的差异：鉴权/元数据参数改为 HTTP Header 传递
//   - X-Timestamp: 毫秒时间戳（必填）
//   - X-Nonce:     随机串（必填）
//   - X-Channel:   渠道（选填）
// 业务参数 app_id 仍走 query。鉴权逻辑与 V1 一致。
// 返回结构与 V1 的差异：
//   - report:        返回上报地址字符串(apps.report_url)，而非 V1 的 0/1
//   - splash_url:    新增启动页地址(apps.splash_url)，默认 ""
//   - popup_url_1/2/3: 新增弹窗地址(apps.popup_url_1/2/3)，默认 ""
//   - ad_order:      新增广告排序/序号(apps.ad_order)，默认 0

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const appId = searchParams.get('app_id') || '';

  // 鉴权/元数据参数从 Header 读取（V2 差异点）
  const channel = request.headers.get('x-channel');
  const timestamp = request.headers.get('x-timestamp');
  const nonce = request.headers.get('x-nonce');

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

  // timestamp / nonce 校验（与 V1 共用，只是来源改为 Header）
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
    // V2 差异：report 返回上报地址字符串，并新增 splash_url(启动页地址，默认 "")
    // 此外返回 popup_url_1/2/3(弹窗地址，默认 "")与 ad_order(广告序号，默认 0)
    data: {
      list: configResult.data.list,
      level: configResult.data.level,
      report: configResult.data.report_url,
      splash_url: configResult.data.splash_url,
      popup_url_1: configResult.data.popup_url_1,
      popup_url_2: configResult.data.popup_url_2,
      popup_url_3: configResult.data.popup_url_3,
      ad_order: configResult.data.ad_order,
    },
    msg: 'APP广告配置获取成功',
  });
}
