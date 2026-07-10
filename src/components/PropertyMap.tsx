'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { Property } from '@/types/property';
import { resolvePropertyCoordinates, HYDERABAD_CENTER } from '@/lib/area-coordinates';
import 'leaflet/dist/leaflet.css';

// Custom price-bubble marker (Airbnb-style) instead of Leaflet's default pin,
// which also sidesteps the well-known bundler asset-path issue with Leaflet's
// default marker images in Next.js.
function priceBubbleIcon(label: string, featured: boolean) {
  return L.divIcon({
    className: 'property-price-marker',
    html: `<div style="
      background: ${featured ? '#f97316' : '#ffffff'};
      color: ${featured ? '#ffffff' : '#1c1917'};
      border: 1.5px solid ${featured ? '#f97316' : '#e7e5e4'};
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      transform: translate(-50%, -100%);
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function shortPrice(price: string): string {
  // Properties already store a display-ready price string (e.g. "1.35 Cr", "45,000/mo") — reuse it directly, trimmed.
  return price.length > 12 ? price.slice(0, 11) + '…' : price;
}

export default function PropertyMap({ properties }: { properties: Property[] }) {
  const points = useMemo(
    () =>
      properties
        .filter((p) => p.area) // needs at least an area to place anywhere
        .map((p) => ({
          property: p,
          coords: resolvePropertyCoordinates(p.lat, p.lng, p.area),
        })),
    [properties]
  );

  const center: [number, number] = points.length > 0 ? points[0].coords : HYDERABAD_CENTER;

  return (
    <div className="h-[600px] rounded-2xl overflow-hidden border border-stone-200">
      <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ property: p, coords }) => (
          <Marker key={p.id} position={coords} icon={priceBubbleIcon('₹' + shortPrice(p.price), p.featured)}>
            <Popup>
              <Link href={`/properties/${p.id}`} className="block w-48 -m-1">
                <div className="h-28 bg-stone-100 rounded-t overflow-hidden -mx-1 -mt-1 mb-2">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🏠</div>
                  )}
                </div>
                <div className="text-xs font-bold text-stone-900 truncate">{p.title}</div>
                <div className="text-[11px] text-stone-500 mb-1">{p.area}</div>
                <div className="text-sm font-bold text-orange-500">₹{p.price}</div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
