import { NextRequest, NextResponse } from 'next/server';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { safeNextPath } from '@/lib/require-internal-member';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const remembered = request.cookies.get('n2p_next')?.value;
  const next = safeNextPath(searchParams.get('next') || (remembered ? decodeURIComponent(remembered) : null));

  if (code) {
    const supabase = await createInternalServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.set('n2p_next', '', { path: '/internal/auth', maxAge: 0 });
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/internal/login?error=1`);
}
