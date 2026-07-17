import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

async function ensureAppAccess(appId: string, userId: string | null, userRole: string | null) {
  const client = getSupabaseClient();
  let query = client
    .from('apps')
    .select('id')
    .eq('id', appId);

  if (userRole !== 'admin') {
    query = query.eq('owner_user_id', userId || '');
  }

  const { data, error } = await query.maybeSingle();
  return { exists: Boolean(data), error };
}

// GET /api/apps/[id] - 获取应用详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const client = getSupabaseClient();

  const accessResult = await ensureAppAccess(id, userId, userRole);
  if (accessResult.error) {
    return NextResponse.json({ error: accessResult.error.message }, { status: 500 });
  }
  if (!accessResult.exists) {
    return NextResponse.json({ error: '应用不存在' }, { status: 404 });
  }

  const { data: app, error: appError } = await client
    .from('apps')
    .select('id, name, package_name, media_id, account, external_app_id, level, report, report_url, splash_url, status, created_at, updated_at')
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
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const body = await request.json();
  const client = getSupabaseClient();

  const accessResult = await ensureAppAccess(id, userId, userRole);
  if (accessResult.error) {
    return NextResponse.json({ error: accessResult.error.message }, { status: 500 });
  }
  if (!accessResult.exists) {
    return NextResponse.json({ error: '应用不存在' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.package_name !== undefined) updateData.package_name = body.package_name;
  if (body.media_id !== undefined) updateData.media_id = body.media_id;
  if (body.account !== undefined) updateData.account = body.account;
  if (body.external_app_id !== undefined) updateData.external_app_id = body.external_app_id;
  if (body.level !== undefined) updateData.level = body.level;
  if (body.report !== undefined) updateData.report = body.report;
  if (body.report_url !== undefined) updateData.report_url = body.report_url;
  if (body.splash_url !== undefined) updateData.splash_url = body.splash_url;
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const client = getSupabaseClient();

  const accessResult = await ensureAppAccess(id, userId, userRole);
  if (accessResult.error) {
    return NextResponse.json({ error: accessResult.error.message }, { status: 500 });
  }
  if (!accessResult.exists) {
    return NextResponse.json({ error: '应用不存在' }, { status: 404 });
  }

  const { error } = await client.from('apps').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
