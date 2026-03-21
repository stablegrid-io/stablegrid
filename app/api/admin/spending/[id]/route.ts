import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/access';
import { parseJsonBody, toAdminErrorResponse } from '@/lib/admin/http';

const VALID_CATEGORIES = ['Hosting','AI / APIs','Subscriptions','Design','Development','Marketing','Miscellaneous'] as const;
const VALID_DOMAINS = ['Infrastructure','Product','AI / ML','Marketing','Operations','Content','General'] as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Entry id is required.' }, { status: 400 });

    const { adminSupabase } = await requireAdminAccess();
    const body = await parseJsonBody(request);
    const { date, category, domain, amount, description } = body;

    const patch: Record<string, unknown> = {};
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) patch.date = date;
    if (VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) patch.category = category;
    if (VALID_DOMAINS.includes(domain as (typeof VALID_DOMAINS)[number])) patch.domain = domain;
    const parsedAmount = Number(amount);
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) patch.amount = parsedAmount;
    if (typeof description === 'string' && description.trim()) patch.description = description.trim();

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 422 });
    }

    const { data, error } = await adminSupabase
      .from('project_spending')
      .update(patch)
      .eq('id', id)
      .select('id, date, category, domain, amount, description, created_at')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to update spending entry.');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Entry id is required.' }, { status: 400 });
    }

    const { adminSupabase } = await requireAdminAccess();

    const { error } = await adminSupabase
      .from('project_spending')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return toAdminErrorResponse(error, 'Failed to delete spending entry.');
  }
}
