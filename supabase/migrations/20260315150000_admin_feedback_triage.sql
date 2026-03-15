create table if not exists public.admin_feedback_triage (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('bug_report', 'lightbulb_feedback')),
  source_id uuid not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'resolved', 'ignored')),
  admin_notes text not null default '',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (source_type, source_id),
  check (char_length(admin_notes) <= 4000)
);

create index if not exists idx_admin_feedback_triage_source_status_updated
  on public.admin_feedback_triage (source_type, status, updated_at desc);

create or replace function public.set_admin_feedback_triage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_admin_feedback_triage_updated_at on public.admin_feedback_triage;
create trigger trg_admin_feedback_triage_updated_at
before update on public.admin_feedback_triage
for each row
execute function public.set_admin_feedback_triage_updated_at();

alter table public.admin_feedback_triage enable row level security;
