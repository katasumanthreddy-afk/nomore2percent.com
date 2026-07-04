-- ════════════════════════════════════════
-- MARKET SURVEY — SUPABASE SCHEMA
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Backs the 8-step property intelligence survey at /market-survey
-- Field names match src/app/api/market-survey/route.ts exactly.

create table if not exists market_survey (
  id bigint generated always as identity primary key,

  -- Step 1: Who are you
  user_type text not null check (user_type in ('owner', 'renter')),
  name text,
  phone text,
  willing_to_contact boolean default false,

  -- Step 2: Property details
  area text,
  locality text,
  property_type text,
  bhk text,
  floor text,
  building_age text,
  society_name text,

  -- Step 3a: Purchase & pricing (owner track)
  purchase_year text,
  purchase_price_range text,
  purchase_price_exact numeric,
  purchase_price_per_sqft numeric,
  current_value_range text,
  current_value_exact numeric,
  appreciation_feel text,

  -- Step 3b: Rent & deposit (renter track)
  rent_amount_range text,
  rent_amount_exact numeric,
  deposit_range text,
  deposit_exact numeric,
  rent_increase_last_year text,
  rent_increase_amount numeric,
  years_renting text,

  -- Step 4: Infrastructure
  infra_water text,
  infra_road_width text,
  infra_road_condition text,
  infra_power text,
  infra_drainage text,
  infra_garbage text,

  -- Step 5: Developments
  nearby_developments text,
  metro_connectivity text,
  new_projects_nearby text,
  price_impact text,

  -- Step 6: Builder & society
  builder_name text,
  builder_rating text,
  maintenance_charges text,
  oc_status text,
  society_quality text,

  -- Step 7: Your view
  would_recommend text,
  best_about_area text,
  worst_about_area text,

  created_at timestamptz default now()
);

-- Helpful indexes for the admin view (filter/sort by area and recency)
create index if not exists idx_market_survey_area on market_survey (area);
create index if not exists idx_market_survey_created_at on market_survey (created_at desc);

-- Row Level Security: only the service role (used server-side in the API route) can read/write.
-- The public/anon key should never touch this table directly — all access goes through
-- /api/market-survey, which uses supabaseAdmin (service role) and bypasses RLS.
alter table market_survey enable row level security;
