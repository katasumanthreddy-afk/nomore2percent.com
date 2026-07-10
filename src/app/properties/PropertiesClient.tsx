'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types/property';
import { List, MapIcon } from 'lucide-react';

const PropertyMap = dynamic(() => import('@/components/PropertyMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] rounded-2xl bg-stone-200 animate-pulse" />,
});

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [listingFilter, setListingFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>(searchParams.get('area') || '');
  const [sort, setSort] = useState('default');
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProperties(data.properties);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...properties];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.area.toLowerCase().includes(q));
    }
    if (listingFilter) list = list.filter((p) => p.listing_type === listingFilter);
    if (areaFilter) list = list.filter((p) => p.area === areaFilter);
    if (sort === 'price_asc') list.sort((a, b) => (a.price_num || 0) - (b.price_num || 0));
    if (sort === 'price_desc') list.sort((a, b) => (b.price_num || 0) - (a.price_num || 0));
    if (sort === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [properties, search, listingFilter, areaFilter, sort]);

  const areas = Array.from(new Set(properties.map((p) => p.area))).sort();

  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Browse Properties</h1>
        <p className="text-stone-500 text-sm mb-6">Verified listings across Hyderabad at just 1% brokerage.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search area or project..."
            className="border border-stone-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-orange-400 flex-1 min-w-[200px]"
          />
          <select value={listingFilter} onChange={(e) => setListingFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All Listings</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All Areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="default">Sort: Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
          <div className="flex border border-stone-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${view === 'list' ? 'bg-orange-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${view === 'map' ? 'bg-orange-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              <MapIcon size={14} /> Map
            </button>
          </div>
          <span className="text-sm text-stone-500 ml-auto"><strong className="text-stone-800">{filtered.length}</strong> properties</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 bg-stone-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          view === 'map' ? (
            <PropertyMap properties={filtered} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filtered.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
            </div>
          )
        ) : (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-3 opacity-20">🏠</div>
            No properties match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesClient() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-stone-400">Loading...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
