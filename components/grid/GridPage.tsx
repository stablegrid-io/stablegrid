'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ComponentSlug,
  GridStateResponse,
  PurchaseResponse,
  ShopItemView,
} from '@/types/grid';
import { GridMap3D } from './GridMap3D';
import { ShopModal } from './ShopModal';
import { BriefingModal } from './BriefingModal';
import { FieldReport } from './FieldReport';
import { FieldArchive } from './FieldArchive';
import { ComponentSpecSheet } from './ComponentSpecSheet';
import { SPEC_SHEETS } from '@/lib/grid/spec-sheets';
import { GameToast, type ToastData } from '@/components/ui/GameToast';
import { logGridEvent } from '@/lib/grid/analytics';
import { GRID_COMPONENTS_BY_SLUG, TOTAL_GRID_COST_KWH } from '@/lib/grid/components';
import { BRIEFINGS } from '@/lib/grid/briefings';
import { VERMILLION } from './tokens';

export function GridPage() {
  const [data, setData] = useState<GridStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingSlug, setPurchasingSlug] = useState<ComponentSlug | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<ComponentSlug | null>(null);
  const [reportSlug, setReportSlug] = useState<ComponentSlug | null>(null);
  const [reportIsNew, setReportIsNew] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [specSlug, setSpecSlug] = useState<ComponentSlug | null>(null);
  const prevRestoredCountRef = useRef(-1);
  const viewedAnalyticsFired = useRef(false);

  const showToast = useCallback((msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2400);
  }, []);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/grid/state', { cache: 'no-store' });
      if (!r.ok) throw new Error(`state ${r.status}`);
      const json = (await r.json()) as GridStateResponse;
      setData(json);
      setLoading(false);
      if (!json.state.briefingSeen) setBriefingOpen(true);

      if (!viewedAnalyticsFired.current) {
        viewedAnalyticsFired.current = true;
        logGridEvent({
          type: 'grid_page_viewed',
          balanceAtLoad: json.balance,
          districtsRestored: json.state.districtsRestored,
        });
      }
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleDeploy = useCallback(
    async (slug: string) => {
      if (!data || purchasingSlug) return;
      const balanceBefore = data.balance;
      setPurchasingSlug(slug as ComponentSlug);
      try {
        const res = await fetch('/api/grid/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });

        if (res.status === 429) {
          showToast('TOO MANY REQUESTS — COOL DOWN', VERMILLION);
          return;
        }

        const result: PurchaseResponse = await res.json();

        if (!result.ok) {
          showToast(result.message, VERMILLION);
          logGridEvent({
            type: 'grid_purchase_rejected',
            slug: slug as ComponentSlug,
            reason: result.error,
          });
          return;
        }

        setData((prev) =>
          prev
            ? {
                ...prev,
                balance: result.newBalance,
                state: result.state,
                quest: result.quest,
                shop: prev.shop.map((item: ShopItemView) =>
                  item.component.slug === slug
                    ? { ...item, owned: true, affordable: true, locked: false, lockReason: null }
                    : { ...item, affordable: !item.owned && result.newBalance >= item.component.costKwh },
                ),
              }
            : prev,
        );
        showToast(`DEPLOYED // ${slug.toUpperCase().replace(/-/g, ' ')}`, VERMILLION);
        logGridEvent({
          type: 'grid_component_deployed',
          slug: slug as ComponentSlug,
          balanceBefore,
          balanceAfter: result.newBalance,
        });
        // Give the deploy burst + toast a moment, then open the field report.
        window.setTimeout(() => {
          setReportSlug(slug as ComponentSlug);
          setReportIsNew(true);
        }, 700);
      } catch {
        showToast('NETWORK ERROR — TRY AGAIN', VERMILLION);
      } finally {
        setPurchasingSlug(null);
      }
    },
    [data, purchasingSlug, showToast],
  );

  // Detect 10/10 transition for analytics only — no UI moment.
  useEffect(() => {
    const n = data?.state.districtsRestored ?? 0;
    const prev = prevRestoredCountRef.current;
    if (prev >= 0 && prev < 10 && n === 10 && data) {
      const first = data.state.firstDeployAt ? new Date(data.state.firstDeployAt).getTime() : Date.now();
      const last = data.state.lastDeployAt ? new Date(data.state.lastDeployAt).getTime() : Date.now();
      const durationDays = Math.max(0, Math.round((last - first) / 86_400_000));
      logGridEvent({
        type: 'grid_restored',
        totalKwhSpent: TOTAL_GRID_COST_KWH,
        durationDays,
      });
    }
    prevRestoredCountRef.current = n;
  }, [data]);

  const handleAcknowledgeBriefing = useCallback(async () => {
    setBriefingOpen(false);
    try {
      await fetch('/api/grid/acknowledge-briefing', { method: 'POST' });
    } catch {
      /* non-blocking */
    }
    setData((prev) =>
      prev ? { ...prev, state: { ...prev.state, briefingSeen: true } } : prev,
    );
    logGridEvent({ type: 'grid_briefing_acknowledged' });
  }, []);

  if (loading) return <SkeletonShell />;
  if (error || !data) return <ErrorShell message={error ?? 'No data.'} onRetry={loadState} />;

  const deployedSlugs = data.state.itemsOwned;

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16 flex flex-col gap-8">
        <header className="pb-6 border-b border-on-surface">
          <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-3">
            Dispatch Terminal · Saulėgrid
          </span>
          <h1 className="font-h1 text-h1 text-on-surface mb-3">Grid Game</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Saulėgrid is dark — ten districts down after a cascading failure on the Baltic corridor, and
            you&rsquo;re the operator with the last working dispatch terminal. Spend the kWh you earn
            from Theory and Practice to deploy real grid components and bring the network back online,
            one district at a time.
          </p>
        </header>

        {/* Status strip: districts restored + reserve */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-surface-dim">
          <div>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-2">
              Districts Restored
            </span>
            <span className="font-data-mono tabular-nums text-[28px] text-on-surface leading-none">
              {data.state.districtsRestored}
              <span className="text-on-surface-variant"> / 10</span>
            </span>
          </div>
          <div className="sm:text-right">
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-2">
              Reserve
            </span>
            <span className="font-data-mono tabular-nums text-[28px] text-on-surface leading-none">
              {data.balance.toLocaleString()}
              <span className="font-data-mono uppercase text-[13px] text-on-surface-variant tracking-wider ml-2">
                kWh
              </span>
            </span>
          </div>
        </section>

        <GridMap3D
          deployedSlugs={deployedSlugs}
          focusedSlug={focusedSlug}
          onMarkerClick={(slug) => setSpecSlug(slug)}
        />

        {/* Action strip */}
        <section aria-label="Actions" className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface px-5 py-3 border border-on-surface bg-surface hover:bg-surface-container-low transition-colors"
          >
            Field Archive
          </button>
          <button
            type="button"
            onClick={() => setShopOpen(true)}
            className="font-data-mono uppercase text-[11px] tracking-wider text-on-primary px-6 py-3 border border-on-surface bg-on-surface hover:bg-on-surface/90 transition-colors"
          >
            Open Catalog
          </button>
        </section>
      </div>

      {reportSlug && (
        <FieldReport
          component={GRID_COMPONENTS_BY_SLUG[reportSlug]}
          briefing={BRIEFINGS[reportSlug]}
          isNewDeployment={reportIsNew}
          onClose={() => { setReportSlug(null); setReportIsNew(false); }}
        />
      )}
      {archiveOpen && (
        <FieldArchive
          deployedSlugs={deployedSlugs}
          onClose={() => setArchiveOpen(false)}
          onOpenBriefing={(slug) => {
            setArchiveOpen(false);
            setReportSlug(slug);
            setReportIsNew(false);
          }}
        />
      )}
      {shopOpen && (
        <ShopModal
          data={data}
          purchasingSlug={purchasingSlug}
          onDeploy={handleDeploy}
          onOpenDetails={(slug) => setSpecSlug(slug as ComponentSlug)}
          onHoverItem={(slug) => setFocusedSlug(slug)}
          onClose={() => setShopOpen(false)}
          suppressEsc={Boolean(specSlug)}
        />
      )}
      {specSlug && (
        <ComponentSpecSheet
          component={GRID_COMPONENTS_BY_SLUG[specSlug]}
          spec={SPEC_SHEETS[specSlug]}
          onClose={() => setSpecSlug(null)}
        />
      )}
      {briefingOpen && <BriefingModal onAcknowledge={handleAcknowledgeBriefing} />}
      {toast && <GameToast msg={toast.msg} color={toast.color} />}

      <style jsx global>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </main>
  );
}

function SkeletonShell() {
  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
          Synchronizing dispatch terminal…
        </span>
      </div>
    </main>
  );
}

function ErrorShell({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-12 py-16 text-center">
        <span className="font-data-mono uppercase text-[11px] tracking-wider text-primary block mb-3">
          ● Fault Detected
        </span>
        <h2 className="font-h2 text-on-surface mb-3">Dispatch terminal is offline.</h2>
        <p className="font-body text-on-surface-variant mb-6 max-w-prose mx-auto">
          The grid is still there — we just can&apos;t reach it. {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface px-7 py-3 border border-on-surface hover:bg-surface-container-low transition-colors"
          >
            Retry Handshake
          </button>
        )}
      </div>
    </main>
  );
}
