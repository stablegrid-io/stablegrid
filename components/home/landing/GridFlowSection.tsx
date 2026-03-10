'use client';

import { ArrowRight, Check, Clock3, Info, Play, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  TRANSMISSION_LINE_SEQUENCE_CONFIG,
  TransmissionLineSequenceBackground
} from '@/components/home/landing/TransmissionLineSequenceBackground';
import {
  GRID_FLOW_CHAPTERS,
  type GridFlowChapter,
  type GridFlowSnapshotTone,
  type GridFlowStepSnapshot
} from '@/components/home/landing/gridFlowStory';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const JOURNEY_UPDATE_EPSILON = 0.0015;
const STORY_UPDATE_EPSILON = 0.055;
const SCROLL_IDLE_TIMEOUT_MS = 150;
const MAX_STORY_STEPS = 3;
const CHAPTER_SCROLL_HEIGHT_CLASS = 'min-h-[130svh] lg:min-h-[150svh]';
const STORY_CHAPTER_GRID_CLASS = 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]';
const STORY_INTERACTIVE_COLUMN_CLASS =
  'lg:justify-self-end lg:ml-auto lg:translate-x-[clamp(12rem,20vw,24rem)]';
const INTRO_AUTOPLAY_START_FRAME = 1;
const INTRO_AUTOPLAY_FINAL_FRAME = TRANSMISSION_LINE_SEQUENCE_CONFIG.frameCount;
const INTRO_AUTOPLAY_FPS = 24;
const INTRO_AUTOPLAY_DURATION_SECONDS =
  (INTRO_AUTOPLAY_FINAL_FRAME - INTRO_AUTOPLAY_START_FRAME) / INTRO_AUTOPLAY_FPS;
const HERO_DISPLAY_FONT_FAMILY =
  "var(--font-hero), 'Inter', 'Segoe UI', system-ui, sans-serif";
const ControlCenterModelPreviewLazy = dynamic(
  () =>
    import('@/components/grid-ops/ControlCenterModelPreview').then(
      (module) => module.ControlCenterModelPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-36 rounded-xl border border-[#2e5975]/45 bg-[radial-gradient(circle_at_40%_24%,rgba(77,147,255,0.24),transparent_48%),linear-gradient(180deg,#091325,#060c16)]" />
    )
  }
);
const BatteryStorageModelPreviewLazy = dynamic(
  () =>
    import('@/components/grid-ops/BatteryStorageModelPreview').then(
      (module) => module.BatteryStorageModelPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded-xl border border-[#2e5975]/45 bg-[radial-gradient(circle_at_40%_24%,rgba(77,147,255,0.24),transparent_48%),linear-gradient(180deg,#091325,#060c16)]" />
    )
  }
);

const getSectionHeightClass = (chapter: GridFlowChapter) => {
  return CHAPTER_SCROLL_HEIGHT_CLASS;
};

const getSectionAlignmentClass = (chapter: GridFlowChapter) => {
  switch (chapter.align) {
    case 'right':
      return 'items-center justify-end';
    case 'center':
      return 'items-center justify-center';
    default:
      return chapter.variant === 'intro'
        ? 'items-start justify-start'
        : 'items-center justify-start';
  }
};

const SNAPSHOT_TONE_STYLES: Record<
  GridFlowSnapshotTone,
  {
    shell: string;
    label: string;
    badge: string;
    dot: string;
    action: string;
    bar: string;
  }
> = {
  mint: {
    shell:
      'border-white/20 bg-[linear-gradient(145deg,rgba(7,10,11,0.98),rgba(8,12,13,0.95)_45%,rgba(12,16,17,0.9)_100%)]',
    label: 'text-[#c3cdca]',
    badge: 'border-white/20 bg-white/[0.06] text-[#dde6e2]',
    dot: 'bg-[#d6dfdb]',
    action: 'text-[#c7d0cc]',
    bar: 'from-[#9ea8a4] via-[#bec7c3] to-[#d9e1de]'
  },
  amber: {
    shell:
      'border-white/20 bg-[linear-gradient(145deg,rgba(8,10,11,0.98),rgba(10,12,13,0.95)_50%,rgba(14,16,17,0.9)_100%)]',
    label: 'text-[#c7d0cc]',
    badge: 'border-white/20 bg-white/[0.06] text-[#e0e8e4]',
    dot: 'bg-[#d8e1dc]',
    action: 'text-[#c9d2ce]',
    bar: 'from-[#a3ada9] via-[#c1cac6] to-[#dbe3df]'
  },
  sky: {
    shell:
      'border-white/20 bg-[linear-gradient(145deg,rgba(6,9,11,0.98),rgba(8,12,14,0.95)_45%,rgba(11,16,18,0.9)_100%)]',
    label: 'text-[#c5ceca]',
    badge: 'border-white/20 bg-white/[0.06] text-[#dfe8e4]',
    dot: 'bg-[#d7dfdc]',
    action: 'text-[#c8d1cd]',
    bar: 'from-[#a0aaa6] via-[#c0c9c5] to-[#dbe2df]'
  }
};

const SQL_KEYWORDS = new Set([
  'WITH',
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'BY',
  'ORDER',
  'AS',
  'AND',
  'OR',
  'OVER',
  'PARTITION',
  'DESC',
  'CAST',
  'TIMESTAMP',
  'IS',
  'NOT',
  'NULL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END'
]);

const SQL_FUNCTIONS = new Set(['window', 'AVG', 'STDDEV_POP', 'DENSE_RANK', 'LAG']);

interface SqlCodePalette {
  punctuation: string;
  operator: string;
  number: string;
  keyword: string;
  functionName: string;
  identifier: string;
  stringLiteral: string;
}

const DEFAULT_SQL_CODE_PALETTE: SqlCodePalette = {
  punctuation: 'text-[#9fa9a5]',
  operator: 'text-[#ced5d2]',
  number: 'text-[#c0c9c5]',
  keyword: 'text-[#dde5e2]',
  functionName: 'text-[#e7eeeb]',
  identifier: 'text-[#edf3f0]',
  stringLiteral: 'text-[#bdc8c3]'
};

const ALERT_SQL_CODE_PALETTE: SqlCodePalette = {
  punctuation: 'text-[#a9a2a2]',
  operator: 'text-[#d4cccc]',
  number: 'text-[#c6bebe]',
  keyword: 'text-[#e1d8d8]',
  functionName: 'text-[#eae0e0]',
  identifier: 'text-[#f4ecec]',
  stringLiteral: 'text-[#ccc4c4]'
};

const renderSqlCodeChunk = (
  chunk: string,
  keyPrefix: string,
  palette: SqlCodePalette
) => {
  const tokens = chunk.split(/(\s+|[(),*])/).filter((token) => token.length > 0);

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    if (/^\s+$/.test(token)) {
      return <span key={key}>{token}</span>;
    }

    if (/^[(),*]$/.test(token)) {
      return (
        <span
          key={key}
          className={palette.punctuation}
        >
          {token}
        </span>
      );
    }

    if (/^(<=|>=|=)$/.test(token)) {
      return (
        <span
          key={key}
          className={palette.operator}
        >
          {token}
        </span>
      );
    }

    if (/^\d+$/.test(token)) {
      return (
        <span
          key={key}
          className={palette.number}
        >
          {token}
        </span>
      );
    }

    const upperToken = token.toUpperCase();
    if (SQL_KEYWORDS.has(upperToken)) {
      return (
        <span
          key={key}
          className={palette.keyword}
        >
          {token}
        </span>
      );
    }

    if (SQL_FUNCTIONS.has(token) || SQL_FUNCTIONS.has(upperToken)) {
      return (
        <span
          key={key}
          className={palette.functionName}
        >
          {token}
        </span>
      );
    }

    return (
      <span
        key={key}
        className={palette.identifier}
      >
        {token}
      </span>
    );
  });
};

const renderSqlSnippetLine = (
  line: string,
  lineIndex: number,
  palette: SqlCodePalette
) => {
  const stringAwareSegments = line.split(/('(?:[^']|'')*')/g).filter((segment) => segment.length > 0);

  return stringAwareSegments.map((segment, segmentIndex) => {
    const key = `line-${lineIndex}-segment-${segmentIndex}`;
    if (/^'.*'$/.test(segment)) {
      return (
        <span
          key={key}
          className={palette.stringLiteral}
        >
          {segment}
        </span>
      );
    }

    return (
      <span key={key}>
        {renderSqlCodeChunk(segment, key, palette)}
      </span>
    );
  });
};

function StepSnapshot({
  snapshot
}: {
  snapshot: GridFlowStepSnapshot;
}) {
  const tone = SNAPSHOT_TONE_STYLES[snapshot.tone];
  const isAlertSnippet = snapshot.codeTone === 'alert';
  const isAmberTone = snapshot.tone === 'amber';
  const progressionSnapshot = snapshot.progressionSnapshot;
  const progressionPercent = progressionSnapshot
    ? Math.round(clamp(progressionSnapshot.readinessPercent, 0, 100))
    : 0;
  const progressionRingStyle = progressionSnapshot
    ? {
        background: `conic-gradient(#bfc9c5 ${progressionPercent * 3.6}deg, rgba(255,255,255,0.13) ${progressionPercent * 3.6}deg)`
      }
    : undefined;
  const sqlPalette = isAlertSnippet ? ALERT_SQL_CODE_PALETTE : DEFAULT_SQL_CODE_PALETTE;
  const codeShellClass = isAlertSnippet
    ? 'overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(170deg,rgba(22,15,15,0.96),rgba(14,10,10,0.95))]'
    : 'overflow-hidden rounded-xl border border-white/20 bg-[#070c0a]/96';
  const codeHeaderClass = isAlertSnippet
    ? 'flex items-center justify-between border-b border-white/15 px-3 py-2'
    : 'flex items-center justify-between border-b border-white/15 px-3 py-2';
  const codeLabelClass = isAlertSnippet
    ? 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7cccc]'
    : 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c5d0cb]';
  const codeChipClass = isAlertSnippet
    ? 'rounded-full border border-white/18 bg-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ddd4d4]'
    : 'rounded-full border border-white/18 bg-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d2dbd7]';
  const lineNumberClass = isAlertSnippet
    ? 'select-none text-right text-[10px] text-[#9f9797]'
    : 'select-none text-right text-[10px] text-[#9ca8a2]';
  const briefingShellClass = isAmberTone
    ? 'overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(165deg,rgba(15,11,8,0.98),rgba(11,9,7,0.96))]'
    : 'overflow-hidden rounded-xl border border-white/20 bg-[#070c0a]/96';
  const briefingHeaderClass = isAmberTone
    ? 'flex items-center justify-between gap-2 border-b border-white/15 px-3 py-2'
    : 'flex items-center justify-between gap-2 border-b border-white/15 px-3 py-2';
  const briefingLabelClass = isAmberTone
    ? 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d9d0c6]'
    : 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8d1cc]';
  const briefingRegionClass = isAmberTone
    ? 'rounded-full border border-white/18 bg-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#ddd4ca]'
    : 'rounded-full border border-white/18 bg-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#d6dfdb]';
  const briefingSectionClass = isAmberTone
    ? 'text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c8c0b8]'
    : 'text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b5c0ba]';
  const briefingTextClass = isAmberTone
    ? 'text-[11px] leading-5 text-[#d9d1ca]'
    : 'text-[11px] leading-5 text-[#d3ddd8]';
  const briefingBulletClass = isAmberTone ? 'bg-[#c8beb3]' : tone.dot;
  const laneSnapshot = snapshot.laneSnapshot;
  const missionListing = snapshot.missionListing;
  const isGridOpsSnapshot = snapshot.mediaModel === 'control-center';
  const gridObjectiveRewards = [120, 80, 60] as const;

  if (missionListing) {
    return (
      <div className="mt-5 origin-top scale-[0.86] [filter:saturate(0)]">
        <div className="group relative overflow-hidden rounded-[1.6rem] border border-white/20 bg-[linear-gradient(150deg,rgba(11,12,13,0.98),rgba(10,11,12,0.97)_58%,rgba(16,17,18,0.9)_100%)] p-4 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.72)] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(225,234,230,0.08),transparent_35%),linear-gradient(180deg,rgba(219,228,224,0.06),transparent_48%)]" />
          <div className="pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full bg-[#cfd8d4]/8 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ced8d4]">
                <span aria-hidden="true">⚡</span>
                {missionListing.missionId}
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-[1.7rem] font-semibold uppercase tracking-[0.02em] text-[#edf3f0] sm:text-[2.35rem] sm:leading-[0.95]">
                  {missionListing.title}
                </h3>
                <span className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d2dbd7]">
                  {missionListing.difficulty}
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-[14px] leading-7 text-[#bcc7c2]">
                {missionListing.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/16 bg-black/40 px-3 py-1.5 text-[#c1ccc7]">
                  {missionListing.urgency}
                </span>
              </div>
            </div>

            <aside className="w-full max-w-[18rem] rounded-3xl border border-white/16 bg-[linear-gradient(165deg,rgba(8,10,11,0.97),rgba(9,11,12,0.95))] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#aab5b0]">
                  {missionListing.statusLabel}
                </span>
                <span className="text-[1.85rem] font-semibold leading-none text-[#ebf1ee]">
                  {missionListing.statusValue}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-[#9fa9a5] to-[#c8d1cd]" />
              </div>

              <p className="mt-4 text-sm leading-6 text-[#c1cbc7]">
                {missionListing.statusDescription}
              </p>
            </aside>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-4">
            <div className="flex flex-wrap gap-2">
              {missionListing.stats.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/16 bg-black/40 px-3 py-1 text-xs text-[#bec8c4]"
                >
                  {item}
                </span>
              ))}
            </div>

            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#d8e1dd] transition-transform group-hover:translate-x-0.5">
              {missionListing.primaryAction}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-5 origin-top scale-[0.88] overflow-hidden rounded-[1.2rem] border shadow-[0_18px_45px_rgba(0,0,0,0.38)] [filter:saturate(0)] ${tone.shell}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${tone.label}`}>
          {snapshot.label}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${tone.badge}`}>
          {snapshot.status}
        </span>
      </div>
      <div className="space-y-3 px-4 py-4">
        {snapshot.title ? (
          <p className="text-sm font-semibold leading-6 text-[#eaf0ed]">{snapshot.title}</p>
        ) : null}
        {snapshot.meta ? (
          <p className="text-xs font-medium text-[#c4cec9]">{snapshot.meta}</p>
        ) : null}
        {snapshot.highlights.length > 0 && !isGridOpsSnapshot ? (
          <div className="space-y-2">
            {snapshot.highlights.map((item) => (
              <p
                key={item}
                className="flex items-start gap-2 text-xs leading-5 text-[#ccd6d1]"
              >
                <span className={`mt-[0.42rem] h-1.5 w-1.5 flex-shrink-0 rounded-full ${tone.dot}`} />
                <span>{item}</span>
              </p>
            ))}
          </div>
        ) : null}
        {isGridOpsSnapshot ? (
          <div className="overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(165deg,rgba(7,11,14,0.96),rgba(9,12,15,0.95)_55%,rgba(10,15,18,0.9)_100%)]">
            <div className="border-b border-white/15 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b6c1bc]">
                    Live operation
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#ecf2ef]">
                    Grid stabilizer challenge
                  </p>
                </div>
                <span className="rounded-full border border-white/20 bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ccd6d2]">
                  Combo x2
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#a4b0ab]">Score</p>
                  <p className="mt-1 text-sm font-semibold text-[#e5ece8]">2,480</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#a4b0ab]">Risk</p>
                  <p className="mt-1 text-sm font-semibold text-[#d4dcd8]">High</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#a4b0ab]">Time left</p>
                  <p className="mt-1 text-sm font-semibold text-[#dfe7e3]">02:40</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 px-3 py-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b4beb9]">
                  Active objectives
                </p>
                {snapshot.highlights.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start justify-between gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-2"
                  >
                    <span className="flex items-start gap-2 text-[11px] leading-5 text-[#d3ddd8]">
                      <span className="mt-[0.3rem] inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-[#d7e0dc]">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{item}</span>
                    </span>
                    <span className="rounded-full border border-white/18 bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-[#d2dbd7]">
                      +{gridObjectiveRewards[index] ?? 60}
                    </span>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-white/15">
                <ControlCenterModelPreviewLazy className="h-40 border-0" />
              </div>
              <div className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-2">
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a7b3ae]">
                  <span>Stability meter</span>
                  <span>78%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#99a4a0] via-[#b5bfbb] to-[#d1d9d5]" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {laneSnapshot ? (
          <div className="relative overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(155deg,rgba(8,11,10,0.96),rgba(8,10,9,0.98)_60%,rgba(6,8,7,0.98)_100%)] px-3 py-4 sm:px-4 sm:py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(191,205,199,0.1),transparent_36%),radial-gradient(circle_at_90%_84%,rgba(182,192,200,0.06),transparent_42%)]" />
            <div className="relative space-y-2.5">
              <div className="relative space-y-2 pb-1">
                <div className="pointer-events-none absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(177,188,183,0.06),rgba(177,188,183,0.5),rgba(177,188,183,0.06))]" />
                {laneSnapshot.modules.map((module) => {
                  const isCurrentModule = module.state === 'current';
                  const cardClass = isCurrentModule
                    ? 'border-white/20 bg-[linear-gradient(140deg,rgba(23,20,15,0.95),rgba(19,17,13,0.95))]'
                    : 'border-white/15 bg-[linear-gradient(140deg,rgba(13,17,15,0.95),rgba(11,14,12,0.95))]';
                  const badgeClass = isCurrentModule
                    ? 'border-white/20 bg-white/[0.08] text-[#ddd2c5]'
                    : 'border-white/18 bg-white/[0.07] text-[#d0d9d5]';
                  const markerClass = isCurrentModule
                    ? 'border-white/25 bg-[#7b7f7d] text-[#f3f5f4] shadow-[0_0_0_10px_rgba(180,188,184,0.2)]'
                    : 'border-white/22 bg-[#5f6663] text-[#eef2ef] shadow-[0_0_0_10px_rgba(122,132,127,0.16)]';
                  const card = (
                    <article className={`rounded-xl border px-2.5 py-2.5 sm:px-3 sm:py-3 ${cardClass}`}>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9ea9a4]">
                        {module.label}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold leading-5 text-[#e7eeea] sm:text-base sm:leading-6">
                        {module.title}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#aeb9b4]">
                        <span>{module.meta}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${badgeClass}`}>
                          {module.checkpoint}
                        </span>
                      </div>
                    </article>
                  );

                  return (
                    <div
                      key={module.id}
                      className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3"
                    >
                      <div>{module.side === 'left' ? card : null}</div>
                      <span
                        className={`relative z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full border ${markerClass}`}
                      >
                        {isCurrentModule ? <Play className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </span>
                      <div>{module.side === 'right' ? card : null}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
        {progressionSnapshot ? (
          <div className="overflow-hidden rounded-xl border border-white/20 bg-[#070c0a]/96 p-3">
            <div className="flex items-start gap-3">
              <div
                className="relative h-24 w-24 shrink-0 rounded-full p-2"
                style={progressionRingStyle}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0a0f0d] text-center">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#afbbb6]">
                    Readiness
                  </span>
                  <span className="mt-1 text-[1.35rem] font-semibold leading-none text-[#edf3f0]">
                    {progressionPercent}%
                  </span>
                </div>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aeb9b4]">
                  Promotion target
                </p>
                <p className="mt-1 text-lg font-semibold leading-6 text-[#eaf1ed]">
                  {progressionSnapshot.promotionTarget}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#c5cfca]">
                  {progressionSnapshot.guidance}
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/22 bg-[#d4ddd9] px-4 py-2.5 text-sm font-semibold text-[#101614]">
              {progressionSnapshot.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xs text-[#bcc7c2]">{progressionSnapshot.footnote}</p>
          </div>
        ) : null}
        {snapshot.missionBriefing ? (
          <div className={briefingShellClass}>
            <div className={briefingHeaderClass}>
              <span className={briefingLabelClass}>Mission briefing</span>
              <span className={briefingRegionClass}>{snapshot.missionBriefing.region}</span>
            </div>
            <div className="space-y-3 px-3 py-3">
              <div className="space-y-1">
                <p className={briefingSectionClass}>Trigger</p>
                <p className={briefingTextClass}>{snapshot.missionBriefing.trigger}</p>
              </div>
              <div className="space-y-1">
                <p className={briefingSectionClass}>Objective</p>
                <p className={briefingTextClass}>{snapshot.missionBriefing.objective}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className={briefingSectionClass}>Constraints</p>
                  <ul className="space-y-1">
                    {snapshot.missionBriefing.constraints.map((constraint) => (
                      <li
                        key={constraint}
                        className="flex items-start gap-2 text-[11px] leading-5 text-[#d6cec6]"
                      >
                        <span className={`mt-[0.38rem] h-1.5 w-1.5 flex-shrink-0 rounded-full ${briefingBulletClass}`} />
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <p className={briefingSectionClass}>Deliverables</p>
                  <ul className="space-y-1">
                    {snapshot.missionBriefing.deliverables.map((deliverable) => (
                      <li
                        key={deliverable}
                        className="flex items-start gap-2 text-[11px] leading-5 text-[#d6cec6]"
                      >
                        <span className={`mt-[0.38rem] h-1.5 w-1.5 flex-shrink-0 rounded-full ${briefingBulletClass}`} />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {snapshot.codeSnippet && !laneSnapshot ? (
          <div className={codeShellClass}>
            <div className={codeHeaderClass}>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isAlertSnippet ? 'bg-[#8a7f7f]' : 'bg-[#8f9a96]'}`} />
                <span className={`h-2 w-2 rounded-full ${isAlertSnippet ? 'bg-[#a19a9a]' : 'bg-[#a2ada8]'}`} />
                <span className="h-2 w-2 rounded-full bg-[#c1c9c5]" />
              </div>
              <span className={codeLabelClass}>
                {snapshot.codeLabel ?? 'query snippet'}
              </span>
              <span className={codeChipClass}>
                sql
              </span>
            </div>
            <pre className="px-0 py-2 text-[11px] leading-[1.45] whitespace-pre-wrap break-words">
              <code className="block font-mono">
                {snapshot.codeSnippet.map((line, lineIndex) => (
                  <span
                    key={`${line}-${lineIndex}`}
                    className="grid grid-cols-[1.8rem,1fr] gap-3 px-3 py-0.5"
                  >
                    <span className={lineNumberClass}>
                      {lineIndex + 1}
                    </span>
                    <span>{renderSqlSnippetLine(line, lineIndex, sqlPalette)}</span>
                  </span>
                ))}
              </code>
            </pre>
          </div>
        ) : null}
        {progressionSnapshot ? null : (
          <div className="flex items-center gap-3 pt-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${tone.bar}`} />
            </div>
            <span className={`text-[11px] font-semibold ${tone.action}`}>{snapshot.actionLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryCta({
  source,
  label,
  emphasized,
  isLightMode
}: {
  source: 'grid_flow_primary' | 'grid_flow_final';
  label: string;
  emphasized: boolean;
  isLightMode: boolean;
}) {
  return (
    <Link
      href="/signup"
      onClick={() => {
        void trackProductEvent('landing_cta', { source });
      }}
      className={`pointer-events-auto group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
        emphasized
          ? 'border border-[#1c7f58] bg-[#22b999] text-[#08110b] hover:bg-[#6fe89a]'
          : isLightMode
            ? 'border border-[#7f8f87]/45 bg-white/85 text-[#25302c] hover:border-[#6f7d76] hover:bg-white'
            : 'border border-white/24 bg-black/28 text-[#e4ece8] hover:border-white/34 hover:bg-black/40'
      }`}
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ScrollHint({
  reducedMotion,
  isLightMode
}: {
  reducedMotion: boolean;
  isLightMode: boolean;
}) {
  const chevronIndexes = [0, 1, 2] as const;
  const chevronTrailShellClass =
    'pointer-events-none absolute left-1/2 top-[calc(100%+0.25rem)] flex -translate-x-1/2 flex-col items-center -space-y-1';
  const shellClass = `relative flex h-[10.25rem] w-[4.75rem] items-start justify-center rounded-[2.45rem] ${
    isLightMode
      ? 'bg-white/22 shadow-[0_16px_34px_rgba(24,72,56,0.2)]'
      : 'bg-black/28 shadow-[0_20px_44px_rgba(0,0,0,0.42)]'
  }`;
  const shellClassWithPointerGuard = `${shellClass} pointer-events-none`;

  const glowClass = isLightMode
    ? 'bg-[radial-gradient(circle,rgba(122,137,128,0.26),transparent_72%)]'
    : 'bg-[radial-gradient(circle,rgba(179,192,186,0.22),transparent_72%)]';

  const bubbleClass = `block h-6 w-6 rounded-full ${
    isLightMode ? 'bg-[#6f7e77]' : 'bg-[#a3b0aa]'
  }`;
  const chevronColorClass = isLightMode ? 'text-[#6a867b]/75' : 'text-white/40';

  const chevronTrail = reducedMotion ? (
    <span className={chevronTrailShellClass}>
      {chevronIndexes.map((index) => (
        <span
          key={`chevron-static-${index}`}
          className={`h-8 w-8 ${chevronColorClass}`}
          style={{
            opacity: 0.84 - index * 0.18
          }}
        >
          <svg
            viewBox="0 0 20 12"
            fill="none"
            className="pointer-events-none h-full w-full"
          >
            <path
              d="M2 3 L10 11 L18 3"
              stroke="currentColor"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
          </svg>
        </span>
      ))}
    </span>
  ) : (
    <span className={chevronTrailShellClass}>
      {chevronIndexes.map((index) => (
        <motion.span
          key={`chevron-motion-${index}`}
          className={`h-8 w-8 ${chevronColorClass}`}
          animate={{
            y: [-1, 3, -1],
            opacity: [0.2, 0.72, 0.2]
          }}
          transition={{
            duration: 1.3,
            ease: 'easeInOut',
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.14
          }}
        >
          <svg
            viewBox="0 0 20 12"
            fill="none"
            className="pointer-events-none h-full w-full"
          >
            <path
              d="M2 3 L10 11 L18 3"
              stroke="currentColor"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
          </svg>
        </motion.span>
      ))}
    </span>
  );

  if (reducedMotion) {
    return (
      <div className={shellClassWithPointerGuard}>
        <span
          className={`absolute inset-[0.4rem] rounded-[2.1rem] border ${
            isLightMode ? 'border-[#b8d0c5]/85' : 'border-white/28'
          }`}
        />
        <span className="absolute left-1/2 top-4 -translate-x-1/2">
          <span className={`${bubbleClass} opacity-85`} />
        </span>
        {chevronTrail}
      </div>
    );
  }

  return (
    <div className={shellClassWithPointerGuard}>
      <motion.span
        aria-hidden="true"
        className={`pointer-events-none absolute -inset-3 -z-[1] rounded-[3rem] blur-md ${glowClass}`}
        animate={{
          opacity: [0.32, 0.68, 0.32],
          scale: [0.96, 1.08, 0.96]
        }}
        transition={{
          duration: 2.8,
          ease: 'easeInOut',
          repeat: Number.POSITIVE_INFINITY
        }}
      />
      <span
        className={`absolute inset-[0.4rem] rounded-[2.1rem] border ${
          isLightMode ? 'border-[#b8d0c5]/85' : 'border-white/28'
        }`}
      />
      <span className="absolute left-1/2 top-4 -translate-x-1/2">
        <motion.span
          className={bubbleClass}
          animate={{
            y: [0, 58, 0],
            opacity: [0.96, 0.82, 0.96],
            scale: [1, 0.95, 1]
          }}
          transition={{
            duration: 2.1,
            ease: 'easeInOut',
            repeat: Number.POSITIVE_INFINITY
          }}
        />
      </span>
      {chevronTrail}
    </div>
  );
}

function IntroCountdownWatch({
  secondsRemaining,
  isLightMode
}: {
  secondsRemaining: number;
  isLightMode: boolean;
}) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${
          isLightMode
            ? 'border-[#b8ccc2]/70 bg-white/74 text-[#2a3b34]'
            : 'border-white/20 bg-[#050a08]/62 text-[#d9e4df]'
        }`}
      >
        <Clock3 className="h-3.5 w-3.5" />
        <span className="font-mono text-[13px] font-semibold tabular-nums">
          {Math.max(0, secondsRemaining).toFixed(1)}
        </span>
        <span className={`text-[10px] uppercase tracking-[0.12em] ${isLightMode ? 'text-[#5b6f66]' : 'text-[#9eb2a9]'}`}>
          s
        </span>
      </div>
    </div>
  );
}

function IntroBrandedTitle({
  title,
  isLightMode
}: {
  title: string;
  isLightMode: boolean;
}) {
  const highlightedTitle = title.split(/(big data|grid|PySpark)/i).map((part, index) => {
    if (/^big data$/i.test(part)) {
      return (
        <span
          key={`title-part-${index}`}
          className="text-[#f4a340]"
        >
          {part}
        </span>
      );
    }

    if (/^grid$/i.test(part)) {
      return (
        <span
          key={`title-part-${index}`}
          className="text-[#57edc5]"
        >
          {part}
        </span>
      );
    }

    if (/^PySpark$/i.test(part)) {
      return (
        <span
          key={`title-part-${index}`}
          className="text-[#e2e8e4]"
        >
          {part}
        </span>
      );
    }

    return <span key={`title-part-${index}`}>{part}</span>;
  });

  return (
    <h1
      className={`mt-5 max-w-[10.8ch] text-[clamp(2.8rem,6.4vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.045em] ${
        isLightMode ? 'text-[#13221a]' : 'text-[#f3f6f3]'
      }`}
      style={{ fontFamily: HERO_DISPLAY_FONT_FAMILY }}
    >
      <span className="block">{highlightedTitle}</span>
    </h1>
  );
}

function IntroChapter({
  chapter,
  emphasis,
  reducedMotion,
  isLightMode
}: {
  chapter: GridFlowChapter;
  emphasis: number;
  reducedMotion: boolean;
  isLightMode: boolean;
}) {
  return (
    <div
      className="pointer-events-auto relative max-w-[30rem] pt-24 sm:pt-28 lg:pt-[15svh]"
      style={{
        opacity: emphasis,
        transform: `translate3d(0, ${(1 - emphasis) * 16}px, 0)`,
        pointerEvents: emphasis < 0.05 ? 'none' : 'auto',
        transition: reducedMotion
          ? 'opacity 160ms linear, transform 160ms linear'
          : 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform, opacity'
      }}
    >
      <div
        className={`absolute -inset-x-8 -inset-y-10 rounded-[3rem] blur-3xl ${
          isLightMode
            ? 'bg-[radial-gradient(circle_at_22%_28%,rgba(141,156,148,0.2),transparent_0,transparent_48%),radial-gradient(circle_at_78%_16%,rgba(152,164,171,0.16),transparent_0,transparent_38%)]'
            : 'bg-[radial-gradient(circle_at_22%_28%,rgba(153,167,160,0.14),transparent_0,transparent_44%),radial-gradient(circle_at_78%_16%,rgba(145,156,163,0.1),transparent_0,transparent_34%)]'
        }`}
      />
      <div className="relative">
        <IntroBrandedTitle title={chapter.title} isLightMode={isLightMode} />
        <div
          className="pointer-events-none hidden lg:fixed lg:top-[10.5rem] lg:z-20 lg:block"
          style={{
            left: 'var(--landing-nav-cta-mid, 50vw)',
            transform: 'translateX(-50%)'
          }}
        >
          <ScrollHint reducedMotion={reducedMotion} isLightMode={isLightMode} />
        </div>
        {chapter.ctaHint ? (
          <p className={`mt-4 max-w-[24rem] text-xs leading-6 ${isLightMode ? 'text-[#5f7a6c]' : 'text-[#9cb8aa]'}`}>{chapter.ctaHint}</p>
        ) : null}
      </div>
    </div>
  );
}

function StoryChapterCard({
  chapter,
  emphasis,
  isLightMode,
  chapterStepNumber
}: {
  chapter: GridFlowChapter;
  emphasis: number;
  isLightMode: boolean;
  chapterStepNumber: number;
}) {
  const chapterStepLabel = String(chapterStepNumber).padStart(2, '0');
  const isTheoryStep = chapter.id === 'theory';
  const isPracticeStep = chapter.id === 'missions';
  const isGridStep = chapter.id === 'grid-case';
  const kwhPhrase = 'and gain kWh';
  const practiceBodyParts = isPracticeStep ? chapter.body.split(kwhPhrase) : [chapter.body];
  const sectionBody = isPracticeStep && practiceBodyParts.length === 2 ? (
    <>
      {practiceBodyParts[0]}
      <span className={isLightMode ? 'font-semibold text-[#1f7f5f]' : 'font-semibold text-[#57d18f]'}>
        {kwhPhrase}
      </span>
      {practiceBodyParts[1]}
    </>
  ) : (
    chapter.body
  );
  const sectionCard = isTheoryStep ? (
    <TheoryCodeSnippetCard isLightMode={isLightMode} />
  ) : isPracticeStep ? (
    <MissionBriefingCard isLightMode={isLightMode} />
  ) : isGridStep ? (
    <BatteryDeckPreviewCard isLightMode={isLightMode} />
  ) : null;

  return (
    <GridExperienceSection
      stepLabel={chapterStepLabel}
      eyebrow={chapter.eyebrow}
      title={chapter.title}
      body={sectionBody}
      card={sectionCard}
      emphasis={emphasis}
      isLightMode={isLightMode}
    />
  );
}

function StoryInteractiveColumn({ children }: { children: React.ReactNode }) {
  return <div className={STORY_INTERACTIVE_COLUMN_CLASS}>{children}</div>;
}

function GridExperienceSection({
  stepLabel,
  eyebrow,
  title,
  body,
  card,
  emphasis,
  isLightMode
}: {
  stepLabel: string;
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  card: React.ReactNode;
  emphasis: number;
  isLightMode: boolean;
}) {
  return (
    <div
      className="relative max-w-[62rem] py-16 min-h-[34rem]"
      style={{
        opacity: emphasis,
        transform: `translate3d(0, ${(1 - emphasis) * 20}px, 0)`,
        transition:
          'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform, opacity'
      }}
    >
      <div
        className={`absolute -inset-x-8 -inset-y-8 rounded-[2.75rem] blur-2xl ${
          isLightMode
            ? 'bg-[radial-gradient(circle_at_18%_24%,rgba(146,160,153,0.16),transparent_0,transparent_46%),linear-gradient(180deg,rgba(231,244,237,0.42),rgba(231,244,237,0))]'
            : 'bg-[radial-gradient(circle_at_18%_24%,rgba(148,162,155,0.1),transparent_0,transparent_42%),linear-gradient(180deg,rgba(5,12,10,0.24),rgba(5,12,10,0))]'
        }`}
      />
      <div className={`relative grid h-full gap-6 ${STORY_CHAPTER_GRID_CLASS} lg:items-start`}>
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`relative -top-1 inline-flex h-[3.2rem] w-[3.2rem] items-center justify-center rounded-full border text-[1.3rem] font-semibold leading-none tracking-[0.01em] ${
                isLightMode
                  ? 'border-[#6a7b73]/70 bg-[#eef2ef] text-[#38433f]'
                  : 'border-[#5c6763]/70 bg-[#121715] text-[#d8e1dd]'
              }`}
            >
              {stepLabel}
            </span>
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                isLightMode ? 'text-[#607069]' : 'text-[#a8b3ae]'
              }`}
            >
              {eyebrow}
            </p>
          </div>
          <h2
            className={`mt-3 text-[clamp(1.3rem,2.1vw,1.95rem)] font-semibold leading-[1.05] tracking-[-0.035em] ${
              isLightMode ? 'text-[#13221a]' : 'text-[#f2f7f3]'
            }`}
          >
            {title}
          </h2>
          <p
            className={`mt-3 max-w-[26rem] text-[13px] leading-6 ${
              isLightMode ? 'text-[#48665a]' : 'text-[#cfd7d3]'
            }`}
          >
            {body}
          </p>
        </div>
        <StoryInteractiveColumn>{card}</StoryInteractiveColumn>
      </div>
    </div>
  );
}

function TheoryCodeSnippetCard({ isLightMode }: { isLightMode: boolean }) {
  const snippetLines = [
    'alerts_df = spark.sql("""',
    'WITH telemetry AS (',
    '  SELECT zone,',
    '         AVG(load_kw) AS avg_load_kw,',
    '         MAX(voltage_kv) AS max_voltage_kv',
    '  FROM grid.telemetry_events',
    "  WHERE ts >= current_timestamp() - INTERVAL 2 HOURS",
    '  GROUP BY zone',
    ')',
    'SELECT zone, avg_load_kw, max_voltage_kv',
    'FROM telemetry',
    'WHERE avg_load_kw >= 4200',
    'ORDER BY avg_load_kw DESC',
    'LIMIT 5',
    '""")'
  ] as const;
  const snippetPalette: SqlCodePalette = {
    punctuation: 'text-[#9ea4ab]',
    operator: 'text-[#d7c18a]',
    number: 'text-[#c8b78e]',
    keyword: 'text-[#8ac6b5]',
    functionName: 'text-[#c29fd4]',
    identifier: 'text-[#d5d8dc]',
    stringLiteral: 'text-[#a3be8c]'
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isLightMode
          ? 'border-[#aab0b7]/60 bg-[#ebedf0]/92'
          : 'border-[#555b61]/65 bg-[linear-gradient(160deg,rgba(28,30,33,0.97),rgba(21,23,26,0.96))]'
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isLightMode ? 'text-[#4f5964]' : 'text-[#aeb6bf]'}`}>
        Theory code snippet
      </p>
      <pre className="mt-3 rounded-xl border border-white/10 bg-black/35 p-3 text-[10.5px] leading-5">
        <code className="block whitespace-pre-wrap break-words font-mono">
          {snippetLines.map((line, lineIndex) => (
            <span key={`${line}-${lineIndex}`} className="block">
              {renderSqlSnippetLine(line, lineIndex, snippetPalette)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function MissionBriefingCard({ isLightMode }: { isLightMode: boolean }) {
  const acts = [
    {
      label: 'Act 1 · 10-15 min',
      title: 'The Alarm',
      detail: 'Read the incident timeline, alerts, and constraints before touching production.'
    },
    {
      label: 'Act 2 · 30-40 min',
      title: 'The Investigation',
      detail: 'Query operational datasets and isolate the exact fault path.'
    },
    {
      label: 'Act 3 · 20-30 min',
      title: 'The Fix',
      detail: 'Ship the remediation and validate against strict checks.'
    },
    {
      label: 'Act 4 · 10 min',
      title: 'The Debrief',
      detail: 'Deliver incident metrics and close out the report for leadership.'
    }
  ] as const;

  return (
    <div
      className={`rounded-[1.8rem] border p-5 ${
        isLightMode
          ? 'border-[#aab0b7]/60 bg-[#ebedf0]/92'
          : 'border-[#555b61]/65 bg-[linear-gradient(160deg,rgba(28,30,33,0.97),rgba(21,23,26,0.96))]'
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isLightMode ? 'text-[#4f5964]' : 'text-[#aeb6bf]'}`}>
        Mission flow
      </p>
      <div
        className={`mt-3 max-h-[22rem] overflow-y-auto rounded-xl border p-3 ${
          isLightMode ? 'border-white/10 bg-black/10' : 'border-white/10 bg-black/35'
        }`}
      >
        {acts.map((act) => (
          <article
            key={act.title}
            className={`py-1.5 ${act.title !== 'The Debrief' ? 'border-b border-white/10' : ''}`}
          >
            <p className={`text-[10px] uppercase tracking-[0.14em] ${isLightMode ? 'text-[#6b737c]' : 'text-[#8f96a0]'}`}>
              {act.label}
            </p>
            <h3 className={`mt-0.5 text-[10.5px] font-semibold leading-5 ${isLightMode ? 'text-[#202733]' : 'text-[#d7dce3]'}`}>
              {act.title}
            </h3>
            <p className={`mt-0.5 text-[10.5px] leading-5 ${isLightMode ? 'text-[#4d5560]' : 'text-[#b8bec8]'}`}>
              {act.detail}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function BatteryDeckPreviewCard({ isLightMode }: { isLightMode: boolean }) {
  return (
    <div
      className={`rounded-[2rem] border p-4 ${
        isLightMode
          ? 'border-[#9db1c9]/65 bg-[#eef4ff]/90'
          : 'border-[#35547a]/55 bg-[linear-gradient(160deg,rgba(13,20,30,0.97),rgba(9,15,24,0.96))]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isLightMode ? 'text-[#4c6d95]' : 'text-[#9eb5d3]'}`}>
            Flexibility
          </p>
          <h3 className={`mt-1 text-sm font-semibold ${isLightMode ? 'text-[#1f3a5b]' : 'text-[#dbe8ff]'}`}>
            Battery Storage (50 MWh)
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            isLightMode
              ? 'border-[#95aed0] bg-[#e7eef9] text-[#375378]'
              : 'border-[#4b6a94] bg-[#152131] text-[#b7ccec]'
          }`}
        >
          <Info className="h-3.5 w-3.5" />
          Details
        </span>
      </div>

      <p className={`mt-2 text-[10.5px] leading-5 ${isLightMode ? 'text-[#3f5f85]' : 'text-[#a9bfde]'}`}>
        Absorbs renewable oversupply and discharges during peak stress.
      </p>

      <div
        className={`mt-3 rounded-2xl border px-4 py-3 ${
          isLightMode ? 'border-[#a3b9d7]/70 bg-[#e8f1ff]/70' : 'border-[#3d5a84] bg-[#101a27]/88'
        }`}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isLightMode ? 'text-[#4b6c92]' : 'text-[#9db5d6]'}`}>
          Unlocks
        </p>
        <p className={`mt-1 text-[10.5px] font-semibold leading-5 ${isLightMode ? 'text-[#244366]' : 'text-[#d9e7ff]'}`}>
          Mission 002: Evening Peak
        </p>
      </div>

      <div
        className={`mt-3 rounded-2xl border ${
          isLightMode ? 'border-[#7ca3b9] bg-[#dff1ff]/45' : 'border-[#2e745f] bg-[#07162a]/85'
        }`}
      >
        <BatteryStorageModelPreviewLazy className="h-44" />
      </div>

      <div
        className={`mt-3 flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-[10.5px] font-semibold ${
          isLightMode
            ? 'border-[#84b7aa] bg-[#dff8f0] text-[#1b6a56]'
            : 'border-[#2a7d66] bg-[#102523] text-[#63c9ac]'
        }`}
      >
        <Zap className="h-4 w-4" />
        Infrastructure active
      </div>
    </div>
  );
}

function ChapterContent({
  chapter,
  emphasis,
  reducedMotion,
  isLightMode,
  chapterStepNumber
}: {
  chapter: GridFlowChapter;
  emphasis: number;
  reducedMotion: boolean;
  isLightMode: boolean;
  chapterStepNumber: number | null;
}) {
  if (chapter.variant === 'intro') {
    return (
      <IntroChapter
        chapter={chapter}
        emphasis={emphasis}
        reducedMotion={reducedMotion}
        isLightMode={isLightMode}
      />
    );
  }

  if (chapter.variant === 'final') {
    return (
      <div
        className="relative mx-auto w-full max-w-[34rem] px-4"
        style={{
          opacity: emphasis,
          transform: `translate3d(0, ${(1 - emphasis) * 20}px, 0)`,
          transition: 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform, opacity'
        }}
      >
        <div
          className={`rounded-[1.4rem] border px-6 py-7 text-center backdrop-blur-lg ${
            isLightMode
              ? 'border-[#c7d9cf] bg-white/86 shadow-[0_20px_70px_rgba(16,38,28,0.18)]'
              : 'border-white/18 bg-[#06100c]/84 shadow-[0_20px_70px_rgba(0,0,0,0.4)]'
          }`}
        >
          <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isLightMode ? 'text-[#5f7a6c]' : 'text-[#a5bfb3]'}`}>
            {chapter.eyebrow}
          </p>
          <h2
            className={`mt-3 text-[clamp(1.7rem,5.2vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.035em] ${isLightMode ? 'text-[#13221a]' : 'text-[#f3f7f4]'}`}
            style={{ fontFamily: HERO_DISPLAY_FONT_FAMILY }}
          >
            {chapter.title}
          </h2>
          {chapter.body ? (
            <p className={`mx-auto mt-3 max-w-[28rem] text-[15px] leading-7 ${isLightMode ? 'text-[#48665a]' : 'text-[#c7ddd3]'}`}>
              {chapter.body}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#courses-gallery"
              className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors ${
                isLightMode
                  ? 'border-[#7f8f87]/45 bg-white/85 text-[#25302c] hover:border-[#6f7d76] hover:bg-white'
                  : 'border-white/24 bg-black/28 text-[#e4ece8] hover:border-white/34 hover:bg-black/40'
              }`}
            >
              Browse courses
            </Link>
            {chapter.ctaSource ? (
              <PrimaryCta
                source={chapter.ctaSource}
                label={chapter.ctaLabel ?? 'Start free'}
                emphasized
                isLightMode={isLightMode}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <StoryChapterCard
      chapter={chapter}
      emphasis={emphasis}
      isLightMode={isLightMode}
      chapterStepNumber={chapterStepNumber ?? 1}
    />
  );
}

export const GridFlowSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const chapterCentersRef = useRef<number[]>([]);
  const journeyPositionRef = useRef(0);
  const storyPositionRef = useRef(0);
  const lastCommitTimestampRef = useRef<number | null>(null);
  const slowScrollFramesRef = useRef(0);
  const scrollIdleTimeoutRef = useRef<number | null>(null);
  const scrollActiveRef = useRef(false);
  const [journeyPosition, setJourneyPosition] = useState(0);
  const [storyPosition, setStoryPosition] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'full' | 'balanced'>('full');
  const [introAutoplayFrame, setIntroAutoplayFrame] = useState<number | null>(
    INTRO_AUTOPLAY_START_FRAME
  );
  const [isIntroAutoplayComplete, setIsIntroAutoplayComplete] = useState(false);
  const [introCountdownSeconds, setIntroCountdownSeconds] = useState(
    INTRO_AUTOPLAY_DURATION_SECONDS
  );
  const isLightMode = false;
  const activeChapters = useMemo(() => {
    let storyCount = 0;

    return GRID_FLOW_CHAPTERS.filter((chapter) => {
      if (chapter.variant !== 'story') {
        return true;
      }

      storyCount += 1;
      return storyCount <= MAX_STORY_STEPS;
    });
  }, []);

  const measureChapterCenters = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const centers = chapterRefs.current
      .filter((chapter): chapter is HTMLElement => chapter !== null)
      .map((chapter) => {
        const rect = chapter.getBoundingClientRect();
        return window.scrollY + rect.top + rect.height * 0.5;
      });

    chapterCentersRef.current = centers;
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = () => setReducedMotion(mediaQuery.matches);
    applyPreference();

    const listener = () => applyPreference();
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const hardwareThreads = navigator.hardwareConcurrency ?? 8;
    const memoryNavigator = navigator as Navigator & { deviceMemory?: number };
    const deviceMemory = memoryNavigator.deviceMemory ?? 8;
    const preferBalancedMode = hardwareThreads <= 6 || deviceMemory <= 4;
    if (preferBalancedMode) {
      setPerformanceMode('balanced');
    }
  }, []);

  useEffect(() => {
    journeyPositionRef.current = journeyPosition;
  }, [journeyPosition]);

  useEffect(() => {
    storyPositionRef.current = storyPosition;
  }, [storyPosition]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (reducedMotion) {
      setIntroAutoplayFrame(null);
      setIsIntroAutoplayComplete(true);
      setIntroCountdownSeconds(0);
      return undefined;
    }

    setIsIntroAutoplayComplete(false);
    setIntroAutoplayFrame(INTRO_AUTOPLAY_START_FRAME);
    setIntroCountdownSeconds(INTRO_AUTOPLAY_DURATION_SECONDS);
    const frameDelta = INTRO_AUTOPLAY_FINAL_FRAME - INTRO_AUTOPLAY_START_FRAME;
    if (frameDelta <= 0) {
      setIntroAutoplayFrame(null);
      setIsIntroAutoplayComplete(true);
      setIntroCountdownSeconds(0);
      return undefined;
    }

    const frameIntervalMs = 1000 / INTRO_AUTOPLAY_FPS;
    let frameIndex = INTRO_AUTOPLAY_START_FRAME;
    const intervalId = window.setInterval(() => {
      frameIndex += 1;
      const remainingFrames = Math.max(INTRO_AUTOPLAY_FINAL_FRAME - frameIndex, 0);
      setIntroCountdownSeconds(remainingFrames / INTRO_AUTOPLAY_FPS);
      if (frameIndex >= INTRO_AUTOPLAY_FINAL_FRAME) {
        window.clearInterval(intervalId);
        setIntroAutoplayFrame(null);
        setIsIntroAutoplayComplete(true);
        setIntroCountdownSeconds(0);
        return;
      }

      setIntroAutoplayFrame(frameIndex);
    }, frameIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (reducedMotion || isIntroAutoplayComplete) {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventScrollKeys = new Set([
      'ArrowDown',
      'ArrowUp',
      'PageDown',
      'PageUp',
      'Home',
      'End',
      'Space'
    ]);
    const handleKeydown = (event: KeyboardEvent) => {
      if (preventScrollKeys.has(event.code) || preventScrollKeys.has(event.key)) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', handleKeydown, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', handleKeydown);
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
    };
  }, [isIntroAutoplayComplete, reducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let frameId: number | null = null;
    const scheduleMeasure = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        measureChapterCenters();
      });
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);

    const observer =
      'ResizeObserver' in window
        ? new ResizeObserver(() => {
            scheduleMeasure();
          })
        : null;

    chapterRefs.current.forEach((chapter) => {
      if (chapter) {
        observer?.observe(chapter);
      }
    });

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      observer?.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [measureChapterCenters]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let frameId: number | null = null;

    const markScrollActive = () => {
      if (!scrollActiveRef.current) {
        scrollActiveRef.current = true;
      }

      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }

      scrollIdleTimeoutRef.current = window.setTimeout(() => {
        scrollActiveRef.current = false;
        scrollIdleTimeoutRef.current = null;
      }, SCROLL_IDLE_TIMEOUT_MS);
    };

    const syncPositions = (nextPosition: number) => {
      if (Math.abs(journeyPositionRef.current - nextPosition) > JOURNEY_UPDATE_EPSILON) {
        journeyPositionRef.current = nextPosition;
        setJourneyPosition(nextPosition);
      }

      if (Math.abs(storyPositionRef.current - nextPosition) > STORY_UPDATE_EPSILON) {
        storyPositionRef.current = nextPosition;
        setStoryPosition(nextPosition);
      }
    };

    const commitJourneyPosition = () => {
      frameId = null;
      const root = sectionRef.current;
      const chapterCenters = chapterCentersRef.current;
      if (!root || chapterCenters.length === 0) {
        measureChapterCenters();
        return;
      }

      const now = performance.now();
      const frameMode = scrollActiveRef.current ? 'balanced' : performanceMode;
      if (frameMode === 'full') {
        if (lastCommitTimestampRef.current !== null) {
          const frameDelta = now - lastCommitTimestampRef.current;
          if (frameDelta > 30) {
            slowScrollFramesRef.current += 1;
          } else {
            slowScrollFramesRef.current = Math.max(0, slowScrollFramesRef.current - 1);
          }

          if (slowScrollFramesRef.current >= 8) {
            setPerformanceMode('balanced');
          }
        }
      } else {
        slowScrollFramesRef.current = 0;
      }
      lastCommitTimestampRef.current = now;

      const focusPosition = window.scrollY + window.innerHeight * 0.66;

      if (focusPosition <= chapterCenters[0]) {
        syncPositions(0);
        return;
      }

      const lastIndex = chapterCenters.length - 1;
      if (focusPosition >= chapterCenters[lastIndex]) {
        syncPositions(lastIndex);
        return;
      }

      let chapterIndex = 0;
      for (let index = 0; index < chapterCenters.length - 1; index += 1) {
        if (focusPosition >= chapterCenters[index] && focusPosition < chapterCenters[index + 1]) {
          chapterIndex = index;
          break;
        }
      }

      const start = chapterCenters[chapterIndex];
      const end = chapterCenters[chapterIndex + 1];
      const localProgress = clamp((focusPosition - start) / Math.max(end - start, 1), 0, 1);
      const nextPosition = chapterIndex + localProgress;
      syncPositions(nextPosition);
    };

    const scheduleJourneyPosition = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(commitJourneyPosition);
    };

    scheduleJourneyPosition();
    const handleScroll = () => {
      markScrollActive();
      scheduleJourneyPosition();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
        scrollIdleTimeoutRef.current = null;
      }
      scrollActiveRef.current = false;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [measureChapterCenters, performanceMode]);

  const heroProgress = clamp(
    journeyPosition / Math.max(activeChapters.length - 1, 1),
    0,
    1
  );
  const stepOnePosition = 1;
  const finalCtaPosition = Math.max(activeChapters.length - 1, stepOnePosition + 1);
  const darknessOverlayOpacity =
    journeyPosition <= stepOnePosition
      ? clamp((journeyPosition / stepOnePosition) * 0.9, 0, 0.9)
      : clamp(
          0.9 +
            ((journeyPosition - stepOnePosition) /
              Math.max(finalCtaPosition - stepOnePosition, 1)) *
              0.1,
          0.9,
          1
        );
  const shouldLockIntroScroll = !reducedMotion && !isIntroAutoplayComplete;
  const scenePerformanceMode: 'full' | 'balanced' = performanceMode;
  const storyArticles = useMemo(
    () => {
      let storyStepNumber = 0;

      return activeChapters.map((chapter, index) => {
        if (chapter.variant === 'story') {
          storyStepNumber += 1;
        }
        const chapterStepNumber = chapter.variant === 'story' ? storyStepNumber : null;
        const chapterDistance = Math.abs(storyPosition - index);
        const baseEmphasis = clamp(1 - chapterDistance * 0.56, 0.34, 1);
        const emphasis = chapter.variant === 'intro' && !isIntroAutoplayComplete ? 0 : baseEmphasis;

        return (
          <article
            key={chapter.id}
            ref={(node) => {
              chapterRefs.current[index] = node;
            }}
            className={`relative [content-visibility:auto] ${
              chapter.variant === 'final'
                ? '[contain-intrinsic-size:420px]'
                : '[contain-intrinsic-size:1120px]'
            } ${getSectionHeightClass(chapter)}`}
          >
            <div
              className={`absolute inset-0 ${
                isLightMode
                  ? 'bg-[linear-gradient(180deg,rgba(241,249,244,0)_0%,rgba(231,244,237,0.45)_22%,rgba(219,236,228,0.78)_100%)]'
                  : 'bg-[linear-gradient(180deg,rgba(4,8,7,0)_0%,rgba(4,8,7,0.1)_22%,rgba(4,8,7,0.24)_100%)]'
              }`}
            />
            <div
              className={`relative mx-auto flex h-full max-w-7xl px-5 sm:px-6 lg:px-10 ${getSectionAlignmentClass(chapter)} ${
                chapter.variant === 'intro'
                  ? 'pt-4'
                  : chapter.variant === 'final'
                    ? 'items-start pb-[8svh] pt-[10svh] lg:pb-[10svh] lg:pt-[12svh]'
                    : 'pb-[14svh] pt-[24svh] lg:pt-[18svh]'
              }`}
            >
              <ChapterContent
                chapter={chapter}
                emphasis={emphasis}
                reducedMotion={reducedMotion}
                isLightMode={isLightMode}
                chapterStepNumber={chapterStepNumber}
              />
            </div>
          </article>
        );
      });
    },
    [
      activeChapters,
      isIntroAutoplayComplete,
      isLightMode,
      reducedMotion,
      storyPosition
    ]
  );

  return (
    <section
      ref={sectionRef}
      id="grid-flow"
      data-intro-lock={shouldLockIntroScroll ? 'true' : 'false'}
      className={`relative overflow-clip ${isLightMode ? 'bg-[#edf5ef]' : 'bg-[#040807]'}`}
      aria-label="Three-step guided introduction to StableGrid core experience"
    >
      <div
        className={`sticky top-16 h-[calc(100vh-4rem)] overflow-hidden border-y ${
          isLightMode ? 'border-[#c7d9cf]' : 'border-[#183025]'
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <TransmissionLineSequenceBackground
            progress={heroProgress}
            reducedMotion={reducedMotion}
            performanceMode={scenePerformanceMode}
            frameOverride={introAutoplayFrame}
            minimumFrame={
              isIntroAutoplayComplete && !reducedMotion ? INTRO_AUTOPLAY_FINAL_FRAME : undefined
            }
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: darknessOverlayOpacity }}
        />
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLightMode
              ? 'bg-[radial-gradient(circle_at_50%_46%,transparent_0,transparent_26%,rgba(219,236,228,0.45)_56%,rgba(236,245,240,0.84)_100%)]'
              : 'bg-[radial-gradient(circle_at_50%_46%,transparent_0,transparent_26%,rgba(4,8,7,0.16)_56%,rgba(4,8,7,0.74)_100%)]'
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLightMode
              ? 'bg-[linear-gradient(180deg,rgba(236,245,240,0.88)_0%,rgba(241,249,244,0.44)_24%,rgba(241,249,244,0)_56%,rgba(222,238,230,0.54)_100%)]'
              : 'bg-[linear-gradient(180deg,rgba(4,8,7,0.72)_0%,rgba(4,8,7,0.16)_24%,rgba(4,8,7,0)_56%,rgba(4,8,7,0.54)_100%)]'
          }`}
        />
        {shouldLockIntroScroll ? (
          <IntroCountdownWatch
            secondsRemaining={introCountdownSeconds}
            isLightMode={isLightMode}
          />
        ) : null}
      </div>

      <div
        className="pointer-events-none relative z-10"
        style={{ marginTop: 'calc(-100vh + 4rem)' }}
      >
        {storyArticles}
      </div>
    </section>
  );
};
