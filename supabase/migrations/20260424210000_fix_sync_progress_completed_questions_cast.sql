-- Fix sync_user_progress RPC: cast jsonb p_completed_questions to text[] to match column type.
--
-- Previous migrations (20260419001000_atomic_sync_progress, 20260421120000_battery_cap_5000)
-- defined the RPC to write jsonb directly into user_progress.completed_questions, but that
-- column is text[]. Every call failed with error 42804 ("column is of type text[] but
-- expression is of type jsonb"), and the route handler fallback only covered 42883 (function
-- missing) — so saveProgress silently failed for all callers, leaving xp frozen at 0 in the DB.

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
  v_completed_q     text[];
begin
  insert into user_progress (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

  select coalesce(xp, 0), coalesce(streak, 0)
    into v_existing_xp, v_existing_streak
    from user_progress
    where user_id = p_user_id
    for update;

  select coalesce(sum(cost_paid), 0) into v_spent
    from user_grid_purchases
    where user_id = p_user_id;

  v_absolute_xp_cap := v_spent + v_balance_cap;

  v_safe_xp := greatest(v_existing_xp, least(p_client_xp, v_existing_xp + p_max_xp_increase));
  v_safe_xp := least(v_safe_xp, greatest(v_existing_xp, v_absolute_xp_cap));

  v_safe_streak := greatest(v_existing_streak, least(greatest(p_client_streak, 0), p_max_streak));

  select coalesce(topic_progress, '{}'::jsonb) into v_merged_tp
    from user_progress where user_id = p_user_id;
  v_merged_tp := v_merged_tp || p_topic_progress;

  -- Cast jsonb array to text[]. Handles null/non-array inputs gracefully.
  if jsonb_typeof(p_completed_questions) = 'array' then
    select coalesce(array_agg(value), '{}'::text[])
      into v_completed_q
      from jsonb_array_elements_text(p_completed_questions) as value;
  else
    v_completed_q := '{}'::text[];
  end if;

  update user_progress
    set xp                  = v_safe_xp,
        streak              = v_safe_streak,
        completed_questions = v_completed_q,
        topic_progress      = v_merged_tp,
        last_activity       = p_now,
        updated_at          = p_now
    where user_id = p_user_id;
end;
$$;
