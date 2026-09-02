import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import InternalHeader from '@/components/internal/InternalHeader';
import RequirementsBulkImportClient from './RequirementsBulkImportClient';

export default async function RequirementsBulkImportPage() {
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/internal/login');

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <RequirementsBulkImportClient />
    </div>
  );
}
