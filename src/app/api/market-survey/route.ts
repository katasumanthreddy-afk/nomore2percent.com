import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();

    const { error } = await supabaseAdmin
      .from('market_survey')
      .insert({
        // Section 1: About You & Your Property
        user_type: b.relationship,
        name: b.respondent_name || null,
        phone: b.respondent_phone || null,
        willing_to_contact: b.willing_to_contact || false,
        years_in_locality: b.years_in_locality || null,
        area: b.area || null,
        landmark: b.landmark || null,
        property_type: b.property_type || null,
        property_size_value: b.property_size_value || null,
        property_size_unit: b.property_size_unit || null,
        facing: b.facing || null,
        corner_plot: b.corner_plot ?? null,

        // Section 2: Purchase History
        purchase_year: b.purchase_year || null,
        purchase_price: b.purchase_price || null,
        purchase_price_per_unit: b.purchase_price_per_unit || null,
        purchase_type: b.purchase_type || null,
        builder_rating_construction: b.builder_rating_construction || null,
        builder_rating_amenities: b.builder_rating_amenities || null,
        builder_rating_value: b.builder_rating_value || null,

        // Section 3: Current Value & Growth
        current_value: b.current_value || null,
        price_growth_bucket: b.price_growth_bucket || null,
        growth_main_reason: b.growth_main_reason || null,
        received_offers: b.received_offers ?? null,
        highest_offer: b.highest_offer || null,

        // Section 4: Infrastructure
        rating_roads: b.rating_roads || null,
        rating_water: b.rating_water || null,
        rating_electricity: b.rating_electricity || null,
        rating_drainage_garbage: b.rating_drainage_garbage || null,
        rating_safety: b.rating_safety || null,
        rating_traffic_parking: b.rating_traffic_parking || null,
        rating_public_transport: b.rating_public_transport || null,
        rating_schools_hospitals: b.rating_schools_hospitals || null,
        rating_shopping: b.rating_shopping || null,
        water_source: b.water_source || null,
        power_cuts: b.power_cuts || null,

        // Section 5: Developments & Issues
        recent_developments_list: b.recent_developments_list || null,
        biggest_issues_list: b.biggest_issues_list || null,

        // Section 6: Investment Interest
        investment_interest: b.investment_interest || null,
        investment_budget: b.investment_budget || null,
        preferred_property_type: b.preferred_property_type || null,
        preferred_location: b.preferred_location || null,
        holding_period: b.holding_period || null,
        expected_return: b.expected_return || null,

        // Section 7: Future Outlook & Recommendation
        price_trend_1yr: b.price_trend_1yr || null,
        price_trend_5yr: b.price_trend_5yr || null,
        recommend_score: b.recommend_score || null,

        // Section 8: Selling / Renting Intent
        planning_to_sell: b.planning_to_sell || null,
        expected_sale_price: b.expected_sale_price || null,
        sell_reason: b.sell_reason || null,
        monthly_rent: b.monthly_rent || null,
        rental_demand: b.rental_demand || null,

        // Section 9: Open Feedback
        feedback_best_thing: b.feedback_best_thing || null,
        feedback_govt_improvement: b.feedback_govt_improvement || null,
        feedback_invest_reason: b.feedback_invest_reason || null,

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
