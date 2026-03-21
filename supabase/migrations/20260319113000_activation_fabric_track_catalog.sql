insert into public.tracks (slug, title, is_active)
values
  ('fabric-data-engineering-track', 'Fabric: Data Engineering Track', true),
  ('fabric-business-intelligence-track', 'Fabric: Business Intelligence Track', true)
on conflict (slug)
do update set
  title = excluded.title,
  is_active = excluded.is_active,
  updated_at = now();

with seed(content_type, track_slug, source_ref, title, sequence_order, is_active) as (
values
  ('theory_module', 'fabric-data-engineering-track', 'module-F1', 'Platform Foundations & Architecture', 1, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-F2', 'OneLake Storage Foundation', 2, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-DW1', 'Lakehouse with SQL Focus', 3, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-DW2', 'Data Warehouse', 4, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-DW3', 'T-SQL Analytics', 5, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-DW4', 'SQL Database', 6, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-DW5', 'Medallion Architecture', 7, true),
  ('theory_module', 'fabric-data-engineering-track', 'module-DW6', 'Pipelines with SQL', 8, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI1', 'Lakehouse & Warehouse for BI', 1, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI2', 'Semantic Models & DirectLake', 2, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI3', 'DAX Deep Dive', 3, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI4', 'Reports & Dashboards', 4, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI5', 'Distribution & Apps', 5, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI6', 'Row-Level Security & Governance', 6, true),
  ('theory_module', 'fabric-business-intelligence-track', 'module-BI7', 'Capstone Project', 7, true)
)
insert into public.content_items (
  content_type,
  track_id,
  source_ref,
  title,
  sequence_order,
  is_active
)
select
  seed.content_type,
  tracks.id,
  seed.source_ref,
  seed.title,
  seed.sequence_order,
  seed.is_active
from seed
join public.tracks on tracks.slug = seed.track_slug
on conflict (content_type, track_id, source_ref)
do update set
  title = excluded.title,
  sequence_order = excluded.sequence_order,
  is_active = excluded.is_active,
  updated_at = now();
