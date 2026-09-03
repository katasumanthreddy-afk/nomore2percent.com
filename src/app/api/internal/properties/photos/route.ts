import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// POST /api/internal/properties/photos — multipart upload, same server-side
// pattern as documents: uploads go through the service role key so the
// bucket can stay private without needing storage RLS policies configured.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const formData = await req.formData();
  const propertyId = formData.get('property_id') as string;
  const isPrimary = formData.get('is_primary') === 'true';
  const file = formData.get('photo') as File | null;

  if (!propertyId || !file) {
    return NextResponse.json({ success: false, message: 'property_id and photo are required' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const path = `property-${propertyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseInternalAdmin.storage
    .from('commercial-property-photos')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}. Did you create the "commercial-property-photos" storage bucket?` }, { status: 500 });
  }

  const { data, error } = await supabaseInternalAdmin
    .from('property_images')
    .insert([{ property_id: propertyId, storage_path: path, is_primary: isPrimary }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, image: data });
}

export async function DELETE(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  const { data: img } = await supabaseInternalAdmin.from('property_images').select('storage_path').eq('id', id).single();
  if (img) await supabaseInternalAdmin.storage.from('commercial-property-photos').remove([img.storage_path]);

  const { error } = await supabaseInternalAdmin.from('property_images').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
