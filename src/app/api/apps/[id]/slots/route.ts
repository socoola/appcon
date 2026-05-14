import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/apps/[id]/slots - 获取应用广告位配置
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('ad_slots')
    .select('id, app_id, slot_name, slot_label, ad_slot_id, platform, enabled, created_at, updated_at')
    .eq('app_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// PUT /api/apps/[id]/slots - 批量更新广告位配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { slots } = body as { slots: Array<{ id: string; ad_slot_id?: string; platform?: number; enabled?: boolean }> };

  if (!slots || !Array.isArray(slots)) {
    return NextResponse.json({ error: '无效的请求数据' }, { status: 400 });
  }

  const client = getSupabaseClient();

  const results = await Promise.all(
    slots.map(async (slot) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (slot.ad_slot_id !== undefined) updateData.ad_slot_id = slot.ad_slot_id;
      if (slot.platform !== undefined) updateData.platform = slot.platform;
      if (slot.enabled !== undefined) updateData.enabled = slot.enabled;

      const { data, error } = await client
        .from('ad_slots')
        .update(updateData)
        .eq('id', slot.id)
        .eq('app_id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    })
  );

  return NextResponse.json({ data: results });
}
