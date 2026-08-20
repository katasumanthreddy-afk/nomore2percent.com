'use client';

import { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { resolvePropertyCoordinates, HYDERABAD_CENTER } from '@/lib/area-coordinates';

interface CommercialProperty {
  id: number; title: string; area: string | null; lat: number | null; lng: number | null;
  property_type: string; deal_type: string; status: string;
  price_label: string | null; lease_rate_label: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-emerald-500 border-emerald-500',
  under_negotiation: 'bg-amber-500 border-amber-500',
  closed: 'bg-stone-500 border-stone-500',
  off_market: 'bg-red-500 border-red-500',
};

export default function CommercialPropertyMap({ properties }: { properties: CommercialProperty[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const points = useMemo(
    () => properties.map((p) => ({ property: p, coords: resolvePropertyCoordinates(p.lat, p.lng, p.area || '') })),
    [properties]
  );

  const center = points.length > 0
    ? { lat: points[0].coords[0], lng: points[0].coords[1] }
    : { lat: HYDERABAD_CENTER[0], lng: HYDERABAD_CENTER[1] };

  const active = points.find((pt) => pt.property.id === activeId);

  if (!apiKey) {
    return <div className="h-[550px] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm text-stone-500">Map view isn&apos;t configured.</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[550px] rounded-xl overflow-hidden border border-stone-200 relative">
        <Map defaultCenter={center} defaultZoom={11} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy">
          {points.map(({ property: p, coords }) => (
            <AdvancedMarker key={p.id} position={{ lat: coords[0], lng: coords[1] }} onClick={() => setActiveId(p.id === activeId ? null : p.id)}>
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow ${STATUS_COLOR[p.status] || 'bg-stone-400'} ${p.id === activeId ? 'scale-150' : ''} transition-transform`} />
            </AdvancedMarker>
          ))}
        </Map>
        {active && (
          <Link href={`/internal/properties/${active.property.id}`} className="absolute bottom-4 left-4 z-20 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-3 hover:border-orange-300 transition-colors">
            <div className="text-sm font-bold text-stone-900">{active.property.title}</div>
            <div className="text-xs text-stone-500 capitalize mb-1">{active.property.area} · {active.property.property_type}</div>
            <div className="text-sm font-bold text-orange-500">{active.property.deal_type === 'lease' ? active.property.lease_rate_label : active.property.price_label}</div>
          </Link>
        )}
      </div>
    </APIProvider>
  );
}
