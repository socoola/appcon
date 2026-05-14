import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/middleware';

export async function middleware(request: NextRequest) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
