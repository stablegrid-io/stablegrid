-- Per-task practice attempt log.
--
-- Records every time the user clicks "Check Answer" on a practice task, so
-- the topic-tier picker (Practice Mastery panel) can show which tasks have
-- been solved and the dashboard can compute progression.
--
-- Granularity: one row per attempt — never updated. The "current state" of a
-- task for a given user is the latest row by attempted_at; success/failure
-- is decided by whether ANY row for (user_id, module_id, task_id) has
-- result = 'success'. Append-only keeps the history queryable for analytics
-- (attempts-per-task, time-to-pass, abandonment) without coordinating reads
-- and writes.

create table if not exists public.practice_task_attempts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  topic        text        not null,
  module_id    text        not null,
  task_id      text        not null,
  -- 'success'     — all validated fields correct (MCQ) or self-marked solved
  -- 'failure'     — at least one validated field incorrect
  -- 'self_review' — code task submitted with no machine-validatable answer
  result       text        not null check (result in ('success', 'failure', 'self_review')),
  attempted_at timestamptz not null default now()
);

create index if not exists idx_practice_attempts_user_module
  on public.practice_task_attempts (user_id, module_id, attempted_at desc);

create index if not exists idx_practice_attempts_user_task
  on public.practice_task_attempts (user_id, module_id, task_id, attempted_at desc);

alter table public.practice_task_attempts enable row level security;

drop policy if exists "users select own practice attempts" on public.practice_task_attempts;
create policy "users select own practice attempts"
  on public.practice_task_attempts
  for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own practice attempts" on public.practice_task_attempts;
create policy "users insert own practice attempts"
  on public.practice_task_attempts
  for insert
  with check (auth.uid() = user_id);
