import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { LEAD_STATUSES } from '@/lib/land-leads';

const STATUS_VALUES = LEAD_STATUSES.map((s) => s.value);
const label = (v: string) => LEAD_STATUSES.find((s) => s.value === v)?.label || v;

// PATCH /api/internal/land-leads/[id] — move through the pipeline or reassign.
// Every change is also written to the lead's activity timeline, so there's a
// record of who moved what and when.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const { data: lead } = await supabaseInternalAdmin.from('land_leads').select('id, status, assigned_to').eq('id', id).single();
  if (!lead) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const log: string[] = [];

  if (body.status !== undefined) {
    if (!STATUS_VALUES.includes(body.status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }
    if (body.status !== lead.status) {
      update.status = body.status;
      const reason = typeof body.rejection_reason === 'string' ? body.rejection_reason.trim().slice(0, 300) : '';
      update.rejection_reason = body.status === 'rejected' ? reason || null : null;
      log.push(`Status: ${label(lead.status)} → ${label(body.status)}${body.status === 'rejected' && reason ? ` (${reason})` : ''}`);
    }
  }

  if (body.assigned_to !== undefined) {
    const assignee = body.assigned_to === null || body.assigned_to === '' ? null : Number(body.assigned_to);
    if (assignee !== lead.assigned_to) {
      let name = 'nobody';
      if (assignee != null) {
        const { data: tm } = await supabaseInternalAdmin.from('team_members').select('id, name, status').eq('id', assignee).single();
        if (!tm || tm.status !== 'active') return NextResponse.json({ success: false, message: 'Unknown team member' }, { status: 400 });
        name = tm.name;
      }
      update.assigned_to = assignee;
      log.push(`Assigned to ${name}`);
    }
  }

  if (log.length === 0) return NextResponse.json({ success: true, unchanged: true });

  const { data, error } = await supabaseInternalAdmin.from('land_leads').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  await supabaseInternalAdmin.from('activity_notes').insert([{ land_lead_id: Number(id), note: log.join(' · '), created_by: member.id }]);

  return NextResponse.json({ success: true, lead: data });
}
