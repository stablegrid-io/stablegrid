'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import type {
  ConsoleMetric,
  GridAction,
  LearningGridNode
} from '@/components/home/home/console-types';

interface LearningGridProps {
  metrics: ConsoleMetric[];
  nodes: LearningGridNode[];
  links: Array<{ from: string; to: string }>;
  recommendedNodeId: string;
  showRouteControls?: boolean;
}

const STATE_LABEL: Record<LearningGridNode['state'], string> = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In progress',
  completed: 'Completed',
  recommended: 'Recommended'
};

const STATE_CLASSES: Record<LearningGridNode['state'], string> = {
  locked:
    'border-surface-dim bg-surface text-on-surface-variant   ',
  available:
    'border-primary-fixed bg-primary-fixed/70 text-on-surface   ',
  in_progress:
    'border-warning-200 bg-warning-50/80 text-on-surface   ',
  completed:
    'border-success-200 bg-success-50/70 text-on-surface   ',
  recommended:
    'border-primary-fixed-dim bg-primary-fixed/80 text-on-surface shadow-[0_0_0_1px_rgba(34,185,153,0.12),0_18px_40px_-26px_rgba(34,185,153,0.28)]    dark:shadow-[0_0_0_1px_rgba(34,185,153,0.18),0_20px_44px_-28px_rgba(0,0,0,0.7)]'
};

const SIGNAL_META: Record<LearningGridNode['state'], { label: string; tone: string }> = {
  locked: {
    label: 'Standby',
    tone: 'bg-slate-400/70'
  },
  available: {
    label: 'Armed',
    tone: 'bg-primary-fixed-dim/75'
  },
  in_progress: {
    label: 'Tracking',
    tone: 'bg-amber-400/75'
  },
  completed: {
    label: 'Stable',
    tone: 'bg-primary/80'
  },
  recommended: {
    label: 'Priority',
    tone: 'bg-primary-fixed-dim/90'
  }
};

const DRAWER_THEME: Record<
  LearningGridNode['state'],
  {
    shell: string;
    badge: string;
    stat: string;
    connector: string;
  }
> = {
  locked: {
    shell:
      'border-surface-dim bg-surface-container/95 text-on-surface  #02060f]/95 ',
    badge:
      'border-surface-dim bg-surface text-on-surface-variant   ',
    stat: 'border-surface-dim bg-surface/90  ',
    connector: 'bg-surface-dim '
  },
  available: {
    shell:
      'border-primary-fixed bg-primary-fixed/95 text-on-surface  #02060f]/95 ',
    badge:
      'border-primary-fixed bg-surface text-primary-dim   ',
    stat: 'border-primary-fixed bg-surface/92  ',
    connector: 'bg-primary/40 '
  },
  in_progress: {
    shell:
      'border-warning-200 bg-warning-50/95 text-on-surface  #02060f]/95 ',
    badge:
      'border-warning-200 bg-surface text-warning-700   ',
    stat: 'border-warning-100 bg-surface/92  ',
    connector: 'bg-warning-500/40 '
  },
  completed: {
    shell:
      'border-success-200 bg-success-50/95 text-on-surface  #02060f]/95 ',
    badge:
      'border-success-200 bg-surface text-success-700   ',
    stat: 'border-success-100 bg-surface/92  ',
    connector: 'bg-success-500/40 '
  },
  recommended: {
    shell:
      'border-primary-fixed-dim bg-primary-fixed/95 text-on-surface  #02060f]/95 ',
    badge:
      'border-primary-fixed bg-surface text-primary-dim   ',
    stat: 'border-primary-fixed bg-surface/92  ',
    connector: 'bg-primary/45 '
  }
};

export const LearningGrid = ({
  metrics,
  nodes,
  links,
  recommendedNodeId,
  showRouteControls = true
}: LearningGridProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [desktopDrawerStyle, setDesktopDrawerStyle] = useState<{
    left: number;
    top: number;
    maxHeight: number;
    width: number;
  } | null>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const desktopLayerRef = useRef<HTMLDivElement | null>(null);

  const sortedNodes = useMemo(
    () => [...nodes].sort((left, right) => left.mobileOrder - right.mobileOrder),
    [nodes]
  );

  const selectedNode = useMemo(
    () =>
      selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) ?? null : null,
    [nodes, selectedNodeId]
  );

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const mobileNodes = useMemo(() => {
    const recommendedNode = sortedNodes.find((node) => node.id === recommendedNodeId);
    const firstNodes = sortedNodes.slice(0, 5);

    if (!recommendedNode || firstNodes.some((node) => node.id === recommendedNode.id)) {
      return firstNodes;
    }

    return [...firstNodes.slice(0, 4), recommendedNode].sort(
      (left, right) => left.mobileOrder - right.mobileOrder
    );
  }, [recommendedNodeId, sortedNodes]);

  const selectedStageLabel = useMemo(() => {
    if (!selectedNode) {
      return null;
    }

    const selectedIndex = sortedNodes.findIndex((node) => node.id === selectedNode.id);
    return getRouteStageLabel(
      selectedNode,
      selectedIndex === -1 ? 0 : selectedIndex,
      recommendedNodeId
    );
  }, [recommendedNodeId, selectedNode, sortedNodes]);

  const recommendedNode = useMemo(
    () => nodes.find((node) => node.id === recommendedNodeId) ?? null,
    [nodes, recommendedNodeId]
  );

  const primaryActionHref =
    recommendedNode?.actions[0]?.href ??
    metrics.find((metric) => metric.id === 'progress')?.actionHref ??
    '/theory';
  const primaryActionLabel =
    recommendedNode?.actions[0]?.label ??
    metrics.find((metric) => metric.id === 'progress')?.actionLabel ??
    'Resume route';

  const contextSummary = useMemo(() => {
    const moduleNode =
      sortedNodes.find((node) => node.kind === 'topic' && node.state !== 'completed') ??
      sortedNodes.find((node) => node.kind === 'topic') ??
      null;
    const progressMetric = metrics.find((metric) => metric.id === 'progress');
    const momentumMetric = metrics.find((metric) => metric.id === 'streak');

    return {
      current: moduleNode?.shortLabel ?? 'Learning route',
      next: recommendedNode?.shortLabel ?? 'Next step',
      progress: progressMetric?.value ?? '--',
      momentum: momentumMetric?.value ?? '--'
    };
  }, [metrics, recommendedNode, sortedNodes]);

  useEffect(() => {
    if (!selectedNodeId) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (
        target.closest('[data-testid="learning-grid-drawer"]') ||
        target.closest('[data-testid^="learning-grid-node-"]')
      ) {
        return;
      }

      setSelectedNodeId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId]);

  useEffect(() => {
    if (!selectedNode || typeof window === 'undefined') {
      setDesktopDrawerStyle(null);
      return undefined;
    }

    const updateDrawerStyle = () => {
      if (window.innerWidth < 1024) {
        setDesktopDrawerStyle(null);
        return;
      }

      const nodeElement = nodeRefs.current[selectedNode.id];
      const desktopLayer = desktopLayerRef.current;
      if (!nodeElement || !desktopLayer) {
        setDesktopDrawerStyle(null);
        return;
      }

      const rect = nodeElement.getBoundingClientRect();
      const layerRect = desktopLayer.getBoundingClientRect();
      const gap = 18;
      const minInset = 16;
      const width = Math.min(
        layerRect.width - minInset * 2,
        window.innerWidth >= 1280 ? 380 : 360
      );
      const maxHeight = window.innerHeight - minInset * 2;
      const measuredDrawerHeight =
        drawerRef.current?.getBoundingClientRect().height ??
        Math.min(
          maxHeight,
          280 +
            selectedNode.actions.length * 56 +
            Math.max(0, Math.ceil(selectedNode.label.length / 18) - 1) * 28
        );

      let left = rect.right - layerRect.left + gap;
      if (left + width > layerRect.width - minInset) {
        left = rect.left - layerRect.left - width - gap;
      }
      left = Math.max(
        minInset - layerRect.left,
        Math.min(left, window.innerWidth - width - minInset - layerRect.left)
      );

      let top =
        rect.top -
        layerRect.top +
        rect.height / 2 -
        Math.min(measuredDrawerHeight * 0.32, 140);
      top = Math.max(
        minInset - layerRect.top,
        Math.min(
          top,
          window.innerHeight - measuredDrawerHeight - minInset - layerRect.top
        )
      );

      setDesktopDrawerStyle({ left, top, maxHeight, width });
    };

    updateDrawerStyle();
    window.addEventListener('resize', updateDrawerStyle);
    window.addEventListener('scroll', updateDrawerStyle, true);
    const frame = window.requestAnimationFrame(updateDrawerStyle);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateDrawerStyle);
      window.removeEventListener('scroll', updateDrawerStyle, true);
    };
  }, [selectedNode]);

  return (
    <section
      data-testid="home-learning-grid"
      className="rounded-[2rem] border border-surface-dim bg-surface-container p-4 shadow-[0_24px_72px_-58px_rgba(15,23,42,0.18)] dark:shadow-[0_24px_72px_-58px_rgba(0,0,0,0.55)]"
    >
      <div className="lg:hidden">
        {showRouteControls ? (
          <div className="mb-3 rounded-[1.2rem] border border-surface-dim bg-surface p-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Next-step map
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              {contextSummary.current} → {contextSummary.next} · {contextSummary.progress}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href={primaryActionHref}
                data-testid="home-primary-action"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-3 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-primary-dim"
              >
                {primaryActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedNodeId(recommendedNodeId)}
                className="inline-flex items-center justify-center rounded-xl border border-surface-dim bg-surface-container px-3 py-2 text-xs font-medium text-on-surface-variant transition hover:border-primary hover:text-primary-dim"
              >
                Why next
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex snap-x gap-3 overflow-x-auto pb-3">
          {mobileNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() =>
                setSelectedNodeId((current) => (current === node.id ? null : node.id))
              }
              data-testid={`learning-grid-node-${node.id}`}
              data-selected={selectedNodeId === node.id ? 'true' : 'false'}
              data-recommended={node.id === recommendedNodeId ? 'true' : 'false'}
              className={`min-w-[220px] snap-start rounded-[1.4rem] border px-4 py-4 text-left transition ${STATE_CLASSES[node.state]} ${
                selectedNodeId === node.id ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl">{node.symbol ?? '•'}</span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em]">
                  {STATE_LABEL[node.state]}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold">{node.shortLabel}</p>
              <p className="mt-1 text-sm opacity-80">{node.hint ?? getNodeSupportCopy(node)}</p>
            </button>
          ))}
        </div>

        {selectedNode ? (
          <NodeDrawer node={selectedNode} stageLabel={selectedStageLabel ?? 'Selected'} />
        ) : (
          <SelectionHint />
        )}
      </div>

      <div ref={desktopLayerRef} className="relative hidden lg:block">
        <div className="relative min-h-[520px] overflow-hidden rounded-[1.7rem] border border-surface-dim bg-surface #02060f]">
          <div className="pointer-events-none absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_50%_35%,rgba(34,185,153,0.12),transparent_26%),linear-gradient(180deg,rgba(34,185,153,0.04),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_50%_35%,rgba(34,185,153,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_42%)]" />
          <div
            className="pointer-events-none absolute inset-0 dark:hidden"
            style={{
              backgroundImage:
                'linear-gradient(rgba(10,10,10,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.08) 1px, transparent 1px)',
              backgroundSize: '56px 56px'
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 hidden dark:block"
            style={{
              backgroundImage:
                'linear-gradient(rgba(250,250,250,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.06) 1px, transparent 1px)',
              backgroundSize: '56px 56px'
            }}
          />

          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="learning-grid-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(115, 115, 115, 0.22)" />
                <stop offset="45%" stopColor="rgba(34,185,153, 0.72)" />
                <stop offset="100%" stopColor="rgba(115, 115, 115, 0.22)" />
              </linearGradient>
            </defs>
            {links.map((link) => {
              const fromNode = nodeMap.get(link.from);
              const toNode = nodeMap.get(link.to);
              if (!fromNode || !toNode) return null;
              const isLiveLink =
                link.from === selectedNodeId ||
                link.to === selectedNodeId ||
                link.from === recommendedNodeId ||
                link.to === recommendedNodeId;

              return (
                <line
                  key={`${link.from}-${link.to}`}
                  x1={`${fromNode.position.x}%`}
                  y1={`${fromNode.position.y}%`}
                  x2={`${toNode.position.x}%`}
                  y2={`${toNode.position.y}%`}
                  stroke={
                    isLiveLink ? 'url(#learning-grid-flow)' : 'rgba(115, 115, 115, 0.3)'
                  }
                  strokeWidth={isLiveLink ? '3.2' : '2.1'}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-surface-dim bg-surface-container/90 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            Next-step map
          </div>
          <div className="pointer-events-none absolute bottom-5 left-5 text-sm font-medium text-on-surface-variant">
            Click a step to see why it matters and start it.
          </div>

          {!prefersReducedMotion ? (
            <>
              <motion.div
                className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-primary-fixed-dim/75 blur-[1px]"
                style={{ left: '12%', top: '48%' }}
                animate={{
                  left: ['12%', '54%', '86%'],
                  top: ['48%', '40%', '72%']
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              <motion.div
                className="pointer-events-none absolute h-2 w-2 rounded-full bg-amber-300/70 blur-[1px]"
                style={{ left: '28%', top: '18%' }}
                animate={{
                  left: ['28%', '44%', '68%'],
                  top: ['18%', '52%', '34%']
                }}
                transition={{
                  duration: 11,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </>
          ) : null}

          {nodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            const isRecommended = node.state === 'recommended';

            return (
              <button
                key={node.id}
                type="button"
                ref={(element) => {
                  nodeRefs.current[node.id] = element;
                }}
                title={node.description}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedNodeId((current) => (current === node.id ? null : node.id))
                }
                data-testid={`learning-grid-node-${node.id}`}
                data-selected={isSelected ? 'true' : 'false'}
                data-recommended={node.id === recommendedNodeId ? 'true' : 'false'}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-[1.2rem] border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${STATE_CLASSES[node.state]} ${
                  isSelected
                    ? 'z-20 ring-2 ring-primary/35 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)] dark:shadow-[0_18px_36px_-28px_rgba(0,0,0,0.7)]'
                    : 'z-10'
                } ${node.state === 'locked' ? 'opacity-75' : ''}`}
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}%`,
                  width: isSelected ? '208px' : '184px'
                }}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-current/15 bg-surface-container/90 px-2 py-0.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${SIGNAL_META[node.state].tone}`}
                    />
                    {getRouteStageLabel(node, index, recommendedNodeId)}
                  </span>
                  <span className="rounded-full border border-current/15 px-2 py-0.5">
                    {STATE_LABEL[node.state]}
                  </span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{node.shortLabel}</p>
                    <p className="mt-1 text-sm opacity-85">{node.hint ?? node.detail}</p>
                  </div>
                  <span className="text-lg leading-none opacity-80">
                    {node.symbol ?? '•'}
                  </span>
                </div>
                <div className="mt-3 truncate border-t border-current/10 pt-2 text-xs text-on-surface-variant opacity-85">
                  {getNodeSupportCopy(node)}
                </div>

                {isRecommended && !prefersReducedMotion ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-[1.2rem] border border-primary-fixed-dim/40"
                    animate={{ opacity: [0.35, 0.85, 0.35] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        {selectedNode && desktopDrawerStyle ? (
          <motion.div
            className="absolute z-30"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }
            }
            style={{
              left: desktopDrawerStyle.left,
              top: desktopDrawerStyle.top,
              width: desktopDrawerStyle.width,
              maxHeight: desktopDrawerStyle.maxHeight
            }}
          >
            <NodeDrawer
              node={selectedNode}
              stageLabel={selectedStageLabel ?? 'Selected'}
              maxHeight={desktopDrawerStyle.maxHeight}
              setDrawerRef={(element) => {
                drawerRef.current = element;
              }}
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
};

const NodeDrawer = ({
  node,
  stageLabel,
  maxHeight,
  setDrawerRef
}: {
  node: LearningGridNode;
  stageLabel: string;
  maxHeight?: number;
  setDrawerRef?: (element: HTMLDivElement | null) => void;
}) => {
  const theme = DRAWER_THEME[node.state];

  return (
    <div
      ref={setDrawerRef}
      data-testid="learning-grid-drawer"
      data-node-id={node.id}
      className={`max-h-full overflow-auto rounded-[1.35rem] border p-3 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.35)] backdrop-blur ${theme.shell}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80">{stageLabel} step</p>
          <h3 className="mt-1 text-[1.5rem] font-semibold leading-tight">{node.label}</h3>
          <p className="mt-2 text-sm leading-5 opacity-85">{getDrawerSummary(node)}</p>
        </div>
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${theme.badge}`}
        >
          {STATE_LABEL[node.state]}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <PlainStat
          label="Why now"
          value={getWhyThisMattersCopy(node)}
          className={theme.stat}
        />
        <PlainStat label="Next" value={getOutcomeCopy(node)} className={theme.stat} />
      </div>

      <div className="mt-3 grid gap-2">
        {node.actions.map((action) => (
          <NodeAction key={`${node.id}-${action.label}`} action={action} />
        ))}
      </div>
    </div>
  );
};

const PlainStat = ({
  label,
  value,
  className
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div
    className={`rounded-xl border px-3 py-2 ${className ?? 'border-surface-dim bg-surface  '}`}
  >
    <p className="text-xs font-medium opacity-75">{label}</p>
    <p className="mt-1 text-[0.95rem] font-semibold leading-snug">{value}</p>
  </div>
);

const SelectionHint = () => (
  <div className="rounded-[1.35rem] border border-dashed border-surface-dim bg-surface px-4 py-3 text-sm text-on-surface-variant">
    Click a step to see what it does, why it matters now, and where it leads next.
  </div>
);

const NodeAction = ({ action }: { action: GridAction }) => {
  const classes =
    action.variant === 'secondary'
      ? 'border-surface-dim bg-surface text-on-surface hover:border-primary hover:text-primary-dim     '
      : action.variant === 'ghost'
        ? 'border-transparent bg-transparent text-on-surface-variant hover:border-primary/35 hover:text-primary-dim   '
        : 'border-primary bg-primary text-on-surface hover:bg-primary-dim    ';

  return (
    <Link
      href={action.href}
      data-testid={`learning-grid-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${classes}`}
    >
      {action.label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
};

const getWhyNowCopy = (node: LearningGridNode) => {
  if (node.kind === 'chapter') {
    return node.state === 'recommended' || node.state === 'in_progress'
      ? 'Do this now'
      : 'Open soon';
  }

  if (node.kind === 'topic') {
    return 'Current focus';
  }

  if (node.kind === 'grid') {
    return node.state === 'locked' ? 'Build toward it' : 'Reward is ready';
  }

  if (node.kind === 'review') {
    return node.state === 'locked' ? 'Only if needed' : 'Fix weak spots';
  }

  if (node.kind === 'practice') {
    return 'Good after theory';
  }

  return 'Available next';
};

const getNodeSupportCopy = (node: LearningGridNode) => {
  if (node.kind === 'mission') {
    return 'Route anchor.';
  }

  if (node.kind === 'topic') {
    return 'Active module.';
  }

  if (node.kind === 'chapter') {
    return node.state === 'recommended'
      ? 'Best next lesson.'
      : 'Keeps the module moving.';
  }

  if (node.kind === 'grid') {
    return node.state === 'locked'
      ? 'Earn more to unlock.'
      : 'Reward is ready.';
  }

  if (node.kind === 'practice') {
    return 'Reinforce recall.';
  }

  if (node.kind === 'review') {
    return 'Fix weak spots.';
  }

  return 'Part of active route.';
};

const getDrawerSummary = (node: LearningGridNode) => {
  if (node.kind === 'mission') {
    return 'Start the current route from here.';
  }

  if (node.kind === 'topic') {
    return `${node.shortLabel} is the topic in play right now.`;
  }

  if (node.kind === 'chapter') {
    return node.state === 'recommended'
      ? 'Best next lesson to open.'
      : 'This lesson keeps the topic moving.';
  }

  if (node.kind === 'grid') {
    return node.state === 'locked'
      ? 'More progress unlocks this reward.'
      : 'This reward is ready in Grid Ops.';
  }

  if (node.kind === 'practice') {
    return 'Use this sprint to reinforce recall.';
  }

  if (node.kind === 'review') {
    return 'Use this lane to recover accuracy.';
  }

  return node.description;
};

const getWhyThisMattersCopy = (node: LearningGridNode) => {
  if (node.kind === 'mission') {
    return 'Keeps the route anchored.';
  }

  if (node.kind === 'topic') {
    return 'Shows the active topic.';
  }

  if (node.kind === 'chapter') {
    return 'Best next lesson for momentum.';
  }

  if (node.kind === 'grid') {
    return node.state === 'locked'
      ? 'Gives the route a payoff to unlock.'
      : 'Turns learning into a real reward.';
  }

  if (node.kind === 'practice') {
    return 'Locks in recall while it is fresh.';
  }

  if (node.kind === 'review') {
    return 'Stops misses from becoming a pattern.';
  }

  return 'Keeps the route coherent.';
};

const getOutcomeCopy = (node: LearningGridNode) => {
  if (node.kind === 'chapter') {
    return 'Continue learning';
  }

  if (node.kind === 'theory') {
    return 'Unlock next chapter';
  }

  if (node.kind === 'practice') {
    return 'Strengthen recall';
  }

  if (node.kind === 'review') {
    return 'Recover accuracy';
  }

  if (node.kind === 'grid') {
    return 'Open Grid Ops';
  }

  return 'Keep momentum';
};

const getRouteStageLabel = (
  node: LearningGridNode,
  index: number,
  recommendedNodeId: string
) => {
  if (index === 0) {
    return 'Start';
  }

  if (node.id === recommendedNodeId) {
    return 'Next';
  }

  if (node.kind === 'grid') {
    return 'Unlock';
  }

  if (node.kind === 'topic') {
    return 'Current';
  }

  return `Step ${index + 1}`;
};
