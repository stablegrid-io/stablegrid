-- Completion tracking hardening:
-- Keep topic_progress theory metrics in sync from reading_sessions
-- even if client updates fail or are skipped.

create extension if not exists "pgcrypto";

-- Manual completion marker (used by UI "I have read this chapter" button).
alter table if exists public.reading_sessions
  add column if not exists completed_by_user boolean not null default false;

-- Backfill existing completed rows.
update public.reading_sessions
set completed_by_user = true
where is_completed = true
  and completed_by_user = false;

create or replace function public.recompute_topic_progress_from_reading(
  p_user_id uuid,
  p_topic text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chapters_completed integer := 0;
  v_sections_total integer := 0;
  v_sections_read integer := 0;
  v_total_minutes integer := 0;
  v_first_activity timestamptz := null;
  v_last_activity timestamptz := null;
begin
  select
    count(*) filter (where is_completed),
    coalesce(sum(sections_total), 0),
    coalesce(sum(sections_read), 0),
    coalesce(round(sum(active_seconds) / 60.0), 0)::integer,
    min(started_at),
    max(last_active_at)
  into
    v_chapters_completed,
    v_sections_total,
    v_sections_read,
    v_total_minutes,
    v_first_activity,
    v_last_activity
  from public.reading_sessions
  where user_id = p_user_id
    and topic = p_topic;

  insert into public.topic_progress (
    user_id,
    topic,
    theory_chapters_completed,
    theory_sections_total,
    theory_sections_read,
    theory_total_minutes_read,
    first_activity_at,
    last_activity_at,
    updated_at
  )
  values (
    p_user_id,
    p_topic,
    v_chapters_completed,
    v_sections_total,
    v_sections_read,
    v_total_minutes,
    v_first_activity,
    v_last_activity,
    now()
  )
  on conflict (user_id, topic)
  do update set
    theory_chapters_completed = excluded.theory_chapters_completed,
    theory_sections_total = excluded.theory_sections_total,
    theory_sections_read = excluded.theory_sections_read,
    theory_total_minutes_read = excluded.theory_total_minutes_read,
    first_activity_at = coalesce(public.topic_progress.first_activity_at, excluded.first_activity_at),
    last_activity_at = excluded.last_activity_at,
    updated_at = now();
end;
$$;

create or replace function public.on_reading_sessions_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_topic_progress_from_reading(old.user_id, old.topic);
    return old;
  end if;

  perform public.recompute_topic_progress_from_reading(new.user_id, new.topic);
  return new;
end;
$$;

drop trigger if exists trg_reading_sessions_changed on public.reading_sessions;
create trigger trg_reading_sessions_changed
after insert or update or delete
on public.reading_sessions
for each row
execute function public.on_reading_sessions_changed();

-- Helpful index for completion queries.
create index if not exists idx_reading_sessions_user_topic_completed
  on public.reading_sessions (user_id, topic, is_completed);
