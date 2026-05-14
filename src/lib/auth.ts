import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ad-config-admin-secret-key-2024'
);

const TOKEN_NAME = 'ad_config_token';
const TOKEN_MAX_AGE = 24 * 60 * 60; // 24小时

export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  role: 'admin' | 'operator' | 'viewer';
}

// 密码hash
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成JWT
export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

// 验证JWT
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      displayName: payload.displayName as string | null,
      role: payload.role as 'admin' | 'operator' | 'viewer',
    };
  } catch {
    return null;
  }
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

// 设置认证cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

// 清除认证cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

// 权限检查：admin拥有所有权限，operator可读写，viewer只读
export function hasPermission(role: string, action: 'read' | 'write' | 'admin'): boolean {
  if (role === 'admin') return true;
  if (role === 'operator') return action === 'read' || action === 'write';
  if (role === 'viewer') return action === 'read';
  return false;
}
