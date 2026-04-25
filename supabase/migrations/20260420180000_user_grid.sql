-- /grid — ten-district shop-and-restore feature.
-- Reads kWh from user_progress.xp (canonical balance). Debits via
-- user_grid_purchases ledger. Available kWh = xp - sum(cost_paid).

create extension if not exists "pgcrypto";

create table if not exists public.user_grid_state (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  items_owned        text[] not null default '{}',
  districts_restored integer not null default 0 check (districts_restored between 0 and 10),
  briefing_seen      boolean not null default false,
  first_deploy_at    timestamptz,
  last_deploy_at     timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.user_grid_purchases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  component_slug text not null,
  cost_paid      integer not null check (cost_paid >= 0),
  balance_after  integer not null check (balance_after >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists idx_user_grid_purchases_user_created
  on public.user_grid_purchases (user_id, created_at desc);

create or replace function public.set_user_grid_state_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_user_grid_state_updated_at on public.user_grid_state;
create trigger trg_user_grid_state_updated_at
before update on public.user_grid_state
for each row execute function public.set_user_grid_state_updated_at();

alter table public.user_grid_state enable row level security;
alter table public.user_grid_purchases enable row level security;

drop policy if exists own_grid_state_select on public.user_grid_state;
create policy own_grid_state_select on public.user_grid_state
for select using (auth.uid() = user_id);

drop policy if exists own_grid_state_insert on public.user_grid_state;
create policy own_grid_state_insert on public.user_grid_state
for insert with check (auth.uid() = user_id);

drop policy if exists own_grid_state_update on public.user_grid_state;
create policy own_grid_state_update on public.user_grid_state
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists own_grid_purchases_select on public.user_grid_purchases;
create policy own_grid_purchases_select on public.user_grid_purchases
for select using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────
-- Atomic purchase RPC. Locks user_progress + user_grid_state + aggregates
-- purchases, validates ownership/gate/funds, appends ledger row, updates
-- state, returns fresh row + new balance.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.grid_purchase(
  p_slug text,
  p_cost integer,
  p_requires_module_complete boolean
)
returns table (
  ok             boolean,
  error_code     text,
  error_message  text,
  new_balance    integer,
  items_owned    text[],
  districts_restored integer,
  briefing_seen  boolean,
  first_deploy_at timestamptz,
  last_deploy_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_xp integer;
  v_spent integer;
  v_available integer;
  v_state public.user_grid_state%rowtype;
  v_has_completed_module boolean;
begin
  if v_user is null then
    return query select false, 'UNAUTHENTICATED'::text, 'Sign in to deploy.'::text,
      0, array[]::text[], 0, false, null::timestamptz, null::timestamptz;
    return;
  end if;

  -- Lock balance row (single source of truth for kWh)
  select coalesce(xp, 0) into v_xp
  from public.user_progress
  where user_id = v_user
  for update;

  if v_xp is null then v_xp := 0; end if;

  -- Lazy-create grid state row
  insert into public.user_grid_state (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  select * into v_state
  from public.user_grid_state
  where user_id = v_user
  for update;

  if p_slug = any(v_state.items_owned) then
    return query select false, 'ALREADY_OWNED'::text, 'Already deployed.'::text,
      v_xp, v_state.items_owned, v_state.districts_restored,
      v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
    return;
  end if;

  if p_requires_module_complete then
    select exists(
      select 1 from public.module_progress
      where user_id = v_user and is_completed = true
      limit 1
    ) into v_has_completed_module;
    if not v_has_completed_module then
      return query select false, 'GATE_NOT_MET'::text,
        'Complete any module in the Learn hub to unlock Generation components.'::text,
        v_xp, v_state.items_owned, v_state.districts_restored,
        v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
      return;
    end if;
  end if;

  select coalesce(sum(cost_paid), 0) into v_spent
  from public.user_grid_purchases
  where user_id = v_user;

  v_available := greatest(v_xp - v_spent, 0);

  if v_available < p_cost then
    return query select false, 'INSUFFICIENT_FUNDS'::text,
      format('Need %s kWh. Current reserve: %s kWh.', p_cost, v_available)::text,
      v_available, v_state.items_owned, v_state.districts_restored,
      v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
    return;
  end if;

  insert into public.user_grid_purchases (user_id, component_slug, cost_paid, balance_after)
  values (v_user, p_slug, p_cost, v_available - p_cost);

  update public.user_grid_state
  set items_owned = array_append(items_owned, p_slug),
      districts_restored = cardinality(array_append(items_owned, p_slug)),
      first_deploy_at = coalesce(first_deploy_at, now()),
      last_deploy_at = now()
  where user_id = v_user
  returning * into v_state;

  return query select true, null::text, null::text,
    v_available - p_cost, v_state.items_owned, v_state.districts_restored,
    v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
end;
$$;

grant execute on function public.grid_purchase(text, integer, boolean) to authenticated;
