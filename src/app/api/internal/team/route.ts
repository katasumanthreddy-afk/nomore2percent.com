import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data, error } = await supabaseInternalAdmin.from('team_members').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, members: data });
}

// Adding new team members is owner-only — this is who gets to decide who
// has a key to the building, so to speak.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can add team members' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, role } = body;
  if (!name || !email) {
    return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
  }

  const { data, error } = await supabaseInternalAdmin
    .from('team_members')
    .insert([{ name, email: email.toLowerCase().trim(), role: role || 'employee', status: 'active' }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ success: false, message: 'Someone with this email is already on the team' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, member: data });
}
