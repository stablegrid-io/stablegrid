alter table public.user_activation_tasks
add column if not exists sort_order integer;

with ranked_tasks as (
  select
    id,
    row_number() over (
      partition by user_id, status
      order by created_at desc, id desc
    ) * 1000 as next_sort_order
  from public.user_activation_tasks
)
update public.user_activation_tasks as tasks
set sort_order = ranked_tasks.next_sort_order
from ranked_tasks
where tasks.id = ranked_tasks.id
  and tasks.sort_order is null;

update public.user_activation_tasks
set sort_order = 1000
where sort_order is null;

alter table public.user_activation_tasks
alter column sort_order set default 1000;

alter table public.user_activation_tasks
alter column sort_order set not null;

create index if not exists idx_user_activation_tasks_user_status_sort_order
  on public.user_activation_tasks(user_id, status, sort_order);
