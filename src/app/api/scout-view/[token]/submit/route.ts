import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';

// POST /api/scout-view/[token]/submit — intentionally has NO team-member
// auth check, same as the scout-view GET. The token is the access control.
// Photos upload server-side through the service role key, so the scout's
// browser never needs its own Supabase credentials or storage permissions.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: scout } = await supabaseInternalAdmin
    .from('external_scouts')
    .select('id')
    .eq('access_token', token)
    .maybeSingle();

  if (!scout) {
    return NextResponse.json({ success: false, message: 'Invalid or expired link' }, { status: 404 });
  }

  const formData = await req.formData();
  const requirementId = formData.get('requirement_id') as string | null;
  const title = formData.get('title') as string;
  const lat = formData.get('lat') as string | null;
  const lng = formData.get('lng') as string | null;
  const address = formData.get('address') as string | null;
  const price = formData.get('price') as string | null;
  const priceLabel = formData.get('price_label') as string | null;
  const notes = formData.get('notes') as string | null;
  const files = formData.getAll('photos') as File[];

  if (!title?.trim()) {
    return NextResponse.json({ success: false, message: 'Please give this property a short title.' }, { status: 400 });
  }

  const { data: submission, error } = await supabaseInternalAdmin
    .from('scout_submissions')
    .insert([{
      scout_id: scout.id,
      requirement_id: requirementId || null,
      title: title.trim(),
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      address: address || null,
      price: price ? parseFloat(price) : null,
      price_label: priceLabel || null,
      notes: notes || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || file.size === 0) continue;
    const ext = file.name.split('.').pop();
    const path = `submission-${submission.id}/${Date.now()}-${i}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseInternalAdmin.storage
      .from('scout-submission-photos')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (!uploadError) {
      await supabaseInternalAdmin.from('scout_submission_images').insert([{ submission_id: submission.id, storage_path: path }]);
    }
  }

  return NextResponse.json({ success: true });
}
