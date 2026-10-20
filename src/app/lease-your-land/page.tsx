import type { Metadata } from 'next';
import { Suspense } from 'react';
import LeaseLandClient from './LeaseLandClient';

export const metadata: Metadata = {
  title: 'Lease Your Land, Earn Monthly Rent | nomore2percent',
  description:
    'Own 500 sq yds or more anywhere in Hyderabad? Lease it long-term for warehouses and delivery hubs. Monthly rent, the land stays in your name. Free evaluation.',
  openGraph: {
    title: 'Your land can earn rent every month, without selling it',
    description: 'Hyderabad landowners with 500+ sq yds: long-term lease for warehouses and delivery hubs. Free evaluation in 48 hours.',
  },
};

export default function LeaseYourLandPage() {
  return (
    <Suspense>
      <LeaseLandClient />
    </Suspense>
  );
}
