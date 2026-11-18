import { requireInternalMember } from '@/lib/require-internal-member';
import PropertiesListClient from './PropertiesListClient';

export default async function InternalPropertiesPage() {
  await requireInternalMember('/internal/properties');

  return (
    <div className="min-h-screen bg-stone-50">
      <PropertiesListClient />
    </div>
  );
}
