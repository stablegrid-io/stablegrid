import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { searchAdminUsers } from '@/lib/admin/service';

export async function GET(request: Request) {
  try {
    const { adminSupabase } = await requireAdminAccess();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';
    const data = await searchAdminUsers(adminSupabase, query);

    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to search users.');
  }
}
