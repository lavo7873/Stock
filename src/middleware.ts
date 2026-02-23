import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'psr_admin';

function hasSession(req: NextRequest): boolean {
  return !!req.cookies.get(COOKIE_NAME)?.value;
}

export function middleware(req: NextRequest) {
  const isLoggedIn = hasSession(req);
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
