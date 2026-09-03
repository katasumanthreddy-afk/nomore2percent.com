import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { distanceInMeters } from '@/lib/geo-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: requirement, error } = await supabaseInternalAdmin
    .from('site_requirements')
    .select('*, commercial_properties(id, title, area, status)')
    .eq('id', id)
    .single();
  if (error || !requirement) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: rawAssignments } = await supabaseInternalAdmin
    .from('requirement_assignments')
    .select('id, team_member_id, scout_id, team_members(id, name), external_scouts(id, name)')
    .eq('requirement_id', id);

  const assignments = (rawAssignments || []).map((a) => ({
    id: a.id,
    name: a.team_member_id ? (a.team_members as any)?.name : (a.external_scouts as any)?.name,
    type: a.team_member_id ? 'team' : 'scout',
  }));

  const { data: properties } = await supabaseInternalAdmin
    .from('commercial_properties')
    .select('id, title, area, status, property_type, deal_type, price_label, lease_rate_label, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const nearby = (properties || [])
    .map((p) => ({ ...p, distance_m: Math.round(distanceInMeters(requirement.lat, requirement.lng, p.lat, p.lng)) }))
    .filter((p) => p.distance_m <= requirement.radius_max_m)
    .sort((a, b) => a.distance_m - b.distance_m);

  return NextResponse.json({ success: true, requirement, nearby, assignments });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const { error } = await supabaseInternalAdmin
    .from('site_requirements')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('site_requirements').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
