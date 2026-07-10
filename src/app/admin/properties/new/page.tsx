'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { defaultSizeUnitForType } from '@/types/property';

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', price: '', price_per_sqft: '', area: 'Gachibowli',
    address: '', property_type: 'apartment', listing_type: 'sale',
    bedrooms: '', bathrooms: '', sqft: '', size_unit: 'sqft', floor: '', parking: '',
    year_built: '', rera_number: '', amenities: '', featured: false,
  });
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [aiError, setAiError] = useState('');

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const handlePropertyTypeChange = (type: string) => {
    setForm((prev) => ({ ...prev, property_type: type, size_unit: defaultSizeUnitForType(type) }));
  };

  const parsePriceNum = (price: string) => {
    const lower = price.toLowerCase();
    const num = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (lower.includes('cr')) return num * 10000000;
    if (lower.includes('l')) return num * 100000;
    return num;
  };

  // ─── AI DESCRIPTION GENERATOR ───
  const generateDescription = async () => {
    setAiError('');
    if (!form.title && !form.area) {
      setAiError('Fill in at least the title and area first.');
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          area: form.area,
          propertyType: form.property_type,
          listingType: form.listing_type,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          sqft: form.sqft,
          floor: form.floor,
          price: form.price,
          amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        set('description', data.description);
      } else {
        setAiError(data.message || 'Failed to generate description.');
      }
    } catch {
      setAiError('Could not connect to AI. Please try again.');
    } finally {
      setGeneratingDesc(false);
    }
  };

  // ─── PHOTO HANDLING ───
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    const newPhotos = valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    const newPhotos = valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const uploadPhotosForProperty = async (propertyId: number) => {
    for (let i = 0; i < photos.length; i++) {
      setUploadProgress('Uploading photo ' + (i + 1) + ' of ' + photos.length + '...');
      const { file } = photos[i];
      const ext = file.name.split('.').pop();
      const fileName = propertyId + '/' + Date.now() + '-' + i + '.' + ext;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) { console.error('Upload failed for photo', i, uploadError); continue; }

      const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);

      await fetch('/api/properties/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, storage_path: urlData.publicUrl, is_primary: i === 0 }),
      });
    }
  };

  const submit = async () => {
    if (!form.title || !form.price || !form.area) {
      alert('Title, price, and area are required.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price_num: parsePriceNum(form.price),
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        sqft: parseFloat(form.sqft) || 0,
        parking: parseInt(form.parking) || 0,
        amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();

    if (!data.success) {
      setSaving(false);
      alert(data.message || 'Failed to save property');
      return;
    }

    if (photos.length > 0) await uploadPhotosForProperty(data.property.id);

    setSaving(false);
    setUploadProgress('');
    router.push('/admin');
  };

  return (
    <div className="flex-1 bg-stone-50 text-stone-900 min-h-screen">
      <div className="bg-white border-b border-stone-200 h-14 px-7 flex items-center justify-between">
        <div className="font-bold">nomore<span className="text-orange-400">2%</span> <span className="text-xs text-stone-500 font-normal">/ Add Property</span></div>
        <Link href="/admin" className="text-sm text-stone-500 hover:text-orange-400">Back to Admin</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-xl font-bold mb-6">Add New Property</h1>

        <Section title="Basic Details">
          <Field label="Property Title *" full><input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="e.g. Prestige Skyline Tower 3BHK" /></Field>
          <Field label="Price *"><input value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} placeholder="e.g. 1.35 Cr or 45,000/mo" /></Field>
          <Field label="Price per sqft"><input value={form.price_per_sqft} onChange={(e) => set('price_per_sqft', e.target.value)} className={inputClass} placeholder="e.g. 7,297" /></Field>
          <Field label="Area *">
            <select value={form.area} onChange={(e) => set('area', e.target.value)} className={inputClass}>
              {['Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur', 'Dammaiguda'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Full Address"><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="Plot no, street, pincode" /></Field>
          <Field label="Property Type">
            <select value={form.property_type} onChange={(e) => handlePropertyTypeChange(e.target.value)} className={inputClass}>
              <option value="apartment">Apartment</option><option value="villa">Villa</option>
              <option value="independent_house">Independent House</option>
              <option value="plot">Plot</option><option value="commercial">Commercial</option>
              <option value="agricultural">Agricultural Land</option>
            </select>
          </Field>
          <Field label="Listing Type">
            <select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)} className={inputClass}>
              <option value="sale">For Sale</option><option value="rent">For Rent</option>
            </select>
          </Field>
        </Section>

        <Section title="Specs">
          {form.property_type !== 'plot' && form.property_type !== 'agricultural' && (
            <>
              <Field label="Bedrooms"><input type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} className={inputClass} /></Field>
              <Field label="Bathrooms"><input type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} className={inputClass} /></Field>
            </>
          )}
          <Field label={form.property_type === 'plot' ? 'Plot Size' : form.property_type === 'agricultural' ? 'Land Size' : 'Built-up Area'}>
            <div className="flex gap-2">
              <input type="number" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} className={inputClass} placeholder="e.g. 1450" />
              <select value={form.size_unit} onChange={(e) => set('size_unit', e.target.value)} className={inputClass + ' w-28 flex-shrink-0'}>
                <option value="sqft">sq.ft</option>
                <option value="sqyd">sq.yd</option>
                <option value="acres">acres</option>
              </select>
            </div>
          </Field>
          <Field label="Floor"><input value={form.floor} onChange={(e) => set('floor', e.target.value)} className={inputClass} placeholder="e.g. 14th" /></Field>
          <Field label="Parking"><input type="number" value={form.parking} onChange={(e) => set('parking', e.target.value)} className={inputClass} /></Field>
          <Field label="Year Built"><input value={form.year_built} onChange={(e) => set('year_built', e.target.value)} className={inputClass} /></Field>
          <Field label="RERA Number"><input value={form.rera_number} onChange={(e) => set('rera_number', e.target.value)} className={inputClass} /></Field>
        </Section>

        <Section title="Description & Amenities">
          <Field label="Amenities (comma separated)" full>
            <input value={form.amenities} onChange={(e) => set('amenities', e.target.value)} className={inputClass} placeholder="Swimming Pool, Gym, 24/7 Security" />
          </Field>

          <Field label="Description" full>
            <div className="relative">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={inputClass + ' min-h-32 pr-4'}
                placeholder="Write a description, or click the AI button below to generate one automatically..."
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDesc}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg px-4 py-2 text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                {generatingDesc ? (
                  <>
                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    AI Generate Description
                  </>
                )}
              </button>
              <span className="text-[11px] text-stone-500">Fill in title, area, and amenities first for best results</span>
            </div>
            {aiError && <div className="text-xs text-red-600 mt-1">{aiError}</div>}
          </Field>

          <Field label="" full>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Mark as Featured Property
            </label>
          </Field>
        </Section>

        <Section title="Property Photos">
          <Field label="" full>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center relative hover:border-orange-400 transition-colors"
            >
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="text-3xl mb-2">Photo</div>
              <div className="text-sm font-semibold text-stone-800">Drop photos here or click to browse</div>
              <div className="text-xs text-stone-500 mt-1">JPG, PNG, WEBP. First photo becomes the cover image.</div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white border border-stone-200">
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">COVER</span>}
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors">X</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </Section>

        <div className="flex gap-3 mt-6 items-center">
          <button onClick={submit} disabled={saving} className="bg-orange-500 text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-orange-400 transition-colors disabled:opacity-50">
            {saving ? (uploadProgress || 'Saving...') : 'Add Property'}
          </button>
          <Link href="/admin" className="border border-stone-200 rounded-lg px-6 py-2.5 text-sm text-stone-500 hover:text-stone-900">Cancel</Link>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-orange-400";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-3 pb-2 border-b border-stone-200">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      {label && <label className="block text-[11px] uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>}
      {children}
    </div>
  );
}
