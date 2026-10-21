import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// GET /api/internal/properties/[id]/cover — signed URL (1 hour) for the
// property's primary photo, or null. Fetched only when a map pin is opened,
// so the map itself stays fast.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { data: photos } = await supabaseInternalAdmin
    .from('property_images')
    .select('storage_path, is_primary')
    .eq('property_id', id)
    .order('is_primary', { ascending: false })
    .limit(1);
  const path = photos?.[0]?.storage_path;
  if (!path) return NextResponse.json({ success: true, url: null, count: 0 });
  const { data } = await supabaseInternalAdmin.storage.from('commercial-property-photos').createSignedUrl(path, 3600);
  const { count } = await supabaseInternalAdmin.from('property_images').select('id', { count: 'exact', head: true }).eq('property_id', id);
  return NextResponse.json({ success: true, url: data?.signedUrl || null, count: count ?? 1 });
}
