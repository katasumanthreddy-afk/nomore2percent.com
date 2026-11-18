import { requireInternalMember } from '@/lib/require-internal-member';
import Link from 'next/link';
import DealForm from '@/components/internal/DealForm';

export default async function NewDealPage({ searchParams }: { searchParams: Promise<{ property_id?: string }> }) {
  const { property_id } = await searchParams;
  await requireInternalMember('/internal/deals/new');

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/internal/deals" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Deals</Link>
        <h1 className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900 mb-6">Add Deal</h1>
        <DealForm mode="create" initialData={{ property_id: property_id || '' }} />
      </div>
    </div>
  );
}
