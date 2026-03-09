'use client';

import { ArrowRight, Check, Play } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GridFlowSceneCanvas } from '@/components/home/landing/GridFlowSceneCanvas';
import {
  GRID_FLOW_CHAPTERS,
  type GridFlowChapter,
  type GridFlowSnapshotTone,
  type GridFlowStepSnapshot
} from '@/components/home/landing/gridFlowStory';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const JOURNEY_UPDATE_EPSILON = 0.01;
const STORY_UPDATE_EPSILON = 0.055;
const SCROLL_IDLE_TIMEOUT_MS = 150;
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

const getSectionHeightClass = (chapter: GridFlowChapter) => {
  switch (chapter.variant) {
    case 'intro':
      return 'min-h-[124svh] lg:min-h-[144svh]';
    case 'final':
      return 'min-h-[24svh] lg:min-h-[28svh]';
    default:
      return 'min-h-[118svh] lg:min-h-[138svh]';
  }
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
      'border-[#3f9b7b]/80 bg-[linear-gradient(145deg,rgba(4,18,14,0.98),rgba(5,20,15,0.95)_45%,rgba(11,42,30,0.84)_100%)]',
    label: 'text-[#a6f0cf]',
    badge: 'border-[#49a686] bg-[#154a35] text-[#baf9de]',
    dot: 'bg-[#66efbf]',
    action: 'text-[#b0f4d5]',
    bar: 'from-[#3de2a5] via-[#67e9d2] to-[#7fd1ff]'
  },
  amber: {
    shell:
      'border-[#b27b35]/80 bg-[linear-gradient(145deg,rgba(22,15,8,0.98),rgba(24,16,8,0.94)_50%,rgba(74,50,16,0.82)_100%)]',
    label: 'text-[#ffe0ae]',
    badge: 'border-[#c18a3a] bg-[#432d12] text-[#ffe3b8]',
    dot: 'bg-[#f9c261]',
    action: 'text-[#ffe4be]',
    bar: 'from-[#f2ad3c] via-[#f8c769] to-[#ffe09c]'
  },
  sky: {
    shell:
      'border-[#4178a6]/80 bg-[linear-gradient(145deg,rgba(7,13,18,0.98),rgba(7,16,22,0.94)_45%,rgba(15,36,56,0.82)_100%)]',
    label: 'text-[#addcff]',
    badge: 'border-[#4e84b3] bg-[#173148] text-[#c2e7ff]',
    dot: 'bg-[#7ec3f6]',
    action: 'text-[#b7e4ff]',
    bar: 'from-[#5caedf] via-[#7fcbff] to-[#a9e6ff]'
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
  punctuation: 'text-[#a3c0b5]',
  operator: 'text-[#ffd08f]',
  number: 'text-[#e4baff]',
  keyword: 'text-[#8fdfff]',
  functionName: 'text-[#ffdd98]',
  identifier: 'text-[#e2f8ee]',
  stringLiteral: 'text-[#a8f59b]'
};

const ALERT_SQL_CODE_PALETTE: SqlCodePalette = {
  punctuation: 'text-[#c3a6a6]',
  operator: 'text-[#ffb190]',
  number: 'text-[#ffc5c1]',
  keyword: 'text-[#ff8a8a]',
  functionName: 'text-[#ffd2a1]',
  identifier: 'text-[#fff0ea]',
  stringLiteral: 'text-[#ffb2c3]'
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
        background: `conic-gradient(#3fd6c1 ${progressionPercent * 3.6}deg, rgba(255,255,255,0.13) ${progressionPercent * 3.6}deg)`
      }
    : undefined;
  const sqlPalette = isAlertSnippet ? ALERT_SQL_CODE_PALETTE : DEFAULT_SQL_CODE_PALETTE;
  const codeShellClass = isAlertSnippet
    ? 'overflow-hidden rounded-xl border border-[#933939]/70 bg-[linear-gradient(170deg,rgba(26,8,8,0.97),rgba(17,5,5,0.95))]'
    : 'overflow-hidden rounded-xl border border-[#2d5a48]/80 bg-[#030d0a]/96';
  const codeHeaderClass = isAlertSnippet
    ? 'flex items-center justify-between border-b border-[#933939]/55 px-3 py-2'
    : 'flex items-center justify-between border-b border-[#234938]/80 px-3 py-2';
  const codeLabelClass = isAlertSnippet
    ? 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffaaaa]'
    : 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9be8c8]';
  const codeChipClass = isAlertSnippet
    ? 'rounded-full border border-[#9d3d3d]/80 bg-[#4a1515]/88 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ffb4b4]'
    : 'rounded-full border border-[#3d9478]/80 bg-[#184936]/82 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a6f2d3]';
  const lineNumberClass = isAlertSnippet
    ? 'select-none text-right text-[10px] text-[#b77a7a]'
    : 'select-none text-right text-[10px] text-[#7fae99]';
  const briefingShellClass = isAmberTone
    ? 'overflow-hidden rounded-xl border border-[#ab7534]/80 bg-[linear-gradient(165deg,rgba(27,15,8,0.98),rgba(18,11,6,0.96))]'
    : 'overflow-hidden rounded-xl border border-[#2d5a48]/80 bg-[#030d0a]/96';
  const briefingHeaderClass = isAmberTone
    ? 'flex items-center justify-between gap-2 border-b border-[#ab7534]/65 px-3 py-2'
    : 'flex items-center justify-between gap-2 border-b border-[#234938]/80 px-3 py-2';
  const briefingLabelClass = isAmberTone
    ? 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffe1b3]'
    : 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9be8c8]';
  const briefingRegionClass = isAmberTone
    ? 'rounded-full border border-[#b78648]/80 bg-[#4c3317]/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#ffe6bf]'
    : 'rounded-full border border-[#3d9478]/70 bg-[#0f2b21]/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#d7efe4]';
  const briefingSectionClass = isAmberTone
    ? 'text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e3b680]'
    : 'text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a9e7cd]';
  const briefingTextClass = isAmberTone
    ? 'text-[11px] leading-5 text-[#f0e1d2]'
    : 'text-[11px] leading-5 text-[#d7ece3]';
  const briefingBulletClass = isAmberTone ? 'bg-[#f1ae52]' : tone.dot;
  const laneSnapshot = snapshot.laneSnapshot;
  const missionListing = snapshot.missionListing;
  const isGridOpsSnapshot = snapshot.mediaModel === 'control-center';
  const gridObjectiveRewards = [120, 80, 60] as const;

  if (missionListing) {
    return (
      <div className="mt-6">
        <div className="group relative overflow-hidden rounded-[1.75rem] border border-[#8f3636]/75 bg-[linear-gradient(150deg,rgba(24,13,14,0.98),rgba(20,12,13,0.97)_58%,rgba(70,26,30,0.88)_100%)] p-4 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.7)] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,93,93,0.18),transparent_35%),linear-gradient(180deg,rgba(255,93,93,0.09),transparent_48%)]" />
          <div className="pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full bg-[#ff6565]/12 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#9a3f3f]/80 bg-[#3b1517]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff6d6d]">
                <span aria-hidden="true">⚡</span>
                {missionListing.missionId}
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-3xl font-semibold uppercase tracking-[0.02em] text-[#f6e8e8] sm:text-[3rem] sm:leading-[0.95]">
                  {missionListing.title}
                </h3>
                <span className="rounded-full border border-[#ab4242]/80 bg-[#401718]/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff7e7e]">
                  {missionListing.difficulty}
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-base leading-8 text-[#cebcbc]">
                {missionListing.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[#4a3838]/75 bg-black/50 px-3 py-1.5 text-[#cabbbb]">
                  {missionListing.urgency}
                </span>
              </div>
            </div>

            <aside className="w-full max-w-sm rounded-3xl border border-[#582526]/75 bg-[linear-gradient(165deg,rgba(17,8,9,0.97),rgba(20,10,11,0.95))] p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a99393]">
                  {missionListing.statusLabel}
                </span>
                <span className="text-[2rem] font-semibold leading-none text-[#f6ecec]">
                  {missionListing.statusValue}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-[#ff7a7a] to-[#ffbe8f]" />
              </div>

              <p className="mt-4 text-sm leading-7 text-[#c9b8b8]">
                {missionListing.statusDescription}
              </p>
            </aside>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#6f2d2d]/62 pt-5">
            <div className="flex flex-wrap gap-2">
              {missionListing.stats.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#4a3838]/75 bg-black/50 px-3 py-1 text-xs text-[#cabbbb]"
                >
                  {item}
                </span>
              ))}
            </div>

            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#f9d5d5] transition-transform group-hover:translate-x-0.5">
              {missionListing.primaryAction}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-6 overflow-hidden rounded-[1.35rem] border shadow-[0_18px_45px_rgba(0,0,0,0.38)] ${tone.shell}`}>
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
          <p className="text-sm font-semibold leading-6 text-[#f3fbf7]">{snapshot.title}</p>
        ) : null}
        {snapshot.meta ? (
          <p className="text-xs font-medium text-[#c4ddd1]">{snapshot.meta}</p>
        ) : null}
        {snapshot.highlights.length > 0 && !isGridOpsSnapshot ? (
          <div className="space-y-2">
            {snapshot.highlights.map((item) => (
              <p
                key={item}
                className="flex items-start gap-2 text-xs leading-5 text-[#cfe5db]"
              >
                <span className={`mt-[0.42rem] h-1.5 w-1.5 flex-shrink-0 rounded-full ${tone.dot}`} />
                <span>{item}</span>
              </p>
            ))}
          </div>
        ) : null}
        {isGridOpsSnapshot ? (
          <div className="overflow-hidden rounded-xl border border-[#2d5d85]/70 bg-[linear-gradient(165deg,rgba(6,14,23,0.96),rgba(7,19,32,0.95)_55%,rgba(10,28,46,0.9)_100%)]">
            <div className="border-b border-[#355f84]/65 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7cc2ff]">
                    Live operation
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#ecf6ff]">
                    Grid stabilizer challenge
                  </p>
                </div>
                <span className="rounded-full border border-[#3c7cb0]/80 bg-[#123357]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9dd4ff]">
                  Combo x2
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#2f5675]/80 bg-[#0b2238]/80 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#8faac0]">Score</p>
                  <p className="mt-1 text-sm font-semibold text-[#e8f5ff]">2,480</p>
                </div>
                <div className="rounded-lg border border-[#2f5675]/80 bg-[#0b2238]/80 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#8faac0]">Risk</p>
                  <p className="mt-1 text-sm font-semibold text-[#ffc77e]">High</p>
                </div>
                <div className="rounded-lg border border-[#2f5675]/80 bg-[#0b2238]/80 px-2 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#8faac0]">Time left</p>
                  <p className="mt-1 text-sm font-semibold text-[#9ce4ff]">02:40</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 px-3 py-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8ecfff]">
                  Active objectives
                </p>
                {snapshot.highlights.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start justify-between gap-2 rounded-lg border border-[#264b6a]/70 bg-[#081a2b]/78 px-2.5 py-2"
                  >
                    <span className="flex items-start gap-2 text-[11px] leading-5 text-[#d4e8f8]">
                      <span className="mt-[0.3rem] inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#4ea3dd]/80 bg-[#123656]/90 text-[#9fddff]">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{item}</span>
                    </span>
                    <span className="rounded-full border border-[#3d76a8]/75 bg-[#133553]/80 px-2 py-0.5 text-[10px] font-semibold text-[#a3d9ff]">
                      +{gridObjectiveRewards[index] ?? 60}
                    </span>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-[#2d5c84]/70">
                <ControlCenterModelPreviewLazy className="h-40 border-0" />
              </div>
              <div className="rounded-lg border border-[#2f5578]/75 bg-[#091b2d]/85 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94b9d6]">
                  <span>Stability meter</span>
                  <span>78%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#4db4ff] via-[#55c2ff] to-[#66e2ff]" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {laneSnapshot ? (
          <div className="relative overflow-hidden rounded-xl border border-[#2d5a48]/80 bg-[linear-gradient(155deg,rgba(8,16,13,0.96),rgba(6,13,10,0.98)_60%,rgba(4,10,8,0.98)_100%)] px-3 py-4 sm:px-4 sm:py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(51,208,162,0.16),transparent_36%),radial-gradient(circle_at_90%_84%,rgba(93,156,255,0.08),transparent_42%)]" />
            <div className="relative space-y-2.5">
              <div className="relative space-y-2 pb-1">
                <div className="pointer-events-none absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(109,230,183,0.06),rgba(109,230,183,0.55),rgba(109,230,183,0.06))]" />
                {laneSnapshot.modules.map((module) => {
                  const isCurrentModule = module.state === 'current';
                  const cardClass = isCurrentModule
                    ? 'border-[#a6782f]/75 bg-[linear-gradient(140deg,rgba(57,39,14,0.95),rgba(44,31,10,0.95))]'
                    : 'border-[#2f7f61]/70 bg-[linear-gradient(140deg,rgba(12,20,17,0.95),rgba(9,16,13,0.95))]';
                  const badgeClass = isCurrentModule
                    ? 'border-[#b68434]/80 bg-[#3f2c11]/90 text-[#ffcf71]'
                    : 'border-[#31a97f]/80 bg-[#154031]/88 text-[#80e4c2]';
                  const markerClass = isCurrentModule
                    ? 'border-[#f4b03b]/85 bg-[#f2a007] text-[#fff4dd] shadow-[0_0_0_10px_rgba(244,176,59,0.22)]'
                    : 'border-[#66e8b8]/85 bg-[#27be60] text-[#f0fff7] shadow-[0_0_0_10px_rgba(39,190,96,0.18)]';
                  const card = (
                    <article className={`rounded-xl border px-2.5 py-2.5 sm:px-3 sm:py-3 ${cardClass}`}>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#90a59b]">
                        {module.label}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold leading-5 text-[#e8f6ef] sm:text-base sm:leading-6">
                        {module.title}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#a8bdb3]">
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
          <div className="overflow-hidden rounded-xl border border-[#2d5a48]/80 bg-[#030d0a]/96 p-3">
            <div className="flex items-start gap-3">
              <div
                className="relative h-28 w-28 shrink-0 rounded-full p-2.5"
                style={progressionRingStyle}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#06100d] text-center">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#b1cbbf]">
                    Readiness
                  </span>
                  <span className="mt-1 text-2xl font-semibold leading-none text-[#eef6f2]">
                    {progressionPercent}%
                  </span>
                </div>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aac6e4]">
                  Promotion target
                </p>
                <p className="mt-1 text-lg font-semibold leading-6 text-[#eef6f2]">
                  {progressionSnapshot.promotionTarget}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#c3dbcf]">
                  {progressionSnapshot.guidance}
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#22b999] px-4 py-3 text-base font-semibold text-[#06120d]">
              {progressionSnapshot.ctaLabel}
              <ArrowRight className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs text-[#bfd6cb]">{progressionSnapshot.footnote}</p>
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
                        className="flex items-start gap-2 text-[11px] leading-5 text-[#f0e1d2]"
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
                        className="flex items-start gap-2 text-[11px] leading-5 text-[#f0e1d2]"
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
                <span className={`h-2 w-2 rounded-full ${isAlertSnippet ? 'bg-[#ff6363]' : 'bg-[#2ccaa0]'}`} />
                <span className={`h-2 w-2 rounded-full ${isAlertSnippet ? 'bg-[#ff8a63]' : 'bg-[#5bc8ff]'}`} />
                <span className="h-2 w-2 rounded-full bg-[#f3c075]" />
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
      className={`group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
        emphasized
          ? 'bg-[#22b999] text-[#08110b] hover:bg-[#6fe89a]'
          : isLightMode
            ? 'border border-[#2f9f79]/45 bg-white/85 text-[#174132] hover:border-[#258f69] hover:bg-white'
            : 'border border-[#62efd0]/50 bg-black/18 text-[#eafff5] hover:border-[#7af5db] hover:bg-black/28'
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
    'absolute left-1/2 top-[calc(100%+0.25rem)] flex -translate-x-1/2 flex-col items-center -space-y-1';
  const shellClass = `relative flex h-[10.25rem] w-[4.75rem] items-start justify-center rounded-[2.45rem] ${
    isLightMode
      ? 'bg-white/22 shadow-[0_16px_34px_rgba(24,72,56,0.2)]'
      : 'bg-black/28 shadow-[0_20px_44px_rgba(0,0,0,0.42)]'
  }`;

  const glowClass = isLightMode
    ? 'bg-[radial-gradient(circle,rgba(47,159,121,0.28),transparent_72%)]'
    : 'bg-[radial-gradient(circle,rgba(87,237,197,0.26),transparent_72%)]';

  const bubbleClass = `block h-6 w-6 rounded-full ${
    isLightMode ? 'bg-[#2f9f79]' : 'bg-[#57edc5]'
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
            className="h-full w-full"
          >
            <path
              d="M2 3 L10 11 L18 3"
              stroke="currentColor"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
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
            className="h-full w-full"
          >
            <path
              d="M2 3 L10 11 L18 3"
              stroke="currentColor"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      ))}
    </span>
  );

  if (reducedMotion) {
    return (
      <div className={shellClass}>
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
    <div className={shellClass}>
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

function IntroBrandedTitle({
  title,
  isLightMode
}: {
  title: string;
  isLightMode: boolean;
}) {
  const highlightedTitle = title.split(/(PySpark|Grid)/i).map((part, index) => {
    if (/^PySpark$/i.test(part)) {
      return (
        <span
          key={`title-part-${index}`}
          className="text-[#cf8b52] drop-shadow-[0_0_8px_rgba(207,139,82,0.16)]"
        >
          {part}
        </span>
      );
    }

    if (/^Grid$/i.test(part)) {
      return (
        <span
          key={`title-part-${index}`}
          className="text-[#67c8a5] drop-shadow-[0_0_8px_rgba(103,200,165,0.16)]"
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
      style={{ fontFamily: 'var(--font-serif)' }}
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
      className="pointer-events-auto relative max-w-[34rem] pt-24 sm:pt-28 lg:pt-[15svh]"
      style={{
        opacity: emphasis,
        transform: `translate3d(0, ${(1 - emphasis) * 16}px, 0)`,
        transition: reducedMotion
          ? 'opacity 160ms linear, transform 160ms linear'
          : 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform, opacity'
      }}
    >
      <div
        className={`absolute -inset-x-8 -inset-y-10 rounded-[3rem] blur-3xl ${
          isLightMode
            ? 'bg-[radial-gradient(circle_at_22%_28%,rgba(38,171,136,0.24),transparent_0,transparent_48%),radial-gradient(circle_at_78%_16%,rgba(109,168,255,0.2),transparent_0,transparent_38%)]'
            : 'bg-[radial-gradient(circle_at_22%_28%,rgba(31,190,153,0.2),transparent_0,transparent_44%),radial-gradient(circle_at_78%_16%,rgba(109,168,255,0.14),transparent_0,transparent_34%)]'
        }`}
      />
      <div className="relative">
        <IntroBrandedTitle title={chapter.title} isLightMode={isLightMode} />
        {chapter.body ? (
          <p className={`mt-5 max-w-[24rem] text-[15px] leading-7 ${isLightMode ? 'text-[#48665a]' : 'text-[#c7ddd3]'}`}>{chapter.body}</p>
        ) : null}
        <div className="pointer-events-none absolute hidden lg:block lg:translate-x-[215%] lg:right-[-31rem] lg:top-[2.25rem] xl:right-[-28rem] xl:top-[2rem] 2xl:right-[-24rem] 2xl:top-[2rem]">
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
  const usesLaneSnapshot = Boolean(chapter.snapshot?.laneSnapshot);
  const usesMissionListing = Boolean(chapter.snapshot?.missionListing);
  const chapterStepLabel = String(chapterStepNumber).padStart(2, '0');

  return (
    <div
      className={`relative ${
        usesLaneSnapshot || usesMissionListing
          ? 'max-w-[44rem] lg:max-w-[52rem]'
          : 'max-w-[26rem] lg:max-w-[28rem]'
      }`}
      style={{
        opacity: emphasis,
        transform: `translate3d(0, ${(1 - emphasis) * 20}px, 0)`,
        transition: 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform, opacity'
      }}
    >
      <div
        className={`absolute -inset-x-8 -inset-y-8 rounded-[2.75rem] blur-2xl ${
          isLightMode
            ? 'bg-[radial-gradient(circle_at_18%_24%,rgba(38,171,136,0.2),transparent_0,transparent_46%),linear-gradient(180deg,rgba(231,244,237,0.66),rgba(231,244,237,0))]'
            : 'bg-[radial-gradient(circle_at_18%_24%,rgba(31,190,153,0.14),transparent_0,transparent_42%),linear-gradient(180deg,rgba(5,12,10,0.24),rgba(5,12,10,0))]'
        }`}
      />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span
            className={`relative -top-1 inline-flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border text-[1.55rem] font-semibold leading-none tracking-[0.01em] ${
              isLightMode
                ? 'border-[#2f9f79]/70 bg-[#e8f6ef] text-[#1f7a5c]'
                : 'border-[#66d7b0]/70 bg-[#0b1f18] text-[#9de3c4]'
            }`}
          >
            {chapterStepLabel}
          </span>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isLightMode ? 'text-[#2f9f79]' : 'text-[#9de3c4]'}`}>
            {chapter.eyebrow}
          </p>
        </div>
        <h2 className={`mt-3 text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] ${isLightMode ? 'text-[#13221a]' : 'text-[#f2f7f3]'}`}>
          {chapter.title}
        </h2>
        <p className={`mt-4 text-[15px] leading-7 ${usesLaneSnapshot || usesMissionListing ? 'max-w-[32rem]' : 'max-w-[20rem]'} ${isLightMode ? 'text-[#48665a]' : 'text-[#c6ddd2]'}`}>
          {chapter.body}
        </p>
        {chapter.snapshot ? (
          <StepSnapshot snapshot={chapter.snapshot} />
        ) : null}
      </div>
    </div>
  );
}

function FinalSceneOverlay({
  chapter,
  visible,
  isLightMode
}: {
  chapter: GridFlowChapter;
  visible: boolean;
  isLightMode: boolean;
}) {
  const highlightedTitle = chapter.title.split(/(PySpark)/i).map((part, index) => {
    if (/^PySpark$/i.test(part)) {
      return (
        <span
          key={`final-title-part-${index}`}
          className="text-[#cf8b52] drop-shadow-[0_0_10px_rgba(207,139,82,0.24)]"
        >
          {part}
        </span>
      );
    }

    return <span key={`final-title-part-${index}`}>{part}</span>;
  });

  return (
    <div
      className="pointer-events-auto absolute inset-x-3 bottom-5 z-20 flex justify-center sm:inset-x-6 sm:bottom-8 lg:bottom-16"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translate3d(0, ${visible ? 0 : 24}px, 0)`,
        transition: 'opacity 350ms cubic-bezier(0.22, 1, 0.36, 1), transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
        willChange: 'transform, opacity'
      }}
    >
      <div
        className={`relative flex w-full max-w-[54rem] flex-col items-center justify-center overflow-hidden rounded-[2rem] px-5 py-10 text-center backdrop-blur-xl sm:min-h-[42rem] sm:px-8 sm:py-14 lg:min-h-[48rem] lg:rounded-[2.25rem] lg:px-12 lg:py-16 ${
          isLightMode
            ? 'border border-[#c7d9cf] bg-white/86 shadow-[0_30px_120px_rgba(16,38,28,0.2),0_0_72px_rgba(47,159,121,0.12)]'
            : 'border border-white/18 bg-[#06100c]/88 shadow-[0_30px_120px_rgba(0,0,0,0.46),0_0_88px_rgba(72,224,185,0.2)]'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLightMode
              ? 'bg-[radial-gradient(circle_at_20%_8%,rgba(47,159,121,0.15),transparent_40%),radial-gradient(circle_at_82%_86%,rgba(109,168,255,0.1),transparent_48%)]'
              : 'bg-[radial-gradient(circle_at_20%_8%,rgba(74,232,196,0.18),transparent_42%),radial-gradient(circle_at_82%_86%,rgba(109,168,255,0.12),transparent_48%)]'
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-x-12 top-0 h-px ${
            isLightMode
              ? 'bg-gradient-to-r from-transparent via-[#46a67e]/60 to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#72f1d0]/70 to-transparent'
          }`}
        />
        <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isLightMode ? 'text-[#2f9f79]' : 'text-[#84d6b0]'}`}>
          {chapter.eyebrow}
        </p>
        <h2
          className={`mt-4 text-[clamp(2.25rem,8vw,5rem)] font-semibold leading-[0.94] tracking-[-0.05em] ${isLightMode ? 'text-[#13221a]' : 'text-[#f3f7f4]'}`}
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {highlightedTitle}
        </h2>
        {chapter.body ? (
          <p className={`mx-auto mt-4 max-w-[34rem] text-base leading-7 sm:text-[1.14rem] sm:leading-8 ${isLightMode ? 'text-[#48665a]' : 'text-[#c7ddd3]'}`}>
            {chapter.body}
          </p>
        ) : null}
        {chapter.ctaHint ? (
          <p className={`mx-auto mt-5 max-w-[34rem] text-sm leading-7 ${isLightMode ? 'text-[#5f7a6c]' : 'text-[#a5bfb3]'}`}>
            {chapter.ctaHint}
          </p>
        ) : null}
        <div className="relative mt-8 flex justify-center lg:mt-10">
          {chapter.ctaSource ? (
            <>
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute top-1/2 h-14 w-[20rem] -translate-y-1/2 rounded-full blur-2xl ${
                  isLightMode ? 'bg-[#2f9f79]/22' : 'bg-[#45dfb8]/26'
                }`}
              />
              <PrimaryCta
                source={chapter.ctaSource}
                label={chapter.ctaLabel ?? 'Start free'}
                emphasized
                isLightMode={isLightMode}
              />
            </>
          ) : null}
        </div>
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
    return null;
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
  const [isScrollActive, setIsScrollActive] = useState(false);
  const isLightMode = false;

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

  useEffect(() => {
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
        setIsScrollActive(true);
      }

      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }

      scrollIdleTimeoutRef.current = window.setTimeout(() => {
        scrollActiveRef.current = false;
        setIsScrollActive(false);
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

  const activeChapterIndex = Math.min(GRID_FLOW_CHAPTERS.length - 1, Math.floor(journeyPosition));
  const phaseProgress = clamp(journeyPosition - activeChapterIndex, 0, 1);
  const activeChapter = GRID_FLOW_CHAPTERS[activeChapterIndex];
  const nextChapter = GRID_FLOW_CHAPTERS[Math.min(activeChapterIndex + 1, GRID_FLOW_CHAPTERS.length - 1)];
  const finalChapter = GRID_FLOW_CHAPTERS[GRID_FLOW_CHAPTERS.length - 1];
  const showDesktopFinalOverlay = journeyPosition >= GRID_FLOW_CHAPTERS.length - 2 + 0.05;
  const scenePerformanceMode: 'full' | 'balanced' = isScrollActive ? 'balanced' : performanceMode;
  const storyArticles = useMemo(
    () => {
      let storyStepNumber = 0;

      return GRID_FLOW_CHAPTERS.map((chapter, index) => {
        if (chapter.variant === 'story') {
          storyStepNumber += 1;
        }
        const chapterStepNumber = chapter.variant === 'story' ? storyStepNumber : null;
        const chapterDistance = Math.abs(storyPosition - index);
        const baseEmphasis = clamp(1 - chapterDistance * 0.56, 0.34, 1);
        const emphasis =
          showDesktopFinalOverlay && chapter.variant === 'story' ? 0 : baseEmphasis;

        return (
          <article
            key={chapter.id}
            ref={(node) => {
              chapterRefs.current[index] = node;
            }}
            className={`relative [content-visibility:auto] ${
              chapter.variant === 'final'
                ? '[contain-intrinsic-size:240px]'
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
                    ? 'items-start pb-[2svh] pt-[1svh] lg:pb-[3svh] lg:pt-[2svh]'
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
    [isLightMode, reducedMotion, showDesktopFinalOverlay, storyPosition]
  );

  return (
    <section
      ref={sectionRef}
      id="grid-flow"
      className={`relative overflow-clip ${isLightMode ? 'bg-[#edf5ef]' : 'bg-[#040807]'}`}
      aria-label="Theory, missions, grid, and HRB product journey"
    >
      <div
        className={`sticky top-16 h-[calc(100vh-4rem)] overflow-hidden border-y ${
          isLightMode ? 'border-[#c7d9cf]' : 'border-[#183025]'
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <GridFlowSceneCanvas
            currentScene={activeChapter.scene}
            nextScene={nextChapter.scene}
            phaseProgress={phaseProgress}
            reducedMotion={reducedMotion}
            performanceMode={scenePerformanceMode}
          />
        </div>
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
        <FinalSceneOverlay
          chapter={finalChapter}
          visible={showDesktopFinalOverlay}
          isLightMode={isLightMode}
        />
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
