'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandForm from '@/components/internal/BrandForm';

export default function NewBrandClient() {
  const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/brands" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Brands</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">New brand</h1>
      <BrandForm
        submitLabel="Create brand"
        onSubmit={async (values) => {
          const res = await fetch('/api/internal/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
          const d = await res.json();
          if (!d.success) return d.message || 'Could not save.';
          router.push(`/internal/brands/${d.brand.id}`);
          return null;
        }}
      />
    </div>
  );
}
