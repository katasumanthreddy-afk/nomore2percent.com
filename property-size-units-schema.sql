-- ════════════════════════════════════════
-- PROPERTY SIZE UNITS — SCHEMA UPDATE
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Adds a size_unit column (sqft / sqyd / acres) and widens property_type
-- to include 'agricultural', so plots can be listed in sq. yards and
-- agricultural land in acres instead of everything defaulting to sqft.

-- Live properties table
alter table properties drop constraint if exists properties_property_type_check;
alter table properties add constraint properties_property_type_check
  check (property_type in ('apartment', 'villa', 'plot', 'commercial', 'agricultural'));
alter table properties add column if not exists size_unit text default 'sqft';
-- sqft was an integer column, which silently truncates decimal acre values
-- (e.g. "2.5 acres" -> 2). Widen it to numeric so agricultural listings keep precision.
alter table properties alter column sqft type numeric using sqft::numeric;

-- Public "List Your Property" submissions table (feeds into properties on approval)
alter table property_submissions drop constraint if exists property_submissions_property_type_check;
alter table property_submissions add constraint property_submissions_property_type_check
  check (property_type in ('apartment', 'villa', 'plot', 'commercial', 'agricultural'));
alter table property_submissions add column if not exists size_unit text default 'sqft';
alter table property_submissions alter column sqft type numeric using sqft::numeric;
