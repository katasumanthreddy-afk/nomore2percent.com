import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/property-submissions/images — record an already-uploaded photo
// against a submission (the file itself goes straight to Supabase Storage
// from the browser; this just saves the resulting public URL).
export async function POST(req: NextRequest) {
  try {
    const { submission_id, storage_path, is_primary } = await req.json();

    if (!submission_id || !storage_path) {
      return NextResponse.json({ success: false, message: 'submission_id and storage_path are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('property_submission_images')
      .insert([{ submission_id, storage_path, is_primary: !!is_primary }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, image: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
