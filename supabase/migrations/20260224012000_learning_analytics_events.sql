-- Lesson/module analytics event stream for theory learning flow and drop-off reporting.

create extension if not exists "pgcrypto";

create table if not exists public.learning_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  event_type text not null
    check (
      event_type in ('lesson_opened', 'lesson_completed', 'module_completed', 'resume_used')
    ),
  module_id text not null,
  module_order integer not null,
  lesson_id text,
  lesson_order integer,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.learning_analytics_events enable row level security;

drop policy if exists own_learning_analytics_events on public.learning_analytics_events;
create policy own_learning_analytics_events on public.learning_analytics_events
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_learning_analytics_user_topic_time
  on public.learning_analytics_events (user_id, topic, occurred_at desc);

create index if not exists idx_learning_analytics_user_topic_module
  on public.learning_analytics_events (user_id, topic, module_id, module_order);

create index if not exists idx_learning_analytics_user_topic_event
  on public.learning_analytics_events (user_id, topic, event_type, occurred_at desc);
