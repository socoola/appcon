import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword, getAuthUser } from '@/lib/auth';

// PATCH /api/users/[id] - 更新用户（仅admin）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '仅管理员可修改用户' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const client = getSupabaseClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.display_name !== undefined) updateData.display_name = body.display_name;
  if (body.role !== undefined) {
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: '无效的角色' }, { status: 400 });
    }
    updateData.role = body.role;
  }
  if (body.status !== undefined) {
    const validStatuses = ['active', 'disabled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }
    updateData.status = body.status;
  }
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: '密码长度不能少于6位' }, { status: 400 });
    }
    updateData.password_hash = await hashPassword(body.password);
  }

  const { data, error } = await client
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, username, display_name, role, status, last_login_at, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/users/[id] - 删除用户（仅admin，不可删自己）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '仅管理员可删除用户' }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json({ error: '不能删除当前登录用户' }, { status: 400 });
  }

  const client = getSupabaseClient();
  const { error } = await client.from('users').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
