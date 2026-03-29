import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { enforceAdminReadRateLimit } from '@/lib/admin/protection';
import { listAdminAuditLogs } from '@/lib/admin/service';

export async function GET(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    await enforceAdminReadRateLimit(request, user.id, 'admin_audit');
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit') ?? '50');
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;
    const data = await listAdminAuditLogs(adminSupabase, limit);

    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load audit log.');
  }
}
