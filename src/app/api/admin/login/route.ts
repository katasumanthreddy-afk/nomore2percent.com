import { NextRequest, NextResponse } from 'next/server';

// Simple single-admin auth — suitable for a one-person brokerage.
// Credentials come from environment variables, never hardcoded.
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUsername = process.env.ADMIN_USERNAME || 'sumanth';
  const validPassword = process.env.ADMIN_PASSWORD || 'nomore2percent@2026';

  if (username === validUsername && password === validPassword) {
    const res = NextResponse.json({ success: true });
    // Session cookie — httpOnly so it can't be read by client-side JS (XSS protection)
    res.cookies.set('n2p_admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  }

  return NextResponse.json({ success: false, message: 'Incorrect username or password' }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('n2p_admin_session');
  return res;
}
