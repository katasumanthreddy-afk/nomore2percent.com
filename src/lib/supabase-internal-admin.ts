import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY client for the internal-database project — uses the service
// role key, bypasses Row Level Security. Only use inside
// src/app/api/internal/** route handlers, never in a browser-facing file.
const internalUrl = process.env.NEXT_PUBLIC_INTERNAL_SUPABASE_URL!;
const internalServiceRoleKey = process.env.INTERNAL_SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseInternalAdmin = createClient(internalUrl, internalServiceRoleKey, {
  auth: { persistSession: false },
});
