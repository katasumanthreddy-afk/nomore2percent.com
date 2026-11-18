import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin panel guard (existing, unrelated to Supabase auth below) ──
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }
  if (pathname.startsWith('/admin')) {
    const valid = await verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!valid) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  // ── Supabase auth session refresh ──
  // Internal portal pages use the separate internal project; everything
  // else uses the public site's project. Refreshing here (not in a Server
  // Component, which can't write cookies) is what keeps a rotated refresh
  // token from being lost and signing people out.
  const isInternal = pathname.startsWith('/internal');
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    isInternal ? process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_URL! : process.env.NEXT_PUBLIC_SUPABASE_URL!,
    isInternal ? process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_ANON_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getClaims() refreshes an expiring session and, with asymmetric signing
  // keys, verifies it without a round trip to the auth server.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest|api).*)',
  ],
};
