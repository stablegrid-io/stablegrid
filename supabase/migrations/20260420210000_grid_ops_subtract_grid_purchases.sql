-- Unify kWh accounting: grid_ops_deploy_asset now subtracts user_grid_purchases
-- cost_paid from its available-units calculation, so the grid_ops simulation
-- and /grid shop draw from the same pool.

create or replace function public.grid_ops_deploy_asset(
  p_scenario_id text,
  p_asset_id text
)
returns table (
  user_id uuid,
  scenario_id text,
  turn_index integer,
  deployed_asset_ids text[],
  last_deployed_asset_id text,
  spent_units integer,
  scenario_seed integer,
  error_code text,
  error_message text
)
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.grid_ops_state%rowtype;
  v_earned_units integer := 0;
  v_grid_spent integer := 0;
  v_asset_cost integer;
  v_prerequisite text;
  v_available_units integer;
  v_seed_deployed text[];
  v_seed_last text;
begin
  if v_user_id is null then
    return query
    select null::uuid, coalesce(p_scenario_id, 'iberia_v1'), 0, array[]::text[], null::text, 0, 1,
      'unauthorized'::text,
      'Unauthorized'::text;
    return;
  end if;

  if p_scenario_id is null or p_scenario_id <> 'iberia_v1' then
    return query
    select v_user_id, coalesce(p_scenario_id, 'iberia_v1'), 0, array[]::text[], null::text, 0, 1,
      'invalid_scenario'::text,
      'Invalid scenario id.'::text;
    return;
  end if;

  case p_asset_id
    when 'control-center'          then v_asset_cost := 0;     v_prerequisite := null;
    when 'smart-transformer'       then v_asset_cost := 2000;  v_prerequisite := 'control-center';
    when 'solar-forecasting-array' then v_asset_cost := 3000;  v_prerequisite := 'smart-transformer';
    when 'battery-storage'         then v_asset_cost := 5000;  v_prerequisite := 'solar-forecasting-array';
    when 'frequency-controller'    then v_asset_cost := 7000;  v_prerequisite := 'battery-storage';
    when 'demand-response-system'  then v_asset_cost := 10000; v_prerequisite := 'frequency-controller';
    when 'grid-flywheel'           then v_asset_cost := 12000; v_prerequisite := 'demand-response-system';
    when 'hvdc-interconnector'     then v_asset_cost := 15000; v_prerequisite := 'grid-flywheel';
    when 'ai-grid-optimizer'       then v_asset_cost := 18000; v_prerequisite := 'hvdc-interconnector';
    else
      return query
      select v_user_id, p_scenario_id, 0, array[]::text[], null::text, 0, 1,
        'invalid_asset'::text,
        'Asset is not defined for this scenario.'::text;
      return;
  end case;

  select coalesce(up.xp, 0) into v_earned_units
  from public.user_progress up
  where up.user_id = v_user_id;
  v_earned_units := coalesce(v_earned_units, 0);

  -- NEW: subtract /grid purchases from the available pool so both features debit
  -- the same user_progress.xp without double-counting.
  select coalesce(sum(ugp.cost_paid), 0) into v_grid_spent
  from public.user_grid_purchases ugp
  where ugp.user_id = v_user_id;

  select *
  into v_row
  from public.grid_ops_state gos
  where gos.user_id = v_user_id
    and gos.scenario_id = p_scenario_id
  for update;

  if not found then
    insert into public.grid_ops_state (user_id, scenario_id)
    values (v_user_id, p_scenario_id)
    on conflict (user_id, scenario_id) do nothing;

    select *
    into v_row
    from public.grid_ops_state gos
    where gos.user_id = v_user_id
      and gos.scenario_id = p_scenario_id
    for update;
  end if;

  if p_asset_id = any(v_row.deployed_asset_ids) then
    return query
    select v_row.user_id, v_row.scenario_id, v_row.turn_index,
      v_row.deployed_asset_ids, v_row.last_deployed_asset_id,
      v_row.spent_units, v_row.scenario_seed,
      'already_deployed'::text, 'Asset is already deployed.'::text;
    return;
  end if;

  if v_prerequisite is not null and not (v_prerequisite = any(v_row.deployed_asset_ids)) then
    return query
    select v_row.user_id, v_row.scenario_id, v_row.turn_index,
      v_row.deployed_asset_ids, v_row.last_deployed_asset_id,
      v_row.spent_units, v_row.scenario_seed,
      'locked_asset'::text,
      format('Asset is locked. Deploy %s first.', v_prerequisite)::text;
    return;
  end if;

  v_available_units := greatest(
    v_earned_units - coalesce(v_row.spent_units, 0) - v_grid_spent,
    0
  );
  if v_available_units < v_asset_cost then
    return query
    select v_row.user_id, v_row.scenario_id, v_row.turn_index,
      v_row.deployed_asset_ids, v_row.last_deployed_asset_id,
      v_row.spent_units, v_row.scenario_seed,
      'insufficient_budget'::text, 'Insufficient kWh budget.'::text;
    return;
  end if;

  update public.grid_ops_state gos
  set
    deployed_asset_ids = array_append(gos.deployed_asset_ids, p_asset_id),
    last_deployed_asset_id = p_asset_id,
    spent_units = coalesce(gos.spent_units, 0) + v_asset_cost,
    turn_index = gos.turn_index + 1,
    updated_at = now()
  where gos.user_id = v_user_id
    and gos.scenario_id = p_scenario_id
  returning gos.*
  into v_row;

  return query
  select v_row.user_id, v_row.scenario_id, v_row.turn_index,
    v_row.deployed_asset_ids, v_row.last_deployed_asset_id,
    v_row.spent_units, v_row.scenario_seed,
    null::text, null::text;
end;
$$;

grant execute on function public.grid_ops_deploy_asset(text, text) to authenticated;
