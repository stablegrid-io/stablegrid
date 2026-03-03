-- Repair sparse module_progress chains for databases that already applied the
-- initial module_progress migration before dense backfill logic existed.

with canonical_modules(topic, module_id, module_order) as (
  values
    ('pyspark', 'module-01', 1),
    ('pyspark', 'module-02', 2),
    ('pyspark', 'module-03', 3),
    ('pyspark', 'module-04', 4),
    ('pyspark', 'module-05', 5),
    ('pyspark', 'module-06', 6),
    ('pyspark', 'module-07', 7),
    ('pyspark', 'module-08', 8),
    ('pyspark', 'module-09', 9),
    ('pyspark', 'module-10', 10),
    ('pyspark', 'module-11', 11),
    ('pyspark', 'module-12', 12),
    ('pyspark', 'module-13', 13),
    ('pyspark', 'module-14', 14),
    ('pyspark', 'module-15', 15),
    ('pyspark', 'module-16', 16),
    ('pyspark', 'module-17', 17),
    ('pyspark', 'module-18', 18),
    ('pyspark', 'module-19', 19),
    ('pyspark', 'module-20', 20),
    ('fabric', 'module-01', 1)
),
user_topics as (
  select distinct user_id, topic
  from public.reading_sessions
  where topic in (select distinct topic from canonical_modules)
  union
  select distinct user_id, topic
  from public.module_progress
  where topic in (select distinct topic from canonical_modules)
),
module_activity as (
  select
    ut.user_id,
    ut.topic,
    coalesce(
      max(
        case
          when mp.is_completed or rs.is_completed then cm.module_order
          else null
        end
      ),
      0
    ) as explicit_completed_order,
    coalesce(
      max(
        case
          when mp.is_completed
            or mp.current_lesson_id is not null
            or mp.last_visited_route is not null
            or rs.is_completed
            or coalesce(rs.sections_read, 0) > 0
            or rs.current_lesson_id is not null
            or rs.last_visited_route is not null
          then cm.module_order
          else null
        end
      ),
      0
    ) as furthest_progress_order
  from user_topics ut
  join canonical_modules cm on cm.topic = ut.topic
  left join public.module_progress mp
    on mp.user_id = ut.user_id
   and mp.topic = ut.topic
   and mp.module_id = cm.module_id
  left join public.reading_sessions rs
    on rs.user_id = ut.user_id
   and rs.topic = ut.topic
   and rs.chapter_id = cm.module_id
  group by ut.user_id, ut.topic
),
missing_rows as (
  select
    ut.user_id,
    ut.topic,
    cm.module_id,
    cm.module_order,
    greatest(
      ma.explicit_completed_order,
      case
        when ma.furthest_progress_order > 0 then ma.furthest_progress_order - 1
        else 0
      end
    ) as completed_boundary_order,
    rs.current_lesson_id,
    rs.last_visited_route,
    rs.completed_at,
    rs.started_at,
    rs.last_active_at
  from user_topics ut
  join canonical_modules cm on cm.topic = ut.topic
  join module_activity ma
    on ma.user_id = ut.user_id
   and ma.topic = ut.topic
  left join public.module_progress mp
    on mp.user_id = ut.user_id
   and mp.topic = ut.topic
   and mp.module_id = cm.module_id
  left join public.reading_sessions rs
    on rs.user_id = ut.user_id
   and rs.topic = ut.topic
   and rs.chapter_id = cm.module_id
  where mp.id is null
)
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
  user_id,
  topic,
  module_id,
  module_order,
  case
    when module_order = 1 then true
    when module_order <= completed_boundary_order + 1 then true
    else false
  end as is_unlocked,
  module_order <= completed_boundary_order as is_completed,
  current_lesson_id,
  last_visited_route,
  case
    when module_order <= completed_boundary_order then completed_at
    else null
  end as completed_at,
  coalesce(started_at, now()) as created_at,
  coalesce(last_active_at, completed_at, now()) as updated_at
from missing_rows
on conflict (user_id, topic, module_id)
do update set
  is_unlocked = excluded.is_unlocked,
  is_completed = excluded.is_completed,
  current_lesson_id = coalesce(public.module_progress.current_lesson_id, excluded.current_lesson_id),
  last_visited_route = coalesce(public.module_progress.last_visited_route, excluded.last_visited_route),
  completed_at = coalesce(public.module_progress.completed_at, excluded.completed_at),
  updated_at = greatest(public.module_progress.updated_at, excluded.updated_at);
