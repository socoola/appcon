import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 兼容参考接口：/api/ad-config?app_id=com.san.test&channel=apple&timestamp=xxx&nonce=xxx
// 原参考路径 /api/san/ad-config 因路由兼容问题调整为此路径

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5分钟容忍窗口

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appId = searchParams.get('app_id');
  const channel = searchParams.get('channel');
  const timestamp = searchParams.get('timestamp');
  const nonce = searchParams.get('nonce');

  // 参数校验
  if (!appId) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 40001,
      msg: '缺少app_id参数',
      data: null,
    });
  }

  if (!timestamp) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 40001,
      msg: '缺少timestamp参数',
      data: null,
    });
  }

  if (!nonce) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 40001,
      msg: '缺少nonce参数',
      data: null,
    });
  }

  // timestamp 校验：与服务器时间差不超过容忍窗口
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 40002,
      msg: 'timestamp格式无效',
      data: null,
    });
  }

  const now = Date.now();
  if (Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE_MS) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 40003,
      msg: '请求已过期，timestamp超出有效时间窗口',
      data: null,
    });
  }

  const client = getSupabaseClient();

  // 查找应用
  const { data: app, error: appError } = await client
    .from('apps')
    .select('id, name, package_name, media_id, level')
    .eq('package_name', appId)
    .maybeSingle();

  if (appError) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 50001,
      msg: '数据库查询失败',
      data: null,
    });
  }

  if (!app) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 40004,
      msg: '应用不存在',
      data: null,
    });
  }

  // 查找广告位配置
  const { data: slots, error: slotsError } = await client
    .from('ad_slots')
    .select('slot_name, ad_slot_id, enabled')
    .eq('app_id', app.id)
    .eq('enabled', true);

  if (slotsError) {
    return NextResponse.json({
      request_id: crypto.randomUUID(),
      code: 50001,
      msg: '数据库查询失败',
      data: null,
    });
  }

  // 查找当前等级配置，确定哪些广告位应该开启
  const { data: levelConfig } = await client
    .from('ad_levels')
    .select('*')
    .eq('level', app.level)
    .maybeSingle();

  // 根据等级过滤广告位
  const levelSlotMap: Record<string, boolean> = {
    openScreenId: levelConfig?.open_screen ?? false,
    bannerId: levelConfig?.banner ?? false,
    IncentiveVideoId: levelConfig?.incentive_video ?? false,
    newInsertFullScreenId: levelConfig?.insert_full_screen ?? false,
  };

  const filteredSlots = (slots || []).filter((slot: { slot_name: string }) => levelSlotMap[slot.slot_name] !== false);

  // 组装返回格式，兼容参考接口（不输出platform）
  const list = filteredSlots.map((slot: { slot_name: string; ad_slot_id: string | null }) => ({
    name: slot.slot_name,
    app_id: app.media_id,
    val: slot.ad_slot_id || '',
  }));

  return NextResponse.json({
    request_id: crypto.randomUUID(),
    code: 10000,
    data: {
      list,
      level: app.level,
    },
    msg: 'APP广告配置获取成功',
  });
}
