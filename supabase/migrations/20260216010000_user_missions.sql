create extension if not exists "pgcrypto";

create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_slug text not null,
  state text not null default 'not_started' check (state in ('not_started', 'in_progress', 'completed')),
  unlocked boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mission_slug)
);

create index if not exists idx_user_missions_user_id on public.user_missions(user_id);
create index if not exists idx_user_missions_user_state on public.user_missions(user_id, state);

create or replace function public.set_user_missions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_missions_updated_at on public.user_missions;
create trigger trg_user_missions_updated_at
before update on public.user_missions
for each row
execute function public.set_user_missions_updated_at();

alter table public.user_missions enable row level security;

drop policy if exists own_user_missions_select on public.user_missions;
create policy own_user_missions_select
on public.user_missions
for select
using (auth.uid() = user_id);

drop policy if exists own_user_missions_insert on public.user_missions;
create policy own_user_missions_insert
on public.user_missions
for insert
with check (auth.uid() = user_id);

drop policy if exists own_user_missions_update on public.user_missions;
create policy own_user_missions_update
on public.user_missions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_user_missions_delete on public.user_missions;
create policy own_user_missions_delete
on public.user_missions
for delete
using (auth.uid() = user_id);

