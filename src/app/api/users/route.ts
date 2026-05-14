import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth';

// GET /api/users - 获取用户列表（仅admin）
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '仅管理员可查看用户列表' }, { status: 403 });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('id, username, display_name, role, status, last_login_at, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/users - 创建用户（仅admin）
export async function POST(request: NextRequest) {
  const currentUser = await getAuthUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '仅管理员可创建用户' }, { status: 403 });
  }

  const body = await request.json();
  const { username, password, display_name, role } = body as {
    username: string;
    password: string;
    display_name?: string;
    role?: string;
  };

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: '密码长度不能少于6位' }, { status: 400 });
  }

  const validRoles = ['admin', 'operator', 'viewer'];
  const userRole = role || 'viewer';
  if (!validRoles.includes(userRole)) {
    return NextResponse.json({ error: '无效的角色' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('users')
    .insert({
      username,
      password_hash: passwordHash,
      display_name: display_name || null,
      role: userRole,
      status: 'active',
    })
    .select('id, username, display_name, role, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
