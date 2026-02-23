import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/sessionCookie';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { valid } = token ? await verifySessionToken(token) : { valid: false };
  const isLoggedIn = valid;
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (isLoginPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }

  if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|api/cron|api/health|_next/static|_next/image|favicon.ico).*)'],
};
