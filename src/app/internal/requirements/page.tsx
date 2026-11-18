import { requireInternalMember } from '@/lib/require-internal-member';
import RequirementsListClient from './RequirementsListClient';

export default async function RequirementsPage() {
  await requireInternalMember('/internal/requirements');

  return (
    <div className="min-h-screen bg-stone-50">
      <RequirementsListClient />
    </div>
  );
}
