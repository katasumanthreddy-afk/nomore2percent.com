import { createClient } from '@supabase/supabase-js';

// Browser-safe client — uses the public anon key.
// This respects Row Level Security policies defined in supabase-schema.sql,
// so it can only do what the policies explicitly allow (read active properties,
// insert leads, read/write chat messages).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
