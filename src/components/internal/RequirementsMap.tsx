'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';

interface Requirement {
  id: number; title: string; lat: number; lng: number;
  radius_max_m: number; status: string; nearby_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  searching: '#f97316',
  found: '#10b981',
  closed: '#78716c',
};

function RadiusCircle({ map, center, radius, color }: { map: google.maps.Map; center: { lat: number; lng: number }; radius: number; color: string }) {
  const [circle] = useState(() => new google.maps.Circle({
    center, radius, map,
    strokeColor: color, strokeOpacity: 0.6, strokeWeight: 1.5,
    fillColor: color, fillOpacity: 0.08,
  }));
  circle.setMap(map);
  return null;
}

export default function RequirementsMap({
  requirements,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: {
  requirements: Requirement[];
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const center = requirements.length > 0
    ? { lat: requirements[0].lat, lng: requirements[0].lng }
    : { lat: 17.4, lng: 78.45 };

  const active = requirements.find((r) => r.id === activeId);

  const handleMarkerClick = (id: number) => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(id);
    } else {
      setActiveId(id === activeId ? null : id);
    }
  };

  if (!apiKey) {
    return <div className="h-[600px] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm text-stone-500">Map view isn&apos;t configured.</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[600px] rounded-xl overflow-hidden border border-stone-200 relative">
        {selectionMode && (
          <div className="absolute top-3 left-3 z-20 bg-stone-900 text-white text-xs font-semibold rounded-lg px-3 py-2 shadow-lg">
            Click markers to select · {selectedIds?.size || 0} selected
          </div>
        )}
        <Map defaultCenter={center} defaultZoom={10} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy" onIdle={(e) => setMapInstance(e.map)}>
          {requirements.map((r) => {
            const isSelected = selectedIds?.has(r.id);
            return (
              <AdvancedMarker key={r.id} position={{ lat: r.lat, lng: r.lng }} onClick={() => handleMarkerClick(r.id)}>
                {selectionMode ? (
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow transition-all ${isSelected ? 'bg-orange-500 border-white scale-110' : 'bg-white border-stone-300'}`}
                  >
                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ background: STATUS_COLOR[r.status] || '#f97316' }} />
                )}
              </AdvancedMarker>
            );
          })}
          {mapInstance && requirements.map((r) => (
            <RadiusCircle
              key={`circle-${r.id}`}
              map={mapInstance}
              center={{ lat: r.lat, lng: r.lng }}
              radius={r.radius_max_m}
              color={selectionMode && selectedIds?.has(r.id) ? '#f97316' : (STATUS_COLOR[r.status] || '#f97316')}
            />
          ))}
        </Map>
        {!selectionMode && active && (
          <Link href={`/internal/requirements/${active.id}`} className="absolute bottom-4 left-4 z-20 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-3 hover:border-orange-300 transition-colors">
            <div className="text-sm font-bold text-stone-900">{active.title}</div>
            <div className="text-xs text-stone-500 capitalize mb-1">{active.status} · up to {active.radius_max_m}m radius</div>
            <div className="text-xs font-semibold text-orange-500">{active.nearby_count} propert{active.nearby_count === 1 ? 'y' : 'ies'} nearby</div>
          </Link>
        )}
      </div>
    </APIProvider>
  );
}
