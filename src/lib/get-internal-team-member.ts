import { cache } from 'react';
import { createInternalServerClient } from './supabase-internal-server';
import { supabaseInternalAdmin } from './supabase-internal-admin';
import { getCached } from './simple-cache';

export interface TeamMember { id: number; name: string; email: string; role: string; status: string }

// Escape LIKE wildcards so "a_b@x.com" can't match "axb@x.com".
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

// Team rows change rarely; caching them for a minute saves a database round
// trip on every page and API call. Changes made on the Team page clear it.
const MEMBER_TTL_MS = 60_000;
export const memberCacheKey = (email: string) => `internal:member:${email.toLowerCase()}`;

async function lookupMember(email: string): Promise<TeamMember | null> {
  return getCached(memberCacheKey(email), MEMBER_TTL_MS, async () => {
    const { data } = await supabaseInternalAdmin
      .from('team_members')
      .select('id, name, email, role, status')
      .ilike('email', escapeLike(email.trim()))
      .limit(1)
      .maybeSingle();
    return (data as TeamMember | null) ?? null;
  });
}

// Who is signed in, verified once per request (React cache dedupes calls
// from the layout, the page and helpers). getClaims() checks the session
// JWT locally when the project uses asymmetric signing keys, and falls back
// to asking the auth server otherwise.
export const getInternalSession = cache(async (): Promise<{ email: string | null; member: TeamMember | null }> => {
  const supabase = await createInternalServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = !error && typeof data?.claims?.email === 'string' ? data.claims.email : null;
  if (!email) return { email: null, member: null };
  return { email, member: await lookupMember(email) };
});

export async function getRequestingTeamMember(): Promise<TeamMember | null> {
  return (await getInternalSession()).member;
}
