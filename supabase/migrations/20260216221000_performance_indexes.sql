-- Performance indexes for high-traffic reads
-- Safe to run multiple times (IF NOT EXISTS)

create index if not exists idx_reading_sessions_user_last_active_at
  on public.reading_sessions (user_id, last_active_at desc);

create index if not exists idx_reading_sessions_user_started_at
  on public.reading_sessions (user_id, started_at desc);

create index if not exists idx_topic_progress_user_updated_at
  on public.topic_progress (user_id, updated_at desc);

create index if not exists idx_user_missions_user_completed_at
  on public.user_missions (user_id, completed_at desc);

create index if not exists idx_function_views_user_topic_bookmarked
  on public.function_views (user_id, topic, is_bookmarked);
