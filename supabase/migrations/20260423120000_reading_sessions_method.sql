-- Persist the timer method (Sprint / Pomodoro / Deep Focus / Free Read) that
-- was active when a reading session was recorded. The /progress dashboard uses
-- this to break down completed sessions by mode instead of inferring from
-- active_seconds.
--
-- Legacy rows keep a NULL value; the dashboard falls back to duration-based
-- inference for those.

alter table public.reading_sessions
  add column if not exists session_method text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reading_sessions_session_method_check'
  ) then
    alter table public.reading_sessions
      add constraint reading_sessions_session_method_check
      check (
        session_method is null
        or session_method in ('sprint', 'pomodoro', 'deep-focus', 'free-read')
      );
  end if;
end $$;

create index if not exists idx_reading_sessions_method
  on public.reading_sessions(user_id, session_method)
  where session_method is not null;
