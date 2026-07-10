'use client';

import { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { Property } from '@/types/property';
import { resolvePropertyCoordinates, HYDERABAD_CENTER } from '@/lib/area-coordinates';

function shortPrice(price: string): string {
  return price.length > 12 ? price.slice(0, 11) + '…' : price;
}

function PriceBubble({ property, active, onClick }: { property: Property; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md border transition-transform hover:scale-105 ${
        active
          ? 'bg-stone-900 text-white border-stone-900 z-10'
          : property.featured
          ? 'bg-orange-500 text-white border-orange-500'
          : 'bg-white text-stone-900 border-stone-200'
      }`}
    >
      ₹{shortPrice(property.price)}
    </button>
  );
}

export default function PropertyMap({ properties }: { properties: Property[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const points = useMemo(
    () =>
      properties
        .filter((p) => p.area)
        .map((p) => ({
          property: p,
          coords: resolvePropertyCoordinates(p.lat, p.lng, p.area),
        })),
    [properties]
  );

  const center = points.length > 0
    ? { lat: points[0].coords[0], lng: points[0].coords[1] }
    : { lat: HYDERABAD_CENTER[0], lng: HYDERABAD_CENTER[1] };

  const active = points.find((pt) => pt.property.id === activeId);

  if (!apiKey) {
    return (
      <div className="h-[600px] rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center text-center px-6">
        <p className="text-sm text-stone-500">Map view isn't configured yet — missing Google Maps API key.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[600px] rounded-2xl overflow-hidden border border-stone-200 relative">
        <Map defaultCenter={center} defaultZoom={11} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy">
          {points.map(({ property: p, coords }) => (
            <AdvancedMarker
              key={p.id}
              position={{ lat: coords[0], lng: coords[1] }}
              onClick={() => setActiveId(p.id === activeId ? null : p.id)}
            >
              <PriceBubble property={p} active={p.id === activeId} onClick={() => setActiveId(p.id === activeId ? null : p.id)} />
            </AdvancedMarker>
          ))}
        </Map>

        {active && (
          <div className="absolute bottom-4 left-4 z-20 w-56">
            <Link href={`/properties/${active.property.id}`} className="block bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden hover:border-orange-300 transition-colors">
              <div className="h-28 bg-stone-100">
                {active.property.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.property.images[0]} alt={active.property.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🏠</div>
                )}
              </div>
              <div className="p-2.5">
                <div className="text-xs font-bold text-stone-900 truncate">{active.property.title}</div>
                <div className="text-[11px] text-stone-500 mb-1">{active.property.area}</div>
                <div className="text-sm font-bold text-orange-500">₹{active.property.price}</div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
