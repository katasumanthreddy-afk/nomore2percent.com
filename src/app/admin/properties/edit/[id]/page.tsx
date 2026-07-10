'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PropertyForm, { PropertyFormData } from '@/components/admin/PropertyForm';

export default function EditPropertyPage() {
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [initialData, setInitialData] = useState<Partial<PropertyFormData> | null>(null);
  const [initialPhotos, setInitialPhotos] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/properties/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) { setNotFound(true); return; }
        const p = data.property;
        setInitialData({
          title: p.title || '', description: p.description || '', price: p.price || '',
          price_per_sqft: p.price_per_sqft || '', area: p.area || 'Gachibowli', address: p.address || '',
          property_type: p.property_type || 'apartment', listing_type: p.listing_type || 'sale',
          bedrooms: p.bedrooms ? String(p.bedrooms) : '', bathrooms: p.bathrooms ? String(p.bathrooms) : '',
          sqft: p.sqft ? String(p.sqft) : '', size_unit: p.size_unit || 'sqft',
          floor: p.floor || '', parking: p.parking ? String(p.parking) : '',
          year_built: p.year_built || '', rera_number: p.rera_number || '',
          amenities: (p.amenities || []).join(', '), featured: !!p.featured,
          lat: p.lat ?? null, lng: p.lng ?? null,
        });
        setInitialPhotos((p.property_images || []).sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm">Loading property...</div>;
  }

  if (notFound || !initialData) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3">
        <p className="text-stone-500 text-sm">Property not found.</p>
        <Link href="/admin" className="text-orange-500 text-sm hover:underline">← Back to Admin</Link>
      </div>
    );
  }

  return <PropertyForm mode="edit" propertyId={id} initialData={initialData} initialPhotos={initialPhotos} />;
}
