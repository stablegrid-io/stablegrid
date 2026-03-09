-- Persist cookie consent choices in Supabase so authenticated users keep settings across devices.

create table if not exists public.cookie_consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version integer not null default 1 check (version > 0),
  source text not null default 'preferences_save',
  consent jsonb not null default '{
    "necessary": true,
    "analytics": false,
    "marketing": false,
    "preferences": false
  }'::jsonb,
  consented_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (
    source in (
      'banner_accept_all',
      'banner_reject_all',
      'preferences_save',
      'preferences_accept_all',
      'preferences_reject_all'
    )
  ),
  check (jsonb_typeof(consent) = 'object'),
  check (
    consent ? 'necessary'
    and jsonb_typeof(consent -> 'necessary') = 'boolean'
    and (consent ->> 'necessary')::boolean = true
  ),
  check (consent ? 'analytics' and jsonb_typeof(consent -> 'analytics') = 'boolean'),
  check (consent ? 'marketing' and jsonb_typeof(consent -> 'marketing') = 'boolean'),
  check (consent ? 'preferences' and jsonb_typeof(consent -> 'preferences') = 'boolean')
);

create or replace function public.set_cookie_consents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_cookie_consents_updated_at on public.cookie_consents;
create trigger trg_cookie_consents_updated_at
before update on public.cookie_consents
for each row
execute function public.set_cookie_consents_updated_at();

alter table public.cookie_consents enable row level security;

drop policy if exists own_cookie_consents_select on public.cookie_consents;
create policy own_cookie_consents_select
on public.cookie_consents
for select
using (auth.uid() = user_id);

drop policy if exists own_cookie_consents_insert on public.cookie_consents;
create policy own_cookie_consents_insert
on public.cookie_consents
for insert
with check (auth.uid() = user_id);

drop policy if exists own_cookie_consents_update on public.cookie_consents;
create policy own_cookie_consents_update
on public.cookie_consents
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists own_cookie_consents_delete on public.cookie_consents;
create policy own_cookie_consents_delete
on public.cookie_consents
for delete
using (auth.uid() = user_id);

create index if not exists idx_cookie_consents_consented_at
  on public.cookie_consents (consented_at desc);
