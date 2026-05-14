import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/apps - 获取应用列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');

  const client = getSupabaseClient();

  let query = client
    .from('apps')
    .select('id, name, package_name, media_id, level, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('package_name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 为每个应用获取广告位数量
  const appsWithSlots = await Promise.all(
    (data || []).map(async (app: { id: string; name: string; package_name: string; media_id: string | null; level: number; status: string; created_at: string; updated_at: string | null }) => {
      const { count: totalSlots, error: totalError } = await client
        .from('ad_slots')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', app.id);

      const { count: enabledSlots, error: enabledError } = await client
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
  const { name, package_name, media_id, level } = body;

  if (!name || !package_name) {
    return NextResponse.json({ error: '应用名称和包名为必填项' }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('apps')
    .insert({
      name,
      package_name,
      media_id: media_id || null,
      level: level ?? 4,
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
