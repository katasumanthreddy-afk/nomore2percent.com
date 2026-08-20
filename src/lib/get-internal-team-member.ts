import { createInternalServerClient } from './supabase-internal-server';
import { supabaseInternalAdmin } from './supabase-internal-admin';

export async function getRequestingTeamMember() {
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: member } = await supabaseInternalAdmin
    .from('team_members')
    .select('id, name, email, role, status')
    .ilike('email', user.email)
    .maybeSingle();

  return member;
}
