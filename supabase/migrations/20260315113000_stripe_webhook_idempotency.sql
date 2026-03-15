create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  customer_id text,
  subscription_id text,
  status text not null default 'processing' check (status in ('processing', 'processed', 'skipped', 'failed')),
  skip_reason text,
  error_message text,
  event_created_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_stripe_webhook_events_created_at
  on public.stripe_webhook_events (event_created_at desc);

create index if not exists idx_stripe_webhook_events_status
  on public.stripe_webhook_events (status, event_created_at desc);

create or replace function public.set_stripe_webhook_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_stripe_webhook_events_updated_at on public.stripe_webhook_events;
create trigger trg_stripe_webhook_events_updated_at
before update on public.stripe_webhook_events
for each row
execute function public.set_stripe_webhook_events_updated_at();

alter table public.stripe_webhook_events enable row level security;

alter table public.subscriptions
  add column if not exists stripe_last_event_id text,
  add column if not exists stripe_last_event_created_at timestamptz;

create index if not exists idx_subscriptions_stripe_customer_id
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
