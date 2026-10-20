-- ============================================================
-- Brands (demand side) + Projects (landowner + brand + site pipeline)
-- Run in the INTERNAL Supabase project (ref jehlvcoawairegxaplfi) → SQL Editor,
-- AFTER land-leads-schema.sql. Safe to re-run.
-- ============================================================

-- ── Brands ──────────────────────────────────────────────────
create table if not exists brands (
  id                   bigserial primary key,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  name                 text not null,
  category             text not null default 'quick_commerce'
                         check (category in ('quick_commerce', 'logistics', 'ecommerce', 'retail', 'other')),
  status               text not null default 'active' check (status in ('active', 'paused', 'prospect')),
  contact_name         text,
  contact_role         text,
  contact_phone        text,
  contact_email        text,
  notes                text,

  -- Default site spec for this brand's format (a requirement can override any of it)
  min_land_sq_yds      numeric,
  min_builtup_sqft     numeric,
  max_builtup_sqft     numeric,
  min_road_width_ft    integer,
  min_frontage_ft      integer,
  min_ceiling_ft       numeric,
  power_kva            numeric,
  rent_min_per_sqft    numeric,   -- ₹ per sq ft per month the brand pays
  rent_max_per_sqft    numeric,
  lease_years          integer,
  spec_notes           text,

  created_by           bigint references team_members(id) on delete set null
);
create unique index if not exists brands_name_uniq on brands (lower(name));

-- ── Site requirements → brand + per-site spec overrides ─────
alter table site_requirements add column if not exists brand_id          bigint references brands(id) on delete set null;
alter table site_requirements add column if not exists min_land_sq_yds   numeric;
alter table site_requirements add column if not exists min_builtup_sqft  numeric;
alter table site_requirements add column if not exists min_road_width_ft integer;
alter table site_requirements add column if not exists rent_max_per_sqft numeric;
alter table site_requirements add column if not exists priority          text default 'normal';
alter table site_requirements add column if not exists target_date       date;
create index if not exists site_requirements_brand_idx on site_requirements (brand_id);

-- ── Projects ────────────────────────────────────────────────
create table if not exists projects (
  id                     bigserial primary key,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  name                   text not null,
  brand_id               bigint references brands(id) on delete set null,
  requirement_id         bigint references site_requirements(id) on delete set null,
  property_id            bigint references commercial_properties(id) on delete set null,
  land_lead_id           bigint references land_leads(id) on delete set null,

  landowner_name         text,
  landowner_phone        text,
  locality               text,
  land_sq_yds            numeric,
  builtup_sqft           numeric,
  rent_per_sqft          numeric,         -- agreed / proposed ₹ per sq ft per month
  lease_years            integer,
  target_handover        date,

  stage                  text not null default 'brand_interested'
                           check (stage in ('brand_interested', 'site_approved', 'term_sheet', 'construction_contract',
                                            'permissions', 'construction', 'handover', 'lease_registered', 'rent_started', 'dropped')),
  stage_changed_at       timestamptz not null default now(),
  dropped_reason         text,
  assigned_to            bigint references team_members(id) on delete set null,
  notes                  text,
  created_by             bigint references team_members(id) on delete set null
);
create index if not exists projects_stage_idx on projects (stage, stage_changed_at);
create index if not exists projects_brand_idx on projects (brand_id);

create table if not exists project_checklist_items (
  id           bigserial primary key,
  project_id   bigint not null references projects(id) on delete cascade,
  stage        text not null,
  label        text not null,
  sort         integer not null default 0,
  done         boolean not null default false,
  done_at      timestamptz,
  done_by      bigint references team_members(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists project_checklist_project_idx on project_checklist_items (project_id, stage, sort);

-- Notes and documents on a project reuse the existing tables.
alter table activity_notes add column if not exists project_id bigint references projects(id) on delete cascade;
create index if not exists activity_notes_project_idx on activity_notes (project_id);
alter table documents add column if not exists project_id bigint references projects(id) on delete cascade;
create index if not exists documents_project_idx on documents (project_id);

alter table brands                  enable row level security;
alter table projects                enable row level security;
alter table project_checklist_items enable row level security;

NOTIFY pgrst, 'reload schema';
