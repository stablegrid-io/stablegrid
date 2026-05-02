-- Per-(user, task, tier) hint-unlock log.
--
-- Once a user clicks Unlock on a tiered hint (H2 / H3 / etc.) we record
-- a row here so the same hint cannot be unlocked again in a later
-- session — the reward dock for that task is permanent. The Unlock
-- button is hidden client-side once the row is present.
--
-- Granularity: one row per (user, module, task, tier). The composite
-- primary key makes duplicate inserts a no-op via ON CONFLICT — the
-- API treats the conflict as "already unlocked" and returns success
-- without charging XP twice.

create table if not exists public.practice_hint_unlocks (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  module_id    text        not null,
  task_id      text        not null,
  hint_tier    text        not null,
  -- Snapshotted from the practice-set JSON at unlock time so future
  -- changes to the source content don't retroactively alter what a
  -- user "paid". Stored as the kWh dock applied to the success reward.
  xp_cost      integer     not null default 0,
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, module_id, task_id, hint_tier)
);

create index if not exists idx_practice_hint_unlocks_user_module
  on public.practice_hint_unlocks (user_id, module_id);

alter table public.practice_hint_unlocks enable row level security;

drop policy if exists "users select own hint unlocks" on public.practice_hint_unlocks;
create policy "users select own hint unlocks"
  on public.practice_hint_unlocks
  for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own hint unlocks" on public.practice_hint_unlocks;
create policy "users insert own hint unlocks"
  on public.practice_hint_unlocks
  for insert
  with check (auth.uid() = user_id);
