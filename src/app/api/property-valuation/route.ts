import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { estimateValue } from '@/lib/valuation';

export async function POST(req: NextRequest) {
  try {
    const { area, property_type, sqft, age_years } = await req.json();

    if (!area || !property_type || !sqft || sqft <= 0) {
      return NextResponse.json({ success: false, message: 'Area, property type, and sqft are required' }, { status: 400 });
    }

    // Pull live comps: active listings of the same type in the same area that
    // have a recorded price_per_sqft, so the estimate reflects our own current
    // listings once we have enough of them, not just the static benchmark.
    const { data: comps } = await supabaseAdmin
      .from('properties')
      .select('price_per_sqft')
      .eq('status', 'active')
      .eq('property_type', property_type)
      .ilike('area', `%${area.trim()}%`)
      .not('price_per_sqft', 'is', null);

    const numericComps = (comps || [])
      .map((c: any) => parseFloat(String(c.price_per_sqft).replace(/[^\d.]/g, '')))
      .filter((n: number) => !isNaN(n) && n > 0);

    const liveCompAvg = numericComps.length > 0
      ? numericComps.reduce((a: number, b: number) => a + b, 0) / numericComps.length
      : null;

    const result = estimateValue({
      area,
      property_type,
      sqft: Number(sqft),
      age_years: Number(age_years) || 5,
      live_comp_avg: liveCompAvg,
      live_comp_count: numericComps.length,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
