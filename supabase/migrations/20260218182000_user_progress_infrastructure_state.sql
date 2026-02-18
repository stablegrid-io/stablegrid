-- Persist StableGrid infrastructure deployment state per user.

alter table public.user_progress
  add column if not exists deployed_node_ids text[] not null default '{control-center}',
  add column if not exists last_deployed_node_id text;

update public.user_progress
set deployed_node_ids = array['control-center']::text[]
where deployed_node_ids is null
   or cardinality(deployed_node_ids) = 0;

update public.user_progress
set last_deployed_node_id = null
where last_deployed_node_id is not null
  and not (last_deployed_node_id = any(deployed_node_ids));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_progress_deployed_nodes_not_empty'
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_deployed_nodes_not_empty
      CHECK (cardinality(deployed_node_ids) > 0);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_progress_last_deployed_in_deployed_nodes'
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_last_deployed_in_deployed_nodes
      CHECK (
        last_deployed_node_id IS NULL
        OR last_deployed_node_id = ANY(deployed_node_ids)
      );
  END IF;
END;
$$;
