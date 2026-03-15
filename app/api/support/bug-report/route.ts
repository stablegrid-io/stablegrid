import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 160;
const DETAILS_MIN_LENGTH = 10;
const DETAILS_MAX_LENGTH = 4000;
const PAGE_URL_MAX_LENGTH = 500;
const USER_AGENT_MAX_LENGTH = 500;
const CONTEXT_FIELD_MAX_LENGTH = 48;

const CATEGORY_LABELS = {
  ui_visual: 'UI / visual glitch',
  navigation: 'Navigation / redirect issue',
  data_progress: 'Data / progress issue',
  performance: 'Performance / slow behavior',
  auth_account: 'Auth / account issue',
  billing: 'Billing / subscription issue',
  crash_error: 'Crash / error message',
  other: 'Other'
} as const;

const AREA_LABELS = {
  home: 'Home / Dashboard',
  theory: 'Learn / Theory',
  tasks: 'Tasks',
  missions: 'Missions',
  practice: 'Practice / Notebooks',
  grid_ops: 'Grid Ops / Energy',
  settings: 'Settings / Billing',
  auth: 'Login / Signup',
  other: 'Other'
} as const;

const toCleanString = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, maxLength);
};

const parseRequiredOption = <T extends Record<string, string>>(
  input: unknown,
  allowedMap: T
): keyof T | null => {
  const value = toCleanString(input, CONTEXT_FIELD_MAX_LENGTH) as keyof T;
  if (value in allowedMap) {
    return value;
  }
  return null;
};

const isValidRouteOrUrl = (value: string) => /^\/|^https?:\/\//i.test(value);

interface BugReportPayload {
  area: keyof typeof AREA_LABELS;
  category: keyof typeof CATEGORY_LABELS;
  details: string;
  pageUrl: string | null;
  title: string;
}

const parseBugReportPayload = async (request: Request) => {
  const payload = await parseJsonObject(request, 'Invalid JSON payload.');
  const title = toCleanString(payload.title, TITLE_MAX_LENGTH);
  const details = toCleanString(payload.details, DETAILS_MAX_LENGTH);
  const pageUrlRaw = toCleanString(payload?.pageUrl, PAGE_URL_MAX_LENGTH);
  const pageUrl = pageUrlRaw.length > 0 ? pageUrlRaw : null;

  if (title.length < TITLE_MIN_LENGTH) {
    throw new ApiRouteError(
      `Summary must be at least ${TITLE_MIN_LENGTH} characters.`,
      400
    );
  }

  if (details.length < DETAILS_MIN_LENGTH) {
    throw new ApiRouteError(
      `Details must be at least ${DETAILS_MIN_LENGTH} characters.`,
      400
    );
  }

  if (pageUrl && !isValidRouteOrUrl(pageUrl)) {
    throw new ApiRouteError('Page route must start with "/" or "http(s)://".', 400);
  }

  const context =
    payload.context && typeof payload.context === 'object'
      ? (payload.context as Record<string, unknown>)
      : {};
  const category = parseRequiredOption(context.category, CATEGORY_LABELS);
  const area = parseRequiredOption(context.area, AREA_LABELS);

  if (!category) {
    throw new ApiRouteError('Category is required.', 400);
  }
  if (!area) {
    throw new ApiRouteError('Affected area is required.', 400);
  }

  return {
    area,
    category,
    details,
    pageUrl,
    title
  } satisfies BugReportPayload;
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new ApiRouteError('Unauthorized', 401);
    }

    const payload = await parseBugReportPayload(request);
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'support_bug_report_user',
        key: user.id,
        limit: 4,
        windowSeconds: 60 * 60
      }),
      enforceRateLimit({
        scope: 'support_bug_report_ip',
        key: clientIp,
        limit: 8,
        windowSeconds: 60 * 60
      })
    ]);

    const detailsWithContext = [
      payload.details,
      '[Structured context]',
      `Category: ${CATEGORY_LABELS[payload.category]}`,
      `Area: ${AREA_LABELS[payload.area]}`
    ]
      .join('\n')
      .slice(0, DETAILS_MAX_LENGTH);

    const userAgent = toCleanString(
      request.headers.get('user-agent'),
      USER_AGENT_MAX_LENGTH
    );

    const response = await runIdempotentJsonRequest({
      scope: 'support_bug_report',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: {
        category: payload.category,
        area: payload.area,
        pageUrl: payload.pageUrl,
        title: payload.title,
        details: payload.details
      },
      execute: async () => {
        const { data, error } = await supabase
          .from('bug_reports')
          .insert({
            user_id: user.id,
            email: user.email ?? '',
            title: payload.title,
            details: detailsWithContext,
            page_url: payload.pageUrl,
            user_agent: userAgent || null
          })
          .select('id')
          .single();

        if (error) {
          throw new ApiRouteError(error.message, 500);
        }

        return {
          body: { reported: true, id: data.id },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to submit bug report.');
  }
}
