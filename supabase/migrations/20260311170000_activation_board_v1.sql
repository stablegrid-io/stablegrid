create extension if not exists "pgcrypto";

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.tracks(id) on delete set null,
  content_type text not null check (
    content_type in ('theory_module', 'flashcard', 'notebook', 'mission')
  ),
  source_ref text not null,
  title text not null,
  sequence_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items
drop constraint if exists content_items_content_type_source_ref_key;

alter table public.content_items
drop constraint if exists content_items_content_type_track_id_source_ref_key;

alter table public.content_items
add constraint content_items_content_type_track_id_source_ref_key
unique (content_type, track_id, source_ref);

create table if not exists public.user_activation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_type text not null check (task_type in ('theory', 'task')),
  task_group text not null check (task_group in ('theory', 'flashcards', 'notebooks', 'missions')),
  track_id uuid references public.tracks(id) on delete set null,
  title text not null,
  description text not null,
  scope_type text not null check (scope_type in ('count', 'all_remaining')),
  requested_count integer check (requested_count between 1 and 3),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_activation_task_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activation_task_id uuid not null references public.user_activation_tasks(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  item_status text not null default 'todo' check (item_status in ('todo', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (activation_task_id, content_item_id)
);

create index if not exists idx_content_items_type_track_order
  on public.content_items(content_type, track_id, sequence_order);

create index if not exists idx_user_activation_tasks_user_status
  on public.user_activation_tasks(user_id, status);

create index if not exists idx_user_activation_task_items_task
  on public.user_activation_task_items(activation_task_id);

create index if not exists idx_user_activation_task_items_content
  on public.user_activation_task_items(content_item_id);

create index if not exists idx_user_activation_task_items_user_status
  on public.user_activation_task_items(user_id, item_status);

create or replace function public.set_activation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_tracks_updated_at on public.tracks;
create trigger trg_tracks_updated_at
before update on public.tracks
for each row
execute function public.set_activation_updated_at();

drop trigger if exists trg_content_items_updated_at on public.content_items;
create trigger trg_content_items_updated_at
before update on public.content_items
for each row
execute function public.set_activation_updated_at();

drop trigger if exists trg_user_activation_tasks_updated_at on public.user_activation_tasks;
create trigger trg_user_activation_tasks_updated_at
before update on public.user_activation_tasks
for each row
execute function public.set_activation_updated_at();

drop trigger if exists trg_user_activation_task_items_updated_at on public.user_activation_task_items;
create trigger trg_user_activation_task_items_updated_at
before update on public.user_activation_task_items
for each row
execute function public.set_activation_updated_at();

insert into public.tracks (slug, title, is_active)
values
  ('pyspark', 'PySpark', true),
  ('fabric', 'Microsoft Fabric', true),
  ('global', 'Global', true)
on conflict (slug)
do update set
  title = excluded.title,
  is_active = excluded.is_active,
  updated_at = now();

with seed(content_type, track_slug, source_ref, title, sequence_order, is_active) as (
values
  ('theory_module', 'pyspark', 'module-01', 'Module 1: The Dawn of PySpark', 1, true),
  ('theory_module', 'pyspark', 'module-02', 'Module 2: Up and Running', 2, true),
  ('theory_module', 'pyspark', 'module-03', 'Module 3: Inside the Engine', 3, true),
  ('theory_module', 'pyspark', 'module-04', 'Module 4: Performance Tuning', 4, true),
  ('theory_module', 'pyspark', 'module-05', 'Module 5: Advanced Joins & The Art of Distributed Relationships', 5, true),
  ('theory_module', 'pyspark', 'module-06', 'Module 6: Spark SQL', 6, true),
  ('theory_module', 'pyspark', 'module-07', 'Module 7: Data Cleaning & Transformation Patterns at Scale', 7, true),
  ('theory_module', 'pyspark', 'module-08', 'Module 8: Complex Data Types', 8, true),
  ('theory_module', 'pyspark', 'module-09', 'Module 9: User-Defined Functions', 9, true),
  ('theory_module', 'pyspark', 'module-10', 'Module 10: Spark Structured Streaming', 10, true),
  ('theory_module', 'pyspark', 'module-11', 'Module 11: Delta Lake & the Data Lakehouse', 11, true),
  ('theory_module', 'pyspark', 'module-12', 'Module 12: Testing, Data Quality & Observability', 12, true),
  ('theory_module', 'pyspark', 'module-13', 'Module 13: Production Deployment & Orchestration', 13, true),
  ('theory_module', 'pyspark', 'module-14', 'Module 14: Security, Governance & Access Control', 14, true),
  ('theory_module', 'pyspark', 'module-15', 'Module 15: Window Functions Deep Dive', 15, true),
  ('theory_module', 'pyspark', 'module-16', 'Module 16: Advanced Performance Engineering', 16, true),
  ('theory_module', 'pyspark', 'module-17', 'Module 17: Data Modeling for the Lakehouse', 17, true),
  ('theory_module', 'pyspark', 'module-18', 'Module 18: The pandas API on Spark', 18, true),
  ('theory_module', 'pyspark', 'module-19', 'Module 19: End-to-End Capstone', 19, true),
  ('theory_module', 'pyspark', 'module-20', 'Module 20: Career, Interviews, and What Comes Next', 20, true),
  ('theory_module', 'fabric', 'module-01', 'Module 1: Platform Foundations & Architecture', 1, true),
  ('theory_module', 'fabric', 'module-02', 'Module 2: OneLake — The Storage Foundation', 2, true),
  ('theory_module', 'fabric', 'module-03', 'Module 3: Lakehouse Fundamentals', 3, true),
  ('theory_module', 'fabric', 'module-04', 'Module 4: Data Factory — Pipelines', 4, true),
  ('theory_module', 'fabric', 'module-05', 'Module 5: Dataflows Gen2 — Power Query Online', 5, true),
  ('theory_module', 'fabric', 'module-06', 'Module 6: Spark Engine, Notebooks, and Environments', 6, true),
  ('theory_module', 'fabric', 'module-07', 'Module 7: PySpark Transformations Deep Dive', 7, true),
  ('theory_module', 'fabric', 'module-08', 'Module 8: Spark SQL and Advanced SQL Patterns', 8, true),
  ('theory_module', 'fabric', 'module-09', 'Module 9: Data Warehouse — T-SQL Analytics Engine', 9, true),
  ('theory_module', 'fabric', 'module-10', 'Module 10: T-SQL Analytics in Fabric', 10, true),
  ('theory_module', 'fabric', 'module-11', 'Module 11: SQL Database in Fabric', 11, true),
  ('theory_module', 'fabric', 'module-12', 'Module 12: Real-Time Intelligence — Eventhouse & KQL', 12, true),
  ('theory_module', 'fabric', 'module-13', 'Module 13: Real-Time Intelligence — Eventstreams & Activator', 13, true),
  ('theory_module', 'fabric', 'module-14', 'Module 14: Power BI — Semantic Models & DAX', 14, true),
  ('theory_module', 'fabric', 'module-15', 'Module 15: Power BI — Reports, Dashboards & Distribution', 15, true),
  ('theory_module', 'fabric', 'module-16', 'Module 16: Data Science & Machine Learning in Fabric', 16, true),
  ('theory_module', 'fabric', 'module-17', 'Module 17: Medallion Architecture & Data Modeling', 17, true),
  ('theory_module', 'fabric', 'module-18', 'Module 18: Security, Governance & Microsoft Purview', 18, true),
  ('theory_module', 'fabric', 'module-19', 'Module 19: Administration, Capacity & DevOps', 19, true),
  ('theory_module', 'fabric', 'module-20', 'Module 20: Capstone — End-to-End Data Platform Project', 20, true),
  ('flashcard', 'pyspark', 'pyspark-m01-001', 'Why did vertical scaling stop being a reliable answer for big-data workloads?', 1, true),
  ('flashcard', 'pyspark', 'pyspark-m01-002', 'Why is veracity especially important in a smart-grid data platform?', 2, true),
  ('flashcard', 'pyspark', 'pyspark-m01-003', 'What made Spark fundamentally faster than classic MapReduce for iterative analytics?', 3, true),
  ('flashcard', 'pyspark', 'pyspark-m02-001', 'What is the main role of `SparkSession` in a PySpark application?', 4, true),
  ('flashcard', 'pyspark', 'pyspark-m02-002', 'What is the biggest risk of calling `collect()` on a very large dataset?', 5, true),
  ('flashcard', 'pyspark', 'pyspark-m02-003', 'When reducing the number of output partitions before a write, which operation is usually cheaper?', 6, true),
  ('flashcard', 'pyspark', 'pyspark-m03-001', 'In which Catalyst phase are rules like predicate pushdown and projection pruning applied?', 7, true),
  ('flashcard', 'pyspark', 'pyspark-m03-002', 'What usually creates a new stage in Spark execution?', 8, true),
  ('flashcard', 'pyspark', 'pyspark-m03-003', 'If a stage has 500 partitions, how many tasks will Spark generally create for that stage?', 9, true),
  ('flashcard', 'pyspark', 'pyspark-m04-001', 'Which Spark UI metrics most directly reveal spill pressure?', 10, true),
  ('flashcard', 'pyspark', 'pyspark-m04-002', 'For a 1 TB fact table joined to a 5 MB dimension table, what is usually the best first optimization to try?', 11, true),
  ('flashcard', 'pyspark', 'pyspark-m04-003', 'What is the goal of salting a skewed join key?', 12, true),
  ('flashcard', 'pyspark', 'pyspark-m05-001', 'Which join type should you use to find rows from the left dataset that have no match on the right?', 13, true),
  ('flashcard', 'pyspark', 'pyspark-m05-002', 'Why are window functions often preferable to self-joins for tasks like ranking and lagging within groups?', 14, true),
  ('flashcard', 'pyspark', 'pyspark-m05-003', 'When is a broadcast hash join a strong candidate?', 15, true),
  ('flashcard', 'pyspark', 'pyspark-m06-001', 'What is the scope of `createOrReplaceTempView()`?', 16, true),
  ('flashcard', 'pyspark', 'pyspark-m06-002', 'What does `spark.sql(...)` return?', 17, true),
  ('flashcard', 'pyspark', 'pyspark-m06-003', 'What is the key architectural relationship between Spark SQL and the DataFrame API?', 18, true),
  ('flashcard', 'pyspark', 'pyspark-m07-001', 'In the medallion architecture, which layer should contain cleaned, standardized, analytics-ready base records?', 19, true),
  ('flashcard', 'pyspark', 'pyspark-m07-002', 'What is a common distributed pattern for deterministic deduplication when you want to keep the latest record per business key?', 20, true),
  ('flashcard', 'pyspark', 'pyspark-m07-003', 'What should a quality gate do when a transformed dataset fails critical validation rules?', 21, true),
  ('flashcard', 'pyspark', 'pyspark-m08-001', 'What does `explode()` do to an array column?', 22, true),
  ('flashcard', 'pyspark', 'pyspark-m08-002', 'What is a Spark `struct` best understood as?', 23, true),
  ('flashcard', 'pyspark', 'pyspark-m08-003', 'What is a major risk when exploding nested collections too early in a pipeline?', 24, true),
  ('flashcard', 'pyspark', 'pyspark-m09-001', 'Why should you prefer built-in Spark functions over Python UDFs when possible?', 25, true),
  ('flashcard', 'pyspark', 'pyspark-m09-002', 'What is the main benefit of a pandas UDF compared with a row-at-a-time Python UDF?', 26, true),
  ('flashcard', 'pyspark', 'pyspark-m09-003', 'When is a grouped map UDF justified?', 27, true),
  ('flashcard', 'pyspark', 'pyspark-m10-001', 'What makes a dataset “unbounded” in Structured Streaming?', 28, true),
  ('flashcard', 'pyspark', 'pyspark-m10-002', 'Why is a checkpoint location essential in Structured Streaming?', 29, true),
  ('flashcard', 'pyspark', 'pyspark-m10-003', 'When is append mode a good fit for a streaming sink?', 30, true),
  ('flashcard', 'pyspark', 'pyspark-m11-001', 'What does Delta Lake add on top of a regular data lake?', 31, true),
  ('flashcard', 'pyspark', 'pyspark-m11-002', 'Which Delta Lake command pattern is commonly used for upserts?', 32, true),
  ('flashcard', 'pyspark', 'pyspark-m11-003', 'What does Delta Lake time travel allow you to do?', 33, true),
  ('flashcard', 'pyspark', 'pyspark-m12-001', 'What is the purpose of a unit test in a data pipeline codebase?', 34, true),
  ('flashcard', 'pyspark', 'pyspark-m12-002', 'What does an integration test usually add beyond unit tests in a Spark project?', 35, true),
  ('flashcard', 'pyspark', 'pyspark-m12-003', 'What does observability give you that a one-time test suite cannot?', 36, true),
  ('flashcard', 'pyspark', 'pyspark-m13-001', 'In `spark-submit --deploy-mode cluster`, where does the driver run?', 37, true),
  ('flashcard', 'pyspark', 'pyspark-m13-002', 'What is an Airflow DAG primarily used to model?', 38, true),
  ('flashcard', 'pyspark', 'pyspark-m13-003', 'Why package a PySpark project as a wheel or zip for `--py-files`?', 39, true),
  ('flashcard', 'pyspark', 'pyspark-m14-001', 'What does the principle of least privilege mean in a data platform?', 40, true),
  ('flashcard', 'pyspark', 'pyspark-m14-002', 'Which control is most appropriate when analysts need a dataset but should not see raw PII values?', 41, true),
  ('flashcard', 'pyspark', 'pyspark-m14-003', 'Why is lineage especially valuable before making a breaking schema change?', 42, true),
  ('flashcard', 'pyspark', 'pyspark-m15-001', 'What does `partitionBy(...)` do in a window specification?', 43, true),
  ('flashcard', 'pyspark', 'pyspark-m15-002', 'How does `dense_rank()` differ from `rank()` when there are ties?', 44, true),
  ('flashcard', 'pyspark', 'pyspark-m15-003', 'Which window function is the most direct way to compare a row with the previous row in the same ordered group?', 45, true),
  ('flashcard', 'pyspark', 'pyspark-m16-001', 'What is one of Adaptive Query Execution’s main benefits?', 46, true),
  ('flashcard', 'pyspark', 'pyspark-m16-002', 'What does a long tail of one or two very slow tasks usually suggest?', 47, true),
  ('flashcard', 'pyspark', 'pyspark-m16-003', 'When is caching a DataFrame most justified?', 48, true),
  ('flashcard', 'pyspark', 'pyspark-m17-001', 'In dimensional modeling, what does a fact table primarily store?', 49, true),
  ('flashcard', 'pyspark', 'pyspark-m17-002', 'What is the defining property of an SCD Type 2 dimension?', 50, true),
  ('flashcard', 'pyspark', 'pyspark-m17-003', 'Where do dimensional models most naturally belong in a medallion-style lakehouse?', 51, true),
  ('flashcard', 'pyspark', 'pyspark-m18-001', 'What is the pandas API on Spark designed to provide?', 52, true),
  ('flashcard', 'pyspark', 'pyspark-m18-002', 'What is the main danger of calling `to_pandas()` on a large distributed DataFrame?', 53, true),
  ('flashcard', 'pyspark', 'pyspark-m18-003', 'When is the pandas API on Spark a particularly good fit?', 54, true),
  ('flashcard', 'pyspark', 'pyspark-m19-001', 'What is the standard medallion flow for moving data toward business use?', 55, true),
  ('flashcard', 'pyspark', 'pyspark-m19-002', 'Which Spark capability is the natural fit for near-real-time anomaly detection in a capstone data platform?', 56, true),
  ('flashcard', 'pyspark', 'pyspark-m19-003', 'Which capstone design best signals senior data-engineering judgment?', 57, true),
  ('flashcard', 'pyspark', 'pyspark-m20-001', 'What makes a performance-improvement story stronger in an interview?', 58, true),
  ('flashcard', 'pyspark', 'pyspark-m20-002', 'What should a strong data-platform system-design answer usually cover?', 59, true),
  ('flashcard', 'pyspark', 'pyspark-m20-003', 'Which portfolio project is most likely to convince a hiring manager that you understand distributed data engineering?', 60, true),
  ('notebook', 'fabric', 'nb-001', 'Outage Incident Root Cause Analysis', 1, true),
  ('notebook', 'fabric', 'nb-002', 'Solar Farm Generation Forecast ETL', 2, true),
  ('notebook', 'fabric', 'nb-003', 'Wind Turbine Anomaly Detection Pipeline', 3, true),
  ('mission', 'global', 'blackout-berlin', 'BLACKOUT BERLIN', 1, true),
  ('mission', 'global', 'solar-surge', 'SOLAR SURGE', 2, true),
  ('mission', 'global', 'battery-arbitrage-texas', 'BATTERY ARBITRAGE', 3, true),
  ('mission', 'global', 'data-tsunami-tokyo', 'DATA TSUNAMI', 4, true),
  ('mission', 'global', 'wind-drought', 'WIND DROUGHT', 5, true),
  ('mission', 'global', 'missing-megawatts', 'MISSING MEGAWATTS', 6, true),
  ('mission', 'global', 'winter-demand-shock', 'WINTER DEMAND SHOCK', 7, true),
  ('mission', 'global', 'ghost-regulator', 'GHOST REGULATOR', 8, true)
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
  track_id = excluded.track_id,
  title = excluded.title,
  sequence_order = excluded.sequence_order,
  is_active = excluded.is_active,
  updated_at = now();

alter table public.tracks enable row level security;
alter table public.content_items enable row level security;
alter table public.user_activation_tasks enable row level security;
alter table public.user_activation_task_items enable row level security;

drop policy if exists read_tracks_authenticated on public.tracks;
create policy read_tracks_authenticated
on public.tracks
for select
using (auth.role() = 'authenticated');

drop policy if exists read_content_items_authenticated on public.content_items;
create policy read_content_items_authenticated
on public.content_items
for select
using (auth.role() = 'authenticated');

drop policy if exists own_user_activation_tasks_select on public.user_activation_tasks;
create policy own_user_activation_tasks_select
on public.user_activation_tasks
for select
using (auth.uid() = user_id);

drop policy if exists own_user_activation_tasks_insert on public.user_activation_tasks;
create policy own_user_activation_tasks_insert
on public.user_activation_tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists own_user_activation_tasks_update on public.user_activation_tasks;
create policy own_user_activation_tasks_update
on public.user_activation_tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_user_activation_tasks_delete on public.user_activation_tasks;
create policy own_user_activation_tasks_delete
on public.user_activation_tasks
for delete
using (auth.uid() = user_id);

drop policy if exists own_user_activation_task_items_select on public.user_activation_task_items;
create policy own_user_activation_task_items_select
on public.user_activation_task_items
for select
using (auth.uid() = user_id);

drop policy if exists own_user_activation_task_items_insert on public.user_activation_task_items;
create policy own_user_activation_task_items_insert
on public.user_activation_task_items
for insert
with check (auth.uid() = user_id);

drop policy if exists own_user_activation_task_items_update on public.user_activation_task_items;
create policy own_user_activation_task_items_update
on public.user_activation_task_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_user_activation_task_items_delete on public.user_activation_task_items;
create policy own_user_activation_task_items_delete
on public.user_activation_task_items
for delete
using (auth.uid() = user_id);
