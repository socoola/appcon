import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const commit = execSync('git rev-parse --short HEAD', {
      cwd: process.cwd(),
      encoding: 'utf-8',
    }).trim();

    return NextResponse.json({ commit });
  } catch {
    return NextResponse.json({ commit: 'unknown' });
  }
}
