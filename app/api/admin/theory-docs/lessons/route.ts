import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { logAdminAudit } from '@/lib/admin/service';
import { updateTheoryLessonInPublishedDoc } from '@/lib/admin/theory';
import type { ContentBlock } from '@/types/theory';

export async function PATCH(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess('content_admin');
    const payload = await parseJsonBody(request);

    const result = await updateTheoryLessonInPublishedDoc({
      topic: String(payload.topic ?? ''),
      chapterId: String(payload.chapterId ?? ''),
      lessonId: String(payload.lessonId ?? ''),
      title: String(payload.title ?? ''),
      estimatedMinutes: Number(payload.estimatedMinutes ?? 0),
      blocks: Array.isArray(payload.blocks) ? (payload.blocks as ContentBlock[]) : []
    });

    await logAdminAudit({
      supabase: adminSupabase,
      actorUserId: user.id,
      entityType: 'theory_lesson',
      entityId: `${result.after.topic}:${result.after.lesson.id}`,
      action: 'theory_lesson_updated',
      beforeState: result.before,
      afterState: result.after
    });

    return NextResponse.json({ data: result.after });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to update theory lesson.');
  }
}
