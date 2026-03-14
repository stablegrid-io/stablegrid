create extension if not exists "pgcrypto";

create table if not exists public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('content_admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_memberships_role
  on public.admin_memberships (role);

create index if not exists idx_admin_audit_logs_created_at
  on public.admin_audit_logs (created_at desc);

create index if not exists idx_admin_audit_logs_target_user
  on public.admin_audit_logs (target_user_id, created_at desc);

create or replace function public.set_admin_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_admin_memberships_updated_at on public.admin_memberships;
create trigger trg_admin_memberships_updated_at
before update on public.admin_memberships
for each row
execute function public.set_admin_updated_at();

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_logs enable row level security;
