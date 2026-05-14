import bcrypt from 'bcryptjs';
import { createToken, verifyToken, type AuthUser } from './jwt';
import { cookies } from 'next/headers';

// 重新导出 jwt 函数
export { createToken, verifyToken, type AuthUser };

const TOKEN_NAME = 'ad_config_token';
const TOKEN_MAX_AGE = 24 * 60 * 60; // 24小时

// 密码hash
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 从请求中获取当前用户
export async function getAuthUser(request?: Request): Promise<AuthUser | null> {
  let token: string | undefined;

  if (request) {
    // 从Authorization header获取
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    // 从cookie获取
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`${TOKEN_NAME}=([^;]+)`));
        if (match) {
          token = match[1];
        }
      }
    }
  } else {
    // Server Component中从cookies()获取
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(TOKEN_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

// Cookie配置项
function getCookieOptions() {
  const isSecure = process.env.COZE_PROJECT_ENV === 'PROD';
  return {
    name: TOKEN_NAME,
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  };
}

export { getCookieOptions, TOKEN_NAME, TOKEN_MAX_AGE };
