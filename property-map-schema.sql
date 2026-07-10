-- ════════════════════════════════════════
-- PROPERTY MAP — SCHEMA UPDATE
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Adds precise coordinates for the new map view. Nullable — properties
-- without a pin yet fall back to their locality's approximate center
-- point on the frontend, so nothing breaks for existing listings.

alter table properties add column if not exists lat numeric;
alter table properties add column if not exists lng numeric;
