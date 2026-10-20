import type { Metadata } from 'next';
import { Suspense } from 'react';
import LeaseLandClient from './LeaseLandClient';

export const metadata: Metadata = {
  title: 'Build for Quick-Commerce Brands on Your Land | nomore2percent',
  description:
    'Own 500 sq yds or more in Hyderabad? Build a dark store or warehouse for a quick-commerce brand. We find the brand and handle the construction contract, permissions and lease registration.',
  openGraph: {
    title: 'Quick-commerce brands need space. Build on your land, we bring the brand.',
    description: 'Hyderabad landowners with 500+ sq yds: we match you with quick-commerce brands and manage construction, permissions and lease registration end to end.',
  },
};

export default function LeaseYourLandPage() {
  return (
    <Suspense>
      <LeaseLandClient />
    </Suspense>
  );
}
