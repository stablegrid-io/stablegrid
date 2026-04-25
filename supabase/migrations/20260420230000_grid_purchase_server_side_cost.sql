-- Security: grid_purchase previously took p_cost and p_requires_module_complete
-- as client-supplied parameters, which let a malicious client submit a fake
-- cost or bypass the Generation gate. Replace with a slug-only signature
-- that derives cost + gate server-side from a CASE statement mirrored from
-- lib/grid/components.ts. Keep the two seed files in sync when costs change.

drop function if exists public.grid_purchase(text, integer, boolean);

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
  v_state public.user_grid_state%rowtype;
  v_has_completed_module boolean;
  v_new_items text[];
begin
  if v_user is null then
    return query select false, 'UNAUTHENTICATED'::text, 'Sign in to deploy.'::text,
      0, array[]::text[], 0, false, null::timestamptz, null::timestamptz;
    return;
  end if;

  -- Server-side cost + gate lookup (mirrors lib/grid/components.ts).
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

  v_available := greatest(v_xp - v_spent, 0);

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
