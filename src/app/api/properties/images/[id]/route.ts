import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// DELETE /api/properties/images/[id] — remove a single photo from a property
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('property_images').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH /api/properties/images/[id] — set this photo as the primary/cover image
// (unsets is_primary on every other photo for the same property first)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: image, error: fetchError } = await supabaseAdmin
      .from('property_images')
      .select('property_id')
      .eq('id', id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ success: false, message: 'Photo not found' }, { status: 404 });
    }

    await supabaseAdmin.from('property_images').update({ is_primary: false }).eq('property_id', image.property_id);
    const { error } = await supabaseAdmin.from('property_images').update({ is_primary: true }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
