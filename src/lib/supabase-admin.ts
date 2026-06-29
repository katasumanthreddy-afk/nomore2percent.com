import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY client — uses the service role key which bypasses Row Level Security.
// NEVER import this file in any component that runs in the browser.
// Only use this inside src/app/api/** route handlers.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
