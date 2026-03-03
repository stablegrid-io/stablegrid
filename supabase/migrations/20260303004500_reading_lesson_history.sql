-- Durable lesson-read history so progress views can show actual read milestones over time.

create table if not exists public.reading_lesson_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  chapter_id text not null,
  chapter_number integer not null,
  lesson_id text not null,
  lesson_order integer not null default 1,
  read_at timestamptz not null default now(),
  source_session_id uuid references public.reading_sessions(id) on delete set null,
  unique (user_id, topic, chapter_id, lesson_id)
);

alter table public.reading_lesson_history enable row level security;

drop policy if exists own_reading_lesson_history on public.reading_lesson_history;
create policy own_reading_lesson_history on public.reading_lesson_history
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_reading_lesson_history_user_read_at
  on public.reading_lesson_history (user_id, read_at desc);

create index if not exists idx_reading_lesson_history_user_topic
  on public.reading_lesson_history (user_id, topic, chapter_id);

insert into public.reading_lesson_history (
  user_id,
  topic,
  chapter_id,
  chapter_number,
  lesson_id,
  lesson_order,
  read_at,
  source_session_id
)
select
  rs.user_id,
  rs.topic,
  rs.chapter_id,
  rs.chapter_number,
  lesson.lesson_id,
  lesson.lesson_order,
  coalesce(rs.completed_at, rs.last_active_at, rs.started_at, now()),
  rs.id
from public.reading_sessions rs
cross join lateral (
  select
    lesson_id,
    min(lesson_order) as lesson_order
  from (
    select
      lesson.lesson_id,
      lesson.idx as lesson_order
    from unnest(
      case
        when cardinality(coalesce(rs.completed_lesson_ids, '{}')) > 0
          then coalesce(rs.completed_lesson_ids, '{}')
        else coalesce(rs.sections_ids_read, '{}')
      end
    ) with ordinality as lesson(lesson_id, idx)
    where lesson.lesson_id is not null and btrim(lesson.lesson_id) <> ''
  ) lesson_rows
  group by lesson_id
) lesson
on conflict (user_id, topic, chapter_id, lesson_id) do nothing;
