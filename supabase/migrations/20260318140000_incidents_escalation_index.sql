-- Add a covering index for the escalation query that runs on every grid-ops state fetch.
--
-- Query pattern (from incidentEngine.ts escalateExpiredIncidents):
--   SELECT id, severity
--   FROM incidents
--   WHERE user_id = $1
--     AND scenario_id = $2
--     AND resolved_at IS NULL
--     AND escalates_at < now()
--
-- The existing incidents_active_asset index covers (user_id, scenario_id, asset_id)
-- WHERE resolved_at IS NULL but cannot satisfy the escalates_at range predicate,
-- forcing Postgres to re-filter the matched rows.  This index makes the timestamp
-- comparison index-native and avoids any heap re-check for the escalation scan.

create index if not exists incidents_escalation
  on public.incidents(user_id, scenario_id, escalates_at)
  where resolved_at is null;
