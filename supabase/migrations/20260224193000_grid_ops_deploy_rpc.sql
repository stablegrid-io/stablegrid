-- Transactional deploy mutation for grid operations.

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
    when 'control-center' then
      v_asset_cost := 0;
      v_prerequisite := null;
    when 'smart-transformer' then
      v_asset_cost := 2000;
      v_prerequisite := 'control-center';
    when 'solar-forecasting-array' then
      v_asset_cost := 3000;
      v_prerequisite := 'smart-transformer';
    when 'battery-storage' then
      v_asset_cost := 5000;
      v_prerequisite := 'solar-forecasting-array';
    when 'frequency-controller' then
      v_asset_cost := 7000;
      v_prerequisite := 'battery-storage';
    when 'demand-response-system' then
      v_asset_cost := 10000;
      v_prerequisite := 'frequency-controller';
    when 'grid-flywheel' then
      v_asset_cost := 12000;
      v_prerequisite := 'demand-response-system';
    when 'hvdc-interconnector' then
      v_asset_cost := 15000;
      v_prerequisite := 'grid-flywheel';
    when 'ai-grid-optimizer' then
      v_asset_cost := 18000;
      v_prerequisite := 'hvdc-interconnector';
    else
      return query
      select v_user_id, p_scenario_id, 0, array[]::text[], null::text, 0, 1,
        'invalid_asset'::text,
        'Asset is not defined for this scenario.'::text;
      return;
  end case;

  select coalesce(up.xp, 0)
  into v_earned_units
  from public.user_progress up
  where up.user_id = v_user_id;

  v_earned_units := coalesce(v_earned_units, 0);

  select *
  into v_row
  from public.grid_ops_state gos
  where gos.user_id = v_user_id
    and gos.scenario_id = p_scenario_id
  for update;

  if not found then
    with source as (
      select
        up.deployed_node_ids,
        up.last_deployed_node_id
      from public.user_progress up
      where up.user_id = v_user_id
    ),
    normalized as (
      select
        case
          when cardinality(coalesce(source.deployed_node_ids, '{}')) = 0 then array['control-center']::text[]
          else (
            with filtered as (
              select node_id, min(ord) as first_seen_ord
              from unnest(source.deployed_node_ids) with ordinality as deployed(node_id, ord)
              where node_id in (
                'control-center',
                'smart-transformer',
                'solar-forecasting-array',
                'battery-storage',
                'frequency-controller',
                'demand-response-system',
                'grid-flywheel',
                'hvdc-interconnector',
                'ai-grid-optimizer'
              )
              group by node_id
            )
            select case
              when exists (select 1 from filtered) then array(
                select node_id
                from filtered
                order by first_seen_ord
              )
              else array['control-center']::text[]
            end
          )
        end as deployed_asset_ids,
        case
          when source.last_deployed_node_id is not null
            and source.last_deployed_node_id = any(coalesce(source.deployed_node_ids, array['control-center']::text[]))
            then source.last_deployed_node_id
          else null
        end as last_deployed_asset_id
      from source
    )
    select
      normalized.deployed_asset_ids,
      normalized.last_deployed_asset_id
    into v_seed_deployed, v_seed_last
    from normalized;

    if v_seed_deployed is null or cardinality(v_seed_deployed) = 0 then
      v_seed_deployed := array['control-center']::text[];
      v_seed_last := null;
    end if;

    insert into public.grid_ops_state (
      user_id,
      scenario_id,
      turn_index,
      deployed_asset_ids,
      last_deployed_asset_id,
      spent_units,
      scenario_seed
    )
    values (
      v_user_id,
      p_scenario_id,
      greatest(cardinality(v_seed_deployed) - 1, 0),
      v_seed_deployed,
      case
        when v_seed_last is not null and v_seed_last = any(v_seed_deployed) then v_seed_last
        else null
      end,
      coalesce(
        (
          select sum(
            case asset_id
              when 'control-center' then 0
              when 'smart-transformer' then 2000
              when 'solar-forecasting-array' then 3000
              when 'battery-storage' then 5000
              when 'frequency-controller' then 7000
              when 'demand-response-system' then 10000
              when 'grid-flywheel' then 12000
              when 'hvdc-interconnector' then 15000
              when 'ai-grid-optimizer' then 18000
              else 0
            end
          )
          from unnest(v_seed_deployed) as asset_id
        ),
        0
      ),
      1
    )
    on conflict (user_id, scenario_id)
    do nothing;

    select *
    into v_row
    from public.grid_ops_state gos
    where gos.user_id = v_user_id
      and gos.scenario_id = p_scenario_id
    for update;
  end if;

  if p_asset_id = any(v_row.deployed_asset_ids) then
    return query
    select
      v_row.user_id,
      v_row.scenario_id,
      v_row.turn_index,
      v_row.deployed_asset_ids,
      v_row.last_deployed_asset_id,
      v_row.spent_units,
      v_row.scenario_seed,
      'already_deployed'::text,
      'Asset is already deployed.'::text;
    return;
  end if;

  if v_prerequisite is not null and not (v_prerequisite = any(v_row.deployed_asset_ids)) then
    return query
    select
      v_row.user_id,
      v_row.scenario_id,
      v_row.turn_index,
      v_row.deployed_asset_ids,
      v_row.last_deployed_asset_id,
      v_row.spent_units,
      v_row.scenario_seed,
      'locked_asset'::text,
      format('Asset is locked. Deploy %s first.', v_prerequisite)::text;
    return;
  end if;

  v_available_units := greatest(v_earned_units - coalesce(v_row.spent_units, 0), 0);
  if v_available_units < v_asset_cost then
    return query
    select
      v_row.user_id,
      v_row.scenario_id,
      v_row.turn_index,
      v_row.deployed_asset_ids,
      v_row.last_deployed_asset_id,
      v_row.spent_units,
      v_row.scenario_seed,
      'insufficient_budget'::text,
      'Insufficient kWh budget.'::text;
    return;
  end if;

  update public.grid_ops_state gos
  set
    deployed_asset_ids = array_append(gos.deployed_asset_ids, p_asset_id),
    last_deployed_asset_id = p_asset_id,
    spent_units = coalesce(
      (
        select sum(
          case asset_id
            when 'control-center' then 0
            when 'smart-transformer' then 2000
            when 'solar-forecasting-array' then 3000
            when 'battery-storage' then 5000
            when 'frequency-controller' then 7000
            when 'demand-response-system' then 10000
            when 'grid-flywheel' then 12000
            when 'hvdc-interconnector' then 15000
            when 'ai-grid-optimizer' then 18000
            else 0
          end
        )
        from unnest(array_append(gos.deployed_asset_ids, p_asset_id)) as asset_id
      ),
      0
    ),
    turn_index = gos.turn_index + 1,
    updated_at = now()
  where gos.user_id = v_user_id
    and gos.scenario_id = p_scenario_id
  returning gos.*
  into v_row;

  return query
  select
    v_row.user_id,
    v_row.scenario_id,
    v_row.turn_index,
    v_row.deployed_asset_ids,
    v_row.last_deployed_asset_id,
    v_row.spent_units,
    v_row.scenario_seed,
    null::text,
    null::text;
end;
$$;

grant execute on function public.grid_ops_deploy_asset(text, text) to authenticated;
