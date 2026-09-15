'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';

interface Match {
  id: number; title: string; area: string | null; status: string; deal_type: string;
  price_label: string | null; lease_rate_label: string | null; distance_m: number; lat: number; lng: number;
}
interface RequirementResult {
  id: number; title: string; lat: number; lng: number; radius_max_m: number; status: string;
  matched_property_id: number | null; matches: Match[];
}

function RadiusCircle({ map, center, radius }: { map: google.maps.Map; center: { lat: number; lng: number }; radius: number }) {
  const [circle] = useState(() => new google.maps.Circle({
    center, radius, map,
    strokeColor: '#f97316', strokeOpacity: 0.4, strokeWeight: 1,
    fillColor: '#f97316', fillOpacity: 0.05,
  }));
  circle.setMap(map);
  return null;
}

export default function MatchesMap({ results }: { results: RequirementResult[] }) {
  const [activeMarker, setActiveMarker] = useState<{ type: 'req' | 'prop'; id: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  // Flatten to unique matched properties (a property could satisfy more
  // than one requirement — only plot it once, green, since it's a match
  // either way).
  const matchedPropertiesById: Record<number, Match> = {};
  results.forEach((r) => r.matches.forEach((m) => { matchedPropertiesById[m.id] = m; }));
  const matchedProperties = Object.values(matchedPropertiesById);

  const center = results.length > 0
    ? { lat: results[0].lat, lng: results[0].lng }
    : { lat: 17.4, lng: 78.45 };

  const activeReq = activeMarker?.type === 'req' ? results.find((r) => r.id === activeMarker.id) : null;
  const activeProp = activeMarker?.type === 'prop' ? matchedProperties.find((p) => p.id === activeMarker.id) : null;

  if (!apiKey) {
    return <div className="h-[600px] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm text-stone-500">Map view isn&apos;t configured.</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[600px] rounded-xl overflow-hidden border border-stone-200 relative">
        <div className="absolute top-3 left-3 z-20 bg-white/95 rounded-lg px-3 py-2 shadow text-xs space-y-1">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Requirement with matches</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Matched property</div>
        </div>

        <Map defaultCenter={center} defaultZoom={11} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy" onIdle={(e) => setMapInstance(e.map)}>
          {results.map((r) => (
            <AdvancedMarker key={`req-${r.id}`} position={{ lat: r.lat, lng: r.lng }} onClick={() => setActiveMarker({ type: 'req', id: r.id })}>
              <div className="w-4 h-4 rounded-full border-2 border-white shadow bg-orange-500" />
            </AdvancedMarker>
          ))}

          {matchedProperties.map((p) => (
            <AdvancedMarker key={`prop-${p.id}`} position={{ lat: p.lat, lng: p.lng }} onClick={() => setActiveMarker({ type: 'prop', id: p.id })}>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow bg-emerald-500" />
            </AdvancedMarker>
          ))}

          {mapInstance && results.map((r) => (
            <RadiusCircle key={`circle-${r.id}`} map={mapInstance} center={{ lat: r.lat, lng: r.lng }} radius={r.radius_max_m} />
          ))}
        </Map>

        {activeReq && (
          <Link href={`/internal/requirements/${activeReq.id}`} className="absolute bottom-4 left-4 z-20 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-3 hover:border-orange-300 transition-colors">
            <div className="text-sm font-bold text-stone-900">{activeReq.title}</div>
            <div className="text-xs text-orange-500 font-semibold">{activeReq.matches.length} match{activeReq.matches.length === 1 ? '' : 'es'} nearby</div>
          </Link>
        )}
        {activeProp && (
          <Link href={`/internal/properties/${activeProp.id}`} className="absolute bottom-4 left-4 z-20 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-3 hover:border-emerald-300 transition-colors">
            <div className="text-sm font-bold text-stone-900">{activeProp.title}</div>
            <div className="text-xs text-stone-500">{activeProp.deal_type === 'lease' ? activeProp.lease_rate_label : activeProp.price_label}</div>
            <div className="text-xs text-emerald-600 font-semibold">{activeProp.distance_m}m from requirement</div>
          </Link>
        )}
      </div>
    </APIProvider>
  );
}
