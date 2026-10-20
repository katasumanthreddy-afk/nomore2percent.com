// Signed admin session.
//
// The cookie value is `<expiryMs>.<hex HMAC-SHA256(expiryMs)>`, signed with
// ADMIN_SESSION_SECRET (falls back to ADMIN_PASSWORD, so changing the password
// also logs out every existing session). Uses Web Crypto so the same code runs
// in both the proxy and route handlers.

export const ADMIN_COOKIE = 'n2p_admin_session';
export const ADMIN_SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string comparison.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const expiry = String(Date.now() + ADMIN_SESSION_MAX_AGE_S * 1000);
  return `${expiry}.${await hmacHex(secret, expiry)}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;
  const [expiry, sig] = token.split('.');
  if (!expiry || !sig || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) < Date.now()) return false;
  return safeEqual(sig, await hmacHex(secret, expiry));
}
