'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BRAND_CATEGORIES, BRAND_STATUSES, specLine } from '@/lib/brands-projects';

interface Brand {
  id: number; name: string; category: string; status: string;
  contact_name: string | null; contact_role: string | null; contact_phone: string | null;
  min_land_sq_yds: number | null; min_builtup_sqft: number | null; min_road_width_ft: number | null;
  rent_min_per_sqft: number | null; rent_max_per_sqft: number | null;
  open_requirements: number; live_projects: number; done_projects: number;
}

const cat = (v: string) => BRAND_CATEGORIES.find((c) => c.value === v)?.label || v;
const st = (v: string) => BRAND_STATUSES.find((s) => s.value === v);

export default function BrandsListClient() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/internal/brands').then((r) => r.json())
      .then((d) => { if (d.success) setBrands(d.brands); else setError(d.message); })
      .catch(() => setError('Could not load brands.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Brands</h1>
          <p className="text-sm text-stone-500 mt-1">Who needs space, what format they need, and who to call.</p>
        </div>
        <Link href="/internal/brands/new" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">+ New brand</Link>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}{/brands/.test(error) ? ' (run brands-projects-schema.sql in the internal Supabase project)' : ''}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : brands.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center text-sm text-stone-500">
          No brands yet. Add the companies you&apos;re talking to (Blinkit, Zepto, Flipkart Minutes…) with their site spec, then link site requirements to them.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {brands.map((b) => (
            <Link key={b.id} href={`/internal/brands/${b.id}`} className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-serif text-lg font-bold text-stone-900">{b.name}</div>
                  <div className="text-xs text-stone-500">{cat(b.category)}</div>
                </div>
                {st(b.status) && <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${st(b.status)!.badge}`}>{st(b.status)!.label}</span>}
              </div>
              {specLine(b) && <div className="text-xs text-stone-600 mt-3">{specLine(b)}</div>}
              <div className="text-xs text-stone-500 mt-1">{b.contact_name ? `${b.contact_name}${b.contact_role ? `, ${b.contact_role}` : ''}` : 'No contact yet'}</div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-100 text-center">
                <div><div className="font-bold text-stone-900">{b.open_requirements}</div><div className="text-[11px] text-stone-500">open sites</div></div>
                <div><div className="font-bold text-stone-900">{b.live_projects}</div><div className="text-[11px] text-stone-500">live projects</div></div>
                <div><div className="font-bold text-emerald-600">{b.done_projects}</div><div className="text-[11px] text-stone-500">rent started</div></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
