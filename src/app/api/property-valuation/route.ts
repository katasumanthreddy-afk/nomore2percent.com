import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { estimateValue, calculateHealthScore } from '@/lib/valuation';

export async function POST(req: NextRequest) {
  try {
    const { area, property_type, sqft, age_years, name, phone } = await req.json();

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

    const valuationInput = {
      area,
      property_type,
      sqft: Number(sqft),
      age_years: Number(age_years) || 5,
      live_comp_avg: liveCompAvg,
      live_comp_count: numericComps.length,
    };

    const result = estimateValue(valuationInput);
    const health = calculateHealthScore(valuationInput, result);

    // If contact details were provided, this is the "unlock" step of the gated
    // flow — capture the lead now, before showing results, not as an
    // afterthought. Invalid/missing phone just skips lead capture silently
    // rather than blocking the valuation itself.
    if (name && phone) {
      const cleanPhone = String(phone).replace(/[\s+\-]/g, '');
      if (/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
        await supabaseAdmin.from('leads').insert([{
          name, phone, area, property_type,
          budget: '₹' + result.estimated_low.toLocaleString('en-IN') + ' - ₹' + result.estimated_high.toLocaleString('en-IN'),
          message: `Property valuation lead. ${sqft} sqft, ${age_years || 5} yrs old. Health Score: ${health.score}/100 (${health.band}).`,
          source: 'property-valuation',
        }]);
      }
    }

    return NextResponse.json({ success: true, ...result, health });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
