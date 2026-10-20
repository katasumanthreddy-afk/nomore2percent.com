import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// GET /api/internal/land-leads — every landowner lead from the campaign,
// newest first, with assignee, nearest requirement and a cover photo.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: leads, error } = await supabaseInternalAdmin
    .from('land_leads')
    .select('*, team_members:assigned_to(id, name), site_requirements:nearest_requirement_id(id, title, radius_max_m), land_lead_images(id, storage_path)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  // Sign only the first photo of each lead for the list view.
  const paths = (leads || []).map((l) => l.land_lead_images?.[0]?.storage_path).filter(Boolean) as string[];
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabaseInternalAdmin.storage.from('land-lead-photos').createSignedUrls(paths, 3600);
    (data || []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
  }

  const result = (leads || []).map(({ land_lead_images, ...l }) => ({
    ...l,
    photo_count: land_lead_images?.length || 0,
    cover_url: land_lead_images?.[0] ? signed[land_lead_images[0].storage_path] || null : null,
  }));

  return NextResponse.json({ success: true, leads: result });
}
