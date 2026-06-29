import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// GET /api/properties — public endpoint, returns active listings with images
// Used by the marketplace frontend (no auth needed — RLS only exposes active properties)
export async function GET() {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, property_images(storage_path, is_primary)')
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (properties || []).map((p: any) => ({
      ...p,
      images: (p.property_images || [])
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
        .map((img: any) => img.storage_path),
    }));

    return NextResponse.json({ success: true, count: formatted.length, properties: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/properties — admin only, creates a new listing
// (In production, wrap this with a session check — see src/lib/auth.ts)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, price, price_num, price_per_sqft, area, address,
      property_type, listing_type, bedrooms, bathrooms, sqft, floor,
      parking, year_built, rera_number, amenities, featured,
    } = body;

    if (!title || !price || !area) {
      return NextResponse.json({ success: false, message: 'Title, price, and area are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert([{
        title, description, price, price_num, price_per_sqft, area, address,
        property_type: property_type || 'apartment',
        listing_type: listing_type || 'sale',
        bedrooms: bedrooms || 0, bathrooms: bathrooms || 0, sqft: sqft || 0,
        floor, parking: parking || 0, year_built, rera_number,
        amenities: amenities || [], featured: !!featured,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, property: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
