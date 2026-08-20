import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import InternalHeader from '@/components/internal/InternalHeader';
import DealDetailClient from './DealDetailClient';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/internal/login?next=/internal/deals/${id}`);

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  const { data: deal } = await supabaseInternalAdmin
    .from('deals')
    .select('*, commercial_properties(id, title, area), team_members(id, name)')
    .eq('id', id)
    .single();
  if (!deal) redirect('/internal/deals');

  const { data: documents } = await supabaseInternalAdmin.from('documents').select('*').eq('deal_id', id).order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <DealDetailClient deal={deal} documents={documents || []} />
    </div>
  );
}
