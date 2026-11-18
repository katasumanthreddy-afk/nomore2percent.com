import { requireInternalMember } from '@/lib/require-internal-member';
import BulkImportClient from './BulkImportClient';

export default async function BulkImportPage() {
  await requireInternalMember('/internal/properties/bulk-import');

  return (
    <div className="min-h-screen bg-stone-50">
      <BulkImportClient />
    </div>
  );
}
