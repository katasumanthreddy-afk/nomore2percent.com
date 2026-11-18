'use client';

import Link from 'next/link';
import { Map as MapIcon } from 'lucide-react';
import PinActions from './PinActions';
import { isValidLatLng, type LayerKey } from '@/lib/map-workspace';

const PARAM: Record<LayerKey, string> = { sites: 'site', leads: 'lead', properties: 'property', projects: 'project' };

/** Directions · WhatsApp · Copy · View on map — for a record's detail page. */
export default function LocationStrip({ lat, lng, label, kind, id, className = '' }: {
  lat: number | string | null | undefined; lng: number | string | null | undefined;
  label: string; kind: LayerKey; id: number; className?: string;
}) {
  const la = lat == null ? NaN : Number(lat);
  const ln = lng == null ? NaN : Number(lng);
  if (!isValidLatLng(la, ln)) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <PinActions point={{ lat: la, lng: ln }} label={label} size="md" />
      <Link href={`/internal/map?${PARAM[kind]}=${id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-stone-300">
        <MapIcon className="w-3.5 h-3.5" /> View on map
      </Link>
    </div>
  );
}
