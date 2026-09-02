import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import InternalHeader from '@/components/internal/InternalHeader';
import RequirementDetailClient from './RequirementDetailClient';

export default async function RequirementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/internal/login?next=/internal/requirements/${id}`);

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <RequirementDetailClient requirementId={id} />
    </div>
  );
}
