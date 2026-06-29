'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', price: '', price_per_sqft: '', area: 'Gachibowli',
    address: '', property_type: 'apartment', listing_type: 'sale',
    bedrooms: '', bathrooms: '', sqft: '', floor: '', parking: '',
    year_built: '', rera_number: '', amenities: '', featured: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const parsePriceNum = (price: string) => {
    const lower = price.toLowerCase();
    const num = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (lower.includes('cr')) return num * 10000000;
    if (lower.includes('l')) return num * 100000;
    return num;
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
        sqft: parseInt(form.sqft) || 0,
        parking: parseInt(form.parking) || 0,
        amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      router.push('/admin');
    } else {
      alert(data.message || 'Failed to save property');
    }
  };

  return (
    <div className="flex-1 bg-stone-950 text-stone-100 min-h-screen">
      <div className="bg-stone-900 border-b border-stone-800 h-15 px-7 flex items-center justify-between">
        <div className="font-bold">nomore<span className="text-orange-400">2%</span> <span className="text-xs text-stone-500 font-normal">/ Add Property</span></div>
        <Link href="/admin" className="text-sm text-stone-400 hover:text-orange-400">← Back to Admin</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-xl font-bold mb-6">Add New Property</h1>

        <Section title="Basic Details">
          <Field label="Property Title *" full><input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="e.g. Prestige Skyline Tower 3BHK" /></Field>
          <Field label="Price *"><input value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} placeholder="e.g. 1.35 Cr or 45,000/mo" /></Field>
          <Field label="Price per sqft"><input value={form.price_per_sqft} onChange={(e) => set('price_per_sqft', e.target.value)} className={inputClass} placeholder="e.g. 7,297" /></Field>
          <Field label="Area *">
            <select value={form.area} onChange={(e) => set('area', e.target.value)} className={inputClass}>
              {['Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Full Address"><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="Plot no, street, pincode" /></Field>
          <Field label="Property Type">
            <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} className={inputClass}>
              <option value="apartment">Apartment</option><option value="villa">Villa</option>
              <option value="plot">Plot</option><option value="commercial">Commercial</option>
            </select>
          </Field>
          <Field label="Listing Type">
            <select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)} className={inputClass}>
              <option value="sale">For Sale</option><option value="rent">For Rent</option>
            </select>
          </Field>
        </Section>

        <Section title="Specs">
          <Field label="Bedrooms"><input type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} className={inputClass} /></Field>
          <Field label="Bathrooms"><input type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} className={inputClass} /></Field>
          <Field label="Area (sqft)"><input type="number" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} className={inputClass} /></Field>
          <Field label="Floor"><input value={form.floor} onChange={(e) => set('floor', e.target.value)} className={inputClass} placeholder="e.g. 14th" /></Field>
          <Field label="Parking"><input type="number" value={form.parking} onChange={(e) => set('parking', e.target.value)} className={inputClass} /></Field>
          <Field label="Year Built"><input value={form.year_built} onChange={(e) => set('year_built', e.target.value)} className={inputClass} /></Field>
          <Field label="RERA Number"><input value={form.rera_number} onChange={(e) => set('rera_number', e.target.value)} className={inputClass} /></Field>
        </Section>

        <Section title="Description & Amenities">
          <Field label="Description" full><textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass + ' min-h-24'} /></Field>
          <Field label="Amenities (comma separated)" full><input value={form.amenities} onChange={(e) => set('amenities', e.target.value)} className={inputClass} placeholder="Swimming Pool, Gym, 24/7 Security" /></Field>
          <Field label="" full>
            <label className="flex items-center gap-2 text-sm text-stone-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Mark as Featured Property
            </label>
          </Field>
        </Section>

        <div className="flex gap-3 mt-6">
          <button onClick={submit} disabled={saving} className="bg-orange-500 text-stone-950 rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-orange-400 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : '✅ Add Property'}
          </button>
          <Link href="/admin" className="border border-stone-800 rounded-lg px-6 py-2.5 text-sm text-stone-400 hover:text-stone-100">Cancel</Link>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full bg-stone-900 border border-stone-800 rounded-lg px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-orange-400";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-3 pb-2 border-b border-stone-800">{title}</div>
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
