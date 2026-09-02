import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: submissions, error } = await supabaseInternalAdmin
    .from('scout_submissions')
    .select('*, external_scouts(id, name, phone), site_requirements(id, title), scout_submission_images(id, storage_path)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  // Photos are in a private bucket — resolve a signed URL for each so the
  // review page can actually display them.
  const withUrls = await Promise.all(
    (submissions || []).map(async (s) => {
      const images = await Promise.all(
        (s.scout_submission_images || []).map(async (img: any) => {
          const { data } = await supabaseInternalAdmin.storage.from('scout-submission-photos').createSignedUrl(img.storage_path, 3600);
          return { id: img.id, url: data?.signedUrl || null };
        })
      );
      return { ...s, images };
    })
  );

  return NextResponse.json({ success: true, submissions: withUrls });
}
