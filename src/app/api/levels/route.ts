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

// POST /api/levels - 添加等级
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, level, is_default, open_screen, banner, incentive_video, insert_full_screen, report } = body as {
    name: string;
    description?: string;
    level?: number;
    is_default?: boolean;
    open_screen?: boolean;
    banner?: boolean;
    incentive_video?: boolean;
    insert_full_screen?: boolean;
    report?: boolean;
  };

  if (!name) {
    return NextResponse.json({ error: '等级名称不能为空' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 如果未指定level编号，自动取最大值+1
  let levelNum = level;
  if (levelNum === undefined || levelNum === null) {
    const { data: maxResult } = await client
      .from('ad_levels')
      .select('level')
      .order('level', { ascending: false })
      .limit(1);
    levelNum = maxResult && maxResult.length > 0 ? maxResult[0].level + 1 : 0;
  }

  // 检查level编号是否已存在
  const { data: existing } = await client
    .from('ad_levels')
    .select('id')
    .eq('level', levelNum)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `等级 Level ${levelNum} 已存在` }, { status: 400 });
  }

  // 如果设为默认，先取消其他默认
  if (is_default) {
    await client
      .from('ad_levels')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('is_default', true);
  }

  const { data, error } = await client
    .from('ad_levels')
    .insert({
      level: levelNum,
      name,
      description: description || null,
      is_default: is_default ?? false,
      open_screen: open_screen ?? false,
      banner: banner ?? false,
      incentive_video: incentive_video ?? false,
      insert_full_screen: insert_full_screen ?? false,
      report: report ?? false,
    })
    .select()
    .single();

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
      report?: boolean;
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
      if (level.report !== undefined) updateData.report = level.report;

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

// DELETE /api/levels - 删除等级
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少等级ID' }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 检查等级是否存在
  const { data: existing } = await client
    .from('ad_levels')
    .select('id, level, name')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: '等级不存在' }, { status: 404 });
  }

  // 检查是否有应用正在使用该等级
  const { count } = await client
    .from('apps')
    .select('*', { count: 'exact', head: true })
    .eq('level', existing.level);

  if (count && count > 0) {
    return NextResponse.json({
      error: `等级 Level ${existing.level}（${existing.name}）正在被 ${count} 个应用使用，无法删除`,
    }, { status: 400 });
  }

  const { error } = await client
    .from('ad_levels')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id, deleted: true } });
}
