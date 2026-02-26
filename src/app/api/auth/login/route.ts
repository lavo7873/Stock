import { NextResponse } from 'next/server';
import { checkUser, verifyPassword, setAuthCookie } from '@/lib/simpleAuth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '').trim();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    // Debug: check if env vars are loaded (Vercel Logs)
    const hasUser = !!process.env.ADMIN_USERNAME;
    const hasPass = !!process.env.ADMIN_PASSWORD;
    if (!hasUser || !hasPass) {
      console.warn('[auth] ENV missing:', { hasUser, hasPass });
    }

    if (!checkUser(username) || !(await verifyPassword(password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await setAuthCookie(username);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}