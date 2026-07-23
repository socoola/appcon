import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/settings - 读取所有系统设置(已登录即可)
export async function GET() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('system_settings')
    .select('key, value, updated_at')
    .order('key', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// PUT /api/settings - upsert 单个设置项(仅 admin)
export async function PUT(request: NextRequest) {
  if (request.headers.get('x-user-role') !== 'admin') {
    return NextResponse.json({ error: '仅管理员可访问' }, { status: 403 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (typeof key !== 'string' || !key.trim()) {
    return NextResponse.json({ error: 'key 必填且需为字符串' }, { status: 400 });
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'value 需为字符串' }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('system_settings')
    .upsert(
      { key: key.trim(), value, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    .select('key, value, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}