-- Grid Operations simulation state (scenario-scoped, user-owned).

create table if not exists public.grid_ops_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id text not null default 'iberia_v1',
  turn_index integer not null default 0 check (turn_index >= 0),
  deployed_asset_ids text[] not null default '{control-center}',
  last_deployed_asset_id text,
  spent_units integer not null default 0 check (spent_units >= 0),
  scenario_seed integer not null default 1 check (scenario_seed >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, scenario_id),
  check (cardinality(deployed_asset_ids) > 0),
  check (
    last_deployed_asset_id is null
    or last_deployed_asset_id = any(deployed_asset_ids)
  )
);

create or replace function public.set_grid_ops_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_grid_ops_state_updated_at on public.grid_ops_state;
create trigger trg_grid_ops_state_updated_at
before update on public.grid_ops_state
for each row
execute function public.set_grid_ops_state_updated_at();

alter table public.grid_ops_state enable row level security;

drop policy if exists own_grid_ops_state_select on public.grid_ops_state;
create policy own_grid_ops_state_select
on public.grid_ops_state
for select
using (auth.uid() = user_id);

drop policy if exists own_grid_ops_state_insert on public.grid_ops_state;
create policy own_grid_ops_state_insert
on public.grid_ops_state
for insert
with check (auth.uid() = user_id);

drop policy if exists own_grid_ops_state_update on public.grid_ops_state;
create policy own_grid_ops_state_update
on public.grid_ops_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_grid_ops_state_delete on public.grid_ops_state;
create policy own_grid_ops_state_delete
on public.grid_ops_state
for delete
using (auth.uid() = user_id);

-- Backfill from legacy infrastructure deployment columns in user_progress.
with normalized as (
  select
    up.user_id,
    up.last_deployed_node_id,
    case
      when cardinality(coalesce(up.deployed_node_ids, '{}')) = 0 then array['control-center']::text[]
      else (
        with filtered as (
          select node_id, min(ord) as first_seen_ord
          from unnest(up.deployed_node_ids) with ordinality as deployed(node_id, ord)
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
    end as deployed_asset_ids
  from public.user_progress up
)
insert into public.grid_ops_state (
  user_id,
  scenario_id,
  turn_index,
  deployed_asset_ids,
  last_deployed_asset_id,
  spent_units,
  scenario_seed
)
select
  normalized.user_id,
  'iberia_v1',
  greatest(cardinality(normalized.deployed_asset_ids) - 1, 0),
  normalized.deployed_asset_ids,
  case
    when normalized.last_deployed_node_id = any(normalized.deployed_asset_ids)
      then normalized.last_deployed_node_id
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
      from unnest(normalized.deployed_asset_ids) as asset_id
    ),
    0
  ) as spent_units,
  1 as scenario_seed
from normalized
on conflict (user_id, scenario_id)
do nothing;
