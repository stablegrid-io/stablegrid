import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { getActivationBoardData } from '@/lib/activation/service';
import { getAdminUserProfile } from '@/lib/admin/service';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
    }

    const { adminSupabase } = await requireAdminAccess();
    const [user, board] = await Promise.all([
      getAdminUserProfile(adminSupabase, userId),
      getActivationBoardData({
        supabase: adminSupabase,
        userId,
        shouldReconcile: true
      })
    ]);

    return NextResponse.json({
      data: {
        user,
        board
      }
    });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load activation board.');
  }
}
