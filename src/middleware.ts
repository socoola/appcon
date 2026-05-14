import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const TOKEN_NAME = 'ad_config_token';

// 不需要认证的路径
const PUBLIC_PATHS = [
  '/api/ad-config',
  '/api/san/',
  '/api/auth/login',
];

// 只需要登录即可访问的路径（任何角色）
const AUTH_ONLY_PATHS = [
  '/api/auth/me',
  '/api/auth/logout',
  '/api/apps',         // GET
  '/api/levels',       // GET
  '/api/stats',
  '/api/logs',
];

// 仅管理员可访问的路径
const ADMIN_PATHS = [
  '/api/users',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径直接放行
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 非API路径放行（页面由前端处理登录跳转）
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 获取token
  const token = request.cookies.get(TOKEN_NAME)?.value 
    || request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: '未登录或登录已过期', code: 40100 },
      { status: 401 }
    );
  }

  // 验证JWT
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json(
      { error: '登录已过期，请重新登录', code: 40101 },
      { status: 401 }
    );
  }

  // 管理员路径检查
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '仅管理员可访问' },
        { status: 403 }
      );
    }
  }

  // 写入用户信息到请求头，供后续API使用
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-username', user.username);
  requestHeaders.set('x-user-role', user.role);
  if (user.displayName) {
    requestHeaders.set('x-user-displayname', encodeURIComponent(user.displayName));
  }

  // 写入方法到header（用于权限判断）
  requestHeaders.set('x-request-method', request.method);

  // 对非admin用户的写操作做限制
  if (user.role === 'viewer' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return NextResponse.json(
      { error: '当前角色无操作权限' },
      { status: 403 }
    );
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
