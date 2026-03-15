import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';
import { runAdminProtectedMutation } from '@/lib/admin/protection';
import { logAdminAudit, updateAdminBugReportStatus } from '@/lib/admin/service';
import type { AdminBugStatusDb } from '@/lib/admin/types';

const toBugStatus = (value: unknown): AdminBugStatusDb | null => {
  if (value === 'new' || value === 'triaged' || value === 'resolved') {
    return value;
  }

  if (value === 'New') {
    return 'new';
  }

  if (value === 'In Review') {
    return 'triaged';
  }

  if (value === 'Resolved') {
    return 'resolved';
  }

  return null;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Bug report id is required.' }, { status: 400 });
    }

    const { adminSupabase, user } = await requireAdminAccess();
    const payload = await parseJsonBody(request);
    const nextStatus = toBugStatus(payload.status);

    if (!nextStatus) {
      return NextResponse.json({ error: 'Bug status is invalid.' }, { status: 422 });
    }
    const requestBody = {
      reportId,
      status: nextStatus
    };

    const response = await runAdminProtectedMutation({
      request,
      adminUserId: user.id,
      scope: 'admin_bug_status_update',
      requestBody,
      execute: async () => {
        const result = await updateAdminBugReportStatus({
          supabase: adminSupabase,
          reportId,
          status: nextStatus
        });

        await logAdminAudit({
          supabase: adminSupabase,
          actorUserId: user.id,
          targetUserId: null,
          entityType: 'bug_report',
          entityId: reportId,
          action: 'bug_report_status_updated',
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
    return toAdminErrorResponse(error, 'Failed to update bug report.');
  }
}
