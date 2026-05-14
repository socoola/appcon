import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/levels - 获取所有等级配置
export async function GET() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('ad_levels')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// PUT /api/levels - 批量更新等级配置
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { levels } = body as {
    levels: Array<{
      id: string;
      name?: string;
      description?: string;
      is_default?: boolean;
      open_screen?: boolean;
      banner?: boolean;
      incentive_video?: boolean;
      insert_full_screen?: boolean;
    }>
  };

  if (!levels || !Array.isArray(levels)) {
    return NextResponse.json({ error: '无效的请求数据' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 如果有等级设为默认，先取消所有默认
  const hasNewDefault = levels.some((l) => l.is_default === true);
  if (hasNewDefault) {
    await client
      .from('ad_levels')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('is_default', true);
  }

  const results = await Promise.all(
    levels.map(async (level) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (level.name !== undefined) updateData.name = level.name;
      if (level.description !== undefined) updateData.description = level.description;
      if (level.is_default !== undefined) updateData.is_default = level.is_default;
      if (level.open_screen !== undefined) updateData.open_screen = level.open_screen;
      if (level.banner !== undefined) updateData.banner = level.banner;
      if (level.incentive_video !== undefined) updateData.incentive_video = level.incentive_video;
      if (level.insert_full_screen !== undefined) updateData.insert_full_screen = level.insert_full_screen;

      const { data, error } = await client
        .from('ad_levels')
        .update(updateData)
        .eq('id', level.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    })
  );

  return NextResponse.json({ data: results });
}
