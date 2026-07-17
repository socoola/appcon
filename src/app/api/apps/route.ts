import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/apps - 获取应用列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  const client = getSupabaseClient();

  let query = client
    .from('apps')
    .select('id, name, package_name, media_id, account, external_app_id, level, report, report_url, splash_url, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (userRole !== 'admin') {
    query = query.eq('owner_user_id', userId || '');
  }

  if (search) {
    query = query.ilike('package_name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 为每个应用获取广告位数量
  const appsWithSlots = await Promise.all(
    (data || []).map(async (app: { id: string; name: string; package_name: string; media_id: string | null; account: string | null; external_app_id: string | null; level: number; report: boolean; report_url: string; splash_url: string; status: string; created_at: string; updated_at: string | null }) => {
      const { count: totalSlots } = await client
        .from('ad_slots')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', app.id);

      const { count: enabledSlots } = await client
        .from('ad_slots')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', app.id)
        .eq('enabled', true);

      return {
        ...app,
        total_slots: totalSlots || 0,
        enabled_slots: enabledSlots || 0,
      };
    })
  );

  return NextResponse.json({ data: appsWithSlots });
}

// POST /api/apps - 创建应用
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, package_name: rawPackageName, media_id, account, external_app_id, level, report, report_url, splash_url } = body;
  const package_name = rawPackageName?.replace(/\s/g, '');
  const userId = request.headers.get('x-user-id');

  if (!name || !package_name || !userId) {
    return NextResponse.json({ error: '应用名称和包名为必填项' }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('apps')
    .insert({
      name,
      package_name,
      media_id: media_id || null,
      account: account || null,
      external_app_id: external_app_id || null,
      level: level ?? 4,
      report: report ?? true,
      report_url: report_url ?? '',
      splash_url: splash_url ?? '',
      owner_user_id: userId,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '包名已存在' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 自动创建4个默认广告位
  const defaultSlots = [
    { app_id: data.id, slot_name: 'openScreenId', slot_label: '开屏广告', platform: 0, enabled: false },
    { app_id: data.id, slot_name: 'bannerId', slot_label: 'Banner广告', platform: 0, enabled: false },
    { app_id: data.id, slot_name: 'IncentiveVideoId', slot_label: '激励视频', platform: 1, enabled: false },
    { app_id: data.id, slot_name: 'newInsertFullScreenId', slot_label: '插屏全屏', platform: 2, enabled: false },
  ];

  await client.from('ad_slots').insert(defaultSlots);

  return NextResponse.json({ data });
}
