-- Lesson-level progress + resume route persistence for theory modules.

alter table if exists public.reading_sessions
  add column if not exists current_lesson_id text,
  add column if not exists completed_lesson_ids text[] not null default '{}',
  add column if not exists last_visited_route text;

-- Backfill completed lessons from existing sections_ids_read data.
update public.reading_sessions
set completed_lesson_ids = coalesce(array_remove(sections_ids_read, null), '{}')
where cardinality(coalesce(completed_lesson_ids, '{}')) = 0
  and cardinality(coalesce(sections_ids_read, '{}')) > 0;

-- Backfill current lesson from the most recently tracked completed lesson.
update public.reading_sessions
set current_lesson_id = coalesce(
  current_lesson_id,
  (
    select lesson_id
    from unnest(coalesce(completed_lesson_ids, '{}')) with ordinality as lesson(lesson_id, idx)
    order by idx desc
    limit 1
  )
)
where current_lesson_id is null;

create index if not exists idx_reading_sessions_user_topic_last_active
  on public.reading_sessions (user_id, topic, last_active_at desc);
