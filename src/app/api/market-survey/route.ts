import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { error } = await supabaseAdmin
      .from('market_survey')
      .insert({
        user_type: body.user_type,
        name: body.name,
        phone: body.phone,
        willing_to_contact: body.willing_to_contact,
        area: body.area,
        locality: body.locality,
        property_type: body.property_type,
        bhk: body.bhk,
        floor: body.floor,
        building_age: body.building_age,
        society_name: body.society_name,
        purchase_year: body.purchase_year || null,
        purchase_price_range: body.purchase_price_range || null,
        purchase_price_exact: body.purchase_price_exact || null,
        purchase_price_per_sqft: body.purchase_price_per_sqft || null,
        current_value_range: body.current_value_range || null,
        current_value_exact: body.current_value_exact || null,
        appreciation_feel: body.appreciation_feel || null,
        rent_amount_range: body.rent_amount_range || null,
        rent_amount_exact: body.rent_amount_exact || null,
        deposit_range: body.deposit_range || null,
        deposit_exact: body.deposit_exact || null,
        rent_increase_last_year: body.rent_increase_last_year || null,
        rent_increase_amount: body.rent_increase_amount || null,
        years_renting: body.years_renting || null,
        infra_water: body.infra?.water_supply || null,
        infra_road_width: body.infra?.road_width || null,
        infra_road_condition: body.infra?.road_condition || null,
        infra_power: body.infra?.power_cuts || null,
        infra_drainage: body.infra?.drainage || null,
        infra_garbage: body.infra?.garbage_collection || null,
        nearby_developments: body.nearby_developments || null,
        metro_connectivity: body.metro_connectivity || null,
        new_projects_nearby: body.new_projects_nearby || null,
        price_impact: body.price_impact_of_developments || null,
        builder_name: body.builder_name || null,
        builder_rating: body.builder_rating || null,
        maintenance_charges: body.maintenance_charges || null,
        oc_status: body.oc_status || null,
        society_quality: body.society_quality || null,
        would_recommend: body.would_recommend_area || null,
        best_about_area: body.best_about_area || null,
        worst_about_area: body.worst_about_area || null,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('market_survey')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, responses: data, count: data?.length || 0 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
