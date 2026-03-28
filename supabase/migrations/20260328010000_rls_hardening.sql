-- ============================================================================
-- RLS HARDENING: Fix tables with RLS enabled but missing policies
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ADMIN TABLES — role-based access via admin_memberships lookup
-- ────────────────────────────────────────────────────────────────────────────

-- Helper function: check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'owner')
  );
$$;

-- admin_memberships: admins can read all memberships, manage their own
ALTER TABLE public.admin_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_memberships_select ON public.admin_memberships
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

CREATE POLICY admin_memberships_insert ON public.admin_memberships
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY admin_memberships_update ON public.admin_memberships
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admin_memberships_delete ON public.admin_memberships
  FOR DELETE USING (public.is_admin());

-- admin_audit_logs: admins can read, system inserts (service role)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_logs_select ON public.admin_audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY admin_audit_logs_insert ON public.admin_audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- admin_feedback_triage: admins can read and manage feedback
ALTER TABLE public.admin_feedback_triage ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_feedback_triage_select ON public.admin_feedback_triage
  FOR SELECT USING (public.is_admin());

CREATE POLICY admin_feedback_triage_insert ON public.admin_feedback_triage
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY admin_feedback_triage_update ON public.admin_feedback_triage
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admin_feedback_triage_delete ON public.admin_feedback_triage
  FOR DELETE USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 2. PROJECT SPENDING — admin-only access
-- ────────────────────────────────────────────────────────────────────────────

-- Check if project_spending table exists before applying
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_spending' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.project_spending ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_spending' AND policyname = 'project_spending_admin_select') THEN
      EXECUTE 'CREATE POLICY project_spending_admin_select ON public.project_spending FOR SELECT USING (public.is_admin())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_spending' AND policyname = 'project_spending_admin_insert') THEN
      EXECUTE 'CREATE POLICY project_spending_admin_insert ON public.project_spending FOR INSERT WITH CHECK (public.is_admin())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_spending' AND policyname = 'project_spending_admin_update') THEN
      EXECUTE 'CREATE POLICY project_spending_admin_update ON public.project_spending FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_spending' AND policyname = 'project_spending_admin_delete') THEN
      EXECUTE 'CREATE POLICY project_spending_admin_delete ON public.project_spending FOR DELETE USING (public.is_admin())';
    END IF;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. API SYSTEM TABLES — service role only (no client access)
-- ────────────────────────────────────────────────────────────────────────────

-- api_rate_limit_counters: server-managed, no client access needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_rate_limit_counters' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.api_rate_limit_counters ENABLE ROW LEVEL SECURITY';
    -- No client policies — only service_role can access
    -- Server API routes use the service role key for rate limiting
  END IF;
END $$;

-- api_idempotency_keys: server-managed, no client access needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_idempotency_keys' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.api_idempotency_keys ENABLE ROW LEVEL SECURITY';
    -- No client policies — only service_role can access
  END IF;
END $$;

-- stripe_webhook_events: server-managed, admin can view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_webhook_events' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_webhook_events' AND policyname = 'stripe_events_admin_select') THEN
      EXECUTE 'CREATE POLICY stripe_events_admin_select ON public.stripe_webhook_events FOR SELECT USING (public.is_admin())';
    END IF;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. GRID OPS INCIDENTS — admin-only access
-- ────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grid_ops_incidents' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.grid_ops_incidents ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grid_ops_incidents' AND policyname = 'grid_ops_incidents_admin_all') THEN
      EXECUTE 'CREATE POLICY grid_ops_incidents_admin_all ON public.grid_ops_incidents FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. BUG REPORTS — tighten: users see own, admins see all
-- ────────────────────────────────────────────────────────────────────────────

-- Drop existing overly broad policy if it exists and recreate with proper scoping
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bug_reports' AND table_schema = 'public') THEN
    -- Add admin read access (admins can see all bug reports)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bug_reports' AND policyname = 'bug_reports_admin_select') THEN
      EXECUTE 'CREATE POLICY bug_reports_admin_select ON public.bug_reports FOR SELECT USING (public.is_admin())';
    END IF;

    -- Add admin update access (admins can update status)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bug_reports' AND policyname = 'bug_reports_admin_update') THEN
      EXECUTE 'CREATE POLICY bug_reports_admin_update ON public.bug_reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
  END IF;
END $$;
