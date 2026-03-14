import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { listAdminCatalog } from '@/lib/admin/service';

export async function GET() {
  try {
    const { adminSupabase } = await requireAdminAccess();
    const data = await listAdminCatalog(adminSupabase);

    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load admin catalog.');
  }
}
