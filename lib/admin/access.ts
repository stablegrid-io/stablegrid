import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES, type AdminRole } from '@/lib/admin/types';

const ROLE_PRIORITY: Record<AdminRole, number> = {
  content_admin: 1,
  super_admin: 2
};

interface AdminMembershipRow {
  user_id: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

export interface AdminAccessContext {
  user: {
    id: string;
    email: string | null;
  };
  role: AdminRole;
  sessionSupabase: ReturnType<typeof createClient>;
  adminSupabase: ReturnType<typeof createAdminClient>;
}

export class AdminAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === 'string' && ADMIN_ROLES.includes(value as AdminRole);

const hasRequiredRole = (currentRole: AdminRole, requiredRole: AdminRole | undefined) => {
  if (!requiredRole) {
    return true;
  }

  return ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[requiredRole];
};

export async function requireAdminAccess(requiredRole?: AdminRole) {
  const sessionSupabase = createClient();
  const {
    data: { user },
    error: userError
  } = await sessionSupabase.auth.getUser();

  if (userError || !user) {
    throw new AdminAccessError('Unauthorized', 401);
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('admin_memberships')
    .select('user_id,role,created_at,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const membership = data as AdminMembershipRow | null;
  if (!membership || !isAdminRole(membership.role)) {
    throw new AdminAccessError('Forbidden', 403);
  }

  if (!hasRequiredRole(membership.role, requiredRole)) {
    throw new AdminAccessError('Forbidden', 403);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null
    },
    role: membership.role,
    sessionSupabase,
    adminSupabase
  } satisfies AdminAccessContext;
}
