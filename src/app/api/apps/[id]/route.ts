import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/apps/[id] - 获取应用详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();

  const { data: app, error: appError } = await client
    .from('apps')
    .select('id, name, package_name, media_id, level, status, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  if (!app) {
    return NextResponse.json({ error: '应用不存在' }, { status: 404 });
  }

  return NextResponse.json({ data: app });
}

// PUT /api/apps/[id] - 更新应用
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const client = getSupabaseClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.package_name !== undefined) updateData.package_name = body.package_name;
  if (body.media_id !== undefined) updateData.media_id = body.media_id;
  if (body.level !== undefined) updateData.level = body.level;
  if (body.status !== undefined) updateData.status = body.status;

  const { data, error } = await client
    .from('apps')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/apps/[id] - 删除应用
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();

  const { error } = await client.from('apps').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
