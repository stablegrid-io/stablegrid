-- Session-level rollup and summary report for the first product activation funnel.

create or replace view public.product_funnel_session_rollups as
select
  session_id,
  max(user_id::text) filter (where user_id is not null)::uuid as user_id,
  min(occurred_at) as first_seen_at,
  max(occurred_at) as last_seen_at,
  min(occurred_at) filter (where event_name = 'landing_cta') as landing_cta_at,
  min(occurred_at) filter (where event_name = 'signup_started') as signup_started_at,
  min(occurred_at) filter (where event_name = 'signup_completed') as signup_completed_at,
  min(occurred_at) filter (where event_name = 'onboarding_completed') as onboarding_completed_at,
  min(occurred_at) filter (where event_name = 'first_chapter_started') as first_chapter_started_at,
  min(occurred_at) filter (where event_name = 'first_chapter_completed') as first_chapter_completed_at,
  min(occurred_at) filter (where event_name = 'first_practice_completed') as first_practice_completed_at,
  min(occurred_at) filter (where event_name = 'first_grid_deploy') as first_grid_deploy_at
from public.product_funnel_events
group by session_id;

create or replace view public.product_funnel_report as
with step_catalog as (
  select 1 as step_order, 'landing_cta'::text as event_name, 'Landing CTA'::text as step_label
  union all
  select 2, 'signup_started', 'Signup started'
  union all
  select 3, 'signup_completed', 'Signup completed'
  union all
  select 4, 'onboarding_completed', 'Onboarding completed'
  union all
  select 5, 'first_chapter_started', 'First chapter started'
  union all
  select 6, 'first_chapter_completed', 'First chapter completed'
  union all
  select 7, 'first_practice_completed', 'First practice completed'
  union all
  select 8, 'first_grid_deploy', 'First grid deploy'
),
session_steps as (
  select
    session_id,
    user_id,
    first_seen_at,
    landing_cta_at,
    signup_started_at,
    signup_completed_at,
    onboarding_completed_at,
    first_chapter_started_at,
    first_chapter_completed_at,
    first_practice_completed_at,
    first_grid_deploy_at
  from public.product_funnel_session_rollups
),
step_counts as (
  select
    sc.step_order,
    sc.event_name,
    sc.step_label,
    count(*) filter (
      where case sc.event_name
        when 'landing_cta' then ss.landing_cta_at
        when 'signup_started' then ss.signup_started_at
        when 'signup_completed' then ss.signup_completed_at
        when 'onboarding_completed' then ss.onboarding_completed_at
        when 'first_chapter_started' then ss.first_chapter_started_at
        when 'first_chapter_completed' then ss.first_chapter_completed_at
        when 'first_practice_completed' then ss.first_practice_completed_at
        when 'first_grid_deploy' then ss.first_grid_deploy_at
        else null
      end is not null
    ) as session_count,
    count(distinct ss.user_id) filter (
      where case sc.event_name
        when 'landing_cta' then ss.landing_cta_at
        when 'signup_started' then ss.signup_started_at
        when 'signup_completed' then ss.signup_completed_at
        when 'onboarding_completed' then ss.onboarding_completed_at
        when 'first_chapter_started' then ss.first_chapter_started_at
        when 'first_chapter_completed' then ss.first_chapter_completed_at
        when 'first_practice_completed' then ss.first_practice_completed_at
        when 'first_grid_deploy' then ss.first_grid_deploy_at
        else null
      end is not null
      and ss.user_id is not null
    ) as identified_user_count
  from step_catalog sc
  cross join session_steps ss
  group by sc.step_order, sc.event_name, sc.step_label
),
baseline as (
  select coalesce(max(session_count) filter (where step_order = 1), 0) as baseline_sessions
  from step_counts
)
select
  step_order,
  event_name,
  step_label,
  session_count,
  identified_user_count,
  lag(session_count) over (order by step_order) as prior_step_session_count,
  case
    when lag(session_count) over (order by step_order) is null then null
    when lag(session_count) over (order by step_order) = 0 then null
    else round(
      (session_count::numeric / lag(session_count) over (order by step_order)::numeric) * 100,
      2
    )
  end as step_to_step_conversion_pct,
  case
    when baseline.baseline_sessions = 0 then null
    else round((session_count::numeric / baseline.baseline_sessions::numeric) * 100, 2)
  end as overall_conversion_pct
from step_counts
cross join baseline
order by step_order;

revoke all on public.product_funnel_session_rollups from anon, authenticated;
revoke all on public.product_funnel_report from anon, authenticated;
