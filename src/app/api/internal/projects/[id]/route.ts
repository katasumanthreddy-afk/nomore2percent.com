import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { ALL_STAGE_VALUES, cleanProjectBody, stageLabel } from '@/lib/brands-projects';

// GET /api/internal/projects/[id] — project + linked records + checklist + documents
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: project } = await supabaseInternalAdmin
    .from('projects')
    .select('*, brands(id, name, contact_name, contact_phone), site_requirements:requirement_id(id, title), commercial_properties:property_id(id, title), land_leads:land_lead_id(id, owner_name, phone, locality), team_members:assigned_to(id, name)')
    .eq('id', id)
    .single();
  if (!project) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: checklist } = await supabaseInternalAdmin
    .from('project_checklist_items')
    .select('id, stage, label, sort, done, done_at, team_members:done_by(id, name)')
    .eq('project_id', id)
    .order('sort');

  const { data: documents } = await supabaseInternalAdmin
    .from('documents')
    .select('id, title, document_type, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ success: true, project, checklist: checklist || [], documents: documents || [] });
}

// PATCH /api/internal/projects/[id] — edit fields or move stage. A stage move
// resets the "days in stage" clock and is written to the activity timeline.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = cleanProjectBody(await req.json());

  const { data: current } = await supabaseInternalAdmin.from('projects').select('id, stage').eq('id', id).single();
  if (!current) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  if ('name' in body && !body.name) return NextResponse.json({ success: false, message: 'Project name is required' }, { status: 400 });

  const update: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
  let note: string | null = null;

  if ('stage' in body) {
    if (!ALL_STAGE_VALUES.includes(String(body.stage))) {
      return NextResponse.json({ success: false, message: 'Invalid stage' }, { status: 400 });
    }
    if (body.stage === current.stage) {
      delete update.stage;
    } else {
      update.stage_changed_at = new Date().toISOString();
      if (body.stage !== 'dropped') update.dropped_reason = null;
      note = `Stage: ${stageLabel(current.stage)} → ${stageLabel(String(body.stage))}${body.stage === 'dropped' && body.dropped_reason ? ` (${body.dropped_reason})` : ''}`;
    }
  }

  const { data, error } = await supabaseInternalAdmin.from('projects').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  if (note) await supabaseInternalAdmin.from('activity_notes').insert([{ project_id: Number(id), note, created_by: member.id }]);

  return NextResponse.json({ success: true, project: data });
}

// Owner only.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can delete a project' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('projects').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
