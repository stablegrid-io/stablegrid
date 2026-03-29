import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { toAdminErrorResponse } from '@/lib/admin/http';
import { enforceAdminReadRateLimit } from '@/lib/admin/protection';
import { listAdminAnalytics } from '@/lib/admin/service';
import type { AdminAnalyticsPeriod } from '@/lib/admin/types';

export async function GET(request: Request) {
  try {
    const { adminSupabase, user } = await requireAdminAccess();
    await enforceAdminReadRateLimit(request, user.id, 'admin_analytics');
    const url = new URL(request.url);
    const requestedPeriod = url.searchParams.get('period');
    const period: AdminAnalyticsPeriod | undefined =
      requestedPeriod === 'all_time' ||
      requestedPeriod === 'monthly' ||
      requestedPeriod === 'weekly' ||
      requestedPeriod === 'daily'
        ? requestedPeriod
        : undefined;
    const data = await listAdminAnalytics(adminSupabase, {
      period
    });

    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load admin analytics.');
  }
}
