import type { Metadata } from 'next';
import PropertiesClient from './PropertiesClient';

export const metadata: Metadata = {
  title: 'Properties for Sale & Rent in Hyderabad | nomore2percent',
  description: 'Browse verified apartments, villas, plots and commercial properties for sale or rent across Gachibowli, Madhapur, Banjara Hills, Kondapur and more Hyderabad localities. Just 1% brokerage.',
};

export default function PropertiesPage() {
  return <PropertiesClient />;
}
