-- Fix admin role mismatch: is_admin() must match the CHECK constraint
-- on admin_memberships.role which only allows ('content_admin', 'super_admin')

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = auth.uid()
      AND role IN ('content_admin', 'super_admin')
  );
$$;
