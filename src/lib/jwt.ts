import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ad-config-admin-secret-key-2024'
);

export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  role: 'admin' | 'operator' | 'viewer';
}

// 生成JWT（Edge兼容）
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

// 验证JWT（Edge兼容）
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
