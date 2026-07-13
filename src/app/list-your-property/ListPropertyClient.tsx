'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { defaultSizeUnitForType } from '@/types/property';
import { getAreaCoordinates } from '@/lib/area-coordinates';
import { Upload, X, CheckCircle2 } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), { ssr: false });

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export default function ListPropertyClient() {
  const [form, setForm] = useState({
    owner_name: '', owner_phone: '', owner_email: '',
    title: '', description: '', price: '',
    property_type: 'apartment', listing_type: 'sale',
    area: '', address: '', bedrooms: '', bathrooms: '', sqft: '', size_unit: 'sqft', floor: '', year_built: '',
    lat: null as number | null, lng: null as number | null,
  });
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    setPhotos((prev) => [...prev, ...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    setPhotos((prev) => [...prev, ...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotosForSubmission = async (submissionId: number) => {
    for (let i = 0; i < photos.length; i++) {
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}...`);
      const { file } = photos[i];
      const ext = file.name.split('.').pop();
      const fileName = `submissions/${submissionId}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) { console.error('Upload failed for photo', i, uploadError); continue; }

      const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);

      await fetch('/api/property-submissions/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, storage_path: urlData.publicUrl, is_primary: i === 0 }),
      });
    }
  };

  const submit = async () => {
    setError('');
    if (!form.owner_name.trim() || !form.owner_phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }
    if (!form.area.trim()) {
      setError('Please enter the property area/locality.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/property-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
          sqft: form.sqft ? parseFloat(form.sqft) : null,
          price_num: form.price ? parsePriceNum(form.price) : null,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Something went wrong. Please try again.');
        setSaving(false);
        return;
      }

      if (photos.length > 0) await uploadPhotosForSubmission(data.submission.id);

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 bg-stone-50">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Submitted for Review</h1>
          <p className="text-stone-500 text-sm">
            Thanks! Our team will verify your property details and photos. Once approved, it'll go live on nomore2percent — usually within 24 hours. Sumanth may call you at {form.owner_phone} to confirm a few details.
          </p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400";
  const labelClass = "text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">List Your Property</h1>
          <p className="text-stone-500 text-sm">
            Selling or renting out? Submit your details and photos below. We verify every listing before it goes live — just 1% brokerage, always.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Owner contact */}
          <div>
            <div className="text-sm font-bold text-stone-800 mb-3">Your Contact Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Your Name *</label><input value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} className={inputClass} placeholder="Full name" /></div>
              <div><label className={labelClass}>Phone Number *</label><input value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} className={inputClass} placeholder="+91 your number" /></div>
              <div className="md:col-span-2"><label className={labelClass}>Email (optional)</label><input value={form.owner_email} onChange={(e) => set('owner_email', e.target.value)} className={inputClass} placeholder="you@example.com" /></div>
            </div>
          </div>

          {/* Property details */}
          <div>
            <div className="text-sm font-bold text-stone-800 mb-3">Property Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Listing Type</label>
                <select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)} className={inputClass}>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Property Type</label>
                <select value={form.property_type} onChange={(e) => handlePropertyTypeChange(e.target.value)} className={inputClass}>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="independent_house">Independent House</option>
                  <option value="plot">Plot / Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="agricultural">Agricultural Land</option>
                </select>
              </div>
              <div className="md:col-span-2"><label className={labelClass}>Title (optional)</label><input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="e.g. Spacious 3BHK near Gachibowli IT hub" /></div>
              <div><label className={labelClass}>Area / Locality *</label><input value={form.area} onChange={(e) => set('area', e.target.value)} className={inputClass} placeholder="e.g. Gachibowli" /></div>
              <div><label className={labelClass}>Full Address (optional)</label><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="Street, landmark" /></div>
              <div><label className={labelClass}>Price</label><input value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} placeholder="e.g. 85 Lakhs or 25,000/mo" /></div>
              <div>
                <label className={labelClass}>{form.property_type === 'plot' ? 'Plot Size' : form.property_type === 'agricultural' ? 'Land Size' : 'Built-up Area'}</label>
                <div className="flex gap-2">
                  <input type="number" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} className={inputClass} placeholder="e.g. 1450" />
                  <select value={form.size_unit} onChange={(e) => set('size_unit', e.target.value)} className={inputClass + ' w-24 flex-shrink-0'}>
                    <option value="sqft">sq.ft</option>
                    <option value="sqyd">sq.yd</option>
                    <option value="acres">acres</option>
                  </select>
                </div>
              </div>
              {form.property_type !== 'plot' && form.property_type !== 'agricultural' && (
                <>
                  <div><label className={labelClass}>Bedrooms</label><input type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} className={inputClass} placeholder="e.g. 3" /></div>
                  <div><label className={labelClass}>Bathrooms</label><input type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} className={inputClass} placeholder="e.g. 2" /></div>
                </>
              )}
              <div><label className={labelClass}>Floor</label><input value={form.floor} onChange={(e) => set('floor', e.target.value)} className={inputClass} placeholder="e.g. 4 of 12" /></div>
              <div><label className={labelClass}>Year Built</label><input value={form.year_built} onChange={(e) => set('year_built', e.target.value)} className={inputClass} placeholder="e.g. 2019" /></div>
              <div className="md:col-span-2"><label className={labelClass}>Description (optional)</label><textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass + ' h-24 resize-none'} placeholder="Anything buyers/renters should know" /></div>
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="text-sm font-bold text-stone-800 mb-3">Pin Your Property's Location <span className="font-normal text-stone-400">(optional, but helps buyers find it)</span></div>
            <LocationPicker
              lat={form.lat}
              lng={form.lng}
              defaultCenter={getAreaCoordinates(form.area)}
              onChange={(lat, lng) => setForm((prev) => ({ ...prev, lat, lng }))}
            />
          </div>

          {/* Photos */}
          <div>
            <div className="text-sm font-bold text-stone-800 mb-3">Photos</div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-orange-300 transition-colors"
            >
              <Upload className="mx-auto text-stone-400 mb-2" size={24} />
              <p className="text-sm text-stone-500 mb-2">Drag & drop photos here, or</p>
              <label className="inline-block bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-colors">
                Choose Files
                <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Cover</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors"
          >
            {saving ? (uploadProgress || 'Submitting...') : 'Submit for Review'}
          </button>
          <p className="text-[11px] text-stone-400 text-center -mt-3">
            We verify every submission before it goes live — usually within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
