-- ============================================================
-- Base tables the internal portal already uses but that may never have been
-- created (activity notes timeline, documents). Run BEFORE the other
-- internal migrations. Safe to re-run: nothing existing is changed.
-- ============================================================

create table if not exists activity_notes (
  id           bigserial primary key,
  note         text not null,
  property_id  bigint references commercial_properties(id) on delete cascade,
  deal_id      bigint,
  created_by   bigint references team_members(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists activity_notes_property_idx on activity_notes (property_id, created_at desc);
create index if not exists activity_notes_deal_idx     on activity_notes (deal_id, created_at desc);
alter table activity_notes enable row level security;

create table if not exists documents (
  id             bigserial primary key,
  title          text not null,
  storage_path   text not null,
  document_type  text not null default 'other',
  property_id    bigint references commercial_properties(id) on delete cascade,
  deal_id        bigint,
  uploaded_by    bigint references team_members(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists documents_property_idx on documents (property_id);
create index if not exists documents_deal_idx     on documents (deal_id);
alter table documents enable row level security;

insert into storage.buckets (id, name, public)
values ('internal-documents', 'internal-documents', false)
on conflict (id) do nothing;

NOTIFY pgrst, 'reload schema';
