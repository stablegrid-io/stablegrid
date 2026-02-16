-- Reading sessions and completion tracking
-- Generated for DataGridLab progress redesign

create extension if not exists "pgcrypto";

-- One active reading session per chapter/topic/user.
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  chapter_id text not null,
  chapter_number integer not null,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  completed_at timestamptz,
  sections_total integer not null default 0,
  sections_read integer not null default 0,
  sections_ids_read text[] not null default '{}',
  active_seconds integer not null default 0,
  is_completed boolean not null default false,
  unique (user_id, topic, chapter_id)
);

-- Denormalized per-topic progress summary.
create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  theory_chapters_total integer not null default 0,
  theory_chapters_completed integer not null default 0,
  theory_sections_total integer not null default 0,
  theory_sections_read integer not null default 0,
  theory_total_minutes_read integer not null default 0,
  practice_questions_total integer not null default 0,
  practice_questions_attempted integer not null default 0,
  practice_questions_correct integer not null default 0,
  functions_total integer not null default 0,
  functions_viewed integer not null default 0,
  functions_bookmarked integer not null default 0,
  overall_completion_pct numeric(5, 2) not null default 0,
  first_activity_at timestamptz,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, topic)
);

-- Function interactions in reference view.
create table if not exists public.function_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  function_id text not null,
  first_viewed_at timestamptz not null default now(),
  view_count integer not null default 1,
  is_bookmarked boolean not null default false,
  unique (user_id, topic, function_id)
);

alter table public.reading_sessions enable row level security;
alter table public.topic_progress enable row level security;
alter table public.function_views enable row level security;

drop policy if exists own_reading_sessions on public.reading_sessions;
create policy own_reading_sessions on public.reading_sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists own_topic_progress on public.topic_progress;
create policy own_topic_progress on public.topic_progress
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists own_function_views on public.function_views;
create policy own_function_views on public.function_views
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_reading_sessions_user_topic
  on public.reading_sessions(user_id, topic);
create index if not exists idx_reading_sessions_completed
  on public.reading_sessions(user_id, is_completed);
create index if not exists idx_topic_progress_user
  on public.topic_progress(user_id);
create index if not exists idx_function_views_user_topic
  on public.function_views(user_id, topic);
