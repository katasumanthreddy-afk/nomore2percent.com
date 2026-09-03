'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

// Pans the map whenever lat/lng changes — needed because Map's defaultCenter
// only applies once on mount. Without this, typing coordinates that are far
// from the current view would move the marker but leave it off-screen,
// looking like nothing happened.
function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) map.panTo({ lat, lng });
  }, [map, lat, lng]);
  return null;
}

export default function LocationPicker({
  lat,
  lng,
  defaultCenter,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  defaultCenter: [number, number];
  onChange: (lat: number, lng: number) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const position = lat != null && lng != null ? { lat, lng } : { lat: defaultCenter[0], lng: defaultCenter[1] };

  // Force the map to recenter when the area's fallback center changes but no
  // precise pin has been set yet (e.g. switching the Area dropdown).
  const [mapKey, setMapKey] = useState(0);
  useEffect(() => {
    if (lat == null && lng == null) setMapKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCenter[0], defaultCenter[1]]);

  if (!apiKey) {
    return (
      <div className="h-64 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center text-center px-6">
        <p className="text-xs text-stone-500">Map isn&apos;t configured yet — missing Google Maps API key.</p>
      </div>
    );
  }

  return (
    <div>
      <APIProvider apiKey={apiKey}>
        <div className="h-64 rounded-lg overflow-hidden border border-stone-200">
          <Map
            key={mapKey}
            defaultCenter={position}
            defaultZoom={14}
            mapId={mapId}
            gestureHandling="greedy"
            onClick={(e) => {
              if (e.detail.latLng) onChange(e.detail.latLng.lat, e.detail.latLng.lng);
            }}
          >
            <AdvancedMarker position={position} />
            {lat != null && lng != null && <MapPanner lat={lat} lng={lng} />}
          </Map>
        </div>
      </APIProvider>
      <p className="text-[11px] text-stone-500 mt-1.5">
        {lat != null && lng != null
          ? `Pin set at ${lat.toFixed(5)}, ${lng.toFixed(5)} — click the map to move it`
          : 'Showing approximate area center — click anywhere on the map to set the exact location'}
      </p>
    </div>
  );
}
