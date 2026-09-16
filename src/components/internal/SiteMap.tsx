'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';

export interface SiteMapProperty {
  id: number; title: string; lat: number; lng: number;
  area?: string | null; deal_type: string; status?: string;
  price_label?: string | null; lease_rate_label?: string | null;
}

export interface SiteMapRequirement {
  id: number; title: string; lat: number; lng: number;
  radius_max_m: number; status: string; nearby_count?: number;
}

const REQ_STATUS_COLOR: Record<string, string> = {
  searching: '#f97316',
  found: '#10b981',
  closed: '#78716c',
};

function RadiusCircle({ map, center, radius, color }: { map: google.maps.Map; center: { lat: number; lng: number }; radius: number; color: string }) {
  const [circle] = useState(() => new google.maps.Circle({
    center, radius, map,
    strokeColor: color, strokeOpacity: 0.5, strokeWeight: 1.5,
    fillColor: color, fillOpacity: 0.08,
  }));
  circle.setCenter(center);
  circle.setRadius(radius);
  circle.setMap(map);
  return null;
}

/**
 * One shared map for every internal-portal browsing/reporting view.
 * Replaces CommercialPropertyMap, RequirementsMap, UnifiedMap, and
 * MatchesMap — each of those rendered near-identical marker + radius-circle
 * logic with small variations, which meant a single bug fix (or style
 * tweak) had to be repeated in four places. This covers all four shapes
 * through props instead:
 *
 *  - Properties list        → properties only
 *  - Requirements list      → requirements only, showAllRadiusCircles, optional selectionMode
 *  - Map Overview (unified) → both, selectedRequirementId + adjustableRadiusM for the live slider
 *  - Matches report         → both (pre-filtered to matches only), showAllRadiusCircles, highlightPropertyIds
 */
export default function SiteMap({
  properties = [],
  requirements = [],
  height = '600px',
  showAllRadiusCircles = false,
  selectedRequirementId = null,
  adjustableRadiusM,
  highlightPropertyIds,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  onSelectRequirement,
  propertyHref = (id: number) => `/internal/properties/${id}`,
  requirementHref = (id: number) => `/internal/requirements/${id}`,
}: {
  properties?: SiteMapProperty[];
  requirements?: SiteMapRequirement[];
  height?: string;
  showAllRadiusCircles?: boolean;
  selectedRequirementId?: number | null;
  adjustableRadiusM?: number;
  highlightPropertyIds?: Set<number>;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onSelectRequirement?: (id: number) => void;
  propertyHref?: (id: number) => string;
  requirementHref?: (id: number) => string;
}) {
  const [activeMarker, setActiveMarker] = useState<{ type: 'req' | 'prop'; id: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const center = requirements.length > 0
    ? { lat: requirements[0].lat, lng: requirements[0].lng }
    : properties.length > 0
    ? { lat: properties[0].lat, lng: properties[0].lng }
    : { lat: 17.4, lng: 78.45 };

  const selectedReq = requirements.find((r) => r.id === selectedRequirementId) || null;
  const activeReq = activeMarker?.type === 'req' ? requirements.find((r) => r.id === activeMarker.id) : null;
  const activeProp = activeMarker?.type === 'prop' ? properties.find((p) => p.id === activeMarker.id) : null;

  const handleReqClick = (id: number) => {
    if (selectionMode && onToggleSelect) onToggleSelect(id);
    else if (onSelectRequirement) onSelectRequirement(id);
    else setActiveMarker({ type: 'req', id });
  };

  if (!apiKey) {
    return <div style={{ height }} className="rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm text-stone-500">Map view isn&apos;t configured.</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ height }} className="rounded-xl overflow-hidden border border-stone-200 relative">
        {selectionMode && (
          <div className="absolute top-3 left-3 z-20 bg-stone-900 text-white text-xs font-semibold rounded-lg px-3 py-2 shadow-lg">
            Click markers to select · {selectedIds?.size || 0} selected
          </div>
        )}
        {!selectionMode && properties.length > 0 && requirements.length > 0 && (
          <div className="absolute top-3 left-3 z-20 bg-white/95 rounded-lg px-3 py-2 shadow text-xs space-y-1">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Requirement</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Property{highlightPropertyIds ? ' (in range)' : ''}</div>
            {highlightPropertyIds && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Property</div>}
          </div>
        )}

        <Map defaultCenter={center} defaultZoom={11} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy" onIdle={(e) => setMapInstance(e.map)}>
          {requirements.map((r) => {
            const isSelected = selectionMode ? selectedIds?.has(r.id) : r.id === selectedRequirementId;
            return (
              <AdvancedMarker key={`req-${r.id}`} position={{ lat: r.lat, lng: r.lng }} onClick={() => handleReqClick(r.id)}>
                {selectionMode ? (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow transition-all ${isSelected ? 'bg-orange-500 border-white scale-110' : 'bg-white border-stone-300'}`}>
                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                ) : (
                  <div
                    className="rounded-full border-2 border-white shadow"
                    style={{ background: REQ_STATUS_COLOR[r.status] || '#f97316', width: isSelected ? 24 : 16, height: isSelected ? 24 : 16 }}
                  />
                )}
              </AdvancedMarker>
            );
          })}

          {properties.map((p) => {
            const isHighlighted = highlightPropertyIds ? highlightPropertyIds.has(p.id) : true;
            return (
              <AdvancedMarker key={`prop-${p.id}`} position={{ lat: p.lat, lng: p.lng }} onClick={() => setActiveMarker({ type: 'prop', id: p.id })}>
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow ${isHighlighted ? 'bg-emerald-500' : 'bg-blue-400'}`} />
              </AdvancedMarker>
            );
          })}

          {mapInstance && showAllRadiusCircles && requirements.map((r) => (
            <RadiusCircle key={`circle-${r.id}`} map={mapInstance} center={{ lat: r.lat, lng: r.lng }} radius={r.radius_max_m} color={REQ_STATUS_COLOR[r.status] || '#f97316'} />
          ))}
          {mapInstance && !showAllRadiusCircles && selectedReq && (
            <RadiusCircle map={mapInstance} center={{ lat: selectedReq.lat, lng: selectedReq.lng }} radius={adjustableRadiusM ?? selectedReq.radius_max_m} color="#f97316" />
          )}
        </Map>

        {!selectionMode && activeReq && (
          <Link href={requirementHref(activeReq.id)} className="absolute bottom-4 left-4 z-20 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-3 hover:border-orange-300 transition-colors">
            <div className="text-sm font-bold text-stone-900">{activeReq.title}</div>
            <div className="text-xs text-stone-500 capitalize">{activeReq.status} · up to {activeReq.radius_max_m}m radius</div>
            {activeReq.nearby_count != null && <div className="text-xs font-semibold text-orange-500">{activeReq.nearby_count} nearby</div>}
          </Link>
        )}
        {!selectionMode && activeProp && (
          <Link href={propertyHref(activeProp.id)} className="absolute bottom-4 left-4 z-20 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-3 hover:border-emerald-300 transition-colors">
            <div className="text-sm font-bold text-stone-900">{activeProp.title}</div>
            <div className="text-xs text-stone-500 capitalize mb-1">{activeProp.area} {activeProp.deal_type && `· ${activeProp.deal_type}`}</div>
            <div className="text-xs font-semibold text-orange-500">{activeProp.deal_type === 'lease' ? activeProp.lease_rate_label : activeProp.price_label}</div>
          </Link>
        )}
      </div>
    </APIProvider>
  );
}
