'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandForm from '@/components/internal/BrandForm';
import BulkSitesInput, { type BulkSitesValue } from '@/components/internal/BulkSitesInput';

export default function NewBrandClient() {
  const router = useRouter();
  const [sites, setSites] = useState<BulkSitesValue | null>(null);
  const onSites = useCallback((v: BulkSitesValue) => setSites(v), []);
  const count = sites?.rows.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/brands" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Brands</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">New brand</h1>

      <BrandForm
        submitLabel={count ? `Create brand + ${count} site${count === 1 ? '' : 's'}` : 'Create brand'}
        extra={
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800">Site requirements (optional)</div>
            <p className="text-xs text-stone-500 mb-3 mt-0.5">Paste every location this brand wants. Each becomes a search zone on the map, linked to the brand and checked against its spec.</p>
            <BulkSitesInput onChange={onSites} />
          </div>
        }
        onSubmit={async (values) => {
          const res = await fetch('/api/internal/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
          const d = await res.json();
          if (!d.success) return d.message || 'Could not save.';
          const brandId = d.brand.id;
          if (sites && sites.rows.length) {
            const r2 = await fetch('/api/internal/requirements/bulk', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                brand_id: brandId,
                requirements: sites.rows.map((r) => ({ title: r.title, lat: r.lat, lng: r.lng })),
                radius_min_m: sites.radius_min_m, radius_max_m: sites.radius_max_m,
                priority: sites.priority, target_date: sites.target_date || null,
              }),
            });
            const d2 = await r2.json();
            // The brand exists either way; send the user to it with the outcome.
            router.push(`/internal/brands/${brandId}?sites=${d2.success ? `${d2.created}-${d2.skipped}` : 'failed'}`);
            return null;
          }
          router.push(`/internal/brands/${brandId}`);
          return null;
        }}
      />
    </div>
  );
}
