import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side client for the SEPARATE internal-database Supabase project —
// entirely different project URL/keys from the public site's client in
// supabase-server.ts. Used from Server Components and Route Handlers under
// src/app/internal/** and src/app/api/internal/**.
export async function createInternalServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Safe to ignore from a context where cookies can't be written.
          }
        },
      },
    }
  );
}
