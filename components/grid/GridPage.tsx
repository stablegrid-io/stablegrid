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
import {
  BRAND_CYAN,
  PANEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from './tokens';

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
          showToast('TOO MANY REQUESTS — COOL DOWN', '#ff716c');
          return;
        }

        const result: PurchaseResponse = await res.json();

        if (!result.ok) {
          showToast(result.message, '#ff716c');
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
        showToast(`DEPLOYED // ${slug.toUpperCase().replace(/-/g, ' ')}`, BRAND_CYAN);
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
        showToast('NETWORK ERROR — TRY AGAIN', '#ff716c');
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
    <main
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 28px) 72px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(20px, 3vw, 28px)',
      }}
    >
      {/* Header strip: kWh balance + restored counter */}
      <section
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 20,
          paddingBottom: 20,
          borderBottom: `1px solid ${PANEL_BORDER}`,
        }}
      >
        <div>
          <div
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: TEXT_TERTIARY, textTransform: 'uppercase', marginBottom: 6 }}
          >
            Dispatch Terminal · Saulégrid
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: TEXT_PRIMARY,
              margin: 0,
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            }}
          >
            {data.state.districtsRestored} of 10 districts restored
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: TEXT_TERTIARY, textTransform: 'uppercase', marginBottom: 6 }}
          >
            Reserve
          </div>
          <div
            className="font-mono tabular-nums"
            style={{ fontSize: 26, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: '-0.01em', lineHeight: 1 }}
          >
            {data.balance.toLocaleString()}
            <span style={{ fontSize: 13, color: TEXT_PRIMARY, marginLeft: 6, letterSpacing: '0.08em' }}>kWh</span>
          </div>
        </div>
      </section>

      <GridMap3D
        deployedSlugs={deployedSlugs}
        focusedSlug={focusedSlug}
        onMarkerClick={(slug) => setSpecSlug(slug)}
      />

      {/* Action strip — opens the shop catalog + field archive */}
      <section
        aria-label="Actions"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          paddingTop: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="font-mono"
            style={{
              background: '#1a1e21',
              border: `1px solid ${PANEL_BORDER}`,
              color: TEXT_SECONDARY,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'border-color 150ms ease, color 150ms ease, background 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = TEXT_PRIMARY; e.currentTarget.style.background = '#22272b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = PANEL_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; e.currentTarget.style.background = '#1a1e21'; }}
          >
            Field Archive
          </button>

          <button
            type="button"
            onClick={() => setShopOpen(true)}
            className="font-mono"
            style={{
              background: BRAND_CYAN,
              border: `1px solid ${BRAND_CYAN}`,
              color: '#06181c',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              padding: '10px 22px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'background 150ms ease, transform 180ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#b8fbff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_CYAN; }}
          >
            Open Catalog
          </button>
        </div>
      </section>

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
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px' }}>
      <div
        className="font-mono"
        style={{ fontSize: 11, letterSpacing: '0.2em', color: TEXT_TERTIARY, textTransform: 'uppercase' }}
      >
        Synchronizing dispatch terminal…
      </div>
    </main>
  );
}

function ErrorShell({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 28px', textAlign: 'center' }}>
      <div
        className="font-mono"
        style={{ fontSize: 10, letterSpacing: '0.24em', color: '#ff716c', textTransform: 'uppercase', marginBottom: 10 }}
      >
        ● Fault Detected
      </div>
      <h2
        style={{
          fontSize: 24,
          color: TEXT_PRIMARY,
          margin: '0 0 10px',
          letterSpacing: '-0.015em',
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
        }}
      >
        Dispatch terminal is offline.
      </h2>
      <p style={{ color: TEXT_SECONDARY, margin: '0 0 22px', fontSize: 14, lineHeight: 1.6 }}>
        The grid is still there — we just can&apos;t reach it. {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-mono"
          style={{
            background: 'transparent',
            border: `1px solid ${BRAND_CYAN}`,
            color: BRAND_CYAN,
            fontSize: 11,
            letterSpacing: '0.22em',
            padding: '11px 28px',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${BRAND_CYAN}14`; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Retry Handshake
        </button>
      )}
    </main>
  );
}
