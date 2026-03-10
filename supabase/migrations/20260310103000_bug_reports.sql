create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  title text not null,
  details text not null,
  page_url text,
  user_agent text,
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (char_length(title) between 5 and 160),
  check (char_length(details) between 10 and 4000),
  check (status in ('new', 'triaged', 'resolved'))
);

create index if not exists idx_bug_reports_user_time
  on public.bug_reports (user_id, created_at desc);

create index if not exists idx_bug_reports_status_time
  on public.bug_reports (status, created_at desc);

create or replace function public.set_bug_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_bug_reports_updated_at on public.bug_reports;
create trigger trg_bug_reports_updated_at
before update on public.bug_reports
for each row
execute function public.set_bug_reports_updated_at();

alter table public.bug_reports enable row level security;

drop policy if exists own_bug_reports_insert on public.bug_reports;
create policy own_bug_reports_insert
on public.bug_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists own_bug_reports_select on public.bug_reports;
create policy own_bug_reports_select
on public.bug_reports
for select
to authenticated
using (auth.uid() = user_id);
