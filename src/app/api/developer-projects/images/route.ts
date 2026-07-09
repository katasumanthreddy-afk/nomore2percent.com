import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { project_id, storage_path, is_primary } = await req.json();

    if (!project_id || !storage_path) {
      return NextResponse.json({ success: false, message: 'project_id and storage_path are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('developer_project_images')
      .insert([{ project_id, storage_path, is_primary: !!is_primary }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, image: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
