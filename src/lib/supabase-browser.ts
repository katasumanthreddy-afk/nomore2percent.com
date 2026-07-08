import { createBrowserClient } from '@supabase/ssr';

// Used from client components for auth actions — signing in with a magic
// link, signing out, and reading the current session. Separate from
// src/lib/supabase.ts (which is for plain anonymous data reads) because
// @supabase/ssr's browser client is what correctly syncs the auth session
// into cookies that the server/middleware can also read.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
