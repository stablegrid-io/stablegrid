import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { runAdminProtectedMutation } from '@/lib/admin/protection';
import { logAdminAudit } from '@/lib/admin/service';
import { updateTheoryLessonInPublishedDoc } from '@/lib/admin/theory';
import type { ContentBlock } from '@/types/theory';

export async function PATCH(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess('content_admin');
    const payload = await parseJsonBody(request);
    const requestBody = {
      topic: String(payload.topic ?? ''),
      chapterId: String(payload.chapterId ?? ''),
      lessonId: String(payload.lessonId ?? ''),
      title: String(payload.title ?? ''),
      estimatedMinutes: Number(payload.estimatedMinutes ?? 0),
      blocks: Array.isArray(payload.blocks) ? (payload.blocks as ContentBlock[]) : []
    };

    const response = await runAdminProtectedMutation({
      request,
      adminUserId: user.id,
      scope: 'admin_theory_lesson_update',
      requestBody,
      rateLimit: {
        userLimit: 30,
        ipLimit: 60
      },
      execute: async () => {
        const result = await updateTheoryLessonInPublishedDoc(requestBody);

        await logAdminAudit({
          supabase: adminSupabase,
          actorUserId: user.id,
          entityType: 'theory_lesson',
          entityId: `${result.after.topic}:${result.after.lesson.id}`,
          action: 'theory_lesson_updated',
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
    return toAdminErrorResponse(error, 'Failed to update theory lesson.');
  }
}
