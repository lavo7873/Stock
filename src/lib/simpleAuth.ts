import { cookies } from 'next/headers';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from './sessionCookie';

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME ?? process.env.ADMIN_USER ?? 'admin').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? '').trim();

export function checkUser(username: string): boolean {
  return username === ADMIN_USERNAME;
}

export async function verifyPassword(password: string): Promise<boolean> {
  if (!password) return false;
  return ADMIN_PASSWORD !== '' && password === ADMIN_PASSWORD;
}

export async function setAuthCookie(username: string): Promise<void> {
  const token = await createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hasAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const { valid } = await verifySessionToken(token);
  return valid;
}