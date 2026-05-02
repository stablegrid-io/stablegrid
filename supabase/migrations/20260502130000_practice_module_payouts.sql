-- Once-per-(user, module) kWh payout ledger for practice sets.
--
-- Rows are inserted by /api/operations/practice/payout when a user clears
-- the score threshold for a practice module. The composite primary key on
-- (user_id, module_id) makes a second insert a no-op via ON CONFLICT — the
-- API treats the conflict as "already paid" and returns success without
-- crediting kWh twice.
--
-- The score and kwh values are snapshotted at payout time so subsequent
-- changes to the practice-set JSON or to the reward formula don't
-- retroactively alter what a user earned. The XP increment lives in
-- public.user_progress and is applied atomically alongside the insert
-- (see the route's transactional path).

create table if not exists public.practice_module_payouts (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  topic          text        not null,
  module_id      text        not null,
  -- Score the user achieved at payout time, 0–100 (rounded to two decimals
  -- so it matches the displayed percentage exactly; the eligibility check
  -- on the server uses this value too, so display and gate never diverge).
  score_percent  numeric(5,2) not null,
  -- kWh actually credited (after global cap clamping). Always >= 0.
  kwh            integer     not null check (kwh >= 0),
  paid_at        timestamptz not null default now(),
  primary key (user_id, module_id)
);

create index if not exists idx_practice_module_payouts_user
  on public.practice_module_payouts (user_id);

alter table public.practice_module_payouts enable row level security;

drop policy if exists "users select own module payouts" on public.practice_module_payouts;
create policy "users select own module payouts"
  on public.practice_module_payouts
  for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own module payouts" on public.practice_module_payouts;
create policy "users insert own module payouts"
  on public.practice_module_payouts
  for insert
  with check (auth.uid() = user_id);
