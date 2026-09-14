'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Property, Requirement } from '@/app/internal/map/UnifiedMapClient';

function RadiusCircle({ map, center, radius }: { map: google.maps.Map; center: { lat: number; lng: number }; radius: number }) {
  const [circle] = useState(() => new google.maps.Circle({
    center, radius, map,
    strokeColor: '#f97316', strokeOpacity: 0.7, strokeWeight: 2,
    fillColor: '#f97316', fillOpacity: 0.1,
  }));
  circle.setCenter(center);
  circle.setRadius(radius);
  circle.setMap(map);
  return null;
}

export default function UnifiedMap({
  properties,
  requirements,
  radiusMeters,
  selectedRequirementId,
  onSelectRequirement,
}: {
  properties: Property[];
  requirements: Requirement[];
  radiusMeters: number;
  selectedRequirementId: number | null;
  onSelectRequirement: (id: number) => void;
}) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const selected = requirements.find((r) => r.id === selectedRequirementId) || null;

  const center = selected
    ? { lat: selected.lat, lng: selected.lng }
    : requirements.length > 0
    ? { lat: requirements[0].lat, lng: requirements[0].lng }
    : { lat: 17.4, lng: 78.45 };

  // Which properties currently fall inside the selected requirement's
  // radius — used purely to highlight them a different color on the map.
  const nearbyIds = new Set<number>();
  if (selected) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    for (const p of properties) {
      if (p.lat == null || p.lng == null) continue;
      const dLat = toRad(p.lat - selected.lat);
      const dLng = toRad(p.lng - selected.lng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(selected.lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distance <= radiusMeters) nearbyIds.add(p.id);
    }
  }

  if (!apiKey) {
    return <div className="h-[650px] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm text-stone-500">Map view isn&apos;t configured.</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[650px] rounded-xl overflow-hidden border border-stone-200 relative">
        <div className="absolute top-3 left-3 z-20 bg-white/95 rounded-lg px-3 py-2 shadow text-xs space-y-1">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Requirement</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Property (in range)</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Property</div>
        </div>

        <Map defaultCenter={center} defaultZoom={11} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy" onIdle={(e) => setMapInstance(e.map)}>
          {requirements.map((r) => (
            <AdvancedMarker key={`req-${r.id}`} position={{ lat: r.lat, lng: r.lng }} onClick={() => onSelectRequirement(r.id)}>
              <div className={`rounded-full border-2 border-white shadow flex items-center justify-center bg-orange-500 ${r.id === selectedRequirementId ? 'w-6 h-6 scale-110' : 'w-3.5 h-3.5'}`} />
            </AdvancedMarker>
          ))}

          {properties.map((p) => p.lat != null && p.lng != null && (
            <AdvancedMarker key={`prop-${p.id}`} position={{ lat: p.lat, lng: p.lng }}>
              <div className={`w-3 h-3 rounded-full border-2 border-white shadow ${nearbyIds.has(p.id) ? 'bg-emerald-500' : 'bg-blue-400'}`} />
            </AdvancedMarker>
          ))}

          {mapInstance && selected && (
            <RadiusCircle map={mapInstance} center={{ lat: selected.lat, lng: selected.lng }} radius={radiusMeters} />
          )}
        </Map>
      </div>
    </APIProvider>
  );
}
