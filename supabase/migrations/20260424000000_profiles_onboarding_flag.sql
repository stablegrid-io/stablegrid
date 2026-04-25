-- Explicit onboarding_completed flag on profiles.
--
-- Previously, completion was inferred by the presence of a topic_progress row
-- (see app/onboarding/page.tsx). That's fragile: a user who resets progress
-- would be dropped back into the onboarding flow. This migration adds an
-- explicit flag + timestamp and backfills it for every user with prior
-- activity, so the existing base skips onboarding post-deploy.
--
-- The activity check remains as an OR-fallback in the server gate for one
-- release cycle to cover users whose activity rows were pruned before the
-- backfill ran.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

-- Backfill active users. Guard with to_regclass so fresh-install replays don't
-- fail if topic_progress / user_progress don't yet exist at this point.
do $$
begin
  if to_regclass('public.topic_progress') is not null then
    update public.profiles p
    set onboarding_completed = true,
        onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
    where exists (
      select 1 from public.topic_progress tp where tp.user_id = p.id
    );
  end if;

  if to_regclass('public.user_progress') is not null then
    update public.profiles p
    set onboarding_completed = true,
        onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
    where onboarding_completed = false
      and exists (
        select 1 from public.user_progress up
        where up.user_id = p.id
          and (
            coalesce(up.xp, 0) > 0
            or coalesce(array_length(up.completed_questions, 1), 0) > 0
          )
      );
  end if;
end $$;

create index if not exists idx_profiles_onboarding_incomplete
  on public.profiles (id)
  where onboarding_completed = false;
