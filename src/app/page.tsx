'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import SurveyPopup from '@/components/SurveyPopup';
import { Property } from '@/types/property';

const AREAS = [
  'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills',
  'Kondapur', 'Kompally', 'Yapral', 'Alwal', 'Miyapur', 'Kukatpally',
];

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial'];
const BHK_OPTIONS = ['Any', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];
const BUDGET_OPTIONS = [
  { label: 'Any Budget', value: '' },
  { label: 'Under ₹30L', value: '0-3000000' },
  { label: '₹30L – ₹60L', value: '3000000-6000000' },
  { label: '₹60L – ₹1 Cr', value: '6000000-10000000' },
  { label: '₹1 Cr – ₹2 Cr', value: '10000000-20000000' },
  { label: '₹2 Cr – ₹5 Cr', value: '20000000-50000000' },
  { label: 'Above ₹5 Cr', value: '50000000-999999999' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'sale' | 'rent'>('sale');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bhk, setBhk] = useState('Any');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, sale: 0, rent: 0, areas: 0 });

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const props: Property[] = d.properties;
          setAllProperties(props);
          setFeaturedProperties(props.filter((p) => p.featured).slice(0, 6));
          setStats({
            total: props.length,
            sale: props.filter((p) => p.listing_type === 'sale').length,
            rent: props.filter((p) => p.listing_type === 'rent').length,
            areas: new Set(props.map((p) => p.area)).size,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('area', location);
    if (propertyType) params.set('type', propertyType.toLowerCase());
    if (activeTab) params.set('listing', activeTab);
    if (budget) params.set('budget', budget);
    if (bhk !== 'Any') params.set('bhk', bhk.replace(' BHK', ''));
    window.location.href = '/properties?' + params.toString();
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-[600px] md:min-h-[680px] flex flex-col justify-center overflow-hidden">
        {/* Background image via Unsplash CDN — free commercial use */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601619933635-023753974a65?w=1600&q=80')" }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-stone-950/30" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 py-16 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-400/20 border border-orange-400/30 rounded-full px-3 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-300 text-xs font-semibold uppercase tracking-widest">Verified Listings · Real Data · Fair Pricing</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Hyderabad Real Estate, Backed by <em className="text-orange-400 italic">Real Data.</em>
            </h1>
            <p className="text-stone-300 text-base md:text-lg mb-8 leading-relaxed">
              Just 1% brokerage — with verified listings, AI-powered area insights, and infrastructure data most brokers can't give you.
            </p>

            {/* Search box */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-stone-100">
                {(['sale', 'rent'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3.5 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {tab === 'sale' ? 'Buy' : 'Rent'}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Location */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase tracking-wide text-stone-400 mb-1 ml-1">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    list="area-options"
                    placeholder="Search area or project..."
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-stone-700"
                  />
                  <datalist id="area-options">
                    {AREAS.map((a) => <option key={a} value={a} />)}
                  </datalist>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-stone-400 mb-1 ml-1">Budget</label>
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-stone-700 bg-white">
                    {BUDGET_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>

                {/* Property type */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-stone-400 mb-1 ml-1">Property Type</label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-stone-700 bg-white">
                    <option value="">Any Type</option>
                    {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* BHK + Search button */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-wide text-stone-400 mb-1 ml-1">BHK</label>
                    <select value={bhk} onChange={(e) => setBhk(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-stone-700 bg-white">
                      {BHK_OPTIONS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-2.5 text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Popular searches */}
              <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-stone-400">Popular:</span>
                {['Yapral', 'Kompally', 'Gachibowli', 'Madhapur', 'Banjara Hills'].map((area) => (
                  <button
                    key={area}
                    onClick={() => { setLocation(area); }}
                    className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 hover:bg-orange-100 transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 1% trust badge — floating right */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white w-56">
            <div className="text-xs text-orange-300 font-semibold uppercase tracking-widest mb-1">1% Brokerage — Always</div>
            <div className="font-serif text-2xl font-bold mb-1">Save Lakhs.</div>
            <div className="text-stone-300 text-xs leading-relaxed mb-3">On a ₹1.5 Cr home, you save ₹1.5 Lakhs vs the industry standard.</div>
            <Link href="/properties" className="block text-center bg-orange-500 hover:bg-orange-400 text-white rounded-lg py-2 text-xs font-bold transition-colors">
              View Properties
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="bg-stone-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <StatItem value={stats.total > 0 ? stats.total + '+' : '—'} label="Live Listings" />
            <StatItem value={stats.areas > 0 ? stats.areas + '+' : '12'} label="Areas Covered" />
            <StatItem value="1%" label="Brokerage — Always" highlight />
            <StatItem value="₹1.5L" label="Avg. Saved Per Deal" />
          </div>
        </div>
      </div>

      {/* ── PROPERTY TYPE GRID ── */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Browse by Property Type</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Apartments', icon: '🏢', type: 'apartment' },
              { label: 'Villas', icon: '🏡', type: 'villa' },
              { label: 'Plots', icon: '📐', type: 'plot' },
              { label: 'Commercial', icon: '🏪', type: 'commercial' },
              { label: 'For Rent', icon: '🔑', listing: 'rent' },
              { label: 'All Listings', icon: '🔍', all: true },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.all ? '/properties' : item.listing ? `/properties?listing=${item.listing}` : `/properties?type=${item.type}`}
                className="flex flex-col items-center gap-2 bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 rounded-xl p-4 transition-all group"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-stone-600 group-hover:text-orange-600 text-center">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXPLORE PROPERTIES ── */}
      <div className="bg-stone-50 py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Explore Properties</h2>
            <Link href="/properties" className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-stone-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <PropertyTabs allProperties={allProperties} featuredProperties={featuredProperties} />
          )}
        </div>
      </div>

      {/* ── WHY NOMORE2PERCENT ── */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Why nomore2percent</div>
              <h2 className="font-serif text-3xl font-bold text-stone-900 mb-4">
                The 2% Era Is Over.
              </h2>
              <p className="text-stone-500 leading-relaxed mb-6">
                Every year, thousands of Hyderabad families silently pay 2% brokerage
                on the biggest purchase of their lives. We charge 1% — always — with no
                compromise on service, speed, or results.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '✓', text: `Verified listings across ${stats.areas > 0 ? stats.areas + '+' : 'multiple'} Hyderabad localities` },
                  { icon: '✓', text: 'Dedicated broker for every transaction' },
                  { icon: '✓', text: 'Real-time market data and area insights' },
                  { icon: '✓', text: '1% brokerage — not negotiable, always guaranteed' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-sm text-stone-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '1%', label: 'Brokerage charged', sub: 'vs 2% everywhere else' },
                { value: '₹1.5L', label: 'Avg savings per deal', sub: 'on a ₹1.5 Cr property' },
                { value: '12', label: 'Areas covered', sub: 'across Hyderabad' },
                { value: '24h', label: 'Response time', sub: 'from enquiry to visit' },
              ].map((s) => (
                <div key={s.label} className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                  <div className="font-serif text-3xl font-bold text-orange-500 mb-1">{s.value}</div>
                  <div className="text-sm font-semibold text-stone-800">{s.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-3">Ready to Find Your Home in Hyderabad?</h2>
          <p className="text-orange-100 mb-6">Browse verified listings across the city — and save lakhs in brokerage.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/properties" className="bg-white text-orange-600 rounded-lg px-6 py-3 text-sm font-bold hover:bg-orange-50 transition-colors">
              Find Your Home
            </Link>
          </div>
        </div>
      </div>

      <SurveyPopup />
    </div>
  );
}

function StatItem({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`font-serif text-3xl font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</div>
      <div className="text-stone-400 text-xs mt-1">{label}</div>
    </div>
  );
}

const ONE_CRORE = 10000000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function PropertyTabs({ allProperties, featuredProperties }: { allProperties: Property[]; featuredProperties: Property[] }) {
  type TabId = 'new' | 'trending' | 'under1cr';
  const [tab, setTab] = useState<TabId>('new');

  const newToday = allProperties.filter(
    (p) => p.created_at && (Date.now() - new Date(p.created_at).getTime()) < ONE_DAY_MS
  );
  // "New Today" falls back to the most recent listings if nothing was added in the last 24h,
  // so the tab isn't empty on a quiet day.
  const newTodayOrRecent = newToday.length > 0 ? newToday : allProperties.slice(0, 6);

  // No view/click tracking exists yet, so "Trending" uses the featured flag —
  // the one manual signal Sumanth already sets from the admin panel.
  const trending = featuredProperties.length > 0 ? featuredProperties : allProperties.slice(0, 6);

  const under1Cr = allProperties.filter(
    (p) => p.listing_type === 'sale' && typeof p.price_num === 'number' && p.price_num > 0 && p.price_num < ONE_CRORE
  );

  const tabs: { id: TabId; label: string; items: Property[]; emptyMsg: string }[] = [
    { id: 'new', label: 'New Today', items: newTodayOrRecent, emptyMsg: 'No listings yet — check back soon.' },
    { id: 'trending', label: 'Trending', items: trending, emptyMsg: 'No trending properties marked yet.' },
    { id: 'under1cr', label: 'Under 1 Cr', items: under1Cr, emptyMsg: 'No properties under ₹1 Cr right now.' },
  ];

  const active = tabs.find((t) => t.id === tab)!;
  const items = active.items.slice(0, 6);

  return (
    <div>
      <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-orange-500 text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-stone-400">
          <div className="text-5xl mb-3 opacity-20">🏠</div>
          <p className="text-sm">{active.emptyMsg}</p>
          <Link href="/admin" className="text-orange-500 text-sm hover:underline mt-1 inline-block">
            Add some from the admin panel →
          </Link>
        </div>
      )}
    </div>
  );
}
