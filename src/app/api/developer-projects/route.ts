import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// GET /api/developer-projects — public endpoint, returns active projects with images.
// Pass ?all=1 (admin dashboard use) to get every project regardless of status.
export async function GET(req: NextRequest) {
  try {
    const showAll = req.nextUrl.searchParams.get('all') === '1';
    const client = showAll ? supabaseAdmin : supabase;

    let query = client
      .from('developer_projects')
      .select('*, developer_project_images(id, storage_path, is_primary)')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (!showAll) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((p: any) => ({
      ...p,
      images: (p.developer_project_images || [])
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
        .map((img: any) => img.storage_path),
    }));

    return NextResponse.json({ success: true, count: formatted.length, projects: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/developer-projects — admin only, creates a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project_name, developer_name, project_type, area, address, description,
      price_range, starting_price_num, possession_date, rera_number, total_units,
      land_area, unit_types, amenities, status, featured,
    } = body;

    if (!project_name || !developer_name || !area) {
      return NextResponse.json({ success: false, message: 'Project name, developer, and area are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('developer_projects')
      .insert([{
        project_name, developer_name,
        project_type: project_type || 'apartment',
        area, address: address || null, description: description || null,
        price_range: price_range || null, starting_price_num: starting_price_num || null,
        possession_date: possession_date || null, rera_number: rera_number || null,
        total_units: total_units || null, land_area: land_area || null,
        unit_types: unit_types || [], amenities: amenities || [],
        status: status || 'under_construction', featured: !!featured,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, project: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
