import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { runAdminProtectedMutation } from '@/lib/admin/protection';
import { logAdminAudit, reorderAdminContentItems } from '@/lib/admin/service';

export async function PATCH(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const trackId = String(payload.trackId ?? '');
    const contentType = payload.contentType as
      | 'theory_module'
      | 'flashcard'
      | 'notebook'
      | 'mission';
    const orderedItemIds = Array.isArray(payload.orderedItemIds)
      ? payload.orderedItemIds.filter(
          (value): value is string => typeof value === 'string'
        )
      : [];
    const requestBody = {
      trackId,
      contentType,
      orderedItemIds
    };

    const response = await runAdminProtectedMutation({
      request,
      adminUserId: user.id,
      scope: 'admin_content_item_reorder',
      requestBody,
      execute: async () => {
        const result = await reorderAdminContentItems({
          supabase: adminSupabase,
          trackId,
          contentType,
          orderedItemIds
        });

        const entityId = `${trackId}:${String(contentType ?? '')}`;
        await logAdminAudit({
          supabase: adminSupabase,
          actorUserId: user.id,
          entityType: 'content_item_order',
          entityId,
          action: 'content_items_reordered',
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
    return toAdminErrorResponse(error, 'Failed to reorder content items.');
  }
}
