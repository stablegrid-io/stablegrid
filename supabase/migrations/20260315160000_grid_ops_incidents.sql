-- Phase 1: Incident system for grid operations.
-- Creates the incidents table, adds completed_dispatch_call_ids to grid_ops_state,
-- and adds the grid_ops_repair_incident RPC.

-- ─── incidents table ──────────────────────────────────────────────────────────

create table if not exists public.incidents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  scenario_id         text not null,
  asset_id            text not null,
  incident_type       text not null,
  severity            text not null default 'warning',
  health_penalty_pct  integer not null default 15,
  repair_cost_units   integer not null,
  started_at          timestamptz not null default now(),
  escalates_at        timestamptz,
  resolved_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- Prevent two active incidents on the same asset at the same time.
create unique index if not exists incidents_active_asset
  on public.incidents(user_id, scenario_id, asset_id)
  where resolved_at is null;

-- RLS
alter table public.incidents enable row level security;

create policy incidents_select
  on public.incidents for select
  using (user_id = auth.uid());

create policy incidents_insert
  on public.incidents for insert
  with check (user_id = auth.uid());

create policy incidents_update
  on public.incidents for update
  using (user_id = auth.uid());

-- ─── grid_ops_state column ────────────────────────────────────────────────────

alter table public.grid_ops_state
  add column if not exists completed_dispatch_call_ids text[] not null default '{}';

-- ─── grid_ops_repair_incident RPC ─────────────────────────────────────────────

create or replace function public.grid_ops_repair_incident(
  p_incident_id uuid,
  p_user_id     uuid
)
returns table (
  success           boolean,
  error_code        text,
  error_message     text,
  repair_cost_units integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id     uuid := auth.uid();
  v_incident      public.incidents%rowtype;
  v_current_xp    integer;
begin
  -- Caller must match the provided user_id (prevents privilege escalation)
  if v_caller_id is null or v_caller_id <> p_user_id then
    return query select false, 'unauthorized'::text, 'Unauthorized.'::text, 0;
    return;
  end if;

  select * into v_incident
    from public.incidents
    where id = p_incident_id
      and user_id = p_user_id
      and resolved_at is null;

  if not found then
    return query select false, 'not_found'::text, 'Incident not found or already resolved.'::text, 0;
    return;
  end if;

  select coalesce(xp, 0) into v_current_xp
    from public.user_progress
    where user_id = p_user_id;

  if v_current_xp < v_incident.repair_cost_units then
    return query select false, 'insufficient_budget'::text, 'Not enough kWh to repair.'::text, v_incident.repair_cost_units;
    return;
  end if;

  -- Atomically deduct XP and resolve the incident.
  update public.user_progress
    set xp = xp - v_incident.repair_cost_units
    where user_id = p_user_id;

  update public.incidents
    set resolved_at = now()
    where id = p_incident_id;

  return query select true, null::text, null::text, v_incident.repair_cost_units;
end;
$$;

grant execute on function public.grid_ops_repair_incident(uuid, uuid) to authenticated;

-- ─── grid_ops_complete_dispatch_call RPC ──────────────────────────────────────

create or replace function public.grid_ops_complete_dispatch_call(
  p_call_id     text,
  p_scenario_id text,
  p_reward_units integer
)
returns table (
  success       boolean,
  error_code    text,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_already boolean;
begin
  if v_user_id is null then
    return query select false, 'unauthorized'::text, 'Unauthorized.'::text;
    return;
  end if;

  -- Idempotent: check if already completed
  select p_call_id = any(completed_dispatch_call_ids)
    into v_already
    from public.grid_ops_state
    where user_id = v_user_id and scenario_id = p_scenario_id;

  if coalesce(v_already, false) then
    return query select true, null::text, null::text;
    return;
  end if;

  -- Append call_id and award XP
  update public.grid_ops_state
    set completed_dispatch_call_ids = array_append(completed_dispatch_call_ids, p_call_id)
    where user_id = v_user_id and scenario_id = p_scenario_id;

  update public.user_progress
    set xp = xp + p_reward_units
    where user_id = v_user_id;

  return query select true, null::text, null::text;
end;
$$;

grant execute on function public.grid_ops_complete_dispatch_call(text, text, integer) to authenticated;
