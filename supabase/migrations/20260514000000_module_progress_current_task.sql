-- Add current_task_id to module_progress so practice-side resume mirrors
-- reading-side (current_lesson_id). Set on every task navigation by
-- PracticeSetViewer; read at page load to open the user back where they
-- were. NULL is the legacy state and resolves to "start at task 0" on the
-- client.

alter table public.module_progress
  add column if not exists current_task_id text;

comment on column public.module_progress.current_task_id is
  'Practice-side cursor — the task the user was last on. Mirrors current_lesson_id which is reading-side.';
