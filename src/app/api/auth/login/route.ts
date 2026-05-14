import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPassword, createToken, getCookieOptions, TOKEN_NAME } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: user, error } = await client
      .from('users')
      .select('id, username, display_name, role, status, password_hash')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = await createToken({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    });

    // 更新最后登录时间
    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 通过NextResponse设置cookie（比cookies().set()更可靠）
    const response = NextResponse.json({
      data: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });

    const opts = getCookieOptions();
    response.cookies.set(opts.name, token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });

    return response;
  } catch (err) {
    console.error('[auth/login] Error:', err);
    return NextResponse.json({ error: '登录服务异常，请稍后重试' }, { status: 500 });
  }
}
