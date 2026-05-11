-- Hardening for public.energy_events.
--
-- Three additional CHECK constraints surfaced during the post-ship audit
-- of the energy-events feature:
--   1. `client_id` was text without a length bound. The API route caps
--      at 64 chars, but anyone bypassing the route (direct PostgREST
--      with RLS) could write arbitrarily long strings.
--   2. `units > 0` was only enforced client-side (the addXP guard) and
--      the API route (`units >= 0` in the route schema). Zero-units
--      events would still pass DB validation and clutter the chart;
--      pull the floor up to match the chart's "generation" semantics.
--   3. `ts` had no bound. Clock-skewed or malicious clients could write
--      events years in the future, breaking the chart's range math. We
--      bound to a 5-year window backwards and 1 day forwards relative
--      to insert time.

alter table public.energy_events
  drop constraint if exists energy_events_units_check;

alter table public.energy_events
  add constraint energy_events_units_check
  check (units > 0 and units <= 10000);

alter table public.energy_events
  add constraint energy_events_client_id_length_check
  check (length(client_id) between 1 and 128);

alter table public.energy_events
  add constraint energy_events_ts_reasonable_check
  check (
    ts >= (timezone('utc'::text, now()) - interval '5 years')
    and ts <= (timezone('utc'::text, now()) + interval '1 day')
  );
