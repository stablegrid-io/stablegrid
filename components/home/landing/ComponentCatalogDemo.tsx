'use client';

/**
 * ComponentCatalogDemo — interactive replica of the in-game ShopModal for the
 * landing page. Category filters, clickable cards, live reserve counter.
 *
 * Starts with all ten components deployed and a 2,138 kWh reserve (the
 * post-game state shown in marketing). Clicking a deployed card un-deploys it
 * and refunds its cost; clicking an un-deployed card re-deploys it (needs
 * enough reserve).
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { GRID_COMPONENTS } from '@/lib/grid/components';
import type { ComponentCategory, ComponentSlug } from '@/types/grid';
import { categoryShapeMarkup } from '@/components/grid/shapes';

const CATEGORY_COLOR: Record<ComponentCategory, string> = {
  backbone: '#ffc965',
  protection: '#ff716c',
  storage: '#99f7ff',
  balancing: '#bf81ff',
  generation: '#86efac',
  command: '#f0f0f3'
};

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  backbone: 'Backbone',
  protection: 'Protection',
  storage: 'Storage',
  balancing: 'Balancing',
  generation: 'Generation',
  command: 'Command'
};

const CATEGORY_ORDER: ComponentCategory[] = [
  'backbone',
  'protection',
  'storage',
  'balancing',
  'generation',
  'command'
];

const INITIAL_RESERVE_KWH = 2138;

type FilterKey = 'all' | ComponentCategory;

export function ComponentCatalogDemo() {
  const [filter, setFilter] = useState<FilterKey>('all');
  // Seed with nothing deployed — landing page shows the pre-restoration state
  // with the full budget available and every component awaiting deployment.
  const [deployed, setDeployed] = useState<Set<ComponentSlug>>(() => new Set());

  const totalCount = GRID_COMPONENTS.length;

  const reserveKwh = useMemo(() => {
    const refunds = GRID_COMPONENTS
      .filter((c) => !deployed.has(c.slug))
      .reduce((s, c) => s + c.costKwh, 0);
    return INITIAL_RESERVE_KWH + refunds;
  }, [deployed]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = { all: totalCount };
    for (const cat of CATEGORY_ORDER) {
      out[cat] = GRID_COMPONENTS.filter((c) => c.category === cat).length;
    }
    return out;
  }, [totalCount]);

  // Cap the visible roster to 3 cards — the demo is a teaser, not the full shop.
  const visible = useMemo(() => {
    const pool =
      filter === 'all'
        ? GRID_COMPONENTS
        : GRID_COMPONENTS.filter((c) => c.category === filter);
    return pool.slice(0, 3);
  }, [filter]);

  const deployedCount = deployed.size;

  const toggleDeploy = (slug: ComponentSlug, cost: number) => {
    setDeployed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (cost <= reserveKwh) {
        next.add(slug);
      }
      return next;
    });
  };

  const chips: Array<{
    key: FilterKey;
    label: string;
    count: number;
    color: string;
    shape: string | null;
  }> = [
    { key: 'all', label: 'All', count: categoryCounts.all, color: '#99f7ff', shape: null },
    ...CATEGORY_ORDER.map((cat) => ({
      key: cat,
      label: CATEGORY_LABEL[cat],
      count: categoryCounts[cat] ?? 0,
      color: CATEGORY_COLOR[cat],
      shape: categoryShapeMarkup(cat)
    }))
  ];

  return (
    <div
      className="catalog-demo overflow-hidden"
      style={{
        background: '#0c0e10',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.45)'
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes catalogCardIn {
            from { opacity: 0; transform: translateY(12px) scale(.985); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          .catalog-demo .chip-btn {
            cursor: pointer;
            transition: background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms cubic-bezier(.16,1,.3,1);
          }
          .catalog-demo .chip-btn:hover {
            transform: translateY(-1px);
          }
          .catalog-demo .catalog-card {
            transition: border-color 320ms ease, box-shadow 420ms cubic-bezier(.16,1,.3,1), transform 420ms cubic-bezier(.16,1,.3,1), filter 260ms ease;
            transform-origin: center center;
            will-change: transform;
          }
          .catalog-demo .catalog-card:hover {
            transform: translateY(-6px) scale(1.035);
            z-index: 2;
            box-shadow: 0 28px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04);
          }
          .catalog-demo .catalog-card__media {
            overflow: hidden;
          }
          .catalog-demo .catalog-card__image {
            transition: transform 900ms cubic-bezier(.16,1,.3,1);
            will-change: transform;
          }
          .catalog-demo .catalog-card:hover .catalog-card__image {
            transform: scale(1.08);
          }
          .catalog-demo .toggle-btn {
            cursor: pointer;
            transition: background 220ms ease, border-color 220ms ease, color 220ms ease, transform 180ms cubic-bezier(.16,1,.3,1);
          }
          .catalog-demo .toggle-btn:hover:not(:disabled) {
            transform: translateY(-1px);
          }
          .catalog-demo .toggle-btn:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
        `
        }}
      />

      {/* Header */}
      <header
        className="flex flex-wrap items-center justify-between gap-5"
        style={{ padding: '22px 26px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div>
          <div
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              marginBottom: 4,
              fontWeight: 600
            }}
          >
            Component Catalog
          </div>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: 'rgba(255,255,255,0.95)',
              margin: 0,
              fontFamily:
                '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif'
            }}
          >
            Deploy to restore the grid
          </h3>
        </div>
        <div
          className="font-mono tabular-nums"
          style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}
        >
          <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
            {deployedCount}
          </span>{' '}
          of {totalCount} deployed ·{' '}
          <span
            style={{
              color: '#99f7ff',
              fontWeight: 600,
              transition: 'color 220ms ease'
            }}
          >
            {reserveKwh.toLocaleString()} kWh
          </span>{' '}
          reserve
        </div>
      </header>

      {/* Filter strip */}
      <div
        className="flex gap-2 flex-wrap"
        style={{
          padding: '14px 26px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        {chips.map((chip) => {
          const active = filter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              className="chip-btn font-mono inline-flex items-center gap-2"
              onClick={() => setFilter(chip.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `1px solid ${active ? chip.color : 'rgba(255,255,255,0.1)'}`,
                background: active ? `${chip.color}14` : 'transparent',
                color: active ? chip.color : 'rgba(255,255,255,0.6)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {chip.shape && (
                <span
                  aria-hidden
                  style={{
                    width: 11,
                    height: 11,
                    color: chip.color,
                    display: 'inline-flex',
                    filter: `drop-shadow(0 0 3px ${chip.color}${active ? 'aa' : '55'})`,
                    transition: 'filter 220ms ease'
                  }}
                  dangerouslySetInnerHTML={{ __html: chip.shape }}
                />
              )}
              {chip.label}
              <span className="tabular-nums" style={{ opacity: 0.6, fontWeight: 500 }}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards grid — re-keyed on filter so stagger animation replays */}
      <div style={{ padding: 'clamp(18px, 2.5vw, 26px)' }}>
        <div
          key={filter}
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
        >
          {visible.map((c, i) => {
            const color = CATEGORY_COLOR[c.category];
            const isDeployed = deployed.has(c.slug);
            const canAfford = c.costKwh <= reserveKwh;

            return (
              <article
                key={c.slug}
                className="catalog-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#0c0e10',
                  border: `1px solid ${isDeployed ? `${color}4d` : 'rgba(255,255,255,0.08)'}`,
                  borderLeft: `2px solid ${isDeployed ? color : 'rgba(255,255,255,0.16)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  opacity: 0,
                  animation: `catalogCardIn 420ms cubic-bezier(.16,1,.3,1) ${i * 55}ms forwards`,
                  filter: isDeployed ? 'none' : 'grayscale(0.35) brightness(0.82)'
                }}
              >
                {/* Image */}
                <div
                  className="catalog-card__media relative w-full"
                  style={{
                    height: 220,
                    background: `linear-gradient(135deg, ${color}1f, rgba(10,12,14,0.9) 65%)`
                  }}
                >
                  <Image
                    src={`/grid/components/${c.slug}.jpg`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="catalog-card__image object-cover"
                    style={{ filter: 'saturate(0.85) contrast(1.05)' }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(10,12,14,0.05) 0%, rgba(10,12,14,0) 35%, rgba(10,12,14,0.85) 100%)'
                    }}
                  />
                  <span
                    className="font-mono absolute"
                    style={{
                      top: 10,
                      left: 10,
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: `${color}20`,
                      color,
                      border: `1px solid ${color}40`,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {CATEGORY_LABEL[c.category]}
                  </span>
                  <span
                    className="font-mono absolute inline-flex items-center gap-1"
                    style={{
                      top: 10,
                      right: 10,
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      padding: '3px 8px',
                      borderRadius: 4,
                      color: isDeployed ? color : 'rgba(255,255,255,0.45)',
                      background: 'rgba(10,12,14,0.6)',
                      border: `1px solid ${isDeployed ? `${color}55` : 'rgba(255,255,255,0.16)'}`,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                      transition: 'color 220ms ease, border-color 220ms ease'
                    }}
                  >
                    {isDeployed ? (
                      <>
                        <Check size={10} strokeWidth={2.8} /> Online
                      </>
                    ) : (
                      'Offline'
                    )}
                  </span>
                </div>

                {/* Body */}
                <div
                  style={{
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    flex: 1
                  }}
                >
                  <div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                        fontWeight: 600
                      }}
                    >
                      {c.districtName}
                    </div>
                    <h4
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.95)',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        fontFamily:
                          '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif'
                      }}
                    >
                      {c.name}
                    </h4>
                  </div>

                  <p
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.35)',
                      margin: 0,
                      minHeight: 40
                    }}
                  >
                    {c.flavor}
                  </p>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10
                    }}
                  >
                    <div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.2em',
                          color: 'rgba(255,255,255,0.35)',
                          textTransform: 'uppercase',
                          fontWeight: 600
                        }}
                      >
                        Cost
                      </div>
                      <div
                        className="font-mono tabular-nums"
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.95)',
                          letterSpacing: '0.01em'
                        }}
                      >
                        {c.costKwh.toLocaleString()}
                        <span
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.35)',
                            letterSpacing: '0.12em',
                            marginLeft: 4
                          }}
                        >
                          kWh
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="toggle-btn font-mono"
                      disabled={!isDeployed && !canAfford}
                      onClick={() => toggleDeploy(c.slug, c.costKwh)}
                      style={{
                        background: isDeployed ? 'transparent' : `${color}14`,
                        border: `1px solid ${
                          isDeployed
                            ? 'rgba(255,255,255,0.18)'
                            : canAfford
                              ? `${color}aa`
                              : 'rgba(255,255,255,0.14)'
                        }`,
                        color: isDeployed
                          ? 'rgba(255,255,255,0.55)'
                          : canAfford
                            ? color
                            : 'rgba(255,255,255,0.35)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        padding: '9px 14px',
                        borderRadius: 8,
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {isDeployed ? 'Deployed' : canAfford ? 'Deploy' : 'Low reserve'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
