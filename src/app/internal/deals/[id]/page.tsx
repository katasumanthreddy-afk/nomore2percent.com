import { redirect } from 'next/navigation';
import { requireInternalMember } from '@/lib/require-internal-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import DealDetailClient from './DealDetailClient';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalMember(`/internal/deals/${id}`);

  const { data: deal } = await supabaseInternalAdmin
    .from('deals')
    .select('*, commercial_properties(id, title, area), team_members(id, name)')
    .eq('id', id)
    .single();
  if (!deal) redirect('/internal/deals');

  const { data: documents } = await supabaseInternalAdmin.from('documents').select('*').eq('deal_id', id).order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50">
      <DealDetailClient deal={deal} documents={documents || []} />
    </div>
  );
}
