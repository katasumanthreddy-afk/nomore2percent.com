import type { Metadata } from 'next';
import { requireInternalMember } from '@/lib/require-internal-member';
import ConstructionOverviewClient from './ConstructionOverviewClient';

export const metadata: Metadata = { title: 'Construction' };

export default async function ConstructionPage() {
  await requireInternalMember('/internal/construction');
  return <ConstructionOverviewClient />;
}
