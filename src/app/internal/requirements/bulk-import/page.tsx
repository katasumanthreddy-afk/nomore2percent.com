import { Suspense } from 'react';
import { requireInternalMember } from '@/lib/require-internal-member';
import RequirementsBulkImportClient from './RequirementsBulkImportClient';

export default async function RequirementsBulkImportPage() {
  await requireInternalMember('/internal/requirements/bulk-import');

  return (
    <div className="min-h-screen bg-stone-50">
      <Suspense><RequirementsBulkImportClient /></Suspense>
    </div>
  );
}
