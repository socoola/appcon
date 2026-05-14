import { NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('ad_config_token', '', {
    httpOnly: true,
    secure: process.env.COZE_PROJECT_ENV === 'PROD',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
