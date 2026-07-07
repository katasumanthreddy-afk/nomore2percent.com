import type { Metadata } from 'next';
import { Suspense } from 'react';
import ValuationClient from './ValuationClient';

export const metadata: Metadata = {
  title: 'Free Property Valuation Tool — Hyderabad | nomore2percent',
  description: 'Get an instant indicative valuation for your Hyderabad property. Enter your locality, size, and property type to see an estimated market value, backed by real listing data.',
};

export default function PropertyValuationPage() {
  return (
    <Suspense fallback={null}>
      <ValuationClient />
    </Suspense>
  );
}
