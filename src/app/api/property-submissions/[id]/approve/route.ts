import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/property-submissions/[id]/approve — admin only.
// Copies a submission into the live `properties` table (status: active),
// carries its photos over into `property_images`, and marks the submission
// as approved with a reference to the published property.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('property_submissions')
      .select('*, property_submission_images(storage_path, is_primary)')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }
    if (submission.status === 'approved') {
      return NextResponse.json({ success: false, message: 'Already approved' }, { status: 400 });
    }

    // Allow the admin to tweak a few fields at approval time (e.g. clean up
    // the title, confirm the price) without needing a separate edit step.
    const overrides = await req.json().catch(() => ({}));

    const { data: property, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert([{
        title: overrides.title || submission.title || `${submission.property_type} in ${submission.area}`,
        description: overrides.description ?? submission.description,
        price: overrides.price ?? submission.price,
        price_num: overrides.price_num ?? submission.price_num,
        area: submission.area,
        address: submission.address,
        property_type: submission.property_type,
        listing_type: submission.listing_type,
        bedrooms: submission.bedrooms || 0,
        bathrooms: submission.bathrooms || 0,
        sqft: submission.sqft || 0,
        size_unit: submission.size_unit || 'sqft',
        floor: submission.floor,
        year_built: submission.year_built,
        amenities: submission.amenities || [],
        featured: false,
        status: 'active',
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Carry the submission's photos over to the new live property
    const images = submission.property_submission_images || [];
    if (images.length > 0) {
      await supabaseAdmin.from('property_images').insert(
        images.map((img: any) => ({
          property_id: property.id,
          storage_path: img.storage_path,
          is_primary: img.is_primary,
        }))
      );
    }

    await supabaseAdmin
      .from('property_submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), published_property_id: property.id })
      .eq('id', id);

    return NextResponse.json({ success: true, property });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
