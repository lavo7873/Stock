/**
 * HMAC-signed session cookie. Uses Web Crypto API for Edge (middleware) compatibility.
 */

const COOKIE_NAME = 'psr_admin';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecodeToStr(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(b64)));
}

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
  const keyData = new TextEncoder().encode(key);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_COOKIE_MAX_AGE = COOKIE_MAX_AGE;

export async function createSessionToken(username: string): Promise<string> {
  const secret = process.env.COOKIE_SIGNING_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-secret';
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const payload = JSON.stringify({ u: username, exp });
  const payloadB64 = btoa(unescape(encodeURIComponent(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = await hmacSha256(secret, payloadB64);
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token: string): Promise<{ valid: boolean; username?: string }> {
  const secret = process.env.COOKIE_SIGNING_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-secret';
  const adminUsername = (process.env.ADMIN_USERNAME ?? process.env.ADMIN_USER ?? 'admin').trim();

  if (!token || !token.includes('.')) return { valid: false };
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return { valid: false };

  try {
    const expectedSig = await hmacSha256(secret, payloadB64);
    const expectedB64 = base64UrlEncode(expectedSig);
    if (sigB64 !== expectedB64) return { valid: false };

    const payloadJson = base64UrlDecodeToStr(payloadB64);
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || typeof payload.exp !== 'number') return { valid: false };
    if (payload.exp < Math.floor(Date.now() / 1000)) return { valid: false };
    if (payload.u !== adminUsername) return { valid: false };

    return { valid: true, username: payload.u };
  } catch {
    return { valid: false };
  }
}
