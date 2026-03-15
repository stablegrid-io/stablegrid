create table if not exists public.api_rate_limit_counters (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  last_request_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (scope, key_hash, window_start)
);

create index if not exists idx_api_rate_limit_counters_last_request_at
  on public.api_rate_limit_counters (last_request_at desc);

create or replace function public.apply_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  request_count integer,
  retry_after_seconds integer,
  window_started_at timestamptz,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc'::text, now());
  v_reset_at timestamptz;
  v_row public.api_rate_limit_counters%rowtype;
  v_window_start timestamptz;
begin
  if coalesce(char_length(trim(p_scope)), 0) = 0 then
    raise exception 'p_scope is required';
  end if;

  if coalesce(char_length(trim(p_key_hash)), 0) = 0 then
    raise exception 'p_key_hash is required';
  end if;

  if p_limit < 1 then
    raise exception 'p_limit must be greater than zero';
  end if;

  if p_window_seconds < 1 then
    raise exception 'p_window_seconds must be greater than zero';
  end if;

  v_window_start :=
    to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);

  insert into public.api_rate_limit_counters (
    scope,
    key_hash,
    window_start,
    request_count,
    last_request_at
  )
  values (
    p_scope,
    p_key_hash,
    v_window_start,
    1,
    v_now
  )
  on conflict (scope, key_hash, window_start)
  do update
  set
    request_count = public.api_rate_limit_counters.request_count + 1,
    last_request_at = excluded.last_request_at
  returning * into v_row;

  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  allowed := v_row.request_count <= p_limit;
  request_count := v_row.request_count;
  retry_after_seconds :=
    greatest(0, ceil(extract(epoch from (v_reset_at - v_now)))::integer);
  window_started_at := v_window_start;
  resets_at := v_reset_at;

  return next;
end;
$$;

alter table public.api_rate_limit_counters enable row level security;

create table if not exists public.api_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  owner_hash text not null,
  key_hash text not null,
  request_hash text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  response_status integer check (
    response_status is null
    or (response_status >= 100 and response_status <= 599)
  ),
  response_body jsonb,
  locked_until timestamptz not null default timezone('utc'::text, now()) + interval '10 minutes',
  last_seen_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (scope, owner_hash, key_hash)
);

create index if not exists idx_api_idempotency_keys_status_locked_until
  on public.api_idempotency_keys (status, locked_until);

create index if not exists idx_api_idempotency_keys_created_at
  on public.api_idempotency_keys (created_at desc);

create or replace function public.set_api_idempotency_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_api_idempotency_keys_updated_at on public.api_idempotency_keys;
create trigger trg_api_idempotency_keys_updated_at
before update on public.api_idempotency_keys
for each row
execute function public.set_api_idempotency_keys_updated_at();

alter table public.api_idempotency_keys enable row level security;
