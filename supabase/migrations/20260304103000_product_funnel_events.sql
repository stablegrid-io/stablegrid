-- Product funnel analytics for landing, onboarding, learning, practice, and Grid Ops activation.

create table if not exists public.product_funnel_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  check (char_length(session_id) >= 8)
);

alter table public.product_funnel_events enable row level security;

drop policy if exists own_product_funnel_events_select on public.product_funnel_events;
create policy own_product_funnel_events_select
on public.product_funnel_events
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists authenticated_product_funnel_events_insert on public.product_funnel_events;
create policy authenticated_product_funnel_events_insert
on public.product_funnel_events
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists anonymous_product_funnel_events_insert on public.product_funnel_events;
create policy anonymous_product_funnel_events_insert
on public.product_funnel_events
for insert
to anon
with check (user_id is null);

create index if not exists idx_product_funnel_events_event_time
  on public.product_funnel_events (event_name, occurred_at desc);

create index if not exists idx_product_funnel_events_user_time
  on public.product_funnel_events (user_id, occurred_at desc);

create index if not exists idx_product_funnel_events_session_time
  on public.product_funnel_events (session_id, occurred_at desc);
