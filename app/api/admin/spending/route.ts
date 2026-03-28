import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';

const VALID_CATEGORIES = [
  'Hosting',
  'AI / APIs',
  'Subscriptions',
  'Design',
  'Development',
  'Marketing',
  'Miscellaneous'
] as const;

const VALID_DOMAINS = [
  'Infrastructure',
  'Product',
  'AI / ML',
  'Marketing',
  'Operations',
  'Content',
  'General'
] as const;

type Category = (typeof VALID_CATEGORIES)[number];
type Domain = (typeof VALID_DOMAINS)[number];

function isValidCategory(value: unknown): value is Category {
  return VALID_CATEGORIES.includes(value as Category);
}

function isValidDomain(value: unknown): value is Domain {
  return VALID_DOMAINS.includes(value as Domain);
}

export async function GET() {
  try {
    const { adminSupabase } = await requireAdminAccess();

    const { data, error } = await adminSupabase
      .from('project_spending')
      .select('id, date, category, domain, amount, description, created_at')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to load spending entries.');
  }
}

export async function POST(request: Request) {
  try {
    const { adminSupabase } = await requireAdminAccess();
    const body = await parseJsonBody(request);

    const { date, category, domain, amount, description } = body;

    if (typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json({ error: 'Invalid date format.' }, { status: 422 });
    }
    if (!isValidCategory(category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 422 });
    }
    const resolvedDomain = isValidDomain(domain) ? domain : 'General';
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 422 });
    }
    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 422 });
    }
    if (description.length > 1_000) {
      return NextResponse.json({ error: 'Description exceeds 1000 character limit.' }, { status: 422 });
    }

    const { data, error } = await adminSupabase
      .from('project_spending')
      .insert({
        date,
        category,
        domain: resolvedDomain,
        amount: parsedAmount,
        description: description.trim()
      })
      .select('id, date, category, domain, amount, description, created_at')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to create spending entry.');
  }
}
