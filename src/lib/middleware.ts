import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// 需要认证的路由前缀（ad-config不需要认证）
const PUBLIC_PATHS = ['/api/ad-config', '/api/san/ad-config', '/api/auth'];

export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // 公开路径不需要认证
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return null;
  }

  // 非API路径不需要认证（页面走前端判断）
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  // 从Authorization header或cookie获取token
  let token: string | undefined;
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/ad_config_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: '未登录或登录已过期', code: 40100 },
      { status: 401 }
    );
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json(
      { error: '登录已过期，请重新登录', code: 40101 },
      { status: 401 }
    );
  }

  // 写操作权限检查（POST/PUT/PATCH/DELETE需要operator及以上）
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (user.role === 'viewer') {
      return NextResponse.json(
        { error: '当前角色无操作权限', code: 40300 },
        { status: 403 }
      );
    }
    // 用户管理仅限admin
    if (pathname.startsWith('/api/users') && user.role !== 'admin') {
      return NextResponse.json(
        { error: '仅管理员可管理用户', code: 40301 },
        { status: 403 }
      );
    }
  }

  return null; // null表示通过认证，继续后续处理
}
