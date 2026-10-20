import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { ALL_STAGE_VALUES } from '@/lib/brands-projects';

async function guard() {
  const member = await getRequestingTeamMember();
  return member && member.status === 'active' ? member : null;
}

// POST — add a custom item to a stage: { stage, label }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await guard();
  if (!member) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  const { id } = await params;
  const { stage, label } = await req.json();
  if (!ALL_STAGE_VALUES.includes(stage) || typeof label !== 'string' || !label.trim()) {
    return NextResponse.json({ success: false, message: 'Stage and label are required' }, { status: 400 });
  }
  const { data: last } = await supabaseInternalAdmin
    .from('project_checklist_items').select('sort').eq('project_id', id).eq('stage', stage)
    .order('sort', { ascending: false }).limit(1);
  const { data, error } = await supabaseInternalAdmin
    .from('project_checklist_items')
    .insert([{ project_id: Number(id), stage, label: label.trim().slice(0, 200), sort: (last?.[0]?.sort ?? -1) + 1 }])
    .select('id, stage, label, sort, done, done_at')
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, item: { ...data, team_members: null } });
}

// PATCH — tick / untick an item: { item_id, done }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await guard();
  if (!member) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  const { id } = await params;
  const { item_id, done } = await req.json();
  const { data, error } = await supabaseInternalAdmin
    .from('project_checklist_items')
    .update({ done: !!done, done_at: done ? new Date().toISOString() : null, done_by: done ? member.id : null })
    .eq('id', item_id)
    .eq('project_id', id)
    .select('id, stage, label, sort, done, done_at, team_members:done_by(id, name)')
    .single();
  if (error || !data) return NextResponse.json({ success: false, message: error?.message || 'Not found' }, { status: 404 });
  await supabaseInternalAdmin.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ success: true, item: data });
}

// DELETE ?item_id=X — remove an item that doesn't apply to this project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await guard();
  if (!member) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  const { id } = await params;
  const itemId = new URL(req.url).searchParams.get('item_id');
  if (!itemId) return NextResponse.json({ success: false, message: 'Missing item_id' }, { status: 400 });
  const { error } = await supabaseInternalAdmin.from('project_checklist_items').delete().eq('id', itemId).eq('project_id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
