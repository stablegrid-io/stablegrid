import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { listAdminBugReports } from '@/lib/admin/service';

export async function GET() {
  try {
    const { adminSupabase } = await requireAdminAccess();
    const data = await listAdminBugReports(adminSupabase);

    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load bug reports.');
  }
}
