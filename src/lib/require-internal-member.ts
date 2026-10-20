import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// Shared guard for internal pages: signed in, on the team, active.
export async function requireInternalMember(nextPath: string) {
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/internal/login?next=${nextPath}`);
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');
  return member;
}
