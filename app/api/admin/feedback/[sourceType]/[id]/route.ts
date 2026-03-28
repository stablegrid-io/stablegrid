import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { runAdminProtectedMutation } from '@/lib/admin/protection';
import { logAdminAudit, updateAdminFeedbackRecord } from '@/lib/admin/service';
import type { AdminFeedbackSourceType, AdminFeedbackStatus } from '@/lib/admin/types';

const toFeedbackSourceType = (value: unknown): AdminFeedbackSourceType | null => {
  if (value === 'bug_report' || value === 'lightbulb_feedback') {
    return value;
  }

  return null;
};

const toFeedbackStatus = (value: unknown): AdminFeedbackStatus | null => {
  if (
    value === 'Submitted' ||
    value === 'Reviewed' ||
    value === 'Resolved' ||
    value === 'Ignored'
  ) {
    return value;
  }

  return null;
};

export async function PATCH(
  request: Request,
  { params }: { params: { sourceType: string; id: string } }
) {
  try {
    const sourceType = toFeedbackSourceType(params.sourceType);
    const sourceId = params.id;

    if (!sourceType) {
      return NextResponse.json(
        { error: 'Feedback source type is invalid.' },
        { status: 422 }
      );
    }

    if (!sourceId) {
      return NextResponse.json({ error: 'Feedback id is required.' }, { status: 400 });
    }

    const payload = await parseJsonBody(request);
    const status = toFeedbackStatus(payload.status);
    const internalNotes =
      typeof payload.internalNotes === 'string' ? payload.internalNotes.slice(0, 10_000) : '';

    if (!status) {
      return NextResponse.json({ error: 'Feedback status is invalid.' }, { status: 422 });
    }

    const { adminSupabase, user } = await requireAdminAccess();
    const requestBody = {
      sourceType,
      sourceId,
      status,
      internalNotes
    };

    const response = await runAdminProtectedMutation({
      request,
      adminUserId: user.id,
      scope: 'admin_feedback_update',
      requestBody,
      execute: async () => {
        const result = await updateAdminFeedbackRecord({
          supabase: adminSupabase,
          actorUserId: user.id,
          sourceId,
          sourceType,
          status,
          adminNotes: internalNotes
        });

        await logAdminAudit({
          supabase: adminSupabase,
          actorUserId: user.id,
          targetUserId: null,
          entityType: 'feedback_record',
          entityId: `${sourceType}:${sourceId}`,
          action: 'feedback_record_updated',
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
    return toAdminErrorResponse(error, 'Failed to update feedback record.');
  }
}
