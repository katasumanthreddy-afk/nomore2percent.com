'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CommercialPropertyMap = dynamic(() => import('@/components/internal/CommercialPropertyMap'), {
  ssr: false,
  loading: () => <div className="h-[550px] rounded-xl bg-stone-200 animate-pulse" />,
});

interface Property {
  id: number; title: string; area: string | null; address: string | null; lat: number | null; lng: number | null;
  property_type: string; deal_type: string; status: string;
  price_label: string | null; lease_rate_label: string | null; sqft: number | null;
}

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  under_negotiation: 'bg-amber-50 text-amber-600 border-amber-200',
  closed: 'bg-stone-100 text-stone-500 border-stone-200',
  off_market: 'bg-red-50 text-red-600 border-red-200',
};

export default function PropertiesListClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/internal/properties').then((r) => r.json()).then((d) => { if (d.success) setProperties(d.properties); }).finally(() => setLoading(false));
  }, []);

  const filtered = properties
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.area?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q);
    });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Commercial Properties</h1>
        <Link href="/internal/properties/new" className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">
          + Add Property
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, area, address..."
          className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs w-56"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs">
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="under_negotiation">Under Negotiation</option>
          <option value="closed">Closed</option>
          <option value="off_market">Off Market</option>
        </select>
        <div className="flex border border-stone-200 rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-semibold ${view === 'list' ? 'bg-orange-500 text-white' : 'text-stone-500'}`}>List</button>
          <button onClick={() => setView('map')} className={`px-3 py-1.5 text-xs font-semibold ${view === 'map' ? 'bg-orange-500 text-white' : 'text-stone-500'}`}>Map</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : view === 'map' ? (
        <CommercialPropertyMap properties={filtered} />
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {filtered.map((p) => (
            <Link key={p.id} href={`/internal/properties/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors">
              <div>
                <div className="text-sm font-semibold text-stone-800">{p.title}</div>
                <div className="text-xs text-stone-500 capitalize">{p.area} · {p.property_type} · {p.deal_type} {p.sqft ? `· ${p.sqft} sqft` : ''}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-orange-500">{p.deal_type === 'lease' ? p.lease_rate_label : p.price_label}</span>
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${STATUS_BADGE[p.status] || ''}`}>{p.status?.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">No properties yet.</div>
      )}
    </div>
  );
}
