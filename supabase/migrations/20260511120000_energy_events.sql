-- Server-side persistence for the kWh event log that powers the
-- /home Generation chart.
--
-- Until now this log lived only in localStorage (Zustand persist on
-- `stablegrid-progress`). The aggregate balance (user_progress.xp) was
-- always durable, but the per-event series — the curve the operator
-- actually sees on the chart — would visually "disappear" when an
-- operator signed in from another device, cleared site data, or used
-- incognito. This migration moves the series itself into Supabase so
-- the chart history follows the account, not the browser.

create table if not exists public.energy_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The event's logical timestamp (when the kWh were earned on the
  -- client). We use a separate `ts` rather than `created_at` so a
  -- client that batches multiple events in one POST can still
  -- represent the moment each one fired.
  ts timestamptz not null,
  source text not null,
  units numeric(10,2) not null check (units >= 0 and units <= 10000),
  label text,
  topic text,
  -- Stable client-supplied dedupe key. Combined with user_id this
  -- prevents replays from inserting duplicate rows; the client uses
  -- its in-store `EnergyEvent.id` (UUID) verbatim.
  client_id text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, client_id)
);

create index if not exists idx_energy_events_user_ts
  on public.energy_events (user_id, ts desc);

alter table public.energy_events enable row level security;

drop policy if exists own_energy_events_insert on public.energy_events;
create policy own_energy_events_insert
  on public.energy_events for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists own_energy_events_select on public.energy_events;
create policy own_energy_events_select
  on public.energy_events for select to authenticated
  using (auth.uid() = user_id);

-- No update / delete policies — events are append-only by design.
-- (Admin readers go through the service-role client.)
