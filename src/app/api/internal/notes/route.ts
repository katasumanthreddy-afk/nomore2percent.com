import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// GET /api/internal/notes?property_id=X or ?deal_id=X — timeline, newest first
export async function GET(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('property_id');
  const dealId = searchParams.get('deal_id');
  if (!propertyId && !dealId) {
    return NextResponse.json({ success: false, message: 'property_id or deal_id required' }, { status: 400 });
  }

  let query = supabaseInternalAdmin.from('activity_notes').select('*, team_members(id, name)').order('created_at', { ascending: false });
  query = propertyId ? query.eq('property_id', propertyId) : query.eq('deal_id', dealId!);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, notes: data });
}

// POST /api/internal/notes — always appends a new entry, never overwrites
// an existing one, so one person's update can't silently erase another's.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  const { note, property_id, deal_id } = body;
  if (!note?.trim() || (!property_id && !deal_id)) {
    return NextResponse.json({ success: false, message: 'Note text and a property_id or deal_id are required' }, { status: 400 });
  }

  const { data, error } = await supabaseInternalAdmin
    .from('activity_notes')
    .insert([{ note: note.trim(), property_id: property_id || null, deal_id: deal_id || null, created_by: member.id }])
    .select('*, team_members(id, name)')
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, note: data });
}
