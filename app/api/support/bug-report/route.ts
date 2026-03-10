import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload:
    | {
        title?: unknown;
        details?: unknown;
        pageUrl?: unknown;
        context?: unknown;
      }
    | null = null;
  try {
    payload = (await request.json()) as {
      title?: unknown;
      details?: unknown;
      pageUrl?: unknown;
      context?: unknown;
    };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const title = toCleanString(payload?.title, TITLE_MAX_LENGTH);
  const details = toCleanString(payload?.details, DETAILS_MAX_LENGTH);
  const pageUrlRaw = toCleanString(payload?.pageUrl, PAGE_URL_MAX_LENGTH);
  const pageUrl = pageUrlRaw.length > 0 ? pageUrlRaw : null;

  if (title.length < TITLE_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Summary must be at least ${TITLE_MIN_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (details.length < DETAILS_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Details must be at least ${DETAILS_MIN_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (pageUrl && !isValidRouteOrUrl(pageUrl)) {
    return NextResponse.json(
      { error: 'Page route must start with "/" or "http(s)://".' },
      { status: 400 }
    );
  }

  const context =
    payload?.context && typeof payload.context === 'object'
      ? (payload.context as Record<string, unknown>)
      : {};
  const category = parseRequiredOption(context.category, CATEGORY_LABELS);
  const area = parseRequiredOption(context.area, AREA_LABELS);

  if (!category) {
    return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
  }
  if (!area) {
    return NextResponse.json({ error: 'Affected area is required.' }, { status: 400 });
  }

  const detailsWithContext = [
    details,
    '[Structured context]',
    `Category: ${CATEGORY_LABELS[category]}`,
    `Area: ${AREA_LABELS[area]}`
  ]
    .join('\n')
    .slice(0, DETAILS_MAX_LENGTH);

  const userAgent = toCleanString(request.headers.get('user-agent'), USER_AGENT_MAX_LENGTH);

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: user.id,
      email: user.email ?? '',
      title,
      details: detailsWithContext,
      page_url: pageUrl,
      user_agent: userAgent || null
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reported: true, id: data.id });
}
