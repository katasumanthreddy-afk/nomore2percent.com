'use client';

import dynamic from 'next/dynamic';
import type { LayerKey } from '@/lib/map-workspace';

// The Maps SDK only runs in the browser, so the workspace loads client-side.
const MapWorkspace = dynamic(() => import('@/components/internal/MapWorkspace'), {
  ssr: false,
  loading: () => <div className="h-[70vh] lg:h-[calc(100vh-8.5rem)] rounded-xl bg-stone-200 animate-pulse" />,
});

export default function MapWorkspaceLoader({ initialSelect }: { initialSelect?: { kind: LayerKey; id: number } }) {
  return <MapWorkspace initialSelect={initialSelect} />;
}
