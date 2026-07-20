import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// DELETE /api/property-submissions/images/[id] — broker removes a photo from
// their own submission, only while it's still pending review.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const { data: image } = await supabaseAdmin
      .from('property_submission_images')
      .select('submission_id')
      .eq('id', id)
      .single();

    if (!image) {
      return NextResponse.json({ success: false, message: 'Photo not found' }, { status: 404 });
    }

    const { data: submission } = await supabaseAdmin
      .from('property_submissions')
      .select('broker_id, status')
      .eq('id', image.submission_id)
      .single();

    const { data: broker } = await supabaseAdmin
      .from('brokers')
      .select('id')
      .ilike('email', user.email)
      .maybeSingle();

    if (!submission || !broker || submission.broker_id !== broker.id) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }
    if (submission.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'This listing has already been reviewed.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('property_submission_images').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
