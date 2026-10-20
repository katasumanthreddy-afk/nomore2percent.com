import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { distanceInMeters } from '@/lib/geo-utils';
import { LAND_TYPES, MIN_SQ_YDS, SQ_YDS_PER_UNIT, toSqYds } from '@/lib/land-leads';

// POST /api/land-leads — public form on /lease-your-land (landowners who
// could build for a quick-commerce / logistics brand; we broker the match,
// construction contract, permissions and lease registration).
// Intentionally no login: landowners arrive from ads. Writes go straight into
// the INTERNAL database through the service role, so the browser never gets
// internal credentials. Guarded by validation, a honeypot field and a
// per-phone cooldown.

const MAX_PHOTOS = 6;
// The browser shrinks photos before upload (Vercel caps request bodies at
// ~4.5 MB), so anything bigger than this didn't come from our form.
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const COOLDOWN_MS = 10 * 60 * 1000;

const str = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const num = (v: FormDataEntryValue | null) => {
  const n = typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const oneOf = (v: string | null, allowed: string[]) => (v && allowed.includes(v) ? v : null);

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid submission.' }, { status: 400 });
  }

  // Honeypot: real people never see or fill this field.
  if (str(formData.get('website'))) {
    return NextResponse.json({ success: true });
  }

  const ownerName = str(formData.get('owner_name'), 120);
  const rawPhone = str(formData.get('phone'), 20) || '';
  const phone = rawPhone.replace(/[^\d]/g, '').slice(-10);
  const locality = str(formData.get('locality'), 120);
  const sizeValue = num(formData.get('size_value'));
  const sizeUnit = oneOf(str(formData.get('size_unit')), Object.keys(SQ_YDS_PER_UNIT)) || 'sq_yds';

  if (!ownerName) return NextResponse.json({ success: false, message: 'Please enter your name.' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
  if (!locality) return NextResponse.json({ success: false, message: 'Please enter the area / village of the land.' }, { status: 400 });
  if (!sizeValue || sizeValue <= 0) return NextResponse.json({ success: false, message: 'Please enter the land size.' }, { status: 400 });

  const sizeSqYds = toSqYds(sizeValue, sizeUnit);
  if (sizeSqYds < MIN_SQ_YDS) {
    return NextResponse.json({ success: false, message: `We're looking for land of ${MIN_SQ_YDS} sq yds or more.` }, { status: 400 });
  }

  let lat = num(formData.get('lat'));
  let lng = num(formData.get('lng'));
  // Keep pins inside a generous box around Hyderabad; drop anything else.
  if (lat == null || lng == null || lat < 16.8 || lat > 18.2 || lng < 77.8 || lng > 79.2) {
    lat = null; lng = null;
  }

  // Cooldown: one submission per phone number every 10 minutes.
  const { data: recent } = await supabaseInternalAdmin
    .from('land_leads')
    .select('id')
    .eq('phone', phone)
    .gte('created_at', new Date(Date.now() - COOLDOWN_MS).toISOString())
    .limit(1);
  if (recent && recent.length > 0) {
    return NextResponse.json({ success: true, duplicate: true });
  }

  // Nearest open site requirement, so the team can prioritise hot leads.
  let nearestRequirementId: number | null = null;
  let nearestRequirementM: number | null = null;
  if (lat != null && lng != null) {
    const { data: reqs } = await supabaseInternalAdmin
      .from('site_requirements')
      .select('id, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null);
    for (const r of reqs || []) {
      const d = distanceInMeters(lat, lng, r.lat, r.lng);
      if (nearestRequirementM == null || d < nearestRequirementM) {
        nearestRequirementM = Math.round(d);
        nearestRequirementId = r.id;
      }
    }
  }

  const { data: lead, error } = await supabaseInternalAdmin
    .from('land_leads')
    .insert([{
      owner_name: ownerName,
      phone,
      relation: oneOf(str(formData.get('relation')), ['owner', 'family', 'agent']) || 'owner',
      locality,
      address: str(formData.get('address'), 500),
      lat, lng,
      size_value: sizeValue,
      size_unit: sizeUnit,
      size_sq_yds: sizeSqYds,
      road_width_ft: num(formData.get('road_width_ft')) != null ? Math.round(num(formData.get('road_width_ft'))!) : null,
      land_type: oneOf(str(formData.get('land_type')), LAND_TYPES.map((t) => t.value)),
      title_status: oneOf(str(formData.get('title_status')), ['clear', 'in_progress', 'not_sure']),
      construction_interest: oneOf(str(formData.get('construction_interest')), ['yes', 'maybe', 'no']),
      current_use: str(formData.get('current_use'), 200),
      expected_rent_monthly: num(formData.get('expected_rent_monthly')),
      lease_years_preferred: num(formData.get('lease_years_preferred')) != null ? Math.round(num(formData.get('lease_years_preferred'))!) : null,
      notes: str(formData.get('notes'), 1500),
      form_language: oneOf(str(formData.get('form_language')), ['en', 'te']) || 'en',
      utm_source: str(formData.get('utm_source'), 100),
      utm_medium: str(formData.get('utm_medium'), 100),
      utm_campaign: str(formData.get('utm_campaign'), 100),
      utm_content: str(formData.get('utm_content'), 100),
      nearest_requirement_id: nearestRequirementId,
      nearest_requirement_m: nearestRequirementM,
    }])
    .select('id')
    .single();

  if (error || !lead) {
    console.error('land_leads insert failed', error);
    return NextResponse.json({ success: false, message: 'Could not save right now. Please WhatsApp us instead.' }, { status: 500 });
  }

  const files = (formData.getAll('photos') as File[]).filter((f) => f && typeof f !== 'string' && f.size > 0).slice(0, MAX_PHOTOS);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/') || file.size > MAX_PHOTO_BYTES) continue;
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
    const path = `lead-${lead.id}/${Date.now()}-${i}.${ext}`;
    const { error: uploadError } = await supabaseInternalAdmin.storage
      .from('land-lead-photos')
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (!uploadError) {
      await supabaseInternalAdmin.from('land_lead_images').insert([{ lead_id: lead.id, storage_path: path }]);
    }
  }

  return NextResponse.json({ success: true });
}
