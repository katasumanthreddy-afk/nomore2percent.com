import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: img } = await supabaseInternalAdmin.from('property_images').select('storage_path').eq('id', id).single();
  if (!img) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseInternalAdmin.storage.from('commercial-property-photos').createSignedUrl(img.storage_path, 3600);
  if (error || !data) return NextResponse.json({ success: false, message: error?.message || 'Could not generate link' }, { status: 500 });

  return NextResponse.json({ success: true, url: data.signedUrl });
}
