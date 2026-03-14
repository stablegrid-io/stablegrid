import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { logAdminAudit, upsertAdminContentItem } from '@/lib/admin/service';

const toBoolean = (value: unknown, defaultValue = true) =>
  typeof value === 'boolean' ? value : defaultValue;

export async function POST(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);

    const result = await upsertAdminContentItem({
      supabase: adminSupabase,
      input: {
        trackId: String(payload.trackId ?? ''),
        contentType: payload.contentType as
          | 'theory_module'
          | 'flashcard'
          | 'notebook'
          | 'mission',
        sourceRef: String(payload.sourceRef ?? ''),
        title: String(payload.title ?? ''),
        sequenceOrder: Number(payload.sequenceOrder ?? 0),
        isActive: toBoolean(payload.isActive, true)
      }
    });

    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      entityType: 'content_item',
      entityId: result.after.id,
      action: 'content_item_created',
      beforeState: result.before,
      afterState: result.after
    });

    return NextResponse.json({ data: result.after }, { status: 201 });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to create content item.');
  }
}

export async function PATCH(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const contentItemId = typeof payload.id === 'string' ? payload.id : '';

    const result = await upsertAdminContentItem({
      supabase: adminSupabase,
      input: {
        id: contentItemId,
        trackId: String(payload.trackId ?? ''),
        contentType: payload.contentType as
          | 'theory_module'
          | 'flashcard'
          | 'notebook'
          | 'mission',
        sourceRef: String(payload.sourceRef ?? ''),
        title: String(payload.title ?? ''),
        sequenceOrder: Number(payload.sequenceOrder ?? 0),
        isActive: toBoolean(payload.isActive, true)
      }
    });

    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      entityType: 'content_item',
      entityId: result.after.id,
      action: 'content_item_updated',
      beforeState: result.before,
      afterState: result.after
    });

    return NextResponse.json({ data: result.after });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to update content item.');
  }
}
