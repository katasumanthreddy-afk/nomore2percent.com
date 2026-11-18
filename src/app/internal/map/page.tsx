import type { Metadata } from 'next';
import { requireInternalMember } from '@/lib/require-internal-member';
import MapWorkspaceLoader from './MapWorkspaceLoader';
import type { LayerKey } from '@/lib/map-workspace';

export const metadata: Metadata = { title: 'Map' };

const PARAM_TO_LAYER: Record<string, LayerKey> = { site: 'sites', lead: 'leads', property: 'properties', project: 'projects' };

// /internal/map — supply + demand in one view. Deep links:
// ?site=12, ?lead=4, ?property=9, ?project=3 open that pin.
export default async function MapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireInternalMember('/internal/map');
  const sp = await searchParams;
  let initialSelect: { kind: LayerKey; id: number } | undefined;
  for (const [param, kind] of Object.entries(PARAM_TO_LAYER)) {
    const id = Number(sp[param]);
    if (Number.isInteger(id) && id > 0) { initialSelect = { kind, id }; break; }
  }

  return (
    <div className="px-3 sm:px-5 py-4 sm:py-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900">Map</h1>
          <p className="text-sm text-stone-500">Where brands want sites, and what supply we have near them.</p>
        </div>
      </div>
      <MapWorkspaceLoader initialSelect={initialSelect} />
    </div>
  );
}
