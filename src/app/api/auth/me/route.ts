import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// GET /api/auth/me - 获取当前登录用户信息
export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });
}
