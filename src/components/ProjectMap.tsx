'use client';

import { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { DeveloperProject, projectStatusLabel } from '@/types/developer-project';
import { resolvePropertyCoordinates, HYDERABAD_CENTER } from '@/lib/area-coordinates';
import { titleCase } from '@/types/property';

function shortLabel(text: string): string {
  return text.length > 14 ? text.slice(0, 13) + '…' : text;
}

function PriceBubble({ project, active }: { project: DeveloperProject; active: boolean }) {
  const label = project.price_range ? shortLabel(project.price_range) : shortLabel(project.project_name);
  return (
    <div
      className={`px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md border transition-transform hover:scale-105 cursor-pointer ${
        active
          ? 'bg-stone-900 text-white border-stone-900 z-10'
          : project.featured
          ? 'bg-orange-500 text-white border-orange-500'
          : 'bg-white text-stone-900 border-stone-200'
      }`}
    >
      {label}
    </div>
  );
}

export default function ProjectMap({ projects }: { projects: DeveloperProject[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const points = useMemo(
    () =>
      projects
        .filter((p) => p.area)
        .map((p) => ({
          project: p,
          coords: resolvePropertyCoordinates(p.lat, p.lng, p.area),
        })),
    [projects]
  );

  const center = points.length > 0
    ? { lat: points[0].coords[0], lng: points[0].coords[1] }
    : { lat: HYDERABAD_CENTER[0], lng: HYDERABAD_CENTER[1] };

  const active = points.find((pt) => pt.project.id === activeId);

  if (!apiKey) {
    return (
      <div className="h-[600px] rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center text-center px-6">
        <p className="text-sm text-stone-500">Map view isn&apos;t configured yet — missing Google Maps API key.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[600px] rounded-2xl overflow-hidden border border-stone-200 relative">
        <Map defaultCenter={center} defaultZoom={11} mapId={mapId} disableDefaultUI={false} gestureHandling="greedy">
          {points.map(({ project: p, coords }) => (
            <AdvancedMarker
              key={p.id}
              position={{ lat: coords[0], lng: coords[1] }}
              onClick={() => setActiveId(p.id === activeId ? null : p.id)}
            >
              <PriceBubble project={p} active={p.id === activeId} />
            </AdvancedMarker>
          ))}
        </Map>

        {active && (
          <div className="absolute bottom-4 left-4 z-20 w-56">
            <Link href={`/projects/${active.project.id}`} className="block bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden hover:border-orange-300 transition-colors">
              <div className="h-28 bg-stone-100">
                {active.project.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.project.images[0]} alt={active.project.project_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🏗️</div>
                )}
              </div>
              <div className="p-2.5">
                <div className="text-xs font-bold text-stone-900 truncate">{titleCase(active.project.project_name)}</div>
                <div className="text-[11px] text-stone-500 mb-1">{titleCase(active.project.developer_name)} · {titleCase(active.project.area)}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-500">{active.project.price_range || 'Price on request'}</span>
                  <span className="text-[10px] text-stone-400">{projectStatusLabel(active.project.status)}</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
