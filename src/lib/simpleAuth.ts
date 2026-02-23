import { cookies } from 'next/headers';

const ADMIN_USER = (process.env.ADMIN_USER ?? 'admin').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? '').replace(/^["']|["']$/g, '');
const COOKIE_NAME = 'psr_admin';
const COOKIE_SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret';

export function verifyPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

export function checkUser(username: string): boolean {
  return username === ADMIN_USER;
}

export async function setAuthCookie() {
  const cookieStore = await cookies();
  const token = Buffer.from(`${COOKIE_SECRET}:admin:${Date.now()}`).toString('base64');
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [, user] = decoded.split(':');
    return user === 'admin';
  } catch {
    return false;
  }
}
