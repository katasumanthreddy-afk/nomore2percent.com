-- Construction costs: budget (with pricing) and expenses per project.
-- Run once in the INTERNAL Supabase project (SQL editor). Safe to re-run.
-- Needs: brands-projects-schema.sql and construction-fees-schema.sql first.

-- Budget lines: what each part of the build should cost.
-- Either a lump sum, or quantity × rate (e.g. 4,500 sq ft × ₹1,450).
create table if not exists construction_budget_lines (
  id          bigserial primary key,
  project_id  bigint not null references projects(id) on delete cascade,
  category    text not null,
  description text,
  quantity    numeric,
  unit        text,
  rate        numeric,
  amount      numeric not null check (amount >= 0),
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists construction_budget_lines_project_idx on construction_budget_lines (project_id, sort);

-- Expenses: what was actually spent, with bill photo and payment status.
create table if not exists construction_expenses (
  id             bigserial primary key,
  project_id     bigint not null references projects(id) on delete cascade,
  update_id      bigint references construction_updates(id) on delete set null,
  category       text not null,
  description    text,
  vendor         text,
  quantity       numeric,
  unit           text,
  rate           numeric,
  amount         numeric not null check (amount >= 0),
  expense_date   date not null default current_date,
  paid_by        text not null default 'landowner' check (paid_by in ('landowner', 'builder', 'us', 'brand', 'other')),
  payment_status text not null default 'paid' check (payment_status in ('paid', 'due')),
  bill_path      text,
  created_by     bigint references team_members(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists construction_expenses_project_idx on construction_expenses (project_id, expense_date desc);
create index if not exists construction_expenses_update_idx on construction_expenses (update_id);

alter table construction_budget_lines enable row level security;
alter table construction_expenses     enable row level security;

-- Explicit Data API grants (required for new tables since 30 Oct 2026).
-- Only the server (service role) reads and writes these tables.
grant select, insert, update, delete on table public.construction_budget_lines to service_role;
grant usage, select on sequence public.construction_budget_lines_id_seq to service_role;
grant select, insert, update, delete on table public.construction_expenses to service_role;
grant usage, select on sequence public.construction_expenses_id_seq to service_role;

-- Bills are stored in the existing private 'project-photos' bucket.
