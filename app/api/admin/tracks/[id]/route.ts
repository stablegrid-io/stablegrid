import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { runAdminProtectedMutation } from '@/lib/admin/protection';
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
    const requestBody = {
      trackId,
      title: typeof payload.title === 'string' ? payload.title : null,
      isActive:
        typeof payload.isActive === 'boolean' ? payload.isActive : null
    };

    const response = await runAdminProtectedMutation({
      request,
      adminUserId: user.id,
      scope: 'admin_track_update',
      requestBody,
      execute: async () => {
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

        return {
          body: { data: result.after },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to update track.');
  }
}
