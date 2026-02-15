-- User-level progress persistence used by:
-- - /api/auth/sync-progress (GET/POST)
-- - User menu XP/streak display

create extension if not exists "pgcrypto";

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  completed_questions text[] not null default '{}',
  topic_progress jsonb not null default '{}'::jsonb,
  last_activity timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.user_progress (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_progress on auth.users;
create trigger trg_auth_user_progress
after insert on auth.users
for each row
execute function public.handle_new_user_progress();

create or replace function public.set_user_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_progress_updated_at on public.user_progress;
create trigger trg_user_progress_updated_at
before update on public.user_progress
for each row
execute function public.set_user_progress_updated_at();

alter table public.user_progress enable row level security;

drop policy if exists own_user_progress_select on public.user_progress;
create policy own_user_progress_select
on public.user_progress
for select
using (auth.uid() = user_id);

drop policy if exists own_user_progress_insert on public.user_progress;
create policy own_user_progress_insert
on public.user_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists own_user_progress_update on public.user_progress;
create policy own_user_progress_update
on public.user_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_user_progress_delete on public.user_progress;
create policy own_user_progress_delete
on public.user_progress
for delete
using (auth.uid() = user_id);
