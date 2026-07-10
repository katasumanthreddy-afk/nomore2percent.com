'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { resolvePropertyCoordinates } from '@/lib/area-coordinates';

const pinIcon = (
  <div style={{
    width: 22, height: 22, borderRadius: '50% 50% 50% 0',
    background: '#f97316', transform: 'rotate(-45deg)',
    border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  }} />
);

export default function PropertySingleMap({
  lat,
  lng,
  area,
}: {
  lat: number | null;
  lng: number | null;
  area: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;
  const [pinLat, pinLng] = resolvePropertyCoordinates(lat, lng, area);
  const hasPrecisePin = lat != null && lng != null;

  if (!apiKey) return null;

  return (
    <div>
      <APIProvider apiKey={apiKey}>
        <div className="h-72 rounded-xl overflow-hidden border border-stone-200">
          <Map
            defaultCenter={{ lat: pinLat, lng: pinLng }}
            defaultZoom={hasPrecisePin ? 15 : 13}
            mapId={mapId}
            gestureHandling="cooperative"
            disableDefaultUI={false}
          >
            <AdvancedMarker position={{ lat: pinLat, lng: pinLng }}>{pinIcon}</AdvancedMarker>
          </Map>
        </div>
      </APIProvider>
      {!hasPrecisePin && (
        <p className="text-[11px] text-stone-400 mt-1.5">Showing the approximate {area} area — exact location shared once you connect with Sumanth.</p>
      )}
    </div>
  );
}
