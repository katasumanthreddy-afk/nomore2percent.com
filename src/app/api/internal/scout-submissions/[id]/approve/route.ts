import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: submission } = await supabaseInternalAdmin.from('scout_submissions').select('*').eq('id', id).single();
  if (!submission) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  if (submission.status !== 'pending') {
    return NextResponse.json({ success: false, message: 'Already reviewed.' }, { status: 400 });
  }

  const { data: property, error } = await supabaseInternalAdmin
    .from('commercial_properties')
    .insert([{
      title: submission.title, lat: submission.lat, lng: submission.lng, address: submission.address,
      price: submission.price, price_label: submission.price_label,
      notes: submission.notes ? `Submitted by scout: ${submission.notes}` : 'Submitted by an external scout.',
      property_type: 'office', deal_type: 'sale', status: 'available',
      created_by: member.id,
    }])
    .select()
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  await supabaseInternalAdmin
    .from('scout_submissions')
    .update({ status: 'approved', published_property_id: property.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ success: true, propertyId: property.id });
}
