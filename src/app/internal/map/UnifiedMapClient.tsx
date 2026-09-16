'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const SiteMap = dynamic(() => import('@/components/internal/SiteMap'), {
  ssr: false,
  loading: () => <div className="h-[650px] rounded-xl bg-stone-200 animate-pulse" />,
});

export interface Property {
  id: number; title: string; area: string | null; lat: number | null; lng: number | null;
  deal_type: string; status: string; lease_rate_label: string | null; price_label: string | null;
}

export interface Requirement {
  id: number; title: string; lat: number; lng: number; status: string; radius_max_m: number;
}

export default function UnifiedMapClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealTypeFilter, setDealTypeFilter] = useState<'lease' | 'all'>('lease');
  const [radiusMeters, setRadiusMeters] = useState(750);
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/internal/properties').then((r) => r.json()),
      fetch('/api/internal/requirements').then((r) => r.json()),
    ]).then(([p, r]) => {
      if (p.success) setProperties(p.properties.filter((x: Property) => x.lat != null && x.lng != null));
      if (r.success) setRequirements(r.requirements);
    }).finally(() => setLoading(false));
  }, []);

  const visibleProperties = dealTypeFilter === 'lease' ? properties.filter((p) => p.deal_type === 'lease') : properties;
  const selectedRequirement = requirements.find((r) => r.id === selectedRequirementId) || null;

  const highlightPropertyIds = new Set<number>();
  if (selectedRequirement) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    for (const p of visibleProperties) {
      if (p.lat == null || p.lng == null) continue;
      const dLat = toRad(p.lat - selectedRequirement.lat);
      const dLng = toRad(p.lng - selectedRequirement.lng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(selectedRequirement.lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distance <= radiusMeters) highlightPropertyIds.add(p.id);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Map Overview</h1>
        <div className="flex gap-2">
          <Link href="/internal/properties" className="border border-stone-200 hover:border-stone-300 text-stone-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">Properties</Link>
          <Link href="/internal/requirements" className="border border-stone-200 hover:border-stone-300 text-stone-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">Requirements</Link>
        </div>
      </div>
      <p className="text-stone-500 text-sm mb-6">Listed properties and site requirements together. Click a requirement to see which properties fall within your chosen radius.</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-[650px] bg-stone-200 rounded-xl animate-pulse" />
          ) : (
            <SiteMap
              properties={visibleProperties.filter((p): p is Property & { lat: number; lng: number } => p.lat != null && p.lng != null)}
              requirements={requirements}
              selectedRequirementId={selectedRequirementId}
              adjustableRadiusM={radiusMeters}
              highlightPropertyIds={highlightPropertyIds}
              onSelectRequirement={setSelectedRequirementId}
              height="650px"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Show Properties</div>
            <select value={dealTypeFilter} onChange={(e) => setDealTypeFilter(e.target.value as 'lease' | 'all')} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm">
              <option value="lease">For Lease Only</option>
              <option value="all">All Properties</option>
            </select>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Search Radius: {radiusMeters}m</div>
            <input
              type="range" min="100" max="2000" step="50"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-1">
              <span>100m</span>
              <span>2km</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-2">Click any orange requirement marker on the map, then drag this to see which properties fall inside different distances.</p>
          </div>

          {selectedRequirement ? (
            <NearbyPanel requirement={selectedRequirement} properties={visibleProperties} radiusMeters={radiusMeters} />
          ) : (
            <div className="bg-white border border-dashed border-stone-300 rounded-xl p-6 text-center text-xs text-stone-400">
              Click a requirement marker to see nearby properties and their exact distances.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NearbyPanel({ requirement, properties, radiusMeters }: { requirement: Requirement; properties: Property[]; radiusMeters: number }) {
  const nearby = useMemo(() => {
    // Inline Haversine — same formula as the shared server util, kept local
    // here so this stays a pure client component with no server import.
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    return properties
      .map((p) => {
        const dLat = toRad((p.lat as number) - requirement.lat);
        const dLng = toRad((p.lng as number) - requirement.lng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(requirement.lat)) * Math.cos(toRad(p.lat as number)) * Math.sin(dLng / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...p, distance: Math.round(distance) };
      })
      .filter((p) => p.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }, [requirement, properties, radiusMeters]);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{requirement.title}</div>
      <div className="text-xs text-orange-500 font-semibold mb-3">{nearby.length} propert{nearby.length === 1 ? 'y' : 'ies'} within {radiusMeters}m</div>
      {nearby.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {nearby.map((p) => (
            <Link key={p.id} href={`/internal/properties/${p.id}`} className="block bg-stone-50 hover:bg-stone-100 rounded-lg px-3 py-2 transition-colors">
              <div className="text-sm font-semibold text-stone-800">{p.title}</div>
              <div className="text-xs text-stone-500 flex justify-between">
                <span>{p.deal_type === 'lease' ? p.lease_rate_label : p.price_label}</span>
                <span className="font-semibold text-orange-500">{p.distance}m</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-400">No properties within this radius. Try increasing it.</p>
      )}
    </div>
  );
}
