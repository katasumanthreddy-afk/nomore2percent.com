'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types/property';

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProperties(data.properties);
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = properties.filter((p) => p.featured).slice(0, 3);
  const areas = ['Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kompally', 'Yapral', 'Alwal', 'Kondapur'];

  const goSearch = () => {
    router.push(`/properties${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-900 to-orange-950 px-6 md:px-10 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(200,114,42,0.18),transparent_60%)]" />
        <div className="relative max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-300 mb-4">📍 Hyderabad's Fairest Real Estate Marketplace<Footer />
    </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-50 leading-tight mb-4">
            Find Your <em className="text-orange-300 italic">Perfect Home</em>.<br />Pay Just 1% Brokerage.
          </h1>
          <p className="text-stone-300 text-sm md:text-base mb-8 max-w-lg">
            Browse verified properties across Hyderabad. Buy, sell, or rent — with half the brokerage of every other broker in the city.
          </p>
          <div className="bg-white rounded-2xl p-1.5 flex items-center gap-2 max-w-xl shadow-2xl">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goSearch()}
              placeholder="Search by area, project name, or locality..."
              className="flex-1 px-4 py-2.5 text-sm outline-none rounded-xl"
            />
            <button onClick={goSearch} className="bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-orange-500 transition-colors whitespace-nowrap">
              🔍 Search
            </button>
          <Footer />
    </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => router.push(`/properties?area=${encodeURIComponent(area)}`)}
                className="text-xs bg-white/10 border border-white/15 text-white/75 px-3.5 py-1.5 rounded-full hover:bg-orange-400/30 hover:border-orange-400/40 hover:text-white transition-colors"
              >
                {area}
              </button>
            ))}
          <Footer />
    </div>
        <Footer />
    </div>
      <Footer />
    </div>

      {/* Savings banner */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <p className="text-sm text-white/90">
          <strong className="text-white">You pay just 1% brokerage — always.</strong> On a ₹1.5 Cr home that's ₹1.5 Lakhs back in your pocket.
        </p>
        <div className="font-serif text-2xl font-bold text-white">1% Only<Footer />
    </div>
      <Footer />
    </div>

      {/* Featured listings */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold">Featured Properties</h2>
          <button onClick={() => router.push('/properties')} className="text-sm font-semibold text-orange-400 hover:text-orange-500">View all →</button>
        <Footer />
    </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-stone-200 rounded-2xl animate-pulse" />
            ))}
          <Footer />
    </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
          <Footer />
    </div>
        ) : (
          <div className="text-center py-16 text-stone-400">
            No featured properties yet. <button onClick={() => router.push('/admin')} className="text-orange-400 underline">Add some from the admin panel</button>.
          <Footer />
    </div>
        )}
      <Footer />
    </div>
    <Footer />
    </div>
  );
}
