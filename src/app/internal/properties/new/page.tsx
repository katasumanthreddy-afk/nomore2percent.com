import { requireInternalMember } from '@/lib/require-internal-member';
import Link from 'next/link';
import PropertyForm from '@/components/internal/PropertyForm';

export default async function NewPropertyPage() {
  await requireInternalMember('/internal/properties/new');

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/internal/properties" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Properties</Link>
        <h1 className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900 mb-6">Add Commercial Property</h1>
        <PropertyForm mode="create" />
      </div>
    </div>
  );
}
