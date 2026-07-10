'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: 'admin-pin-marker',
  html: `<div style="
    width: 20px; height: 20px; border-radius: 50% 50% 50% 0;
    background: #f97316; transform: rotate(-45deg);
    border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
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
  const position: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter;
  // Force remount when the area's fallback center changes but no precise pin
  // has been set yet, so the map recenters instead of staying put.
  const [mapKey, setMapKey] = useState(0);
  useEffect(() => {
    if (lat == null && lng == null) setMapKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCenter[0], defaultCenter[1]]);

  return (
    <div>
      <div className="h-64 rounded-lg overflow-hidden border border-stone-200">
        <MapContainer key={mapKey} center={position} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={pinIcon} />
          <ClickHandler onPick={onChange} />
        </MapContainer>
      </div>
      <p className="text-[11px] text-stone-500 mt-1.5">
        {lat != null && lng != null
          ? `Pin set at ${lat.toFixed(5)}, ${lng.toFixed(5)} — click the map to move it`
          : 'Showing approximate area center — click anywhere on the map to set the exact location'}
      </p>
    </div>
  );
}
