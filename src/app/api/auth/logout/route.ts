import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/sessionCookie';

function clearAuth(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL('/login', url.origin));
  clearAuth(res);
  return res;
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuth(res);
  return res;
}
