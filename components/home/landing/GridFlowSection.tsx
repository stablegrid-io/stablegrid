'use client';

import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Flag,
  Info,
  Layers3,
  Lock,
  NotebookPen,
  Play,
  Zap
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  TRANSMISSION_LINE_SEQUENCE_CONFIG,
  TransmissionLineSequenceBackground
} from '@/components/home/landing/TransmissionLineSequenceBackground';
import { ScrollSectionIndicator } from '@/components/home/landing/ScrollSectionIndicator';
import {
  GRID_FLOW_CHAPTERS,
  type GridFlowChapter,
  type GridFlowSnapshotTone,
  type GridFlowStepSnapshot
} from '@/components/home/landing/gridFlowStory';
import { LANDING_INTRO_COMPLETE_EVENT } from '@/lib/cookies/cookie-consent';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const JOURNEY_UPDATE_EPSILON = 0.0015;
const STORY_UPDATE_EPSILON = 0.055;
const SCROLL_IDLE_TIMEOUT_MS = 150;
const MAX_STORY_STEPS = 3;
const CHAPTER_SCROLL_HEIGHT_CLASS = 'min-h-[130svh] lg:min-h-[150svh]';
const FINAL_CHAPTER_HEIGHT_CLASS = 'min-h-fit';
const STORY_CHAPTER_GRID_CLASS = 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]';
const STORY_INTERACTIVE_COLUMN_CLASS =
  'lg:justify-self-end lg:ml-auto lg:translate-x-[clamp(12rem,20vw,24rem)]';
const INTRO_AUTOPLAY_START_FRAME = 1;
const INTRO_AUTOPLAY_FINAL_FRAME = TRANSMISSION_LINE_SEQUENCE_CONFIG.frameCount;
const INTRO_AUTOPLAY_FPS = 24;
const INTRO_AUTOPLAY_HOLD_MS = 300;
const INTRO_AUTOPLAY_HOLD_SECONDS = INTRO_AUTOPLAY_HOLD_MS / 1000;
const INTRO_AUTOPLAY_DURATION_SECONDS =
  (INTRO_AUTOPLAY_FINAL_FRAME - INTRO_AUTOPLAY_START_FRAME) / INTRO_AUTOPLAY_FPS;
const FINAL_CTA_FIRST_FRAME_PATH = (() => {
  const { basePath, fileExtension, zeroPad, assetVersion } =
    TRANSMISSION_LINE_SEQUENCE_CONFIG;
  const framePath = `${basePath}/${String(INTRO_AUTOPLAY_START_FRAME).padStart(zeroPad, '0')}.${fileExtension}`;
  return assetVersion ? `${framePath}?v=${assetVersion}` : framePath;
})();
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
const SolarForecastingModelPreviewLazy = dynamic(
  () =>
    import('@/components/grid-ops/SolarForecastingModelPreview').then(
      (module) => module.SolarForecastingModelPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded-xl border border-[#2e5975]/45 bg-[radial-gradient(circle_at_40%_24%,rgba(77,147,255,0.24),transparent_48%),linear-gradient(180deg,#091325,#060c16)]" />
    )
  }
);

const getSectionHeightClass = (chapter: GridFlowChapter) => {
  if (chapter.variant === 'final') {
    return FINAL_CHAPTER_HEIGHT_CLASS;
  }

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

interface StoryStepVisualStyle {
  halo: string;
  stepChip: string;
  eyebrow: string;
  divider: string;
}

const LIGHT_STORY_STEP_VISUAL_STYLE: StoryStepVisualStyle = {
  halo: 'bg-[radial-gradient(circle_at_18%_24%,rgba(146,160,153,0.16),transparent_0,transparent_46%),linear-gradient(180deg,rgba(231,244,237,0.42),rgba(231,244,237,0))]',
  stepChip: 'border-[#6a7b73]/70 bg-[#eef2ef] text-[#38433f]',
  eyebrow: 'text-[#607069]',
  divider: 'bg-[linear-gradient(90deg,rgba(116,130,122,0.56),rgba(116,130,122,0))]'
};

const DEFAULT_DARK_STORY_STEP_VISUAL_STYLE: StoryStepVisualStyle = {
  halo: 'bg-[radial-gradient(circle_at_18%_24%,rgba(148,162,155,0.12),transparent_0,transparent_42%),linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0))]',
  stepChip: 'border-[#5c6763]/70 bg-[#121715] text-[#d8e1dd]',
  eyebrow: 'text-[#a8b3ae]',
  divider: 'bg-[linear-gradient(90deg,rgba(173,186,180,0.48),rgba(173,186,180,0))]'
};

const DARK_STORY_STEP_VISUAL_STYLE_BY_STEP: Record<string, StoryStepVisualStyle> = {
  '01': {
    halo: 'bg-[radial-gradient(circle_at_18%_24%,rgba(179,193,187,0.16),transparent_0,transparent_44%),linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0))]',
    stepChip: 'border-[#6e7c76]/85 bg-[#121917] text-[#e3ece7]',
    eyebrow: 'text-[#b4c2bc]',
    divider: 'bg-[linear-gradient(90deg,rgba(180,195,188,0.6),rgba(180,195,188,0))]'
  },
  '02': {
    halo: 'bg-[radial-gradient(circle_at_18%_24%,rgba(194,171,142,0.18),transparent_0,transparent_44%),linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0))]',
    stepChip: 'border-[#7f725f]/85 bg-[#181511] text-[#efe6db]',
    eyebrow: 'text-[#c8bbad]',
    divider: 'bg-[linear-gradient(90deg,rgba(198,176,150,0.64),rgba(198,176,150,0))]'
  },
  '03': {
    halo: 'bg-[radial-gradient(circle_at_18%_24%,rgba(146,170,194,0.18),transparent_0,transparent_44%),linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0))]',
    stepChip: 'border-[#5f7389]/85 bg-[#111822] text-[#e0e9f4]',
    eyebrow: 'text-[#b6c5d6]',
    divider: 'bg-[linear-gradient(90deg,rgba(157,177,199,0.62),rgba(157,177,199,0))]'
  }
};

const getStoryStepVisualStyle = (
  stepLabel: string,
  isLightMode: boolean
): StoryStepVisualStyle => {
  if (isLightMode) {
    return LIGHT_STORY_STEP_VISUAL_STYLE;
  }

  return DARK_STORY_STEP_VISUAL_STYLE_BY_STEP[stepLabel] ?? DEFAULT_DARK_STORY_STEP_VISUAL_STYLE;
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

interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
}

const LANDING_FAQ_ITEMS: readonly LandingFaqItem[] = [
  {
    id: 'what-is-stablegrid',
    question: 'What is stableGrid?',
    answer:
      'stableGrid is a gamified learning platform for big data. You learn core concepts, practice through tasks, and apply decisions in a live energy-grid simulation.'
  },
  {
    id: 'how-fast-can-i-start',
    question: 'How quickly can I start?',
    answer:
      'You can start immediately. Pick a track, complete a short module, and move into flashcards, missions, and notebooks in the same session.'
  },
  {
    id: 'do-i-need-prior-experience',
    question: 'Do I need prior data engineering experience?',
    answer:
      'No. The journey is structured from fundamentals to applied scenarios. If you are experienced, you can still move faster by focusing on task-based practice.'
  },
  {
    id: 'what-do-i-build',
    question: 'What do I build during learning?',
    answer:
      'You build operational thinking. Each chapter connects theory to practical grid workflows so you can reason about data pipelines, quality, and reliability under pressure.'
  },
  {
    id: 'is-this-for-teams',
    question: 'Can teams use stableGrid together?',
    answer:
      'Yes. Teams can align on the same learning path and compare progress across modules, tasks, and readiness checkpoints.'
  },
  {
    id: 'what-if-im-not-sure',
    question: 'What if I am still not sure?',
    answer:
      'Use the "Not sure yet" page for a concise value breakdown. It explains outcomes, who this is for, and how the platform fits different learning goals.'
  }
] as const;

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
  const emphasizedClass =
    source === 'grid_flow_final'
      ? 'border border-[#edf3f8] bg-[#d8e0e7] text-[#0f151b] shadow-[0_0_0_1px_rgba(255,255,255,0.35)_inset,0_12px_24px_rgba(222,232,240,0.24)] hover:border-[#f7fbff] hover:bg-[#edf3f8]'
      : 'border border-[#8f99a4] bg-[#b7c0c8] text-[#11161c] hover:bg-[#d0d8df]';

  return (
    <Link
      href="/signup"
      onClick={() => {
        void trackProductEvent('landing_cta', { source });
      }}
      className={`pointer-events-auto group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
        emphasized
          ? emphasizedClass
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
          className="whitespace-nowrap text-[#d6a067]"
        >
          {part}
        </span>
      );
    }

    if (/^grid$/i.test(part)) {
      return (
        <span
          key={`title-part-${index}`}
          className="text-[#c7d0d8]"
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
      className={`mt-1 max-w-[10.6ch] text-[clamp(2.8rem,6.4vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.045em] ${
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
      className="pointer-events-auto relative max-w-[27.5rem] pt-24 sm:pt-28 lg:pt-[15svh]"
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
            : 'bg-[radial-gradient(circle_at_22%_28%,rgba(153,167,160,0.08),transparent_0,transparent_42%),radial-gradient(circle_at_78%_16%,rgba(145,156,163,0.05),transparent_0,transparent_34%)]'
        }`}
      />
      <div
        className={`relative overflow-hidden rounded-[1.75rem] border-[0.8px] pl-6 pr-5 py-5 backdrop-blur-[5px] sm:pl-7 sm:pr-6 sm:py-6 ${
          isLightMode
            ? 'border-[#c7d9cf]/58 bg-[#eaf3ee]/68 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.52)]'
            : 'border-white/[0.12] bg-[linear-gradient(150deg,rgba(10,12,13,0.54),rgba(6,8,9,0.36))] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.08)]'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLightMode
              ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_42%)]'
              : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0)_42%)]'
          }`}
        />
        <div className="relative">
          <IntroBrandedTitle title={chapter.title} isLightMode={isLightMode} />
          {chapter.ctaHint ? (
            <p className={`mt-4 max-w-[23rem] text-xs leading-6 ${isLightMode ? 'text-[#5f7a6c]' : 'text-[#9cb8aa]'}`}>
              {chapter.ctaHint}
            </p>
          ) : null}
        </div>
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
  const sectionBody = chapter.body;
  const sectionCard = null;
  const sectionInlineCard = isTheoryStep ? (
    <TheoryTrackGallery isLightMode={isLightMode} />
  ) : isPracticeStep ? (
    <MissionBriefingCard isLightMode={isLightMode} />
  ) : isGridStep ? (
    <GridItemDeckCarousel isLightMode={isLightMode} />
  ) : null;

  return (
    <GridExperienceSection
      stepLabel={chapterStepLabel}
      eyebrow={chapter.eyebrow}
      title={chapter.title}
      body={sectionBody}
      card={sectionCard}
      inlineCard={sectionInlineCard}
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
  inlineCard,
  emphasis,
  isLightMode
}: {
  stepLabel: string;
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  card: React.ReactNode;
  inlineCard?: React.ReactNode;
  emphasis: number;
  isLightMode: boolean;
}) {
  const stepVisualStyle = getStoryStepVisualStyle(stepLabel, isLightMode);
  const hasInteractiveColumn = Boolean(card);

  return (
    <div
      className="relative max-w-6xl py-16 min-h-[34rem]"
      style={{
        opacity: emphasis,
        transform: `translate3d(0, ${(1 - emphasis) * 20}px, 0)`,
        transition:
          'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform, opacity'
      }}
    >
      <div
        className={`absolute -inset-x-8 -inset-y-8 rounded-[2.75rem] blur-2xl ${stepVisualStyle.halo}`}
      />
      <div
        className={`relative z-10 grid h-full gap-6 lg:items-start ${
          hasInteractiveColumn ? STORY_CHAPTER_GRID_CLASS : ''
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`relative -top-1 inline-flex h-[3.2rem] w-[3.2rem] items-center justify-center rounded-full border text-[1.3rem] font-semibold leading-none tracking-[0.01em] ${stepVisualStyle.stepChip}`}
            >
              {stepLabel}
            </span>
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${stepVisualStyle.eyebrow}`}
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
          <div className={`mt-6 h-px w-28 ${stepVisualStyle.divider}`} />
          {inlineCard ? <div className="mt-6">{inlineCard}</div> : null}
        </div>
        {hasInteractiveColumn ? <StoryInteractiveColumn>{card}</StoryInteractiveColumn> : null}
      </div>
    </div>
  );
}

function TheoryTrackGallery({ isLightMode }: { isLightMode: boolean }) {
  const COURSE_CAROUSEL_ROTATE_MS = 3600;
  const COURSE_CAROUSEL_ANIMATION_MS = 980;
  const tracks = [
    {
      id: 'pyspark',
      name: 'PySpark',
      description: 'Distributed data engineering foundations and practical workflow drills.',
      logoSrc: '/brand/pyspark-logo.svg',
      href: '/learn/pyspark/theory',
      badge: 'Live now',
      locked: false
    },
    {
      id: 'fabric',
      name: 'Microsoft Fabric',
      description: 'Lakehouse-first analytics patterns and orchestration in production contexts.',
      logoSrc: '/brand/microsoft-fabric-logo.svg',
      href: '/learn/theory',
      badge: 'Live now',
      locked: false
    },
    {
      id: 'airflow',
      name: 'Apache Airflow',
      description: 'Pipeline scheduling, DAG design, and reliability playbooks.',
      logoSrc: '/brand/apache-airflow-logo.svg',
      href: '/learn/theory',
      badge: 'Locked',
      locked: true
    }
  ] as const;
  const loopedTracks = [...tracks, ...tracks];
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [stepWidthPx, setStepWidthPx] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  const measureStepWidth = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stripNode = stripRef.current;
    if (!stripNode) {
      return;
    }

    const firstCard = stripNode.querySelector<HTMLElement>('[data-course-card="true"]');
    if (!firstCard) {
      return;
    }

    const computed = window.getComputedStyle(stripNode);
    const gapValue = Number.parseFloat(computed.columnGap || computed.gap || '0');
    const gap = Number.isFinite(gapValue) ? gapValue : 0;
    setStepWidthPx(firstCard.getBoundingClientRect().width + gap);
  }, []);

  useEffect(() => {
    measureStepWidth();
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => measureStepWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureStepWidth]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || tracks.length <= 1 || stepWidthPx <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCarouselIndex((currentIndex) => currentIndex + 1);
    }, COURSE_CAROUSEL_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [COURSE_CAROUSEL_ROTATE_MS, isPaused, prefersReducedMotion, stepWidthPx, tracks.length]);

  const handleTrackTransitionEnd = () => {
    if (carouselIndex < tracks.length) {
      return;
    }

    setTransitionEnabled(false);
    setCarouselIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  };

  const activeDotIndex =
    tracks.length > 0 ? ((carouselIndex % tracks.length) + tracks.length) % tracks.length : 0;

  return (
    <div
      className="w-full max-w-6xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          ref={stripRef}
          className={`flex gap-5 ${
            transitionEnabled && !prefersReducedMotion
              ? 'transition-transform ease-[cubic-bezier(0.24,1,0.34,1)]'
              : ''
          }`}
          style={{
            transform:
              stepWidthPx > 0
                ? `translate3d(-${carouselIndex * stepWidthPx}px, 0, 0)`
                : 'translate3d(0, 0, 0)',
            transitionDuration:
              transitionEnabled && !prefersReducedMotion
                ? `${COURSE_CAROUSEL_ANIMATION_MS}ms`
                : undefined
          }}
          onTransitionEnd={handleTrackTransitionEnd}
          role="region"
          aria-roledescription="carousel"
          aria-label="Theory course tracks"
        >
          {loopedTracks.map((track, index) => {
            const card = (
              <article
                data-course-card="true"
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-colors ${
                  isLightMode
                    ? 'border-[#aab5bf]/65 bg-[#e7ecef]'
                    : track.locked
                      ? 'border-[#343c45] bg-[#0f1318]'
                      : 'border-[#2a323a] bg-[#10151a] hover:border-[#3a434d]'
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(100,160,220,0.12),transparent_38%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        track.locked
                          ? 'border border-[#454f58] bg-[#1a2129] text-[#9aa6b1]'
                          : 'border border-[#4f5b66] bg-[#232b33] text-[#c5ced6]'
                      }`}
                    >
                      {track.badge}
                    </span>
                    {track.locked ? <Lock className="h-4 w-4 text-[#94a79a]" /> : null}
                  </div>

                  <div className="relative mt-4 rounded-xl border border-[#2f3840] bg-[#0e1318] p-4">
                    <div className="relative h-28 w-full">
                      <Image
                        src={track.logoSrc}
                        alt={`${track.name} logo`}
                        fill
                        className={`object-contain ${track.locked ? 'opacity-55 grayscale' : ''}`}
                      />
                    </div>
                  </div>

                  <h3 className={`relative mt-4 text-xl font-semibold ${isLightMode ? 'text-[#1f2a34]' : 'text-[#e3efe8]'}`}>
                    {track.name}
                  </h3>
                  <p className={`relative mt-2 text-sm leading-6 ${isLightMode ? 'text-[#4b5a66]' : 'text-[#b0bac4]'}`}>
                    {track.description}
                  </p>
                  <p
                    className={`relative mt-3 text-xs font-semibold uppercase tracking-[0.12em] ${
                      track.locked
                        ? isLightMode
                          ? 'text-[#6f7882]'
                          : 'text-[#7f8a95]'
                        : isLightMode
                          ? 'text-[#2f3f4c]'
                          : 'text-[#c5ced6]'
                    }`}
                  >
                    {track.locked ? 'Preview track' : 'Open track'}
                  </p>
                </div>
              </article>
            );

            return (
              <Link
                key={`${track.id}-${index}`}
                href={track.href}
                className="block w-full flex-none sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
                aria-label={`${track.locked ? 'Preview' : 'Open'} ${track.name} track`}
              >
                {card}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            type="button"
            onClick={() => {
              setTransitionEnabled(true);
              setCarouselIndex(index);
            }}
            aria-label={`Show ${track.name}`}
            aria-current={index === activeDotIndex ? 'true' : undefined}
            className={`rounded-full transition-all duration-300 ${
              index === activeDotIndex
                ? 'h-1.5 w-5 bg-[#a7b0b8]'
                : 'h-1.5 w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function MissionBriefingCard({ isLightMode }: { isLightMode: boolean }) {
  const TASK_CAROUSEL_ROTATE_MS = 3600;
  const TASK_CAROUSEL_ANIMATION_MS = 980;
  const taskOptions = [
    {
      id: 'notebooks',
      title: 'Notebooks',
      description: 'Audit production notebooks and resolve line-level reliability issues.',
      progress: '0/3 reviewed',
      cta: 'Open notebooks',
      href: '/tasks',
      icon: NotebookPen,
      tone: 'mint'
    },
    {
      id: 'missions',
      title: 'Missions',
      description: 'Run incident scenarios and continue the latest active operations drill.',
      progress: '0/8 completed',
      cta: 'Resume mission',
      href: '/missions',
      icon: Flag,
      tone: 'amber'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Train high-speed recall and keep your latest theory track fresh.',
      progress: '4 attempted',
      cta: 'Resume flashcards',
      href: '/tasks',
      icon: Layers3,
      tone: 'gold'
    }
  ] as const;
  const loopedTasks = [...taskOptions, ...taskOptions];
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [stepWidthPx, setStepWidthPx] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  const measureStepWidth = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stripNode = stripRef.current;
    if (!stripNode) {
      return;
    }

    const firstCard = stripNode.querySelector<HTMLElement>('[data-task-card="true"]');
    if (!firstCard) {
      return;
    }

    const computed = window.getComputedStyle(stripNode);
    const gapValue = Number.parseFloat(computed.columnGap || computed.gap || '0');
    const gap = Number.isFinite(gapValue) ? gapValue : 0;
    setStepWidthPx(firstCard.getBoundingClientRect().width + gap);
  }, []);

  useEffect(() => {
    measureStepWidth();
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => measureStepWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureStepWidth]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || taskOptions.length <= 1 || stepWidthPx <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCarouselIndex((currentIndex) => currentIndex + 1);
    }, TASK_CAROUSEL_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [
    TASK_CAROUSEL_ROTATE_MS,
    isPaused,
    prefersReducedMotion,
    stepWidthPx,
    taskOptions.length
  ]);

  const handleTrackTransitionEnd = () => {
    if (carouselIndex < taskOptions.length) {
      return;
    }

    setTransitionEnabled(false);
    setCarouselIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  };

  const activeDotIndex =
    taskOptions.length > 0
      ? ((carouselIndex % taskOptions.length) + taskOptions.length) % taskOptions.length
      : 0;

  const toneStyles: Record<
    (typeof taskOptions)[number]['tone'],
    {
      shell: string;
      badge: string;
      iconShell: string;
      iconColor: string;
      dot: string;
      glow: string;
    }
  > = {
    mint: {
      shell: 'border-[#2a4f45] bg-[#0f1514] hover:border-[#35675a]',
      badge: 'border border-[#2f6b5e] bg-[#15302b] text-[#bce8dc]',
      iconShell: 'border-[#2f6b5e]/85 bg-[#122824]',
      iconColor: 'text-[#3ed3b2]',
      dot: 'bg-[#3ed3b2]',
      glow: 'bg-[radial-gradient(circle_at_16%_14%,rgba(62,211,178,0.12),transparent_38%)]'
    },
    amber: {
      shell: 'border-[#5c4426] bg-[#16120e] hover:border-[#7b5c34]',
      badge: 'border border-[#87622c] bg-[#2d2111] text-[#ecd1a4]',
      iconShell: 'border-[#87622c]/85 bg-[#2a1f11]',
      iconColor: 'text-[#f3b24a]',
      dot: 'bg-[#f3b24a]',
      glow: 'bg-[radial-gradient(circle_at_16%_14%,rgba(243,178,74,0.12),transparent_38%)]'
    },
    gold: {
      shell: 'border-[#6d4f22] bg-[#17120d] hover:border-[#8b6630]',
      badge: 'border border-[#91672d] bg-[#2f2212] text-[#edd4a8]',
      iconShell: 'border-[#91672d]/85 bg-[#2d2112]',
      iconColor: 'text-[#f4ba58]',
      dot: 'bg-[#f4ba58]',
      glow: 'bg-[radial-gradient(circle_at_16%_14%,rgba(244,186,88,0.13),transparent_38%)]'
    }
  };

  return (
    <div
      className="w-full max-w-6xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          ref={stripRef}
          className={`flex gap-5 ${
            transitionEnabled && !prefersReducedMotion
              ? 'transition-transform ease-[cubic-bezier(0.24,1,0.34,1)]'
              : ''
          }`}
          style={{
            transform:
              stepWidthPx > 0
                ? `translate3d(-${carouselIndex * stepWidthPx}px, 0, 0)`
                : 'translate3d(0, 0, 0)',
            transitionDuration:
              transitionEnabled && !prefersReducedMotion
                ? `${TASK_CAROUSEL_ANIMATION_MS}ms`
                : undefined
          }}
          onTransitionEnd={handleTrackTransitionEnd}
          role="region"
          aria-roledescription="carousel"
          aria-label="Practice task tracks"
        >
          {loopedTasks.map((task, index) => {
            const tone = toneStyles[task.tone];
            const Icon = task.icon;

            return (
              <Link
                key={`${task.id}-${index}`}
                href={task.href}
                className="block w-full flex-none sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
                aria-label={task.cta}
              >
                <article
                  data-task-card="true"
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-colors ${tone.shell}`}
                >
                  <div className={`pointer-events-none absolute inset-0 ${tone.glow}`} />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}
                      >
                        Task
                      </span>
                      <p className={`text-[11px] font-medium ${isLightMode ? 'text-[#4b5a66]' : 'text-[#aeb8c2]'}`}>
                        {task.progress}
                      </p>
                    </div>

                    <div className="relative mt-4 rounded-xl border border-[#2f3840] bg-[#0e1318] p-4">
                      <div className="flex h-28 items-center gap-3.5">
                        <span
                          className={`inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl border ${tone.iconShell}`}
                        >
                          <Icon className={`h-6 w-6 ${tone.iconColor}`} />
                        </span>
                        <h3
                          className={`text-xl font-semibold leading-tight ${
                            isLightMode ? 'text-[#1f2a34]' : 'text-[#e3efe8]'
                          }`}
                        >
                          {task.title}
                        </h3>
                      </div>
                    </div>

                    <p
                      className={`relative mt-4 text-sm leading-6 ${
                        isLightMode ? 'text-[#4b5a66]' : 'text-[#b0bac4]'
                      }`}
                    >
                      {task.description}
                    </p>
                    <p
                      className={`relative mt-3 text-xs font-semibold uppercase tracking-[0.12em] ${
                        isLightMode ? 'text-[#2f3f4c]' : 'text-[#c5ced6]'
                      }`}
                    >
                      {task.cta}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {taskOptions.map((task, index) => (
          <button
            key={task.id}
            type="button"
            onClick={() => {
              setTransitionEnabled(true);
              setCarouselIndex(index);
            }}
            aria-label={`Show ${task.title}`}
            aria-current={index === activeDotIndex ? 'true' : undefined}
            className={`rounded-full transition-all duration-300 ${
              index === activeDotIndex
                ? `h-1.5 w-5 ${toneStyles[task.tone].dot}`
                : 'h-1.5 w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function GridItemDeckCarousel({ isLightMode }: { isLightMode: boolean }) {
  const TECH_CAROUSEL_ROTATE_MS = 3600;
  const TECH_CAROUSEL_ANIMATION_MS = 980;
  const techItems = [
    {
      id: 'control-center',
      category: 'Monitoring',
      title: 'Control Center',
      description: 'Restores telemetry visibility and dispatch command continuity.',
      unlocks: 'Infrastructure telemetry',
      href: '/missions',
      preview: 'control'
    },
    {
      id: 'smart-transformer',
      category: 'Control',
      title: 'Smart Transformer',
      description: 'Stabilizes bidirectional prosumer injections at the edge.',
      unlocks: 'Mission 003: Prosumer Swarm',
      href: '/missions',
      preview: 'none'
    },
    {
      id: 'solar-forecasting-array',
      category: 'Forecasting',
      title: 'Solar Forecasting Array',
      description: 'Improves day-ahead and intra-day irradiance dispatch estimates.',
      unlocks: 'Mission 001: Solar Surge',
      href: '/missions',
      preview: 'solar'
    },
    {
      id: 'battery-storage',
      category: 'Flexibility',
      title: 'Battery Storage (50 MWh)',
      description: 'Absorbs renewable oversupply and discharges during peak stress.',
      unlocks: 'Mission 002: Evening Peak',
      href: '/missions',
      preview: 'battery'
    }
  ] as const;
  const loopedItems = [...techItems, ...techItems];
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [stepWidthPx, setStepWidthPx] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  const measureStepWidth = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stripNode = stripRef.current;
    if (!stripNode) {
      return;
    }

    const firstCard = stripNode.querySelector<HTMLElement>('[data-tech-card="true"]');
    if (!firstCard) {
      return;
    }

    const computed = window.getComputedStyle(stripNode);
    const gapValue = Number.parseFloat(computed.columnGap || computed.gap || '0');
    const gap = Number.isFinite(gapValue) ? gapValue : 0;
    setStepWidthPx(firstCard.getBoundingClientRect().width + gap);
  }, []);

  useEffect(() => {
    measureStepWidth();
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => measureStepWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureStepWidth]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || techItems.length <= 1 || stepWidthPx <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCarouselIndex((currentIndex) => currentIndex + 1);
    }, TECH_CAROUSEL_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [
    TECH_CAROUSEL_ROTATE_MS,
    isPaused,
    prefersReducedMotion,
    stepWidthPx,
    techItems.length
  ]);

  const handleTrackTransitionEnd = () => {
    if (carouselIndex < techItems.length) {
      return;
    }

    setTransitionEnabled(false);
    setCarouselIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  };

  const activeDotIndex =
    techItems.length > 0
      ? ((carouselIndex % techItems.length) + techItems.length) % techItems.length
      : 0;

  const renderPreview = (
    preview: (typeof techItems)[number]['preview'],
    title: string
  ) => {
    if (preview === 'control') {
      return <ControlCenterModelPreviewLazy className="h-40 border-0" />;
    }

    if (preview === 'solar') {
      return <SolarForecastingModelPreviewLazy className="h-40 border-0" />;
    }

    if (preview === 'battery') {
      return <BatteryStorageModelPreviewLazy className="h-40 border-0" />;
    }

    return (
      <div className="h-40 rounded-xl border border-[#2b4f41] bg-[radial-gradient(circle_at_30%_18%,rgba(88,132,255,0.18),transparent_46%),linear-gradient(180deg,#0a1322,#060c15)]">
        <div className="flex h-full items-center justify-center gap-2 text-[#8eb5df]">
          <Zap className="h-5 w-5" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full max-w-6xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          ref={stripRef}
          className={`flex gap-5 ${
            transitionEnabled && !prefersReducedMotion
              ? 'transition-transform ease-[cubic-bezier(0.24,1,0.34,1)]'
              : ''
          }`}
          style={{
            transform:
              stepWidthPx > 0
                ? `translate3d(-${carouselIndex * stepWidthPx}px, 0, 0)`
                : 'translate3d(0, 0, 0)',
            transitionDuration:
              transitionEnabled && !prefersReducedMotion
                ? `${TECH_CAROUSEL_ANIMATION_MS}ms`
                : undefined
          }}
          onTransitionEnd={handleTrackTransitionEnd}
          role="region"
          aria-roledescription="carousel"
          aria-label="Grid tech deck"
        >
          {loopedItems.map((item, index) => (
            <Link
              key={`${item.id}-${index}`}
              href={item.href}
              className="block w-full flex-none sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
              aria-label={`Open ${item.title}`}
            >
              <article
                data-tech-card="true"
                className="group relative overflow-hidden rounded-2xl border border-[#2a3e58] bg-[#0f161f] p-5 transition-colors hover:border-[#3c587b]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(65,130,212,0.14),transparent_42%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isLightMode ? 'text-[#4c6073]' : 'text-[#8ea6c2]'}`}>
                      {item.category}
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3b5b84] bg-[#152335] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#b9cee8]">
                      <Info className="h-3.5 w-3.5" />
                      Details
                    </span>
                  </div>

                  <h3 className={`mt-1 text-xl font-semibold ${isLightMode ? 'text-[#1f2a34]' : 'text-[#e3edf8]'}`}>
                    {item.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${isLightMode ? 'text-[#4b5a66]' : 'text-[#b0bfd1]'}`}>
                    {item.description}
                  </p>

                  <div className="mt-3 rounded-xl border border-[#2f4e72] bg-[#102033] px-4 py-3">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isLightMode ? 'text-[#4d6378]' : 'text-[#9db5d2]'}`}>
                      Unlocks
                    </p>
                    <p className={`mt-1 text-[10.5px] font-semibold leading-5 ${isLightMode ? 'text-[#26425f]' : 'text-[#d9e7ff]'}`}>
                      {item.unlocks}
                    </p>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-[#2b4f41]">
                    {renderPreview(item.preview, item.title)}
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#2f6b5e]/70 bg-[#122924] px-4 py-2 text-[11px] font-semibold text-[#56baa3]">
                    <Zap className="h-4 w-4" />
                    Infrastructure active
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {techItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTransitionEnabled(true);
              setCarouselIndex(index);
            }}
            aria-label={`Show ${item.title}`}
            aria-current={index === activeDotIndex ? 'true' : undefined}
            className={`rounded-full transition-all duration-300 ${
              index === activeDotIndex
                ? 'h-1.5 w-5 bg-[#78a7df]'
                : 'h-1.5 w-1.5 bg-white/30'
            }`}
          />
        ))}
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
        className="relative mx-auto w-full max-w-6xl"
        style={{
          opacity: emphasis,
          transform: `translate3d(0, ${(1 - emphasis) * 20}px, 0)`,
          transition: 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform, opacity'
        }}
      >
        <div
          className={`relative isolate flex min-h-[22rem] items-center justify-center overflow-hidden rounded-[1.5rem] border px-7 py-10 text-center backdrop-blur-lg sm:min-h-[26rem] sm:px-10 sm:py-12 lg:min-h-[32rem] lg:px-14 lg:py-14 ${
            isLightMode
              ? 'border-[#c7d9cf] bg-white/86 shadow-[0_20px_70px_rgba(16,38,28,0.18)]'
              : 'border-white/18 bg-[#06100c]/84 shadow-[0_20px_70px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={FINAL_CTA_FIRST_FRAME_PATH}
              alt=""
              fill
              sizes="(min-width: 1280px) 72rem, 100vw"
              className="object-cover object-center opacity-38"
            />
            <div
              className={`absolute inset-0 ${
                isLightMode
                  ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(245,252,248,0.9))]'
                  : 'bg-[linear-gradient(180deg,rgba(0,0,0,0.44),rgba(0,0,0,0.74))]'
              }`}
            />
          </div>
          <div className="relative z-10 w-full">
            {chapter.eyebrow ? (
              <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isLightMode ? 'text-[#5f7a6c]' : 'text-[#a5bfb3]'}`}>
                {chapter.eyebrow}
              </p>
            ) : null}
            <h2
              className={`${chapter.eyebrow ? 'mt-3' : ''} text-[clamp(2rem,5.9vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] ${isLightMode ? 'text-[#13221a]' : 'text-[#f3f7f4]'}`}
              style={{ fontFamily: HERO_DISPLAY_FONT_FAMILY }}
            >
              {chapter.title}
            </h2>
            {chapter.body ? (
              <p className={`mx-auto mt-4 max-w-[32rem] text-[16px] leading-8 ${isLightMode ? 'text-[#48665a]' : 'text-[#c7ddd3]'}`}>
                {chapter.body}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/not-sure-yet"
                className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors ${
                  isLightMode
                    ? 'border-[#7f8f87]/45 bg-white/85 text-[#25302c] hover:border-[#6f7d76] hover:bg-white'
                    : 'border-white/24 bg-black/28 text-[#e4ece8] hover:border-white/34 hover:bg-black/40'
                }`}
              >
                Not sure yet
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
        <FinalFaqSection />
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

function FinalFaqSection() {
  const [openFaqId, setOpenFaqId] = useState<string>('');

  return (
    <section
      aria-label="Landing page frequently asked questions"
      className="pointer-events-auto relative left-1/2 mt-56 w-screen -translate-x-1/2 border-y border-[#d0d8df] bg-[linear-gradient(180deg,#f9fbfc,#f2f5f7)] sm:mt-64 lg:mt-80"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-12">
          <div className="max-w-[30rem]">
            <h3
              className="text-[clamp(1.9rem,4.1vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[#121b22]"
              style={{ fontFamily: HERO_DISPLAY_FONT_FAMILY }}
            >
              FAQs.
            </h3>
            <p className="mt-4 text-[14px] leading-7 text-[#4d5c66]">
              Big-data learning can feel dense at first. These answers keep it clear, so you know exactly what you get before you start.
            </p>
          </div>

          <div className="divide-y divide-[#c6ced6]">
            {LANDING_FAQ_ITEMS.map((item) => {
              const isOpen = item.id === openFaqId;
              const answerId = `landing-faq-answer-${item.id}`;

              return (
                <article key={item.id} className="text-[#132029]">
                  <button
                    type="button"
                    className="pointer-events-auto flex w-full items-center justify-between gap-5 py-5 text-left transition-colors hover:text-[#0a141b]"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => {
                      setOpenFaqId((current) => (current === item.id ? '' : item.id));
                    }}
                  >
                    <span className="text-[clamp(1.05rem,1.7vw,1.34rem)] font-medium leading-tight">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#4f5d67] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isOpen
                          ? 'rotate-180'
                          : 'rotate-0'
                      }`}
                    />
                  </button>
                  <div
                    id={answerId}
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] pb-0 opacity-0'
                    }`}
                  >
                    <p className="overflow-hidden text-[15px] leading-8 text-[#445460]">
                      {item.answer}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
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
  const introAutoplayStartTimeoutRef = useRef<number | null>(null);
  const introAutoplayIntervalRef = useRef<number | null>(null);
  const introAutoplayStartedRef = useRef(false);
  const [journeyPosition, setJourneyPosition] = useState(0);
  const [storyPosition, setStoryPosition] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'full' | 'balanced'>('full');
  const [introAutoplayFrame, setIntroAutoplayFrame] = useState<number | null>(
    INTRO_AUTOPLAY_START_FRAME
  );
  const [isIntroAutoplayComplete, setIsIntroAutoplayComplete] = useState(false);
  const [introCountdownSeconds, setIntroCountdownSeconds] = useState(
    INTRO_AUTOPLAY_DURATION_SECONDS + INTRO_AUTOPLAY_HOLD_SECONDS
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
  const indicatorSections = useMemo(
    () =>
      activeChapters
        .filter(
          (chapter) =>
            chapter.variant === 'intro' ||
            chapter.variant === 'story' ||
            chapter.variant === 'final'
        )
        .slice(0, 5)
        .map((chapter) => ({
          id: chapter.id,
          label: chapter.eyebrow
        })),
    [activeChapters]
  );

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

    const clearIntroAutoplayTimers = () => {
      if (introAutoplayStartTimeoutRef.current !== null) {
        window.clearTimeout(introAutoplayStartTimeoutRef.current);
        introAutoplayStartTimeoutRef.current = null;
      }
      if (introAutoplayIntervalRef.current !== null) {
        window.clearInterval(introAutoplayIntervalRef.current);
        introAutoplayIntervalRef.current = null;
      }
    };

    clearIntroAutoplayTimers();
    introAutoplayStartedRef.current = false;

    if (reducedMotion) {
      setIntroAutoplayFrame(null);
      setIsIntroAutoplayComplete(true);
      setIntroCountdownSeconds(0);
      return undefined;
    }

    setIsIntroAutoplayComplete(false);
    setIntroAutoplayFrame(INTRO_AUTOPLAY_START_FRAME);
    setIntroCountdownSeconds(INTRO_AUTOPLAY_DURATION_SECONDS + INTRO_AUTOPLAY_HOLD_SECONDS);
    const frameDelta = INTRO_AUTOPLAY_FINAL_FRAME - INTRO_AUTOPLAY_START_FRAME;
    if (frameDelta <= 0) {
      setIntroAutoplayFrame(null);
      setIsIntroAutoplayComplete(true);
      setIntroCountdownSeconds(0);
      return undefined;
    }

    const frameIntervalMs = 1000 / INTRO_AUTOPLAY_FPS;
    let frameIndex = INTRO_AUTOPLAY_START_FRAME;
    introAutoplayStartTimeoutRef.current = window.setTimeout(() => {
      if (introAutoplayStartedRef.current) {
        return;
      }
      introAutoplayStartedRef.current = true;
      setIntroCountdownSeconds(INTRO_AUTOPLAY_DURATION_SECONDS);

      introAutoplayIntervalRef.current = window.setInterval(() => {
        frameIndex += 1;
        const remainingFrames = Math.max(INTRO_AUTOPLAY_FINAL_FRAME - frameIndex, 0);
        setIntroCountdownSeconds(remainingFrames / INTRO_AUTOPLAY_FPS);
        if (frameIndex >= INTRO_AUTOPLAY_FINAL_FRAME) {
          if (introAutoplayIntervalRef.current !== null) {
            window.clearInterval(introAutoplayIntervalRef.current);
            introAutoplayIntervalRef.current = null;
          }
          setIntroAutoplayFrame(null);
          setIsIntroAutoplayComplete(true);
          setIntroCountdownSeconds(0);
          return;
        }

        setIntroAutoplayFrame(frameIndex);
      }, frameIntervalMs);
    }, INTRO_AUTOPLAY_HOLD_MS);

    return () => {
      clearIntroAutoplayTimers();
      introAutoplayStartedRef.current = false;
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
    if (typeof window === 'undefined' || !isIntroAutoplayComplete) {
      return;
    }

    window.dispatchEvent(new Event(LANDING_INTRO_COMPLETE_EVENT));
  }, [isIntroAutoplayComplete]);

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
  const baseDarknessOverlayOpacity =
    journeyPosition <= stepOnePosition
      ? clamp(journeyPosition / stepOnePosition, 0, 1)
      : 1;
  const postIntroDarknessFloor = isIntroAutoplayComplete ? 0.36 : 0;
  const darknessOverlayOpacity = clamp(
    Math.max(baseDarknessOverlayOpacity, postIntroDarknessFloor),
    0,
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
            id={chapter.id}
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
                  : 'bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.12)_22%,rgba(0,0,0,0.28)_100%)]'
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
      className={`relative overflow-clip ${isLightMode ? 'bg-[#edf5ef]' : 'bg-black'}`}
      aria-label="Three-step guided introduction to stableGrid core experience"
    >
      {!shouldLockIntroScroll ? (
        <ScrollSectionIndicator
          sections={indicatorSections}
          className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
        />
      ) : null}
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
          className={`pointer-events-none absolute inset-y-0 left-0 w-[min(62vw,56rem)] ${
            isLightMode
              ? 'bg-[linear-gradient(90deg,rgba(236,245,240,0.86)_0%,rgba(236,245,240,0.56)_42%,rgba(236,245,240,0.22)_70%,rgba(236,245,240,0)_100%)]'
              : 'bg-[linear-gradient(90deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.42)_40%,rgba(0,0,0,0.16)_72%,rgba(0,0,0,0)_100%)]'
          }`}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: darknessOverlayOpacity }}
        />
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLightMode
              ? 'bg-[radial-gradient(circle_at_50%_46%,transparent_0,transparent_26%,rgba(219,236,228,0.45)_56%,rgba(236,245,240,0.84)_100%)]'
              : 'bg-[radial-gradient(circle_at_50%_46%,transparent_0,transparent_26%,rgba(0,0,0,0.2)_56%,rgba(0,0,0,0.86)_100%)]'
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLightMode
              ? 'bg-[linear-gradient(180deg,rgba(236,245,240,0.88)_0%,rgba(241,249,244,0.44)_24%,rgba(241,249,244,0)_56%,rgba(222,238,230,0.54)_100%)]'
              : 'bg-[linear-gradient(180deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.2)_24%,rgba(0,0,0,0)_56%,rgba(0,0,0,0.64)_100%)]'
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
