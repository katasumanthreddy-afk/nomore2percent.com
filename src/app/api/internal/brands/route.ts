import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { cleanBrandBody } from '@/lib/brands-projects';

// GET /api/internal/brands — every brand with counts of its open
// requirements and live projects.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: brands, error } = await supabaseInternalAdmin.from('brands').select('*').order('name');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const { data: reqs } = await supabaseInternalAdmin.from('site_requirements').select('brand_id, status').not('brand_id', 'is', null);
  const { data: projects } = await supabaseInternalAdmin.from('projects').select('brand_id, stage').not('brand_id', 'is', null);

  const result = (brands || []).map((b) => ({
    ...b,
    open_requirements: (reqs || []).filter((r) => r.brand_id === b.id && r.status !== 'closed').length,
    live_projects: (projects || []).filter((p) => p.brand_id === b.id && p.stage !== 'dropped' && p.stage !== 'rent_started').length,
    done_projects: (projects || []).filter((p) => p.brand_id === b.id && p.stage === 'rent_started').length,
  }));

  return NextResponse.json({ success: true, brands: result });
}

// POST /api/internal/brands
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const body = cleanBrandBody(await req.json());
  if (!body.name) return NextResponse.json({ success: false, message: 'Brand name is required' }, { status: 400 });

  const { data, error } = await supabaseInternalAdmin
    .from('brands')
    .insert([{ ...body, created_by: member.id }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: false, message: 'A brand with this name already exists' }, { status: 400 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, brand: data });
}
