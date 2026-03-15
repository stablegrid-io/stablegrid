create or replace function public.cleanup_api_request_protection(
  p_rate_limit_max_age_seconds integer default 86400,
  p_idempotency_max_age_seconds integer default 604800
)
returns table (
  deleted_rate_limit_counters integer,
  deleted_idempotency_keys integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc'::text, now());
  v_rate_limit_cutoff timestamptz;
  v_idempotency_cutoff timestamptz;
begin
  if p_rate_limit_max_age_seconds < 60 then
    raise exception 'p_rate_limit_max_age_seconds must be at least 60';
  end if;

  if p_idempotency_max_age_seconds < 300 then
    raise exception 'p_idempotency_max_age_seconds must be at least 300';
  end if;

  v_rate_limit_cutoff := v_now - make_interval(secs => p_rate_limit_max_age_seconds);
  v_idempotency_cutoff := v_now - make_interval(secs => p_idempotency_max_age_seconds);

  delete from public.api_rate_limit_counters
  where last_request_at < v_rate_limit_cutoff;

  get diagnostics deleted_rate_limit_counters = row_count;

  delete from public.api_idempotency_keys
  where coalesce(completed_at, last_seen_at, created_at) < v_idempotency_cutoff
    or (
      status in ('processing', 'failed')
      and locked_until < v_now - interval '1 hour'
    );

  get diagnostics deleted_idempotency_keys = row_count;

  return next;
end;
$$;
