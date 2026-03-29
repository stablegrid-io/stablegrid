import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { enforceAdminReadRateLimit } from '@/lib/admin/protection';
import { getTheoryDocForAdmin, listTheoryDocSummaries } from '@/lib/admin/theory';

export async function GET(request: Request) {
  try {
    const { user } = await requireAdminAccess('content_admin');
    await enforceAdminReadRateLimit(request, user.id, 'admin_theory_docs');
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    if (topic) {
      const data = await getTheoryDocForAdmin(topic);
      return NextResponse.json({ data });
    }

    const data = await listTheoryDocSummaries();
    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load theory docs.');
  }
}
