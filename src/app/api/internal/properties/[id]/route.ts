import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { distanceInMeters } from '@/lib/geo-utils';
import { invalidateCache } from '@/lib/simple-cache';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: property, error } = await supabaseInternalAdmin.from('commercial_properties').select('*').eq('id', id).single();
  if (error || !property) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: deals } = await supabaseInternalAdmin.from('deals').select('id, deal_name, stage').eq('property_id', id);
  const { data: documents } = await supabaseInternalAdmin.from('documents').select('*').eq('property_id', id).order('created_at', { ascending: false });

  let matchingRequirements: any[] = [];
  if (property.lat != null && property.lng != null) {
    const { data: requirements } = await supabaseInternalAdmin.from('site_requirements').select('id, title, status, lat, lng, radius_max_m').neq('status', 'closed');
    matchingRequirements = (requirements || [])
      .filter((r) => distanceInMeters(r.lat, r.lng, property.lat, property.lng) <= r.radius_max_m)
      .map((r) => ({ id: r.id, title: r.title, status: r.status }));
  }

  return NextResponse.json({ success: true, property, deals: deals || [], documents: documents || [], matchingRequirements });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  delete body.created_by;

  const { error } = await supabaseInternalAdmin
    .from('commercial_properties')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  invalidateCache('internal:properties');
  invalidateCache('internal:requirements:matches');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('commercial_properties').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  invalidateCache('internal:properties');
  invalidateCache('internal:requirements:matches');
  return NextResponse.json({ success: true });
}
