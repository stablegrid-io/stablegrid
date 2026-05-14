import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { enforceAdminReadRateLimit } from '@/lib/admin/protection';
import { getAdminCustomerProgressDetail } from '@/lib/admin/service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    await enforceAdminReadRateLimit(request, user.id, 'admin_customer_progress');

    const targetUserId = params.userId;
    if (!targetUserId || !UUID_RE.test(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
    }

    const data = await getAdminCustomerProgressDetail(adminSupabase, targetUserId);
    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load customer progress.');
  }
}
