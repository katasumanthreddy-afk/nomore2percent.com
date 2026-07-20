import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Resolves the requesting broker from the current session, or null if the
// signed-in user isn't a recognized broker.
async function getRequestingBroker() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: broker } = await supabaseAdmin
    .from('brokers')
    .select('id, name, phone, status')
    .ilike('email', user.email)
    .maybeSingle();

  return broker;
}

// GET /api/property-submissions/[id] — broker fetches their own submission for editing
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const broker = await getRequestingBroker();
    if (!broker) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const { data: submission, error } = await supabaseAdmin
      .from('property_submissions')
      .select('*, property_submission_images(id, storage_path, is_primary)')
      .eq('id', id)
      .single();

    if (error || !submission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }
    if (submission.broker_id !== broker.id) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH /api/property-submissions/[id] — broker edits their own submission, only while still pending
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const broker = await getRequestingBroker();
    if (!broker) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const { data: existing } = await supabaseAdmin
      .from('property_submissions')
      .select('broker_id, status')
      .eq('id', id)
      .single();

    if (!existing || existing.broker_id !== broker.id) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }
    if (existing.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'This listing has already been reviewed and can no longer be edited.' }, { status: 400 });
    }

    const body = await req.json();
    // Never allow a broker to touch review/ownership fields through this route.
    const { status, admin_notes, published_property_id, broker_id, owner_name, owner_phone, ...safeFields } = body;

    const { error } = await supabaseAdmin
      .from('property_submissions')
      .update(safeFields)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
