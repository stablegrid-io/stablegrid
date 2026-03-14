import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';

export async function GET() {
  try {
    const access = await requireAdminAccess();

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
