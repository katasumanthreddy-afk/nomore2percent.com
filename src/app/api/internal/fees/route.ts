import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// GET /api/internal/fees — every fee across projects (owner only).
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can see fees' }, { status: 403 });
  }
  const { data, error } = await supabaseInternalAdmin
    .from('project_fees')
    .select('*, projects(id, name, stage, brands(name))')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, fees: data || [] });
}
