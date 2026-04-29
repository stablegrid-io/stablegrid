-- Capture the user's submitted code and the output their run produced for
-- each practice-task attempt. Lets the validator (server-side or analytics)
-- replay an attempt, and lets us debug "why was this marked failure" cases
-- without the user re-running.
--
-- Both columns are nullable: legacy rows pre-dating this migration have no
-- code/output, and self-review attempts may legitimately have no captured
-- output (e.g. the user hit Check before pressing Run).

alter table public.practice_task_attempts
  add column if not exists code   text,
  add column if not exists output text;
