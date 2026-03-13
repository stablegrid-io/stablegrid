alter table public.user_activation_tasks
drop constraint if exists user_activation_tasks_requested_count_check;

alter table public.user_activation_tasks
add constraint user_activation_tasks_requested_count_check
check (
  (scope_type = 'count' and requested_count is not null and requested_count >= 1)
  or (scope_type = 'all_remaining' and requested_count is null)
);
