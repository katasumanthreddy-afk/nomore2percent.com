-- ════════════════════════════════════════
-- SEPARATE INDEPENDENT HOUSE FROM VILLA
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Previously "Villa" and "Independent House" were combined into a single
-- 'villa' type across the site. This adds 'independent_house' as its own
-- distinct property type.

alter table properties drop constraint if exists properties_property_type_check;
alter table properties add constraint properties_property_type_check
  check (property_type in ('apartment', 'villa', 'independent_house', 'plot', 'commercial', 'agricultural'));

alter table property_submissions drop constraint if exists property_submissions_property_type_check;
alter table property_submissions add constraint property_submissions_property_type_check
  check (property_type in ('apartment', 'villa', 'independent_house', 'plot', 'commercial', 'agricultural'));
