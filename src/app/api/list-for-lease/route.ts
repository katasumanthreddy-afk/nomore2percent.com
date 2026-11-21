import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { invalidateCache } from '@/lib/simple-cache';
import { FLOORS, LISTING_TYPES, SUBMITTED_STATUS, SUBMITTER_ROLES, listingTypeLabel } from '@/lib/lease-listing';

// POST /api/list-for-lease — public form on /list-for-lease. Anyone with
// the link (owners, brokers, scouts) can send a property for lease.
// No login: writes go straight into the INTERNAL Properties table through
// the service role with status "submitted", so the team reviews it in
// Internal → Properties. Guarded by validation, a honeypot and a per-phone
// hourly cap.

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // the browser compresses before upload
const MAX_PER_PHONE_PER_HOUR = 15;

const str = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const num = (v: FormDataEntryValue | null) => {
  const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};
const oneOf = <T extends string>(v: string | null, allowed: readonly T[]) => (v && (allowed as readonly string[]).includes(v) ? (v as T) : null);
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export async function POST(req: NextRequest) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid submission.' }, { status: 400 });
  }

  if (str(fd.get('website'))) return NextResponse.json({ success: true }); // honeypot

  const name = str(fd.get('name'), 120);
  const phone = (str(fd.get('phone'), 20) || '').replace(/[^\d]/g, '').slice(-10);
  const role = oneOf(str(fd.get('role')), SUBMITTER_ROLES.map((r) => r.value)) || 'owner';
  const type = oneOf(str(fd.get('property_type')), LISTING_TYPES.map((t) => t.value));
  const locality = str(fd.get('locality'), 120);

  if (!name) return NextResponse.json({ success: false, message: 'Please enter your name.' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
  if (!type) return NextResponse.json({ success: false, message: 'Please choose the type of property.' }, { status: 400 });
  if (!locality) return NextResponse.json({ success: false, message: 'Please enter the area / locality.' }, { status: 400 });

  let lat = num(fd.get('lat'));
  let lng = num(fd.get('lng'));
  if (lat == null || lng == null || lat < 16.8 || lat > 18.2 || lng < 77.8 || lng > 79.2) { lat = null; lng = null; }

  const isLand = type === 'land';
  const sqft = isLand ? null : num(fd.get('sqft'));
  const landSqYds = isLand ? num(fd.get('land_sq_yds')) : null;
  const ratePerSqft = num(fd.get('rate_per_sqft'));
  const rentMonthly = num(fd.get('rent_monthly'));
  const roadWidth = num(fd.get('road_width_ft'));
  const frontage = num(fd.get('frontage_ft'));
  const floor = oneOf(str(fd.get('floor')), FLOORS);
  const availableFrom = str(fd.get('available_from'), 40);
  const by = str(fd.get('by'), 60);

  const { count } = await supabaseInternalAdmin
    .from('commercial_properties')
    .select('id', { count: 'exact', head: true })
    .eq('owner_phone', phone)
    .eq('status', SUBMITTED_STATUS)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((count ?? 0) >= MAX_PER_PHONE_PER_HOUR) {
    return NextResponse.json({ success: false, message: 'You have sent a lot of properties in the last hour. Please try again later or WhatsApp us.' }, { status: 429 });
  }

  const size = sqft ? `${Math.round(sqft).toLocaleString('en-IN')} sq ft` : landSqYds ? `${Math.round(landSqYds).toLocaleString('en-IN')} sq yds` : null;
  const title = [listingTypeLabel(type), size, locality].filter(Boolean).join(' · ').slice(0, 200);
  const rateLabel = ratePerSqft ? `${inr(ratePerSqft)}/sqft/mo` : rentMonthly ? `${inr(rentMonthly)}/mo` : null;

  const notes = [
    `Sent via the list-for-lease link by ${name} (${SUBMITTER_ROLES.find((r) => r.value === role)?.label}) · ${phone}${by ? ` · link shared with: ${by}` : ''}`,
    floor && `Floor: ${floor}`,
    rentMonthly && ratePerSqft ? `Expected rent: ${inr(rentMonthly)}/mo` : null,
    availableFrom && `Available from: ${availableFrom}`,
    str(fd.get('notes'), 1500),
  ].filter(Boolean).join('\n');

  const row = {
    title,
    property_type: type,
    deal_type: 'lease',
    area: locality,
    address: str(fd.get('address'), 500),
    lat, lng,
    sqft,
    land_sq_yds: landSqYds,
    road_width_ft: roadWidth != null ? Math.round(roadWidth) : null,
    frontage_ft: frontage != null ? Math.round(frontage) : null,
    lease_rate: ratePerSqft,
    lease_rate_label: rateLabel,
    owner_name: name,
    owner_phone: phone,
    status: SUBMITTED_STATUS,
    notes,
  };

  let { data: property, error } = await supabaseInternalAdmin.from('commercial_properties').insert([row]).select('id').single();
  // If the table restricts status values, fall back to off-market (still
  // clearly marked as a link submission in the notes).
  if (error && /check constraint|invalid input value/i.test(error.message)) {
    ({ data: property, error } = await supabaseInternalAdmin.from('commercial_properties')
      .insert([{ ...row, status: 'off_market', notes: `[NEW SUBMISSION — review]\n${notes}` }]).select('id').single());
  }
  if (error || !property) {
    console.error('list-for-lease insert failed', error);
    return NextResponse.json({ success: false, message: 'Could not save right now. Please WhatsApp us instead.' }, { status: 500 });
  }

  const files = (fd.getAll('photos') as File[]).filter((f) => f && typeof f !== 'string' && f.size > 0).slice(0, MAX_PHOTOS);
  let saved = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/') || file.size > MAX_PHOTO_BYTES) continue;
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
    const path = `property-${property.id}/${Date.now()}-${i}.${ext}`;
    const { error: upErr } = await supabaseInternalAdmin.storage
      .from('commercial-property-photos')
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (!upErr) {
      await supabaseInternalAdmin.from('property_images').insert([{ property_id: property.id, storage_path: path, is_primary: saved === 0 }]);
      saved++;
    }
  }

  invalidateCache('internal:properties');
  invalidateCache('internal:requirements:matches');
  invalidateCache('internal:map:data');

  return NextResponse.json({ success: true, photos: saved });
}
