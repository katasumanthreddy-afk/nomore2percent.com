-- ============================================================
-- Land sourcing campaign: landowners offering 500+ sq yds on long-term lease
-- Run in the INTERNAL Supabase project (nomore2percent-internal,
-- ref jehlvcoawairegxaplfi) → SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists land_leads (
  id                     bigserial primary key,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  -- Who
  owner_name             text not null,
  phone                  text not null,
  relation               text not null default 'owner'
                           check (relation in ('owner', 'family', 'agent')),

  -- Where
  locality               text not null,
  address                text,
  lat                    double precision,
  lng                    double precision,

  -- What
  size_value             numeric not null,
  size_unit              text not null default 'sq_yds'
                           check (size_unit in ('sq_yds', 'guntas', 'acres')),
  size_sq_yds            numeric not null,          -- normalised, used for the 500 minimum + sorting
  road_width_ft          integer,
  land_type              text
                           check (land_type in ('open_plot', 'hmda_layout', 'dtcp_layout', 'gp_layout', 'agricultural', 'other')),
  title_status           text
                           check (title_status in ('clear', 'in_progress', 'not_sure')),
  current_use            text,
  expected_rent_monthly  numeric,
  lease_years_preferred  integer,
  notes                  text,

  -- Campaign attribution
  form_language          text not null default 'en' check (form_language in ('en', 'te')),
  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  utm_content            text,

  -- Pipeline
  status                 text not null default 'new'
                           check (status in ('new', 'contacted', 'site_visit', 'shortlisted', 'negotiating', 'signed', 'rejected')),
  rejection_reason       text,
  assigned_to            bigint references team_members(id) on delete set null,
  nearest_requirement_id bigint references site_requirements(id) on delete set null,
  nearest_requirement_m  integer,
  converted_property_id  bigint references commercial_properties(id) on delete set null,

  constraint land_leads_min_size check (size_sq_yds >= 500)
);

create index if not exists land_leads_status_idx   on land_leads (status, created_at desc);
create index if not exists land_leads_phone_idx    on land_leads (phone);
create index if not exists land_leads_assigned_idx on land_leads (assigned_to);

create table if not exists land_lead_images (
  id            bigserial primary key,
  lead_id       bigint not null references land_leads(id) on delete cascade,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);
create index if not exists land_lead_images_lead_idx on land_lead_images (lead_id);

-- Activity notes on a lead reuse the existing append-only timeline.
alter table activity_notes add column if not exists land_lead_id bigint references land_leads(id) on delete cascade;
create index if not exists activity_notes_land_lead_idx on activity_notes (land_lead_id);

-- Only the server (service role) touches these tables.
alter table land_leads       enable row level security;
alter table land_lead_images enable row level security;

-- Private photo bucket; files are shown through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('land-lead-photos', 'land-lead-photos', false)
on conflict (id) do nothing;

NOTIFY pgrst, 'reload schema';
