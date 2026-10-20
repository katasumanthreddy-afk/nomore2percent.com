import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { CHECKLIST_TEMPLATE, cleanProjectBody } from '@/lib/brands-projects';
import { invalidateCache } from '@/lib/simple-cache';

// GET /api/internal/projects — all projects with brand, assignee and
// checklist progress for the current stage.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: projects, error } = await supabaseInternalAdmin
    .from('projects')
    .select('*, brands(id, name), team_members:assigned_to(id, name)')
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const { data: items } = await supabaseInternalAdmin.from('project_checklist_items').select('project_id, stage, done');

  const result = (projects || []).map((p) => {
    const here = (items || []).filter((i) => i.project_id === p.id && i.stage === p.stage);
    return { ...p, stage_done: here.filter((i) => i.done).length, stage_total: here.length };
  });

  return NextResponse.json({ success: true, projects: result });
}

// POST /api/internal/projects — creates the project and seeds the standard
// checklist for every stage.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const body = cleanProjectBody(await req.json());
  if (!body.name) return NextResponse.json({ success: false, message: 'Project name is required' }, { status: 400 });
  if ('stage' in body) delete body.stage; // every project starts at the first stage

  const { data: project, error } = await supabaseInternalAdmin
    .from('projects')
    .insert([{ ...body, created_by: member.id, assigned_to: body.assigned_to ?? member.id }])
    .select()
    .single();
  if (error || !project) return NextResponse.json({ success: false, message: error?.message || 'Insert failed' }, { status: 500 });

  const seed = Object.entries(CHECKLIST_TEMPLATE).flatMap(([stage, labels]) =>
    labels.map((label, i) => ({ project_id: project.id, stage, label, sort: i })));
  await supabaseInternalAdmin.from('project_checklist_items').insert(seed);

  await supabaseInternalAdmin.from('activity_notes').insert([{ project_id: project.id, note: 'Project created', created_by: member.id }]);

  // Linking a site to a project means the requirement has its candidate.
  if (project.requirement_id) {
    await supabaseInternalAdmin.from('site_requirements').update({ status: 'found' }).eq('id', project.requirement_id).eq('status', 'searching');
    invalidateCache('internal:requirements:raw');
  }

  return NextResponse.json({ success: true, project });
}
