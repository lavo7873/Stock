/**
 * Base URL for the app. On Vercel, uses VERCEL_URL (auto-injected).
 * Override with APP_BASE_URL or NEXTAUTH_URL in env.
 */
export function getBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Vercel injects VERCEL_URL (e.g. "my-app-xxx.vercel.app")
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
