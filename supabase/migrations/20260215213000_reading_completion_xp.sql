-- Award XP once per chapter on first manual completion.
-- This stores idempotency at DB layer so re-completing a chapter does not re-award XP.

alter table if exists public.reading_sessions
  add column if not exists xp_awarded boolean not null default false;

alter table if exists public.reading_sessions
  add column if not exists xp_awarded_at timestamptz;

create index if not exists idx_reading_sessions_xp_awarded
  on public.reading_sessions (user_id, topic, xp_awarded);
