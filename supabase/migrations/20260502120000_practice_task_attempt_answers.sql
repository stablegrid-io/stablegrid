-- Capture the per-field MCQ answers the user submitted on each practice
-- task attempt, so the recorded `result` is auditable rather than
-- client-asserted. Three downstream uses:
--   1. Server-side validation — the route handler computes success/failure
--      from the submitted answers + the registry's correctAnswer, and only
--      then writes the row. Closes the trust gap where a tampered client
--      could POST result='success' for any task.
--   2. Post-hoc review — show the user what they answered and where they
--      diverged, even after they navigate away.
--   3. Analytics — which distractors are most commonly chosen, per task.
--
-- Shape: { "<fieldId>": { "value": "<submitted text>", "isCorrect": <bool> } }
--
-- Nullable: legacy attempts predating this migration have no captured
-- answers, and code tasks (write_the_code) have no MCQ fields to capture.

alter table public.practice_task_attempts
  add column if not exists answers jsonb;

-- Lightweight expression index so analytics queries that filter on
-- "rows with captured answers" stay cheap even as the table grows.
-- We don't index inside the JSON shape itself — per-field analytics will
-- run as ad-hoc queries against jsonb path operators.
create index if not exists idx_practice_attempts_with_answers
  on public.practice_task_attempts ((answers is not null))
  where answers is not null;
