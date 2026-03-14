import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { logAdminAudit, reorderAdminContentItems } from '@/lib/admin/service';

export async function PATCH(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const orderedItemIds = Array.isArray(payload.orderedItemIds)
      ? payload.orderedItemIds.filter(
          (value): value is string => typeof value === 'string'
        )
      : [];

    const result = await reorderAdminContentItems({
      supabase: adminSupabase,
      trackId: String(payload.trackId ?? ''),
      contentType: payload.contentType as
        | 'theory_module'
        | 'flashcard'
        | 'notebook'
        | 'mission',
      orderedItemIds
    });

    const entityId = `${String(payload.trackId ?? '')}:${String(payload.contentType ?? '')}`;
    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      entityType: 'content_item_order',
      entityId,
      action: 'content_items_reordered',
      beforeState: result.before,
      afterState: result.after
    });

    return NextResponse.json({ data: result.after });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to reorder content items.');
  }
}
