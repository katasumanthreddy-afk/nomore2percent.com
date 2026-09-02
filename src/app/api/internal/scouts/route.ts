import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { randomBytes } from 'crypto';

export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: scouts, error } = await supabaseInternalAdmin.from('external_scouts').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const { data: requirements } = await supabaseInternalAdmin.from('site_requirements').select('assigned_to_scout_id').not('assigned_to_scout_id', 'is', null);
  const withCounts = (scouts || []).map((s) => ({
    ...s,
    assigned_count: (requirements || []).filter((r) => r.assigned_to_scout_id === s.id).length,
  }));

  return NextResponse.json({ success: true, scouts: withCounts });
}

export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });

  const token = randomBytes(16).toString('hex');
  const { data, error } = await supabaseInternalAdmin
    .from('external_scouts')
    .insert([{ name: body.name, phone: body.phone || null, access_token: token }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, scout: data });
}
