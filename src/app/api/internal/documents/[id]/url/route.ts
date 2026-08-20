import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// GET /api/internal/documents/[id]/url — a signed URL valid for 1 hour, so
// documents can be viewed/downloaded without the storage bucket ever being
// public.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { id } = await params;
  const { data: doc } = await supabaseInternalAdmin.from('documents').select('storage_path').eq('id', id).single();
  if (!doc) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseInternalAdmin.storage.from('internal-documents').createSignedUrl(doc.storage_path, 3600);
  if (error || !data) return NextResponse.json({ success: false, message: error?.message || 'Could not generate link' }, { status: 500 });

  return NextResponse.json({ success: true, url: data.signedUrl });
}
