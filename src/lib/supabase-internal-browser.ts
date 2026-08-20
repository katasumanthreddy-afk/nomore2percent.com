import { createBrowserClient } from '@supabase/ssr';

// Browser client for the SEPARATE internal-database Supabase project —
// used for sign-in actions (magic link / Google) from internal portal
// client components.
export function createInternalBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_ANON_KEY!
  );
}
