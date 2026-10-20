import { redirect } from 'next/navigation';
import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import FeesClient from './FeesClient';

export default async function FeesPage() {
  const member = await requireInternalMember('/internal/fees');
  if (member.role !== 'owner') redirect('/internal/projects');
  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <FeesClient />
    </div>
  );
}
