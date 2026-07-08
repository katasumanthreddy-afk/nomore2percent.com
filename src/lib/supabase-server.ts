import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Used from Server Components, Route Handlers, and middleware to read the
// current auth session via cookies. Each call needs a fresh cookies() store,
// so this is a function to call per-request, not a singleton to import.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // setAll can be called from a Server Component where cookies can't
            // be written — safe to ignore since middleware handles refreshing
            // the session on every request instead.
          }
        },
      },
    }
  );
}
