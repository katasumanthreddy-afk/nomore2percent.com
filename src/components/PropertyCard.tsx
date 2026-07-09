'use client';

import Link from 'next/link';
import { Bed, Bath, Maximize } from 'lucide-react';
import { Property, savingsLabel, sizeUnitLabel } from '@/types/property';

const ICONS = ['🏢', '🏡', '🏠', '🏗️', '🏘️', '🌿', '🌊', '🏛️'];

export default function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const saving = savingsLabel(property.price_num, property.listing_type);
  const icon = ICONS[index % ICONS.length];
  const coverImage = property.images?.[0];
  const isNew = property.created_at
    ? (Date.now() - new Date(property.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-orange-400 hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg flex flex-col"
    >
      <div className="h-44 relative bg-stone-100 overflow-hidden">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">{icon}</div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${property.listing_type === 'sale' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
            {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
          {isNew && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500 text-white">New</span>
          )}
          {property.featured && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-white/90 text-stone-700">★ Featured</span>
          )}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-serif text-xl font-bold text-stone-900">₹{property.price}</div>
        {saving && <div className="text-[11px] text-emerald-600 font-semibold mb-1">✓ Save {saving} vs 2% broker</div>}
        <div className="font-semibold text-sm text-stone-800 mt-1">{property.title}</div>
        <div className="text-xs text-stone-500 mb-3">📍 {property.area}, Hyderabad</div>
        <div className="flex gap-3 text-xs text-stone-500 pt-3 border-t border-stone-100 mt-auto">
          {property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed size={12} /> {property.bedrooms} BHK</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms}</span>}
          {property.sqft > 0 && <span className="flex items-center gap-1"><Maximize size={12} /> {property.sqft.toLocaleString('en-IN')} {sizeUnitLabel(property.size_unit)}</span>}
        </div>
      </div>
    </Link>
  );
}
