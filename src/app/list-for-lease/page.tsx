import type { Metadata } from 'next';
import { Suspense } from 'react';
import ListForLeaseClient from './ListForLeaseClient';

export const metadata: Metadata = {
  title: 'Lease Your Property to Brands | nomore2percent',
  description: 'Have a shop, warehouse, plot or building for lease in Hyderabad? Share it in 2 minutes. We match it with quick-commerce and retail brands looking for space.',
  openGraph: {
    title: 'Have a space to lease? Share it in 2 minutes.',
    description: 'Shops, warehouses, plots and buildings in Hyderabad. We match them with brands looking for space right now.',
  },
};

// Public link anyone can fill. Submissions go straight into Internal →
// Properties as "New submission". Optional ?by=Name tags who it was sent to.
export default function ListForLeasePage() {
  return (
    <Suspense>
      <ListForLeaseClient />
    </Suspense>
  );
}
