'use client';

import { useState } from 'react';
import { Check, Copy, Navigation, Share2 } from 'lucide-react';
import { coordText, directionsUrl, whatsappShareUrl, type LatLng } from '@/lib/map-workspace';

/**
 * Directions / Share on WhatsApp / Copy coordinates for any pin.
 * Used on map cards and on detail pages so the team can send a site to a
 * landowner, scout or brand in one tap.
 */
export default function PinActions({ point, label, size = 'sm', className = '', nowrap = false }: {
  point: LatLng; label?: string; size?: 'sm' | 'md'; className?: string; nowrap?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coordText(point));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — ignore */ }
  };
  const btn = size === 'md'
    ? 'inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-stone-300'
    : 'inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:border-stone-300';
  const icon = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={`flex ${nowrap ? 'flex-nowrap' : 'flex-wrap'} gap-1.5 ${className}`} onClick={stop}>
      <a href={directionsUrl(point)} target="_blank" rel="noopener noreferrer" className={btn}>
        <Navigation className={icon} /> Directions
      </a>
      <a href={whatsappShareUrl(point, label)} target="_blank" rel="noopener noreferrer" className={btn}>
        <Share2 className={icon} /> WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn} title={`Copy ${coordText(point)}`} aria-label="Copy coordinates">
        {copied ? <Check className={`${icon} text-emerald-600`} /> : <Copy className={icon} />}{size === 'md' && (copied ? ' Copied' : ' Copy')}
      </button>
    </div>
  );
}
