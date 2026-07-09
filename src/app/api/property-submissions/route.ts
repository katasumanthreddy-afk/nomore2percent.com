import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/property-submissions — public endpoint, owners submit their property for review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      owner_name, owner_phone, owner_email, title, description,
      property_type, listing_type, area, address,
      bedrooms, bathrooms, sqft, size_unit, price, price_num, floor, year_built, amenities,
    } = body;

    if (!owner_name || !owner_phone || !property_type || !listing_type || !area) {
      return NextResponse.json({ success: false, message: 'Name, phone, property type, listing type, and area are required' }, { status: 400 });
    }

    const cleanPhone = String(owner_phone).replace(/[\s+\-]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
      return NextResponse.json({ success: false, message: 'Please enter a valid Indian mobile number' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('property_submissions')
      .insert([{
        owner_name, owner_phone, owner_email: owner_email || null,
        title: title || null, description: description || null,
        property_type, listing_type, area, address: address || null,
        bedrooms: bedrooms || null, bathrooms: bathrooms || null, sqft: sqft || null,
        size_unit: size_unit || 'sqft',
        price: price || null, price_num: price_num || null,
        floor: floor || null, year_built: year_built || null,
        amenities: amenities || [],
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, submission: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}

// GET /api/property-submissions — admin only, lists all submissions with their images
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('property_submissions')
      .select('*, property_submission_images(id, storage_path, is_primary)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, submissions: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
