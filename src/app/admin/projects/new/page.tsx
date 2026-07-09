'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

const UNIT_TYPE_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK', 'Villa', 'Plot', 'Commercial'];
const AMENITY_OPTIONS = ['Clubhouse', 'Swimming Pool', 'Gym', 'Landscaped Gardens', 'Children\'s Play Area', 'Sports Court', 'Jogging Track', '24x7 Security', 'Power Backup', 'Covered Parking', 'Rainwater Harvesting', 'EV Charging'];

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    project_name: '', developer_name: '', project_type: 'apartment',
    area: 'Gachibowli', address: '', description: '',
    price_range: '', starting_price_num: '',
    possession_date: '', rera_number: '', total_units: '', land_area: '',
    status: 'under_construction', featured: false,
  });
  const [unitTypes, setUnitTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const parsePriceNum = (price: string) => {
    const lower = price.toLowerCase();
    const num = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (lower.includes('cr')) return num * 10000000;
    if (lower.includes('l')) return num * 100000;
    return num;
  };

  // ─── PHOTO HANDLING ───
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

  const uploadPhotosForProject = async (projectId: number) => {
    for (let i = 0; i < photos.length; i++) {
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}...`);
      const { file } = photos[i];
      const ext = file.name.split('.').pop();
      const fileName = `projects/${projectId}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) { console.error('Upload failed for photo', i, uploadError); continue; }

      const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);

      await fetch('/api/developer-projects/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, storage_path: urlData.publicUrl, is_primary: i === 0 }),
      });
    }
  };

  const submit = async () => {
    if (!form.project_name || !form.developer_name || !form.area) {
      alert('Project name, developer, and area are required.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/developer-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        starting_price_num: form.starting_price_num ? parseFloat(form.starting_price_num) : (form.price_range ? parsePriceNum(form.price_range) : null),
        total_units: form.total_units ? parseInt(form.total_units) : null,
        unit_types: unitTypes,
        amenities,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      setSaving(false);
      alert(data.message || 'Failed to save project');
      return;
    }

    if (photos.length > 0) await uploadPhotosForProject(data.project.id);

    setSaving(false);
    setUploadProgress('');
    router.push('/admin?tab=projects');
  };

  return (
    <div className="flex-1 bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-200 h-14 px-7 flex items-center justify-between">
        <div className="font-bold text-stone-900">nomore<span className="text-orange-400">2%</span> <span className="text-xs text-stone-500 font-normal">/ Add Developer Project</span></div>
        <Link href="/admin" className="text-sm text-stone-500 hover:text-orange-500">Back to Admin</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-xl font-bold mb-6 text-stone-900">Add New Developer Project</h1>

        <Section title="Project Details">
          <Field label="Project Name *" full><input value={form.project_name} onChange={(e) => set('project_name', e.target.value)} className={inputClass} placeholder="e.g. Prestige High Fields" /></Field>
          <Field label="Developer / Builder Name *"><input value={form.developer_name} onChange={(e) => set('developer_name', e.target.value)} className={inputClass} placeholder="e.g. Prestige Group" /></Field>
          <Field label="Project Type">
            <select
              value={form.project_type}
              onChange={(e) => {
                const type = e.target.value;
                setForm((prev) => ({ ...prev, project_type: type, status: type === 'plot' && prev.status === 'ready_to_move' ? 'under_construction' : prev.status }));
              }}
              className={inputClass}
            >
              <option value="apartment">Apartment</option><option value="villa">Villa</option>
              <option value="plot">Plotted Development</option><option value="commercial">Commercial</option>
              <option value="mixed">Mixed-Use</option>
            </select>
          </Field>
          <Field label="Area *">
            <select value={form.area} onChange={(e) => set('area', e.target.value)} className={inputClass}>
              {['Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur', 'Dammaiguda', 'Kokapet', 'Financial District'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Full Address" full><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="Locality, landmark" /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              <option value="upcoming">Upcoming</option>
              <option value="under_construction">{form.project_type === 'plot' ? 'Development in Progress' : 'Under Construction'}</option>
              {form.project_type !== 'plot' && <option value="ready_to_move">Ready to Move</option>}
            </select>
          </Field>
          <Field label="Possession Date"><input value={form.possession_date} onChange={(e) => set('possession_date', e.target.value)} className={inputClass} placeholder="e.g. Dec 2027 or Ready to Move" /></Field>
        </Section>

        <Section title="Pricing & Scale">
          <Field label="Price Range (display)"><input value={form.price_range} onChange={(e) => set('price_range', e.target.value)} className={inputClass} placeholder="e.g. ₹85L - ₹1.5 Cr" /></Field>
          <Field label="Starting Price (numeric, for sorting)"><input type="number" value={form.starting_price_num} onChange={(e) => set('starting_price_num', e.target.value)} className={inputClass} placeholder="e.g. 8500000" /></Field>
          <Field label="Total Units"><input type="number" value={form.total_units} onChange={(e) => set('total_units', e.target.value)} className={inputClass} placeholder="e.g. 320" /></Field>
          <Field label="Land Area"><input value={form.land_area} onChange={(e) => set('land_area', e.target.value)} className={inputClass} placeholder="e.g. 5.2 acres" /></Field>
          <Field label="RERA Number"><input value={form.rera_number} onChange={(e) => set('rera_number', e.target.value)} className={inputClass} placeholder="e.g. P02400001234" /></Field>
        </Section>

        <Section title="Unit Types">
          <Field label="" full>
            <div className="flex flex-wrap gap-2">
              {UNIT_TYPE_OPTIONS.map((u) => (
                <button key={u} type="button" onClick={() => toggle(unitTypes, setUnitTypes, u)} className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${unitTypes.includes(u) ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                  {u}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Amenities">
          <Field label="" full>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => toggle(amenities, setAmenities, a)} className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${amenities.includes(a) ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                  {a}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Description & Photos">
          <Field label="Description" full><textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass + ' h-28 resize-none'} placeholder="Overview of the project..." /></Field>

          <Field label="" full>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span className="text-sm text-stone-700">Feature this project (shows at top of New Projects page)</span>
            </label>
          </Field>

          <Field label="Photos" full>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-orange-300 transition-colors"
            >
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
                    {i === 0 && <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">COVER</span>}
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </Section>

        <div className="flex gap-3 mt-6 items-center">
          <button onClick={submit} disabled={saving} className="bg-orange-500 text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
            {saving ? (uploadProgress || 'Saving...') : 'Add Project'}
          </button>
          <Link href="/admin" className="border border-stone-200 rounded-lg px-6 py-2.5 text-sm text-stone-500 hover:text-stone-900">Cancel</Link>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3 pb-2 border-b border-stone-200">{title}</div>
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
