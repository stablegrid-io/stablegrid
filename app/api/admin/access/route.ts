import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { enforceAdminReadRateLimit } from '@/lib/admin/protection';

export async function GET(request: Request) {
  try {
    const access = await requireAdminAccess();
    await enforceAdminReadRateLimit(request, access.user.id, 'admin_access');

    return NextResponse.json({
      data: {
        enabled: true,
        role: access.role
      }
    });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to verify admin access.');
  }
}
