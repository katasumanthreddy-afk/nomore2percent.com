import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// POST /api/internal/documents — multipart upload. Files go straight through
// the server using the service-role key, so no storage RLS policies need to
// be configured on the bucket at all — it can stay fully locked down.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string;
  const documentType = (formData.get('document_type') as string) || 'other';
  const propertyId = formData.get('property_id') as string | null;
  const dealId = formData.get('deal_id') as string | null;

  if (!file || !title) {
    return NextResponse.json({ success: false, message: 'File and title are required' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const path = `${propertyId ? `property-${propertyId}` : `deal-${dealId}`}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseInternalAdmin.storage
    .from('internal-documents')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}. Did you create the "internal-documents" storage bucket?` }, { status: 500 });
  }

  const { data, error } = await supabaseInternalAdmin
    .from('documents')
    .insert([{
      title, storage_path: path, document_type: documentType,
      property_id: propertyId || null, deal_id: dealId || null,
      uploaded_by: member.id,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, document: data });
}

export async function DELETE(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });

  const { data: doc } = await supabaseInternalAdmin.from('documents').select('storage_path').eq('id', id).single();
  if (doc) await supabaseInternalAdmin.storage.from('internal-documents').remove([doc.storage_path]);

  const { error } = await supabaseInternalAdmin.from('documents').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
