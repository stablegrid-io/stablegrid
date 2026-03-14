import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { logAdminAudit, updateAdminTrack } from '@/lib/admin/service';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;
    if (!trackId) {
      return NextResponse.json({ error: 'Track id is required.' }, { status: 400 });
    }

    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const result = await updateAdminTrack({
      supabase: adminSupabase,
      trackId,
      input: {
        title: typeof payload.title === 'string' ? payload.title : undefined,
        isActive:
          typeof payload.isActive === 'boolean' ? payload.isActive : undefined
      }
    });

    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      entityType: 'track',
      entityId: trackId,
      action: 'track_updated',
      beforeState: result.before,
      afterState: result.after
    });

    return NextResponse.json({ data: result.after });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to update track.');
  }
}
