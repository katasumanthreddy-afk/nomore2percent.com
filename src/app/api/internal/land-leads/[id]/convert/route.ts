import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { invalidateCache } from '@/lib/simple-cache';
import { formatSize } from '@/lib/land-leads';

// POST /api/internal/land-leads/[id]/convert — turn a qualified lead into a
// commercial property (type "land", deal "lease") so it shows on the map and
// in requirement matching. Photos are copied across to the property bucket.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: lead } = await supabaseInternalAdmin.from('land_leads').select('*, land_lead_images(storage_path)').eq('id', id).single();
  if (!lead) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  if (lead.converted_property_id) {
    return NextResponse.json({ success: true, propertyId: lead.converted_property_id });
  }

  const sqft = Math.round(Number(lead.size_sq_yds) * 9);
  const notes = [
    `From land-sourcing campaign (lead #${lead.id}).`,
    `Owner: ${lead.owner_name} (${lead.relation}), ${lead.phone}.`,
    lead.road_width_ft ? `Road: ${lead.road_width_ft} ft.` : null,
    lead.land_type ? `Land type: ${lead.land_type}.` : null,
    lead.title_status ? `Title: ${lead.title_status}.` : null,
    lead.construction_interest ? `Open to constructing: ${lead.construction_interest}.` : null,
    lead.expected_rent_monthly ? `Owner expects ₹${Number(lead.expected_rent_monthly).toLocaleString('en-IN')}/month.` : null,
    lead.notes ? `Owner notes: ${lead.notes}` : null,
  ].filter(Boolean).join('\n');

  const { data: property, error } = await supabaseInternalAdmin
    .from('commercial_properties')
    .insert([{
      title: `${formatSize(Number(lead.size_sq_yds))} land, ${lead.locality}`,
      area: lead.locality,
      address: lead.address,
      lat: lead.lat, lng: lead.lng,
      property_type: 'land', deal_type: 'lease', status: 'available',
      sqft,
      land_sq_yds: Number(lead.size_sq_yds),
      road_width_ft: lead.road_width_ft,
      land_type: lead.land_type,
      title_status: lead.title_status,
      construction_interest: lead.construction_interest,
      owner_name: lead.owner_name,
      owner_phone: lead.phone,
      lease_rate: lead.expected_rent_monthly,
      lease_rate_label: lead.expected_rent_monthly ? `₹${Number(lead.expected_rent_monthly).toLocaleString('en-IN')}/mo (owner ask)` : null,
      notes,
      created_by: member.id,
    }])
    .select('id')
    .single();
  if (error || !property) return NextResponse.json({ success: false, message: error?.message || 'Insert failed' }, { status: 500 });

  // Copy photos into the property's own bucket so they show on the property page.
  for (const img of lead.land_lead_images || []) {
    const { data: file } = await supabaseInternalAdmin.storage.from('land-lead-photos').download(img.storage_path);
    if (!file) continue;
    const dest = `property-${property.id}/${img.storage_path.split('/').pop()}`;
    const { error: upErr } = await supabaseInternalAdmin.storage
      .from('commercial-property-photos')
      .upload(dest, Buffer.from(await file.arrayBuffer()), { contentType: file.type || 'image/jpeg', upsert: false });
    if (!upErr) {
      await supabaseInternalAdmin.from('property_images').insert([{ property_id: property.id, storage_path: dest, is_primary: false }]);
    }
  }

  await supabaseInternalAdmin.from('land_leads').update({ converted_property_id: property.id, updated_at: new Date().toISOString() }).eq('id', id);
  await supabaseInternalAdmin.from('activity_notes').insert([{ land_lead_id: Number(id), note: `Added to Properties (#${property.id})`, created_by: member.id }]);

  invalidateCache('internal:properties');
  invalidateCache('internal:requirements:matches');
  invalidateCache('internal:requirements:raw');

  return NextResponse.json({ success: true, propertyId: property.id });
}
