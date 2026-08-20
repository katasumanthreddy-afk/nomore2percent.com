import { NextRequest, NextResponse } from 'next/server';
import { createInternalServerClient } from '@/lib/supabase-internal-server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/internal';

  if (code) {
    const supabase = await createInternalServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/internal/login?error=1`);
}
