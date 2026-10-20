-- ============================================================
-- Construction tracker + our fees, per project
-- Run in the INTERNAL Supabase project (ref jehlvcoawairegxaplfi) → SQL Editor,
-- AFTER brands-projects-schema.sql. Safe to re-run.
-- ============================================================

-- ── Construction fields on the project ──────────────────────
alter table projects add column if not exists builder_name           text;
alter table projects add column if not exists builder_phone          text;
alter table projects add column if not exists contract_value         numeric;   -- ₹ total construction contract
alter table projects add column if not exists construction_funded_by text
  check (construction_funded_by in ('landowner', 'loan', 'brand', 'mixed', 'other'));
alter table projects add column if not exists construction_start     date;
alter table projects add column if not exists construction_progress  integer not null default 0
  check (construction_progress between 0 and 100);

-- ── Dated site updates (progress + note + photos) ───────────
create table if not exists construction_updates (
  id           bigserial primary key,
  project_id   bigint not null references projects(id) on delete cascade,
  progress     integer check (progress between 0 and 100),
  note         text,
  created_by   bigint references team_members(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists construction_updates_project_idx on construction_updates (project_id, created_at desc);

create table if not exists construction_update_photos (
  id            bigserial primary key,
  update_id     bigint not null references construction_updates(id) on delete cascade,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);
create index if not exists construction_update_photos_update_idx on construction_update_photos (update_id);

-- ── Our fees ────────────────────────────────────────────────
create table if not exists project_fees (
  id               bigserial primary key,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  project_id       bigint not null references projects(id) on delete cascade,
  fee_type         text not null default 'brokerage'
                     check (fee_type in ('brokerage', 'construction_mgmt', 'permissions', 'other')),
  payer            text not null default 'landowner' check (payer in ('landowner', 'brand', 'builder', 'other')),
  basis            text not null default 'fixed' check (basis in ('fixed', 'months_rent', 'percent_contract')),
  basis_value      numeric,           -- e.g. 1 (month of rent) or 5 (% of contract)
  amount           numeric not null,  -- ₹ expected
  due_date         date,
  status           text not null default 'expected'
                     check (status in ('expected', 'invoiced', 'received', 'written_off')),
  invoice_number   text,
  invoiced_at      date,
  received_amount  numeric,
  received_at      date,
  notes            text,
  created_by       bigint references team_members(id) on delete set null
);
create index if not exists project_fees_project_idx on project_fees (project_id);
create index if not exists project_fees_status_idx  on project_fees (status, due_date);

alter table construction_updates       enable row level security;
alter table construction_update_photos enable row level security;
alter table project_fees               enable row level security;

-- Private bucket for construction progress photos (signed URLs only).
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', false)
on conflict (id) do nothing;

NOTIFY pgrst, 'reload schema';
