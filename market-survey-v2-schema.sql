-- ════════════════════════════════════════
-- MARKET SURVEY v2 — SCHEMA EXTENSION
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Extends the existing market_survey table for the new 9-section survey.
-- Purely additive — no existing columns are dropped, no data is lost.

-- Widen user_type into a broader "relationship to property" field
alter table market_survey drop constraint if exists market_survey_user_type_check;
alter table market_survey add constraint market_survey_user_type_check
  check (user_type in ('owner', 'renter', 'tenant', 'investor', 'broker'));

-- Section 1: About You & Your Property
alter table market_survey add column if not exists years_in_locality text;
alter table market_survey add column if not exists landmark text;
alter table market_survey add column if not exists property_size_value numeric;
alter table market_survey add column if not exists property_size_unit text; -- 'sqft' | 'sqyd'
alter table market_survey add column if not exists facing text;
alter table market_survey add column if not exists corner_plot boolean;

-- Section 2: Purchase History (+ conditional builder satisfaction)
alter table market_survey add column if not exists purchase_price numeric;
alter table market_survey add column if not exists purchase_price_per_unit numeric;
alter table market_survey add column if not exists purchase_type text; -- builder | resale | owner_direct | auction
alter table market_survey add column if not exists builder_rating_construction int;
alter table market_survey add column if not exists builder_rating_amenities int;
alter table market_survey add column if not exists builder_rating_value int;

-- Section 3: Current Value & Growth
alter table market_survey add column if not exists current_value numeric;
alter table market_survey add column if not exists price_growth_bucket text;
alter table market_survey add column if not exists growth_main_reason text;
alter table market_survey add column if not exists received_offers boolean;
alter table market_survey add column if not exists highest_offer numeric;

-- Section 4: Infrastructure (9 consolidated star ratings, 1-5)
alter table market_survey add column if not exists rating_roads int;
alter table market_survey add column if not exists rating_water int;
alter table market_survey add column if not exists rating_electricity int;
alter table market_survey add column if not exists rating_drainage_garbage int;
alter table market_survey add column if not exists rating_safety int;
alter table market_survey add column if not exists rating_traffic_parking int;
alter table market_survey add column if not exists rating_public_transport int;
alter table market_survey add column if not exists rating_schools_hospitals int;
alter table market_survey add column if not exists rating_shopping int;
alter table market_survey add column if not exists water_source text; -- GHMC | Borewell | Tanker | Mixed
alter table market_survey add column if not exists power_cuts text; -- never | rarely | weekly | daily

-- Section 5: Developments & Issues (checklists)
alter table market_survey add column if not exists recent_developments_list text[];
alter table market_survey add column if not exists biggest_issues_list text[];

-- Section 6: Investment Interest
alter table market_survey add column if not exists investment_interest text; -- yes | no | maybe
alter table market_survey add column if not exists investment_budget text;
alter table market_survey add column if not exists preferred_property_type text;
alter table market_survey add column if not exists preferred_location text;
alter table market_survey add column if not exists holding_period text;
alter table market_survey add column if not exists expected_return text;

-- Section 7: Future Outlook & Recommendation
alter table market_survey add column if not exists price_trend_1yr text; -- up | flat | down
alter table market_survey add column if not exists price_trend_5yr text;
alter table market_survey add column if not exists recommend_score int; -- 1-10 NPS-style

-- Section 8: Selling / Renting Intent
alter table market_survey add column if not exists planning_to_sell text; -- yes | no | maybe
alter table market_survey add column if not exists expected_sale_price numeric;
alter table market_survey add column if not exists sell_reason text;
alter table market_survey add column if not exists monthly_rent numeric;
alter table market_survey add column if not exists rental_demand text; -- high | medium | low

-- Section 9: Open Feedback
alter table market_survey add column if not exists feedback_best_thing text;
alter table market_survey add column if not exists feedback_govt_improvement text;
alter table market_survey add column if not exists feedback_invest_reason text;
