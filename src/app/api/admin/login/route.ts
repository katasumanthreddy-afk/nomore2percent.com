import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_S, createAdminSessionToken, safeEqual } from '@/lib/admin-auth';

// Simple single-admin auth — suitable for a one-person brokerage.
// Credentials come ONLY from environment variables (ADMIN_USERNAME,
// ADMIN_PASSWORD). There is deliberately no fallback: the repo is public.
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('Admin login disabled: ADMIN_USERNAME / ADMIN_PASSWORD env vars are not set.');
    return NextResponse.json({ success: false, message: 'Admin login is not configured on the server.' }, { status: 500 });
  }

  const ok = typeof username === 'string' && typeof password === 'string'
    && safeEqual(username, validUsername) && safeEqual(password, validPassword);

  if (!ok) {
    return NextResponse.json({ success: false, message: 'Incorrect username or password' }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const res = NextResponse.json({ success: true });
  // Signed session cookie — httpOnly so client-side JS can't read it.
  res.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE_S,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
