-- User-customizable dashboard layouts for Progress page

create table if not exists public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  layout jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create or replace function public.set_dashboard_layouts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dashboard_layouts_updated_at on public.dashboard_layouts;
create trigger trg_dashboard_layouts_updated_at
before update on public.dashboard_layouts
for each row
execute function public.set_dashboard_layouts_updated_at();

alter table public.dashboard_layouts enable row level security;

drop policy if exists own_dashboard_layouts_select on public.dashboard_layouts;
create policy own_dashboard_layouts_select
on public.dashboard_layouts
for select
using (auth.uid() = user_id);

drop policy if exists own_dashboard_layouts_insert on public.dashboard_layouts;
create policy own_dashboard_layouts_insert
on public.dashboard_layouts
for insert
with check (auth.uid() = user_id);

drop policy if exists own_dashboard_layouts_update on public.dashboard_layouts;
create policy own_dashboard_layouts_update
on public.dashboard_layouts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_dashboard_layouts_delete on public.dashboard_layouts;
create policy own_dashboard_layouts_delete
on public.dashboard_layouts
for delete
using (auth.uid() = user_id);

create index if not exists idx_dashboard_layouts_user_id
  on public.dashboard_layouts (user_id);
