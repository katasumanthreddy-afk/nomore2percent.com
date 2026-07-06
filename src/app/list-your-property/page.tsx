import type { Metadata } from 'next';
import ListPropertyClient from './ListPropertyClient';

export const metadata: Metadata = {
  title: 'List Your Property | nomore2percent',
  description: 'Selling or renting out your Hyderabad property? Submit your details and photos — our team verifies every listing before it goes live at just 1% brokerage.',
};

export default function ListYourPropertyPage() {
  return <ListPropertyClient />;
}
