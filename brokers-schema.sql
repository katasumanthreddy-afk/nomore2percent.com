-- ════════════════════════════════════════
-- BROKER PARTNER NETWORK — SCHEMA
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
--
-- Invite-only: brokers are added here by admin, not self-registered.
-- Portal access works by matching the broker's email against whatever
-- email they signed in with via the existing buyer auth (magic link or
-- Google) — no separate broker login system needed.

create table if not exists brokers (
  id bigint generated always as identity primary key,

  name text not null,
  phone text not null,
  email text not null unique,

  rera_agent_number text,
  rera_verified boolean default false,
  mou_signed boolean default false,

  status text default 'invited' check (status in ('invited', 'active', 'suspended')),
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_brokers_email on brokers (lower(email));

-- Attribute a submission to the broker who sourced it. Nullable — a null
-- broker_id means the property owner submitted it directly, same as before.
-- owner_name/owner_phone on property_submissions continue to represent the
-- actual property owner/seller regardless of who submitted the listing.
alter table property_submissions add column if not exists broker_id bigint references brokers(id) on delete set null;

create index if not exists idx_property_submissions_broker on property_submissions(broker_id);

alter table brokers enable row level security;

NOTIFY pgrst, 'reload schema';
