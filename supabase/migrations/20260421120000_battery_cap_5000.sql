-- Hard-cap user balance at 5000 kWh (rated BESS capacity).
--
-- Balance = user_progress.xp − sum(user_grid_purchases.cost_paid). The cap is
-- enforced at every write path so it's impossible to accumulate beyond 5000:
--   1. sync_user_progress clamps incoming xp to (spent + 5000)
--   2. grid_purchase reads a capped available balance for its affordability check
--
-- Read paths (API + SSR) also clamp defensively via lib/energy.ts::capBalance().

create or replace function sync_user_progress(
  p_user_id        uuid,
  p_client_xp      bigint,
  p_client_streak   int,
  p_max_xp_increase bigint default 500,
  p_max_streak      int    default 365,
  p_completed_questions jsonb default '[]'::jsonb,
  p_topic_progress  jsonb default '{}'::jsonb,
  p_now             timestamptz default now()
)
returns void
language plpgsql
security definer
as $$
declare
  v_existing_xp     bigint;
  v_existing_streak int;
  v_spent           bigint;
  v_balance_cap     bigint := 5000;  -- BATTERY_CAPACITY_KWH (keep in sync with lib/energy.ts)
  v_absolute_xp_cap bigint;
  v_safe_xp         bigint;
  v_safe_streak     int;
  v_merged_tp       jsonb;
begin
  -- Lock the row (or insert if new) to prevent concurrent reads
  insert into user_progress (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

  select coalesce(xp, 0), coalesce(streak, 0)
    into v_existing_xp, v_existing_streak
    from user_progress
    where user_id = p_user_id
    for update;  -- row-level lock held until commit

  -- Look up total grid spend so we can compute the balance cap.
  select coalesce(sum(cost_paid), 0) into v_spent
    from user_grid_purchases
    where user_id = p_user_id;

  -- Absolute cap: xp must never exceed spent + 5000, so balance ≤ 5000.
  -- If the user already exceeds this cap (legacy data), don't shrink it —
  -- just freeze further growth until they spend more.
  v_absolute_xp_cap := v_spent + v_balance_cap;

  -- Clamp per-sync growth, never decrease, and apply the absolute cap.
  v_safe_xp := greatest(v_existing_xp, least(p_client_xp, v_existing_xp + p_max_xp_increase));
  v_safe_xp := least(v_safe_xp, greatest(v_existing_xp, v_absolute_xp_cap));

  -- Clamp: streak capped at p_max_streak, never decreases
  v_safe_streak := greatest(v_existing_streak, least(greatest(p_client_streak, 0), p_max_streak));

  -- Shallow-merge topic_progress (client keys overwrite server keys)
  select coalesce(topic_progress, '{}'::jsonb) into v_merged_tp
    from user_progress where user_id = p_user_id;
  v_merged_tp := v_merged_tp || p_topic_progress;

  update user_progress
    set xp                  = v_safe_xp,
        streak              = v_safe_streak,
        completed_questions = p_completed_questions,
        topic_progress      = v_merged_tp,
        last_activity       = p_now,
        updated_at          = p_now
    where user_id = p_user_id;
end;
$$;

-- Update grid_purchase to use capped balance for affordability.
create or replace function public.grid_purchase(p_slug text)
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
  v_cost integer;
  v_requires_module_complete boolean := false;
  v_xp integer;
  v_spent integer;
  v_available integer;
  v_balance_cap integer := 5000;  -- keep in sync with lib/energy.ts::BATTERY_CAPACITY_KWH
  v_state public.user_grid_state%rowtype;
  v_has_completed_module boolean;
  v_new_items text[];
begin
  if v_user is null then
    return query select false, 'UNAUTHENTICATED'::text, 'Sign in to deploy.'::text,
      0, array[]::text[], 0, false, null::timestamptz, null::timestamptz;
    return;
  end if;

  case p_slug
    when 'primary-substation'   then v_cost := 250;
    when 'power-transformer'    then v_cost := 375;
    when 'protective-relay'     then v_cost := 800;
    when 'circuit-breaker-bank' then v_cost := 900;
    when 'battery-storage-unit' then v_cost := 1100;
    when 'capacitor-bank'       then v_cost := 1300;
    when 'solar-array'          then v_cost := 1600; v_requires_module_complete := true;
    when 'wind-turbine-cluster' then v_cost := 1900; v_requires_module_complete := true;
    when 'smart-inverter'       then v_cost := 2250;
    when 'control-center'       then v_cost := 3000;
    else
      return query select false, 'UNKNOWN_COMPONENT'::text, 'Unknown component.'::text,
        0, array[]::text[], 0, false, null::timestamptz, null::timestamptz;
      return;
  end case;

  select coalesce(up.xp, 0) into v_xp
  from public.user_progress up
  where up.user_id = v_user
  for update;

  if v_xp is null then v_xp := 0; end if;

  insert into public.user_grid_state (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  select * into v_state
  from public.user_grid_state gs
  where gs.user_id = v_user
  for update;

  if p_slug = any(v_state.items_owned) then
    return query select false, 'ALREADY_OWNED'::text, 'Already deployed.'::text,
      v_xp, v_state.items_owned, v_state.districts_restored,
      v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
    return;
  end if;

  if v_requires_module_complete then
    select exists(
      select 1 from public.module_progress mp
      where mp.user_id = v_user and mp.is_completed = true
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

  select coalesce(sum(p.cost_paid), 0) into v_spent
  from public.user_grid_purchases p
  where p.user_id = v_user;

  -- Cap available balance at the battery capacity so affordability matches the UI.
  v_available := least(v_balance_cap, greatest(v_xp - v_spent, 0));

  if v_available < v_cost then
    return query select false, 'INSUFFICIENT_FUNDS'::text,
      format('Need %s kWh. Current reserve: %s kWh.', v_cost, v_available)::text,
      v_available, v_state.items_owned, v_state.districts_restored,
      v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
    return;
  end if;

  insert into public.user_grid_purchases (user_id, component_slug, cost_paid, balance_after)
  values (v_user, p_slug, v_cost, v_available - v_cost);

  v_new_items := array_append(v_state.items_owned, p_slug);

  update public.user_grid_state gs
  set items_owned = v_new_items,
      districts_restored = cardinality(v_new_items),
      first_deploy_at = coalesce(gs.first_deploy_at, now()),
      last_deploy_at = now()
  where gs.user_id = v_user
  returning * into v_state;

  return query select true, null::text, null::text,
    v_available - v_cost, v_state.items_owned, v_state.districts_restored,
    v_state.briefing_seen, v_state.first_deploy_at, v_state.last_deploy_at;
end;
$$;

grant execute on function public.grid_purchase(text) to authenticated;
