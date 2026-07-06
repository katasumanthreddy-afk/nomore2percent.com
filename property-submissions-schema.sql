-- ════════════════════════════════════════
-- PROPERTY SUBMISSIONS — SCHEMA
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Backs the public "List Your Property" form at /list-your-property.
-- Kept completely separate from the live `properties` table so unverified
-- owner submissions can never accidentally appear on the public site —
-- only an approved submission gets copied into `properties`.

create table if not exists property_submissions (
  id bigint generated always as identity primary key,

  -- Who submitted it
  owner_name text not null,
  owner_phone text not null,
  owner_email text,

  -- What they're submitting
  title text,
  description text,
  property_type text not null check (property_type in ('apartment', 'villa', 'plot', 'commercial')),
  listing_type text not null check (listing_type in ('sale', 'rent')),
  area text not null,
  address text,
  bedrooms int,
  bathrooms int,
  sqft int,
  price text,
  price_num numeric,
  floor text,
  year_built text,
  amenities text[],

  -- Review workflow
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  published_property_id bigint references properties(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz default now()
);

create table if not exists property_submission_images (
  id bigint generated always as identity primary key,
  submission_id bigint references property_submissions(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_property_submissions_status on property_submissions(status);
create index if not exists idx_submission_images_submission on property_submission_images(submission_id);

-- RLS: only the service role (used server-side in the API routes) can read/write.
-- Public visitors submit through /api/property-submissions, which uses supabaseAdmin
-- and bypasses RLS — the anon key never touches these tables directly.
alter table property_submissions enable row level security;
alter table property_submission_images enable row level security;
