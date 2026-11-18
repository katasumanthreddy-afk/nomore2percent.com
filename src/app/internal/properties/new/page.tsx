import { requireInternalMember } from '@/lib/require-internal-member';
import Link from 'next/link';
import PropertyForm from '@/components/internal/PropertyForm';
import { isValidLatLng } from '@/lib/map-workspace';

// ?lat=..&lng=.. (from "Drop pin" on the Map) pre-fills the location.
export default async function NewPropertyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireInternalMember('/internal/properties/new');
  const sp = await searchParams;
  const lat = Number(sp.lat); const lng = Number(sp.lng);
  const initialData = sp.lat && sp.lng && isValidLatLng(lat, lng) ? { lat, lng } : undefined;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/internal/properties" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Properties</Link>
        <h1 className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900 mb-6">Add Commercial Property</h1>
        <PropertyForm mode="create" initialData={initialData} />
      </div>
    </div>
  );
}
