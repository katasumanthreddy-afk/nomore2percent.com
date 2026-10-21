-- ============================================================
-- Land fields on internal properties + expiring / revocable scout links
-- Run in the INTERNAL Supabase project (ref jehlvcoawairegxaplfi) → SQL Editor.
-- Only adds columns to existing tables (no new tables, so no new grants needed).
-- Safe to re-run.
-- ============================================================

-- ── Land details on commercial_properties ───────────────────
alter table commercial_properties add column if not exists land_sq_yds           numeric;
alter table commercial_properties add column if not exists road_width_ft         integer;
alter table commercial_properties add column if not exists frontage_ft           integer;
alter table commercial_properties add column if not exists land_type             text;
alter table commercial_properties add column if not exists title_status          text;
alter table commercial_properties add column if not exists construction_interest text;
alter table commercial_properties add column if not exists owner_name            text;
alter table commercial_properties add column if not exists owner_phone           text;

-- Existing land rows: derive sq yds from sqft (sqft = sq yds × 9).
update commercial_properties
   set land_sq_yds = round(sqft / 9)
 where property_type = 'land' and land_sq_yds is null and sqft is not null;

-- ── Scout links: expiry + revoke ────────────────────────────
alter table external_scouts add column if not exists expires_at timestamptz;
alter table external_scouts add column if not exists revoked_at timestamptz;

-- Existing links keep working for 90 more days, then need a renew.
update external_scouts
   set expires_at = now() + interval '90 days'
 where expires_at is null and revoked_at is null;

NOTIFY pgrst, 'reload schema';
