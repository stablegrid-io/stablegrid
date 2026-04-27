-- Per-module checkpoint quiz results (90% pass gate to advance).
--
-- Previously checkpoint pass/fail lived only in localStorage
-- (lib/stores/useCheckpointStore.ts). Track-map advancement gates on
-- `lessonsAllRead AND checkpointPassed`, but lesson progress was the only
-- half synced to the server — passing the checkpoint on one device
-- left module N+1 locked on every other device. This table closes that
-- gap; localStorage stays as a write-through cache for instant UI.
--
-- Score columns are stored as ratios in [0,1] (correct / total) to match
-- CHECKPOINT_PASS_RATIO in lib/learn/moduleCheckpointGate.ts.

create extension if not exists "pgcrypto";

create table if not exists public.module_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  module_id text not null,
  passed boolean not null default false,
  attempts integer not null default 0,
  best_score real not null default 0,
  last_score real not null default 0,
  total_questions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic, module_id)
);

alter table public.module_checkpoints enable row level security;

drop policy if exists own_module_checkpoints on public.module_checkpoints;
create policy own_module_checkpoints on public.module_checkpoints
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_module_checkpoints_user_topic
  on public.module_checkpoints (user_id, topic);
