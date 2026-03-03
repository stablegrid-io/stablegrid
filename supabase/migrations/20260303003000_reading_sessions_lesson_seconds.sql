-- Persist per-lesson reading time so "read" requires dwell, not just opening a route.

alter table if exists public.reading_sessions
  add column if not exists lesson_seconds_by_id jsonb not null default '{}'::jsonb;

-- Preserve existing read/completed lessons by seeding them at the minimum read threshold.
update public.reading_sessions
set lesson_seconds_by_id = coalesce(
  (
    select jsonb_object_agg(lesson_id, 30)
    from (
      select distinct lesson_id
      from unnest(
        case
          when cardinality(coalesce(completed_lesson_ids, '{}')) > 0
            then coalesce(completed_lesson_ids, '{}')
          else coalesce(sections_ids_read, '{}')
        end
      ) as lesson_id
      where lesson_id is not null and btrim(lesson_id) <> ''
    ) seeded_lessons
  ),
  '{}'::jsonb
)
where coalesce(lesson_seconds_by_id, '{}'::jsonb) = '{}'::jsonb;
