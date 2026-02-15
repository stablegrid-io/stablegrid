create extension if not exists "pgcrypto";

-- Profiles table for settings preferences.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  notification_prefs jsonb not null default '{
    "streak_reminder": true,
    "weekly_digest": true,
    "new_content": false,
    "practice_reminder": true,
    "marketing": false
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists notification_prefs jsonb not null default '{
    "streak_reminder": true,
    "weekly_digest": true,
    "new_content": false,
    "practice_reminder": true,
    "marketing": false
  }'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

insert into public.profiles (id, name, email)
select
  u.id,
  coalesce((u.raw_user_meta_data ->> 'name'), split_part(u.email, '@', 1)),
  u.email
from auth.users u
on conflict (id) do update
set
  name = coalesce(public.profiles.name, excluded.name),
  email = coalesce(public.profiles.email, excluded.email);

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'name'), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_new_profile on auth.users;
create trigger trg_auth_new_profile
after insert on auth.users
for each row
execute function public.handle_new_profile();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists own_profiles_select on public.profiles;
create policy own_profiles_select
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists own_profiles_insert on public.profiles;
create policy own_profiles_insert
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists own_profiles_update on public.profiles;
create policy own_profiles_update
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Billing subscriptions table synced from Stripe webhook.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_sub_id text,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_sub_id text,
  add column if not exists plan text not null default 'free',
  add column if not exists status text not null default 'active',
  add column if not exists current_period_end timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

insert into public.subscriptions (user_id, plan, status)
select u.id, 'free', 'active'
from auth.users u
on conflict (user_id) do nothing;

create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_subscriptions_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists own_subscription_select on public.subscriptions;
create policy own_subscription_select
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists own_subscription_insert on public.subscriptions;
create policy own_subscription_insert
on public.subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists own_subscription_update on public.subscriptions;
create policy own_subscription_update
on public.subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Deletion reasons (audit trail for two-step account deletion flow).
create table if not exists public.account_deletion_reasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_account_deletion_reasons_user_id
  on public.account_deletion_reasons (user_id);

alter table public.account_deletion_reasons enable row level security;

drop policy if exists own_delete_reason_insert on public.account_deletion_reasons;
create policy own_delete_reason_insert
on public.account_deletion_reasons
for insert
with check (auth.uid() = user_id);

drop policy if exists own_delete_reason_select on public.account_deletion_reasons;
create policy own_delete_reason_select
on public.account_deletion_reasons
for select
using (auth.uid() = user_id);
