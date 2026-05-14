import { NextResponse } from 'next/server';
import { loadServerPracticeProgress } from '@/lib/practice/serverPracticeProgress';

// Thin GET wrapper around loadServerPracticeProgress for client-side
// refresh. /practice/modules SSRs the initial state via the same loader;
// this endpoint exists so the editorial track view can re-query on window
// focus / visibility change without a full page reload.

const isSafeModuleId = (value: string): boolean =>
  value.length > 0 && value.length <= 200 && /^[A-Za-z0-9_\-:.]+$/.test(value);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('moduleIds');
  if (!raw) {
    return NextResponse.json({ progressByModule: {}, solvedTasksByModule: {} });
  }

  const moduleIds = Array.from(
    new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter((id) => isSafeModuleId(id))
    )
  ).slice(0, 60); // hard cap — only ever ~30 modules in the registry

  if (moduleIds.length === 0) {
    return NextResponse.json({ progressByModule: {}, solvedTasksByModule: {} });
  }

  const payload = await loadServerPracticeProgress(moduleIds);
  return NextResponse.json(payload);
}
