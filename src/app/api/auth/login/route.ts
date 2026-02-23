import { NextResponse } from 'next/server';
import { checkUser, verifyPassword } from '@/lib/simpleAuth';

const COOKIE_NAME = 'psr_admin';
const COOKIE_SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username ?? '').trim();
    const password = body?.password ?? '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    if (!checkUser(username) || !verifyPassword(password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = Buffer.from(`${COOKIE_SECRET}:admin:${Date.now()}`).toString('base64');
    const isProd = process.env.NODE_ENV === 'production';

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return res;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
