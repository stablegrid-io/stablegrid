import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { enforceAdminReadRateLimit } from '@/lib/admin/protection';
import { listAdminCustomers } from '@/lib/admin/service';

export async function GET(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    await enforceAdminReadRateLimit(request, user.id, 'admin_customers');
    const data = await listAdminCustomers(adminSupabase);

    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load customers.');
  }
}
