'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Lock } from 'lucide-react';
import type {
  ComponentSlug,
  GridStateResponse,
  PurchaseResponse,
  ShopItemView,
} from '@/types/grid';
// MapLibre GL is ~700KB minified — keep it out of the route's initial JS so
// the page shell paints before the map chunk lands. SSR-disabled because
// maplibre relies on `window` and `getContext('webgl')` at module load.
const GridMap3D = dynamic(
  () => import('./GridMap3D').then((m) => m.GridMap3D),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low font-data-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
        Loading map…
      </div>
    ),
  },
);
import { ShopModal } from './ShopModal';
import { BriefingModal } from './BriefingModal';
import { FieldReport } from './FieldReport';
import { FieldArchive } from './FieldArchive';
import { ComponentSpecSheet } from './ComponentSpecSheet';
import { SPEC_SHEETS } from '@/lib/grid/spec-sheets';
import { GameToast, type ToastData } from '@/components/ui/GameToast';
import { logGridEvent } from '@/lib/grid/analytics';
import { GRID_COMPONENTS, GRID_COMPONENTS_BY_SLUG, TOTAL_GRID_COST_KWH } from '@/lib/grid/components';
import { BRIEFINGS } from '@/lib/grid/briefings';
import { CATEGORY_COLOR, VERMILLION } from './tokens';

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

  const deployedSet = new Set(deployedSlugs);
  const restored = data.state.districtsRestored;
  const cheapestUndeployed = [...GRID_COMPONENTS]
    .filter((c) => !deployedSet.has(c.slug))
    .sort((a, b) => a.costKwh - b.costKwh)[0];
  const orderedComponents = [...GRID_COMPONENTS].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14">
        {/* Compact header */}
        <header className="pb-5 mb-8 border-b-2 border-on-surface flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant block mb-1">
              Dispatch Terminal
            </span>
            <h1 className="font-h2 text-on-surface">Saulėgrid Restoration</h1>
          </div>
          <p className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant tabular-nums">
            10 districts dark · April 14 cascade
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10 items-start">
          {/* Left panel — sticky dispatch console */}
          <aside className="lg:sticky lg:top-20 flex flex-col gap-6">
            {/* Mission progress block */}
            <div className="border border-on-surface bg-surface">
              <div className="px-4 py-3 bg-on-surface text-on-primary font-data-mono uppercase text-[11px] tracking-wider flex items-center justify-between">
                <span>Mission</span>
                <span className="tabular-nums">{restored}/10</span>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {/* Progress cells — 10 little squares */}
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className={`flex-1 h-3 ${
                        i < restored ? 'bg-on-surface' : 'border border-surface-dim bg-surface'
                      }`}
                    />
                  ))}
                </div>
                <div>
                  <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block">
                    Districts restored
                  </span>
                  <span className="font-data-mono tabular-nums text-[24px] text-on-surface leading-none">
                    {restored}
                    <span className="text-on-surface-variant"> / 10</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Reserve block */}
            <div className="border border-on-surface bg-surface px-4 py-4">
              <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-2">
                Reserve
              </span>
              <span className="font-data-mono tabular-nums text-[28px] text-on-surface leading-none">
                {data.balance.toLocaleString()}
                <span className="font-data-mono uppercase text-[13px] text-on-surface-variant tracking-wider ml-2">
                  kWh
                </span>
              </span>
            </div>

            {/* Next move suggestion */}
            {cheapestUndeployed && (
              <div className="border border-surface-dim bg-surface-container-low/50 px-4 py-4">
                <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-2">
                  Next move
                </span>
                <button
                  type="button"
                  onClick={() => setSpecSlug(cheapestUndeployed.slug)}
                  className="text-left w-full"
                >
                  <span className="font-serif text-[16px] text-on-surface block leading-snug">
                    {cheapestUndeployed.name}
                  </span>
                  <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant tabular-nums mt-1 block">
                    {cheapestUndeployed.districtName} ·{' '}
                    {cheapestUndeployed.costKwh.toLocaleString()} kWh
                  </span>
                </button>
              </div>
            )}

            {/* Actions stacked */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShopOpen(true)}
                className="font-data-mono uppercase text-[11px] tracking-wider text-on-primary px-5 py-3 border border-on-surface bg-on-surface hover:bg-on-surface/90 transition-colors"
              >
                Open Catalog
              </button>
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface px-5 py-3 border border-on-surface bg-surface hover:bg-surface-container-low transition-colors"
              >
                Field Archive
              </button>
            </div>
          </aside>

          {/* Right column — map + ledger */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 3D dispatch map. Desktop-only — touch pan/zoom on a 3D
                MapLibre canvas at phone widths is hostile, and the map
                consumes >50 % of the viewport before the operator sees
                anything actionable. Phones get a static placeholder
                that explains the trade-off and points to the ledger
                below (which already lists every component slot). */}
            <div className="hidden lg:block">
              <GridMap3D
                deployedSlugs={deployedSlugs}
                focusedSlug={focusedSlug}
                onMarkerClick={(slug) => setSpecSlug(slug)}
              />
            </div>
            <div className="lg:hidden border border-on-surface bg-surface-container-low p-6 flex flex-col items-center text-center gap-3">
              <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
                Field Map
              </span>
              <p className="font-serif text-[18px] leading-snug text-on-surface max-w-[36ch]">
                The 3D dispatch map opens on desktop.
              </p>
              <p className="font-body text-[13px] leading-relaxed text-on-surface-variant max-w-[44ch]">
                You can still browse the catalogue, deploy components, and read
                field reports from this phone — the ledger below lists every
                slot in the cascade. The map needs precision pan / zoom that
                doesn’t map cleanly to touch yet.
              </p>
            </div>

            {/* Deployment ledger — all 10 component slots */}
            <section
              aria-label="Deployment ledger"
              className="border border-on-surface bg-surface"
            >
              <header className="px-4 py-3 bg-on-surface text-on-primary font-data-mono uppercase text-[11px] tracking-wider flex items-center justify-between">
                <span>Deployment Ledger</span>
                <span className="tabular-nums">{restored}/10 online</span>
              </header>
              <ul className="grid grid-cols-2 sm:grid-cols-5">
                {orderedComponents.map((c, i) => {
                  const isDeployed = deployedSet.has(c.slug);
                  const color = CATEGORY_COLOR[c.category];
                  return (
                    <li
                      key={c.slug}
                      className="border-r border-b border-surface-dim last:border-r-0 [&:nth-child(5n)]:border-r-0"
                    >
                      <button
                        type="button"
                        onClick={() => setSpecSlug(c.slug)}
                        className="text-left w-full p-3 hover:bg-surface-container-low transition-colors flex flex-col gap-2 h-full"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-data-mono tabular-nums text-[10px] text-on-surface-variant">
                            {(i + 1).toString().padStart(2, '0')}
                          </span>
                          {isDeployed ? (
                            <span
                              aria-hidden
                              className="w-2.5 h-2.5"
                              style={{ backgroundColor: color }}
                              title="Online"
                            />
                          ) : (
                            <Lock
                              className="h-3 w-3 text-on-surface-variant/60"
                              strokeWidth={1.75}
                            />
                          )}
                        </div>
                        <span className="font-data-mono uppercase text-[9px] tracking-wider text-on-surface-variant">
                          {c.category}
                        </span>
                        <span
                          className={`font-serif text-[13px] leading-tight ${
                            isDeployed ? 'text-on-surface' : 'text-on-surface-variant'
                          }`}
                        >
                          {c.districtName}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
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
