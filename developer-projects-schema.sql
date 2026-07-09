-- ════════════════════════════════════════
-- DEVELOPER PROJECTS — SCHEMA
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Backs the admin "Add Developer Project" screen and the public
-- /projects (New Projects) showcase — kept separate from the `properties`
-- table since a single project (e.g. "Prestige High Fields") contains
-- multiple unit types and configurations, not one sellable unit.

create table if not exists developer_projects (
  id bigint generated always as identity primary key,

  project_name text not null,
  developer_name text not null,
  project_type text default 'apartment' check (project_type in ('apartment', 'villa', 'plot', 'commercial', 'mixed')),

  area text not null,
  address text,
  description text,

  price_range text,              -- display text, e.g. "₹85L - ₹1.2 Cr"
  starting_price_num numeric,    -- numeric anchor for sorting/filtering ("starting from")

  possession_date text,          -- free text, e.g. "Dec 2027" or "Ready to Move"
  rera_number text,
  total_units int,
  land_area text,                -- free text, e.g. "5.2 acres"

  unit_types text[],             -- e.g. ['2 BHK', '3 BHK', '4 BHK']
  amenities text[],

  status text default 'under_construction' check (status in ('upcoming', 'under_construction', 'ready_to_move')),
  featured boolean default false,
  is_active boolean default true, -- soft hide/unpublish without deleting

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists developer_project_images (
  id bigint generated always as identity primary key,
  project_id bigint references developer_projects(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_developer_projects_active on developer_projects(is_active);
create index if not exists idx_developer_projects_featured on developer_projects(featured);
create index if not exists idx_project_images_project on developer_project_images(project_id);

-- RLS: service role (admin routes) bypasses this; public reads go through
-- /api/developer-projects which filters to is_active = true server-side.
alter table developer_projects enable row level security;
alter table developer_project_images enable row level security;
