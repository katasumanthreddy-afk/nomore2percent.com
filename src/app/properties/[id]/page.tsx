import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import PropertyDetailClient from './PropertyDetailClient';
import { getProperty } from '@/lib/get-property';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return { title: 'Property Not Found | nomore2percent' };
  }

  const listingWord = property.listing_type === 'rent' ? 'for Rent' : 'for Sale';
  const title = `${property.title} — ${listingWord} in ${property.area}, Hyderabad | nomore2percent`;
  const description =
    property.description ||
    `${property.bedrooms > 0 ? property.bedrooms + ' BHK ' : ''}${property.property_type} ${listingWord.toLowerCase()} in ${property.area}, Hyderabad for ₹${property.price}. Buy or rent through nomore2percent at just 1% brokerage.`;
  const image = property.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: property.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <PropertyDetailClient property={property} />
    </div>
  );
}
