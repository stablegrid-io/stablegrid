-- Atomic progress sync to prevent TOCTOU race conditions.
-- Reads existing XP/streak and writes clamped values in a single transaction.
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

  -- Clamp: XP can only increase by max p_max_xp_increase per sync, never decrease
  v_safe_xp     := greatest(v_existing_xp, least(p_client_xp, v_existing_xp + p_max_xp_increase));
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
