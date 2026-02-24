-- Canonical module-level progress and unlock chain persistence.

create extension if not exists "pgcrypto";

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  module_id text not null,
  module_order integer not null,
  is_unlocked boolean not null default false,
  is_completed boolean not null default false,
  current_lesson_id text,
  last_visited_route text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic, module_id)
);

alter table public.module_progress enable row level security;

drop policy if exists own_module_progress on public.module_progress;
create policy own_module_progress on public.module_progress
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_module_progress_user_topic
  on public.module_progress (user_id, topic);
create index if not exists idx_module_progress_user_topic_order
  on public.module_progress (user_id, topic, module_order);

-- Backfill from existing reading_sessions completion data.
insert into public.module_progress (
  user_id,
  topic,
  module_id,
  module_order,
  is_unlocked,
  is_completed,
  current_lesson_id,
  last_visited_route,
  completed_at,
  created_at,
  updated_at
)
select
  rs.user_id,
  rs.topic,
  rs.chapter_id as module_id,
  max(rs.chapter_number) as module_order,
  bool_or(rs.is_completed) as is_unlocked,
  bool_or(rs.is_completed) as is_completed,
  max(rs.current_lesson_id) filter (where rs.current_lesson_id is not null) as current_lesson_id,
  max(rs.last_visited_route) filter (where rs.last_visited_route is not null) as last_visited_route,
  max(rs.completed_at) as completed_at,
  min(rs.started_at) as created_at,
  max(rs.last_active_at) as updated_at
from public.reading_sessions rs
group by rs.user_id, rs.topic, rs.chapter_id
on conflict (user_id, topic, module_id)
do update set
  module_order = excluded.module_order,
  is_unlocked = excluded.is_unlocked,
  is_completed = excluded.is_completed,
  current_lesson_id = coalesce(excluded.current_lesson_id, public.module_progress.current_lesson_id),
  last_visited_route = coalesce(excluded.last_visited_route, public.module_progress.last_visited_route),
  completed_at = coalesce(excluded.completed_at, public.module_progress.completed_at),
  updated_at = greatest(public.module_progress.updated_at, excluded.updated_at);
