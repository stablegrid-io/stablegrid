import type { SupabaseClient } from '@supabase/supabase-js';
import { GRID_COMPONENTS } from '@/lib/grid/components';
import { computeQuestView } from '@/lib/grid/quest';
import type {
  ComponentSlug,
  GridStateResponse,
  ShopItemView,
  UserGridState,
} from '@/types/grid';

const GATE_MESSAGE = 'Complete any module in the Learn hub to unlock Generation components.';

interface StateRow {
  user_id: string;
  items_owned: string[] | null;
  districts_restored: number;
  briefing_seen: boolean;
  first_deploy_at: string | null;
  last_deploy_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchGridState(
  supabase: SupabaseClient,
  userId: string,
): Promise<GridStateResponse> {
  // Ensure a row exists so subsequent purchases don't race on insert.
  await supabase
    .from('user_grid_state')
    .insert({ user_id: userId })
    .select()
    .single()
    .then(() => undefined, () => undefined); // ignore conflict

  const [stateRes, xpRes, spentRes, moduleRes] = await Promise.all([
    supabase
      .from('user_grid_state')
      .select('user_id, items_owned, districts_restored, briefing_seen, first_deploy_at, last_deploy_at, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('user_progress').select('xp').eq('user_id', userId).maybeSingle(),
    supabase.from('user_grid_purchases').select('cost_paid').eq('user_id', userId),
    supabase
      .from('module_progress')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', userId)
      .eq('is_completed', true)
      .limit(1),
  ]);

  const stateRow = (stateRes.data ?? {
    user_id: userId,
    items_owned: [],
    districts_restored: 0,
    briefing_seen: false,
    first_deploy_at: null,
    last_deploy_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }) as StateRow;

  const xp = (xpRes.data?.xp as number | undefined) ?? 0;
  const spent = (spentRes.data ?? []).reduce(
    (sum, row: { cost_paid: number }) => sum + (row.cost_paid ?? 0),
    0,
  );
  const balance = Math.max(0, xp - spent);
  const hasCompletedModule = (moduleRes.count ?? 0) > 0;

  const state: UserGridState = {
    userId: stateRow.user_id,
    itemsOwned: (stateRow.items_owned ?? []) as ComponentSlug[],
    districtsRestored: stateRow.districts_restored,
    briefingSeen: stateRow.briefing_seen,
    firstDeployAt: stateRow.first_deploy_at,
    lastDeployAt: stateRow.last_deploy_at,
    createdAt: stateRow.created_at,
    updatedAt: stateRow.updated_at,
  };

  const ownedSet = new Set<ComponentSlug>(state.itemsOwned);
  const shop: ShopItemView[] = [...GRID_COMPONENTS]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((component) => {
      const owned = ownedSet.has(component.slug);
      const gated = component.gate === 'any-module-complete' && !hasCompletedModule;
      return {
        component,
        owned,
        affordable: !owned && balance >= component.costKwh,
        locked: !owned && gated,
        lockReason: !owned && gated ? GATE_MESSAGE : null,
      };
    });

  return {
    balance,
    state,
    shop,
    quest: computeQuestView(state.itemsOwned),
  };
}
