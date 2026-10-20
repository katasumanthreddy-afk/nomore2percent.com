import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { invalidateCache } from '@/lib/simple-cache';
import { cleanBrandBody } from '@/lib/brands-projects';

// GET /api/internal/brands/[id] — brand + its requirements + its projects
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: brand } = await supabaseInternalAdmin.from('brands').select('*').eq('id', id).single();
  if (!brand) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: requirements } = await supabaseInternalAdmin
    .from('site_requirements')
    .select('id, title, status, radius_max_m, priority, target_date')
    .eq('brand_id', id)
    .order('created_at', { ascending: false });

  const { data: projects } = await supabaseInternalAdmin
    .from('projects')
    .select('id, name, stage, stage_changed_at, locality')
    .eq('brand_id', id)
    .order('updated_at', { ascending: false });

  return NextResponse.json({ success: true, brand, requirements: requirements || [], projects: projects || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = cleanBrandBody(await req.json());
  if ('name' in body && !body.name) return NextResponse.json({ success: false, message: 'Brand name is required' }, { status: 400 });

  const { data, error } = await supabaseInternalAdmin
    .from('brands')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: false, message: 'A brand with this name already exists' }, { status: 400 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  // Brand specs feed requirement matching.
  invalidateCache('internal:requirements:raw');
  invalidateCache('internal:requirements:matches');
  return NextResponse.json({ success: true, brand: data });
}

// Deleting a brand unlinks its requirements and projects (they are kept).
// Owner only.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can delete a brand' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('brands').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  invalidateCache('internal:requirements:raw');
  invalidateCache('internal:requirements:matches');
  return NextResponse.json({ success: true });
}
