-- Completion-feedback ratings.
-- Three tables, one per source: module read, track finished, practice set
-- completed. Each carries the operator's 1-5 rating + the contextual data
-- the admin /feedback page needs to render KPI tiles and drill-down rows.
--
-- All three are owned by the user (RLS: own insert/select); admins read
-- via the service-role client in `lib/admin/service.ts`. The unique
-- constraint per source prevents accidental duplicates and lets the writer
-- endpoint use ON CONFLICT DO UPDATE so a re-submission overwrites the
-- previous rating instead of erroring.

-- ── 1. module_feedback ─────────────────────────────────────────────────
create table if not exists public.module_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  module_id text not null,
  module_title text not null,
  module_number int not null,
  value int not null check (value between 1 and 5),
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, topic, module_id)
);

create index if not exists idx_module_feedback_topic_time
  on public.module_feedback (topic, submitted_at desc);
create index if not exists idx_module_feedback_value_time
  on public.module_feedback (value, submitted_at desc);

alter table public.module_feedback enable row level security;

drop policy if exists own_module_feedback_insert on public.module_feedback;
create policy own_module_feedback_insert
  on public.module_feedback for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists own_module_feedback_update on public.module_feedback;
create policy own_module_feedback_update
  on public.module_feedback for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists own_module_feedback_select on public.module_feedback;
create policy own_module_feedback_select
  on public.module_feedback for select to authenticated
  using (auth.uid() = user_id);

-- ── 2. track_feedback ──────────────────────────────────────────────────
create table if not exists public.track_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  track_slug text not null check (track_slug in ('junior', 'mid', 'senior')),
  track_title text not null,
  total_modules int not null,
  value int not null check (value between 1 and 5),
  comment text,
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, topic, track_slug),
  check (comment is null or char_length(comment) <= 1000)
);

create index if not exists idx_track_feedback_topic_time
  on public.track_feedback (topic, submitted_at desc);
create index if not exists idx_track_feedback_track_value
  on public.track_feedback (track_slug, value);

alter table public.track_feedback enable row level security;

drop policy if exists own_track_feedback_insert on public.track_feedback;
create policy own_track_feedback_insert
  on public.track_feedback for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists own_track_feedback_update on public.track_feedback;
create policy own_track_feedback_update
  on public.track_feedback for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists own_track_feedback_select on public.track_feedback;
create policy own_track_feedback_select
  on public.track_feedback for select to authenticated
  using (auth.uid() = user_id);

-- ── 3. practice_set_feedback ──────────────────────────────────────────
create table if not exists public.practice_set_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  module_id text not null,           -- practice set moduleId, e.g. module-PS3 or module-FND-AGGREGATIONS-JUNIOR
  set_title text not null,
  tasks_solved int not null check (tasks_solved >= 0),
  total_tasks int not null check (total_tasks >= 0),
  value int not null check (value between 1 and 5),
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, topic, module_id)
);

create index if not exists idx_practice_set_feedback_topic_time
  on public.practice_set_feedback (topic, submitted_at desc);
create index if not exists idx_practice_set_feedback_value_time
  on public.practice_set_feedback (value, submitted_at desc);

alter table public.practice_set_feedback enable row level security;

drop policy if exists own_practice_set_feedback_insert on public.practice_set_feedback;
create policy own_practice_set_feedback_insert
  on public.practice_set_feedback for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists own_practice_set_feedback_update on public.practice_set_feedback;
create policy own_practice_set_feedback_update
  on public.practice_set_feedback for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists own_practice_set_feedback_select on public.practice_set_feedback;
create policy own_practice_set_feedback_select
  on public.practice_set_feedback for select to authenticated
  using (auth.uid() = user_id);

-- ── 4. expand admin_feedback_triage source_type CHECK ──────────────────
-- The original triage table only allowed bug_report + lightbulb_feedback;
-- admins now triage module/track/practice-set ratings too.
alter table public.admin_feedback_triage
  drop constraint if exists admin_feedback_triage_source_type_check;
alter table public.admin_feedback_triage
  add constraint admin_feedback_triage_source_type_check
  check (
    source_type in (
      'bug_report',
      'lightbulb_feedback',
      'module_feedback',
      'track_feedback',
      'practice_set_feedback'
    )
  );
