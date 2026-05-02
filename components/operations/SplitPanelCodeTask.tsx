'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Play,
  Copy,
  RotateCcw,
  Loader2,
  Check,
  Terminal,
  Clock,
  FileText,
  Database,
  Lightbulb,
  Columns,
  ChevronDown,
  ChevronRight,
  Table2,
  X,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import type {
  PracticeSet,
  PracticeTask,
  PracticeSetDataset,
  TemplateField,
} from '@/data/operations/practice-sets';
import { getPracticeTaskReward } from '@/lib/energy';
import { highlightPython } from './PracticeCodeEditor';

/** Compute the kWh a user will earn for solving this task given which hints
 *  they've already unlocked. Mirrors the reward-dock logic in
 *  PracticeSetViewer so the panel and the actual award stay in sync.
 *  Rules:
 *    - Base = getPracticeTaskReward(trackLevel)
 *    - If the highest hint tier is unlocked → reward = 0
 *    - Otherwise reward = max(0, base - sum(unlocked hint xp_costs))
 */
function effectiveReward(
  task: PracticeTask,
  unlockedHints: Set<string>,
  trackSlug: string,
): { base: number; effective: number; deducted: number; zeroed: boolean } {
  const base = getPracticeTaskReward(trackSlug);
  const taskHints = task.hints ?? [];
  const lastHintTier = taskHints[taskHints.length - 1]?.tier;
  const zeroed = Boolean(taskHints.length > 0 && lastHintTier && unlockedHints.has(lastHintTier));
  if (zeroed) {
    return { base, effective: 0, deducted: base, zeroed: true };
  }
  const hintCostUsed = taskHints
    .filter((h) => unlockedHints.has(h.tier))
    .reduce((sum, h) => sum + (h.xp_cost ?? 0), 0);
  const effective = Math.max(0, base - hintCostUsed);
  return { base, effective, deducted: base - effective, zeroed: false };
}

/** Compact circular reward indicator. Stroke fills proportional to
 *  remaining/base; centre stacks the effective value over a "kWh"
 *  label. Three-state colour: heading-tone at full base, kWh-gold once
 *  any hint is unlocked, secondary-grey when zeroed.
 *
 *  Polish: a faint conic glow behind the ring at full reward (drops
 *  off as hints deplete it), inner soft-fill so the centre reads as a
 *  subtle elevated surface, drop-shadow under the whole composition,
 *  rounded stroke caps, and animated stroke + colour transitions. */
function RewardRing({
  effective, base, zeroed,
}: { effective: number; base: number; zeroed: boolean }) {
  const SIZE = 40;
  const STROKE = 2.5;
  const radius = (SIZE - STROKE) / 2;
  const innerRadius = radius - STROKE / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const ratio = base > 0 ? Math.max(0, Math.min(1, effective / base)) : 0;
  const dashOffset = circumference * (1 - ratio);
  const isFull = ratio >= 1;
  const accent = zeroed
    ? 'var(--rm-text-secondary)'
    : effective < base
      ? '#ffc965'
      : 'var(--rm-text-heading, var(--rm-text))';
  const haloAccent = zeroed
    ? 'rgba(160,160,160,0)'
    : effective < base
      ? 'rgba(255,201,101,0.32)'
      : 'rgba(255,255,255,0.22)';
  const labelTitle = effective === base
    ? `Solve to earn ${effective} kWh`
    : `Solve to earn ${effective} kWh (was ${base}; hint deductions applied)`;
  return (
    <div
      className="relative shrink-0"
      style={{
        width: SIZE,
        height: SIZE,
        // Soft drop shadow lifts the ring off the page; halo follows
        // the accent so a fresh task glints subtly. Both fade out
        // smoothly as the reward depletes.
        filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.18)) drop-shadow(0 0 ${ratio * 6}px ${haloAccent})`,
        transition: 'filter 320ms ease',
      }}
      title={labelTitle}
      aria-label={labelTitle}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          {/* Subtle vertical gradient on the active stroke for depth. */}
          <linearGradient id="rwdStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.78" />
          </linearGradient>
          {/* Inner-fill radial — slightly elevated centre. */}
          <radialGradient id="rwdInner" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--rm-bg-elevated)" stopOpacity="0.96" />
            <stop offset="100%" stopColor="var(--rm-bg-elevated)" stopOpacity="0.65" />
          </radialGradient>
        </defs>
        {/* Inner soft-fill disc — gives the centre weight so the
            numbers don't float on the page background. */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={innerRadius}
          fill="url(#rwdInner)"
        />
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={radius}
          fill="none" strokeWidth={STROKE}
          stroke="var(--rm-border)"
          strokeOpacity={0.6}
        />
        {/* Filled portion — rotated -90deg so the stroke starts at the
            top of the ring and fills clockwise. */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={radius}
          fill="none" strokeWidth={STROKE}
          stroke="url(#rwdStroke)"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            transition: 'stroke-dashoffset 480ms cubic-bezier(0.16, 1, 0.3, 1), stroke 220ms ease',
          }}
        />
        {/* Tiny terminal dot at the leading edge of the stroke when
            partially full — subtle visual anchor. Skipped at full
            because the stroke wraps fully and there's no leading edge. */}
        {!isFull && ratio > 0 && (() => {
          const angle = ratio * 2 * Math.PI - Math.PI / 2;
          const cx = SIZE / 2 + radius * Math.cos(angle);
          const cy = SIZE / 2 + radius * Math.sin(angle);
          return <circle cx={cx} cy={cy} r={STROKE / 2 + 0.5} fill={accent} />;
        })()}
      </svg>
      {/* Value + unit stacked centre — value bigger, kWh smaller below */}
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="font-bold tabular-nums"
          style={{
            color: accent,
            fontSize: effective >= 100 ? 11 : 13,
            fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            transition: 'color 220ms ease',
          }}
        >
          {effective}
        </span>
        <span
          className="font-mono font-bold uppercase"
          style={{
            color: 'var(--rm-text-secondary)',
            fontSize: 6,
            letterSpacing: '0.16em',
            lineHeight: 1,
            opacity: 0.6,
            marginTop: 1,
          }}
        >
          kWh
        </span>
      </div>
    </div>
  );
}

/* ── Constants ──────────────────────────────────────────────────────────────── */

const ACCENT = '153,247,255';
const GREEN_RGB = '34,197,94';
const RED_RGB = '239,68,68';
const RUN_GREEN = `rgb(${GREEN_RGB})`;

/* Feedback colors that adapt per reading mode. Use these for any "Correct"
   / "Incorrect" affordance rendered against the page surface (option pills,
   chips, rationale cards). The fixed GREEN_RGB / RED_RGB constants above stay
   for elements rendered inside the code editor's own dark panel, which has a
   constant background regardless of reading mode. */
const SUCCESS_RGB = 'var(--rm-success-rgb)';
const ERROR_RGB = 'var(--rm-error-rgb)';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface FieldAnswer {
  value: string;
  result: boolean | null;
}

interface TaskState {
  answers: Record<string, FieldAnswer>;
  checked: boolean;
  allCorrect: boolean;
  selfReview?: boolean;
  output?: string;
  validationReasons?: string[];
}

export interface RunMeta {
  /** Mock methods invoked during the run — proof-of-work evidence. */
  callLog: string[];
  /** Numeric literals extracted from the user's source via ast.parse. */
  literals: number[];
  /** The user's code (without setup) — used by the validator for AST checks. */
  userCode: string;
}

interface SplitPanelCodeTaskProps {
  task: PracticeTask;
  practiceSet: PracticeSet;
  topic: string;
  taskState: TaskState;
  isReview: boolean;
  onAnswerChange: (fieldId: string, value: string) => void;
  /**
   * Pushes the captured stdout from the most recent run up to the session
   * reducer so CHECK_ANSWERS can validate against an `expectedOutput` spec.
   * The optional second arg carries proof-of-work evidence (which mock
   * methods got called + numeric literals from the user's code), used by
   * the validator's anti-cheat heuristics. Optional — non-code task
   * surfaces don't need it.
   */
  onOutputChange?: (output: string, meta?: RunMeta) => void;
  onCheck: () => void;
  onNext: () => void;
  onSkip: () => void;
  /**
   * Optional handler to navigate to the previous task in the set. When
   * present (multi-question MCQ surfaces), the answers panel renders an
   * inline Previous button next to Check / Continue so users don't have
   * to scroll out to find the outer footer.
   */
  onPrev?: () => void;
  isFirst?: boolean;
  checked: boolean;
  isLast: boolean;
  /**
   * Optional lifted hint state. When provided, the parent owns which hints
   * are unlocked for this task (so it can compute completion rewards based
   * on hint usage). When omitted, the component falls back to local state.
   */
  unlockedHints?: Set<string>;
  onUnlockHint?: (tier: string) => void;
}

type LeftTab = 'context' | 'dataset' | 'hints';

/* ── Pyodide Execution Engine (shared singleton) ────────────────────────────── */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  FS: {
    writeFile: (path: string, data: string) => void;
    mkdir: (path: string) => void;
    readdir: (path: string) => string[];
  };
  loadPackage: (pkg: string | string[]) => Promise<void>;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadingPromise: Promise<PyodideInterface> | null = null;

function loadPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.head.appendChild(script);
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;
  pyodideLoadingPromise = (async () => {
    await loadPyodideScript();
    const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_CDN });
    await pyodide.loadPackage(['pandas', 'micropip']);
    pyodideInstance = pyodide;
    return pyodide;
  })();
  return pyodideLoadingPromise;
}

/* ── PySpark Mock ───────────────────────────────────────────────────────────── */
/* Identical to PracticeCodeEditor — shared via import would be ideal but the
   mock is a raw string template literal; we keep a reference here for the
   standalone execution path. In practice the module-level singleton `pyodideInstance`
   means both components share the same runtime. We import the mock from PracticeCodeEditor
   by re-using the same constant. For bundle size, we inline a reference. */

// We dynamically load the mock only when needed via lazy import reference.
// The PracticeCodeEditor already defines PYSPARK_MOCK — we replicate the exact
// same string here. This is necessary because PYSPARK_MOCK is not exported.

const PYSPARK_MOCK = `
# ── PySpark Mock (pandas-backed, browser execution) ──────────────────────────
import pandas as pd
import sys, types, io, math, re

_ISO_DATE_RE = re.compile(r'^\\d{4}-\\d{2}-\\d{2}$')

class _MockConf:
    def __init__(self):
        self._conf = {}
    def get(self, key, default=None):
        return self._conf.get(key, default)
    def set(self, key, value):
        self._conf[key] = str(value)
        return self

class _MockColumn:
    """
    Carries enough information to evaluate column expressions against the
    underlying pandas DataFrame inside agg() and filter().

    op   — agg ops: 'sum'|'avg'|'mean'|'min'|'max'|'count'|'count_distinct'|
            'first'|'last'|'round'|'lit'|None (None = bare column reference).
            predicate ops (used by filter): 'pred_gt'|'pred_ge'|'pred_lt'|
            'pred_le'|'pred_eq'|'pred_ne'|'pred_isnull'|'pred_notnull'|
            'pred_between'|'pred_isin'|'pred_and'|'pred_or'|'pred_not'.
    src  — for terminal ops: source column name as string.
            for 'round': another _MockColumn (the inner expression).
            for predicates: typically the lhs _MockColumn (or list for and/or).
    args — extra params (e.g. {'scale': 2} for round, {'value': 50} for gt).
    """
    def __init__(self, name, op=None, src=None, args=None):
        self._name = name
        self._op = op
        self._src = src
        self._args = args or {}
    def alias(self, a):
        return _MockColumn(a, op=self._op, src=self._src, args=dict(self._args))
    def isNotNull(self):
        return _MockColumn(f'{self._name} IS NOT NULL', op='pred_notnull', src=self)
    def isNull(self):
        return _MockColumn(f'{self._name} IS NULL', op='pred_isnull', src=self)
    def cast(self, t):
        return self
    def isin(self, *vals):
        flat = list(vals)
        if len(flat) == 1 and isinstance(flat[0], (list, tuple)):
            flat = list(flat[0])
        return _MockColumn(f'{self._name} IN ...', op='pred_isin', src=self, args={'values': flat})
    # when().when().otherwise() chain — only meaningful when self is itself a
    # 'when' column; on other columns the call is a no-op so we don't blow up
    # exotic student code.
    def when(self, cond, val):
        if self._op == 'when':
            new_conds = list(self._args.get('conditions', [])) + [(cond, val)]
            return _MockColumn(
                'when',
                op='when',
                args={'conditions': new_conds, 'otherwise': self._args.get('otherwise')}
            )
        return self
    def otherwise(self, val):
        if self._op == 'when':
            return _MockColumn(
                'when',
                op='when',
                args={
                    'conditions': self._args.get('conditions', []),
                    'otherwise': val,
                }
            )
        return self
    # Arithmetic ops — produce row-wise expression columns so things like
    # col('a') + col('b') and col('x') * 1.5 evaluate inside agg / filter.
    def __add__(self, other):
        return _MockColumn(f'{self._name} + ...', op='arith_add', src=[self, other])
    def __radd__(self, other):
        return _MockColumn(f'... + {self._name}', op='arith_add', src=[other, self])
    def __sub__(self, other):
        return _MockColumn(f'{self._name} - ...', op='arith_sub', src=[self, other])
    def __rsub__(self, other):
        return _MockColumn(f'... - {self._name}', op='arith_sub', src=[other, self])
    def __mul__(self, other):
        return _MockColumn(f'{self._name} * ...', op='arith_mul', src=[self, other])
    def __rmul__(self, other):
        return _MockColumn(f'... * {self._name}', op='arith_mul', src=[other, self])
    def __truediv__(self, other):
        return _MockColumn(f'{self._name} / ...', op='arith_div', src=[self, other])
    def __rtruediv__(self, other):
        return _MockColumn(f'... / {self._name}', op='arith_div', src=[other, self])
    def __mod__(self, other):
        return _MockColumn(f'{self._name} % ...', op='arith_mod', src=[self, other])
    def __rmod__(self, other):
        return _MockColumn(f'... % {self._name}', op='arith_mod', src=[other, self])
    def __floordiv__(self, other):
        return _MockColumn(f'{self._name} // ...', op='arith_floordiv', src=[self, other])
    def __rfloordiv__(self, other):
        return _MockColumn(f'... // {self._name}', op='arith_floordiv', src=[other, self])
    def __neg__(self):
        return _MockColumn(f'-{self._name}', op='arith_mul', src=[-1, self])
    def __ge__(self, other):
        return _MockColumn(f'{self._name} >= ...', op='pred_ge', src=self, args={'value': other})
    def __gt__(self, other):
        return _MockColumn(f'{self._name} > ...', op='pred_gt', src=self, args={'value': other})
    def __le__(self, other):
        return _MockColumn(f'{self._name} <= ...', op='pred_le', src=self, args={'value': other})
    def __lt__(self, other):
        return _MockColumn(f'{self._name} < ...', op='pred_lt', src=self, args={'value': other})
    def __eq__(self, other):
        return _MockColumn(f'{self._name} = ...', op='pred_eq', src=self, args={'value': other})
    def __ne__(self, other):
        return _MockColumn(f'{self._name} != ...', op='pred_ne', src=self, args={'value': other})
    def __and__(self, other):
        return _MockColumn('AND', op='pred_and', src=[self, other])
    def __or__(self, other):
        return _MockColumn('OR', op='pred_or', src=[self, other])
    def __invert__(self):
        return _MockColumn('NOT', op='pred_not', src=self)
    def between(self, lo, hi):
        return _MockColumn(f'{self._name} BETWEEN ...', op='pred_between', src=self, args={'lo': lo, 'hi': hi})
    # __eq__ returning a non-bool would normally break hashing; pin a stable
    # identity-based hash so MockColumns can still appear in sets/dicts.
    def __hash__(self):
        return id(self)


def _to_dt(s):
    """Coerce a Series of strings / dates / timestamps into a pandas
    datetime64[ns] Series. Errors become NaT so downstream date math
    degrades gracefully on bad data."""
    if hasattr(s, 'dtype') and 'datetime' in str(s.dtype):
        return s
    return pd.to_datetime(s, errors='coerce')


def _resolve_to_series(pdf, expr):
    """
    Coerce a literal / column ref / arith / when / lit / date-fn / cast /
    window-agg expression into a pandas Series aligned to pdf. Used by the
    predicate compiler (filter), withColumn, and agg evaluator.

    Aggregation ops (sum/avg/...) are NOT resolved here — they collapse a
    Series into a scalar, which is the agg evaluator's job. Returning None
    signals "can't resolve this in row context".
    """
    if isinstance(expr, _MockColumn):
        op = expr._op
        if op is None:
            if expr._name in pdf.columns:
                return pdf[expr._name]
            # Bare ref to a non-existent column — treat as null series.
            return pd.Series([None] * len(pdf), index=pdf.index)
        if op == 'lit':
            return pd.Series([expr._args.get('value')] * len(pdf), index=pdf.index)
        if op == 'when':
            return _eval_when_series(pdf, expr)
        if op in ('arith_add', 'arith_sub', 'arith_mul', 'arith_div',
                  'arith_mod', 'arith_floordiv'):
            a, b = expr._src
            s_a = _resolve_to_series(pdf, a)
            s_b = _resolve_to_series(pdf, b)
            if s_a is None or s_b is None:
                return None
            try:
                if op == 'arith_add': return s_a + s_b
                if op == 'arith_sub': return s_a - s_b
                if op == 'arith_mul': return s_a * s_b
                if op == 'arith_div': return s_a / s_b
                if op == 'arith_mod': return s_a % s_b
                if op == 'arith_floordiv': return s_a // s_b
            except Exception:
                return None
        # ── Date / time functions ─────────────────────────────────────────
        if op == 'date_trunc':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            unit = (expr._args.get('unit') or 'day').lower()
            try:
                dt = _to_dt(inner)
                if unit == 'year':    return dt.dt.to_period('Y').dt.to_timestamp()
                if unit == 'quarter': return dt.dt.to_period('Q').dt.to_timestamp()
                if unit == 'month':   return dt.dt.to_period('M').dt.to_timestamp()
                if unit == 'week':    return dt.dt.to_period('W-MON').dt.start_time
                if unit == 'day':     return dt.dt.normalize()
                if unit == 'hour':    return dt.dt.floor('h')
                if unit == 'minute':  return dt.dt.floor('min')
                if unit == 'second':  return dt.dt.floor('s')
                return dt.dt.normalize()
            except Exception:
                return None
        if op == 'date_format':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            fmt_spark = expr._args.get('fmt', 'yyyy-MM-dd')
            # Translate Spark/Java date format → strftime in a single
            # pass so that one replacement's output (e.g. %d) doesn't get
            # re-matched by a later token (e.g. d → %-d). Order longest
            # first so 'yyyy' wins over 'yy', etc.
            import re as _re
            _SPARK_TO_STRFTIME = {
                'yyyy': '%Y', 'yy': '%y',
                'MM': '%m', 'M': '%-m',
                'dd': '%d', 'd': '%-d',
                'HH': '%H', 'H': '%-H',
                'mm': '%M', 'ss': '%S',
            }
            _PATTERN = _re.compile('|'.join(
                _re.escape(k) for k in sorted(_SPARK_TO_STRFTIME, key=len, reverse=True)
            ))
            fmt = _PATTERN.sub(lambda m: _SPARK_TO_STRFTIME[m.group(0)], fmt_spark)
            try:
                return _to_dt(inner).dt.strftime(fmt)
            except Exception:
                return None
        if op in ('year', 'month', 'quarter', 'weekofyear',
                  'dayofmonth', 'dayofweek', 'dayofyear', 'hour',
                  'minute', 'second'):
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                dt = _to_dt(inner)
                if op == 'year':       return dt.dt.year
                if op == 'month':      return dt.dt.month
                if op == 'quarter':    return dt.dt.quarter
                if op == 'weekofyear': return dt.dt.isocalendar().week.astype('int64')
                if op == 'dayofmonth': return dt.dt.day
                # Spark dayofweek: 1=Sunday..7=Saturday. pandas: 0=Mon..6=Sun.
                if op == 'dayofweek':  return ((dt.dt.dayofweek + 1) % 7) + 1
                if op == 'dayofyear':  return dt.dt.dayofyear
                if op == 'hour':       return dt.dt.hour
                if op == 'minute':     return dt.dt.minute
                if op == 'second':     return dt.dt.second
            except Exception:
                return None
        if op == 'datediff':
            end_s = _resolve_to_series(pdf, expr._args.get('end'))
            start_s = _resolve_to_series(pdf, expr._args.get('start'))
            if end_s is None or start_s is None:
                return None
            try:
                return (_to_dt(end_s) - _to_dt(start_s)).dt.days.astype('int64')
            except Exception:
                return None
        if op == 'date_add':
            inner = _resolve_to_series(pdf, expr._src)
            n = expr._args.get('n', 0)
            if inner is None:
                return None
            try:
                return _to_dt(inner) + pd.Timedelta(days=int(n))
            except Exception:
                return None
        if op == 'date_sub':
            inner = _resolve_to_series(pdf, expr._src)
            n = expr._args.get('n', 0)
            if inner is None:
                return None
            try:
                return _to_dt(inner) - pd.Timedelta(days=int(n))
            except Exception:
                return None
        if op == 'from_utc_timestamp':
            inner = _resolve_to_series(pdf, expr._src)
            tz = expr._args.get('tz', 'UTC')
            if isinstance(tz, _MockColumn):
                tz = _resolve_to_series(pdf, tz)
            if inner is None:
                return None
            try:
                base = _to_dt(inner)
                # Strip tz then apply per-row tz when tz is a Series.
                if isinstance(tz, pd.Series):
                    out = pd.Series(pd.NaT, index=base.index, dtype='datetime64[ns]')
                    for tz_name, idx in tz.groupby(tz).groups.items():
                        try:
                            converted = (base.loc[idx]
                                         .dt.tz_localize('UTC')
                                         .dt.tz_convert(str(tz_name))
                                         .dt.tz_localize(None))
                            out.loc[idx] = converted
                        except Exception:
                            pass
                    return out
                return (base.dt.tz_localize('UTC')
                            .dt.tz_convert(str(tz))
                            .dt.tz_localize(None))
            except Exception:
                return base
        if op == 'to_utc_timestamp':
            inner = _resolve_to_series(pdf, expr._src)
            tz = expr._args.get('tz', 'UTC')
            if isinstance(tz, _MockColumn):
                tz = _resolve_to_series(pdf, tz)
            if inner is None:
                return None
            try:
                base = _to_dt(inner)
                if isinstance(tz, pd.Series):
                    out = pd.Series(pd.NaT, index=base.index, dtype='datetime64[ns]')
                    for tz_name, idx in tz.groupby(tz).groups.items():
                        try:
                            converted = (base.loc[idx]
                                         .dt.tz_localize(str(tz_name))
                                         .dt.tz_convert('UTC')
                                         .dt.tz_localize(None))
                            out.loc[idx] = converted
                        except Exception:
                            pass
                    return out
                return (base.dt.tz_localize(str(tz))
                            .dt.tz_convert('UTC')
                            .dt.tz_localize(None))
            except Exception:
                return base
        if op == 'to_date':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                return _to_dt(inner).dt.normalize()
            except Exception:
                return None
        if op == 'to_timestamp':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                return _to_dt(inner)
            except Exception:
                return None
        # ── Cast ───────────────────────────────────────────────────────────
        if op == 'cast':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            tgt = (expr._args.get('to') or 'string').lower()
            try:
                if tgt in ('int', 'integer'):
                    return pd.to_numeric(inner, errors='coerce').astype('Int64')
                if tgt == 'long':
                    return pd.to_numeric(inner, errors='coerce').astype('Int64')
                if tgt in ('double', 'float'):
                    return pd.to_numeric(inner, errors='coerce').astype('float64')
                if tgt == 'string':
                    return inner.astype(str)
                if tgt == 'date':
                    return _to_dt(inner).dt.normalize()
                if tgt == 'timestamp':
                    return _to_dt(inner)
                if tgt == 'boolean':
                    return inner.astype(bool)
            except Exception:
                return inner
            return inner
        # ── Math / hash / abs ─────────────────────────────────────────────
        if op == 'abs':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                return pd.to_numeric(inner, errors='coerce').abs()
            except Exception:
                return inner
        if op == 'floor':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                import numpy as _np
                return _np.floor(pd.to_numeric(inner, errors='coerce'))
            except Exception:
                return inner
        if op == 'ceil':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                import numpy as _np
                return _np.ceil(pd.to_numeric(inner, errors='coerce'))
            except Exception:
                return inner
        if op == 'hash':
            inner = _resolve_to_series(pdf, expr._src)
            if inner is None:
                return None
            try:
                # Spark's hash() is Murmur3 (positive + negative). For a
                # mock used to teach salting we just need a deterministic
                # integer per value — Python's hash() suffices.
                return inner.apply(lambda v: hash(v) if v is not None else 0).astype('int64')
            except Exception:
                return inner
        # ── round (row-wise) — when scale wraps a row-resolvable expr. ───
        if op == 'round' and not isinstance(expr._src, str):
            inner = _resolve_to_series(pdf, expr._src)
            scale = int(expr._args.get('scale', 0))
            if inner is not None:
                try:
                    return pd.to_numeric(inner, errors='coerce').round(scale)
                except Exception:
                    pass
        # ── Window aggregation ────────────────────────────────────────────
        if op == 'window_agg':
            return _eval_window_agg(pdf, expr)
        # Predicate ops resolve to a boolean mask Series.
        if op and op.startswith('pred_'):
            return _build_predicate_mask(pdf, expr)
        # Aggregation ops aren't row-resolvable.
        return None
    if isinstance(expr, str):
        if expr in pdf.columns:
            return pdf[expr]
        return pd.Series([expr] * len(pdf), index=pdf.index)
    if expr is None:
        return pd.Series([None] * len(pdf), index=pdf.index)
    return pd.Series([expr] * len(pdf), index=pdf.index)


def _eval_window_agg(pdf, col):
    """Evaluate a windowed aggregation: agg_or_rank.over(window_spec)."""
    spec = col._args.get('spec')
    inner = col._args.get('inner')  # a _MockColumn carrying agg or rank op
    if spec is None or inner is None:
        return pd.Series([None] * len(pdf), index=pdf.index)

    parts = [_col_arg_to_name(c) for c in spec._parts]
    parts = [p for p in parts if p in pdf.columns]
    orders = spec._orders
    frame = spec._frame  # ('rows', start, end) or ('range', start, end) or None

    # Build sort spec — supports col / 'col' / desc(col) / asc(col)
    sort_cols = []
    sort_asc = []
    for o in orders:
        if isinstance(o, _MockColumn) and o._op == 'sort_desc':
            sort_cols.append(o._src)
            sort_asc.append(False)
        elif isinstance(o, _MockColumn) and o._op == 'sort_asc':
            sort_cols.append(o._src)
            sort_asc.append(True)
        else:
            sort_cols.append(_col_arg_to_name(o))
            sort_asc.append(True)
    sort_cols = [c for c in sort_cols if c in pdf.columns]
    sort_asc = sort_asc[:len(sort_cols)]

    # Sort the frame (preserving original index so we can restore order).
    work = pdf.copy()
    work['__orig_idx'] = range(len(work))
    if sort_cols:
        work = work.sort_values(sort_cols, ascending=sort_asc, kind='mergesort')

    inner_op = inner._op
    out_series = pd.Series([None] * len(work), index=work.index, dtype=object)

    def _group_iter():
        if parts:
            for _, g in work.groupby(parts, dropna=False, sort=False):
                yield g
        else:
            yield work

    for group in _group_iter():
        result_chunk = None
        if inner_op in ('row_number',):
            result_chunk = pd.Series(range(1, len(group) + 1), index=group.index)
        elif inner_op == 'rank':
            # Rank by the ORDER BY columns: ties get same rank, gaps after.
            if sort_cols:
                ranks = group[sort_cols].apply(tuple, axis=1)
                rank_series = ranks.rank(method='min').astype('int64')
                result_chunk = rank_series
            else:
                result_chunk = pd.Series(range(1, len(group) + 1), index=group.index)
        elif inner_op == 'dense_rank':
            if sort_cols:
                ranks = group[sort_cols].apply(tuple, axis=1)
                rank_series = ranks.rank(method='dense').astype('int64')
                result_chunk = rank_series
            else:
                result_chunk = pd.Series(range(1, len(group) + 1), index=group.index)
        elif inner_op == 'percent_rank':
            if len(group) <= 1:
                result_chunk = pd.Series([0.0] * len(group), index=group.index)
            else:
                ranks = group[sort_cols].apply(tuple, axis=1).rank(method='min')
                result_chunk = (ranks - 1) / (len(group) - 1)
        elif inner_op == 'cume_dist':
            if sort_cols:
                ranks = group[sort_cols].apply(tuple, axis=1).rank(method='max')
                result_chunk = ranks / len(group)
            else:
                result_chunk = pd.Series([1.0] * len(group), index=group.index)
        elif inner_op == 'lag' or inner_op == 'lead':
            src_name = inner._src
            if src_name in group.columns:
                offset = inner._args.get('offset', 1)
                shift = offset if inner_op == 'lag' else -offset
                result_chunk = group[src_name].shift(shift)
                default = inner._args.get('default')
                if default is not None:
                    result_chunk = result_chunk.fillna(default)
            else:
                result_chunk = pd.Series([None] * len(group), index=group.index)
        elif inner_op in ('sum', 'avg', 'mean', 'min', 'max', 'count'):
            src_name = inner._src
            if inner_op == 'count' and src_name in (None, '*'):
                src_series = pd.Series([1] * len(group), index=group.index)
            elif src_name in group.columns:
                if inner_op == 'count':
                    src_series = group[src_name].notna().astype(int)
                else:
                    src_series = pd.to_numeric(group[src_name], errors='coerce')
            else:
                src_series = pd.Series([0] * len(group), index=group.index)

            if frame is not None:
                kind, start, end = frame
                # Rolling window only supported for rows-based frames.
                # Translate (start, end) into a pandas .rolling spec.
                LARGE = 2**30
                lo = -LARGE if start <= -LARGE else start
                hi = LARGE if end >= LARGE else end
                if hi == LARGE and lo == -LARGE:
                    window_size = len(group)
                    closed = 'both'
                else:
                    window_size = max(1, hi - lo + 1)
                    closed = 'both'
                # Shift the result to align with the requested frame end.
                # For rowsBetween(-N, 0) we want trailing N+1 rows ending at
                # current — pandas rolling does exactly that with window=N+1.
                # For rowsBetween(-N, M) where M > 0, we shift back by M.
                rolled = src_series.rolling(window=window_size, min_periods=1)
                if inner_op == 'sum':   chunk = rolled.sum()
                elif inner_op in ('avg', 'mean'): chunk = rolled.mean()
                elif inner_op == 'min': chunk = rolled.min()
                elif inner_op == 'max': chunk = rolled.max()
                else:                   chunk = rolled.sum()  # count via sum-of-1s
                if hi > 0 and hi < LARGE:
                    chunk = chunk.shift(-hi)
                result_chunk = chunk
            else:
                # No frame → unbounded preceding to current row when ORDER BY
                # is present; full partition aggregate otherwise.
                if sort_cols:
                    if inner_op == 'sum':   result_chunk = src_series.cumsum()
                    elif inner_op in ('avg', 'mean'):
                        result_chunk = src_series.expanding().mean()
                    elif inner_op == 'min': result_chunk = src_series.cummin()
                    elif inner_op == 'max': result_chunk = src_series.cummax()
                    else:                   result_chunk = src_series.cumsum()
                else:
                    if inner_op == 'sum':   v = src_series.sum()
                    elif inner_op in ('avg', 'mean'): v = src_series.mean()
                    elif inner_op == 'min': v = src_series.min()
                    elif inner_op == 'max': v = src_series.max()
                    else:                   v = src_series.sum()
                    result_chunk = pd.Series([v] * len(group), index=group.index)

        if result_chunk is not None:
            out_series.loc[group.index] = result_chunk

    # Coerce the result to a sane dtype so the printed schema reflects the
    # output type (long for ranks/counts, double for sum/avg, etc.) rather
    # than the object-dtype default we initialised with.
    if inner_op in ('row_number', 'rank', 'dense_rank', 'ntile'):
        out_series = pd.to_numeric(out_series, errors='coerce').astype('Int64')
    elif inner_op == 'count':
        out_series = pd.to_numeric(out_series, errors='coerce').astype('Int64')
    elif inner_op in ('sum', 'avg', 'mean', 'min', 'max', 'percent_rank',
                      'cume_dist', 'lag', 'lead'):
        try:
            out_series = pd.to_numeric(out_series, errors='ignore')
        except Exception:
            pass

    # Restore the original row order so later operations align with pdf.
    work['__win_value'] = out_series
    work = work.sort_values('__orig_idx').reset_index(drop=True)
    return work['__win_value']


def _eval_when_series(pdf, col):
    """Evaluate a when()...when()...otherwise() chain into a Series."""
    result = pd.Series([None] * len(pdf), index=pdf.index, dtype=object)
    matched = pd.Series([False] * len(pdf), index=pdf.index)
    for cond, val_expr in col._args.get('conditions', []):
        try:
            cond_mask = _build_predicate_mask(pdf, cond)
        except Exception:
            cond_mask = pd.Series([False] * len(pdf), index=pdf.index)
        active = cond_mask & ~matched
        val_series = _resolve_to_series(pdf, val_expr)
        if val_series is not None:
            result.loc[active] = val_series.loc[active]
        matched = matched | active
    otherwise = col._args.get('otherwise')
    if otherwise is not None:
        val_series = _resolve_to_series(pdf, otherwise)
        if val_series is not None:
            result.loc[~matched] = val_series.loc[~matched]
    # Promote dtype if the values are uniformly numeric — keeps downstream
    # aggregations like sum() working without coercion.
    try:
        as_numeric = pd.to_numeric(result, errors='coerce')
        if as_numeric.notna().sum() == result.notna().sum():
            return as_numeric
    except Exception:
        pass
    return result


def _build_predicate_mask(pdf, col):
    """Compile a _MockColumn predicate tree into a boolean Series aligned to
    pdf. The lhs of a comparison is resolved via _resolve_to_series so
    arithmetic and 'when' expressions work on the left-hand side, not just
    bare column refs. Anything we can't interpret degrades to 'match all'
    so exotic predicates don't crash student code."""
    if not isinstance(col, _MockColumn):
        return pd.Series([True]*len(pdf), index=pdf.index)
    op = col._op
    if op == 'pred_and':
        a, b = col._src
        return _build_predicate_mask(pdf, a) & _build_predicate_mask(pdf, b)
    if op == 'pred_or':
        a, b = col._src
        return _build_predicate_mask(pdf, a) | _build_predicate_mask(pdf, b)
    if op == 'pred_not':
        return ~_build_predicate_mask(pdf, col._src)
    # Unary predicate: lhs is col._src — resolve it (may be a bare column,
    # arith expression, when, etc).
    series = _resolve_to_series(pdf, col._src)
    if series is None:
        return pd.Series([True]*len(pdf), index=pdf.index)
    rhs = col._args.get('value')
    rhs_series = _resolve_to_series(pdf, rhs) if rhs is not None else None
    rhs_resolved = rhs_series if rhs_series is not None else rhs
    if op == 'pred_gt':
        return series > rhs_resolved
    if op == 'pred_ge':
        return series >= rhs_resolved
    if op == 'pred_lt':
        return series < rhs_resolved
    if op == 'pred_le':
        return series <= rhs_resolved
    if op == 'pred_eq':
        return series == rhs_resolved
    if op == 'pred_ne':
        return series != rhs_resolved
    if op == 'pred_isnull':
        return series.isna()
    if op == 'pred_notnull':
        return series.notna()
    if op == 'pred_between':
        lo = _resolve_to_series(pdf, col._args.get('lo'))
        hi = _resolve_to_series(pdf, col._args.get('hi'))
        if lo is None: lo = col._args.get('lo')
        if hi is None: hi = col._args.get('hi')
        return (series >= lo) & (series <= hi)
    if op == 'pred_isin':
        return series.isin(col._args.get('values', []))
    return pd.Series([True]*len(pdf), index=pdf.index)


def _eval_agg_column(pdf, col):
    """Evaluate a _MockColumn aggregation expression against a pandas DF.
    Returns the scalar result. The src may be either a column-name string
    (legacy/simple case) or a _MockColumn carrying an arith/when/lit
    expression — _resolve_to_series handles both."""
    if not hasattr(col, '_op') or col._op is None:
        return None
    op = col._op

    def _src_series():
        """Resolve col._src to a pandas Series — None if not resolvable."""
        s = col._src
        if isinstance(s, str):
            return pdf[s] if s in pdf.columns else None
        return _resolve_to_series(pdf, s)

    # Aggregations on a missing column: real Spark raises
    # AnalysisException. Returning 0/None silently let students bypass
    # validation by aggregating the wrong column AND happening to
    # hardcode the right answer. None propagates through the validator
    # as a schema/value mismatch, which is the desired feedback.
    if op == 'sum':
        s = _src_series()
        if s is None:
            return None
        return float(pd.to_numeric(s, errors='coerce').dropna().sum())
    if op in ('avg', 'mean'):
        s = _src_series()
        if s is None:
            return None
        s2 = pd.to_numeric(s, errors='coerce').dropna()
        return float(s2.mean()) if len(s2) else 0.0
    if op == 'min':
        s = _src_series()
        if s is None:
            return None
        s2 = s.dropna()
        return s2.min() if len(s2) else None
    if op == 'max':
        s = _src_series()
        if s is None:
            return None
        s2 = s.dropna()
        return s2.max() if len(s2) else None
    if op == 'count':
        if col._src in (None, '*'):
            return int(len(pdf))
        s = _src_series()
        if s is None:
            return None
        return int(s.notna().sum())
    if op == 'count_distinct':
        if isinstance(col._src, list):
            cols = [c for c in col._src if c in pdf.columns]
            if not cols:
                return None
            return int(pdf[cols].dropna().drop_duplicates().shape[0])
        s = _src_series()
        if s is None:
            return None
        return int(s.dropna().nunique())
    if op == 'first':
        s = _src_series()
        if s is None:
            return None
        if col._args.get('ignorenulls'):
            s = s.dropna()
        return s.iloc[0] if len(s) else None
    if op == 'last':
        s = _src_series()
        if s is None:
            return None
        if col._args.get('ignorenulls'):
            s = s.dropna()
        return s.iloc[-1] if len(s) else None
    if op == 'round':
        # round wraps another aggregation expression — recurse.
        inner_val = _eval_agg_column(pdf, col._src)
        scale = int(col._args.get('scale', 0))
        if inner_val is None:
            return None
        try:
            return round(float(inner_val), scale)
        except (TypeError, ValueError):
            return inner_val
    if op == 'lit':
        return col._args.get('value')
    return 0

class _MockDF:
    def __init__(self, pdf, _schema=None):
        self._pdf = pdf.copy()
        self._schema = _schema or self._build_schema(pdf)
    @property
    def columns(self):
        return list(self._pdf.columns)
    @property
    def schema(self):
        return self._schema
    @property
    def dtypes(self):
        return [(c, str(self._pdf[c].dtype)) for c in self._pdf.columns]
    def _build_schema(self, pdf):
        type_map = {
            'object': 'StringType()', 'string': 'StringType()',
            'float64': 'DoubleType()', 'float32': 'FloatType()',
            'int64': 'LongType()', 'int32': 'IntegerType()',
            # pandas extension dtypes (nullable) — written with capital I/U
            # in repr; normalise via .lower() before the lookup.
            'int8': 'IntegerType()', 'int16': 'IntegerType()',
            'uint8': 'IntegerType()', 'uint16': 'IntegerType()',
            'uint32': 'LongType()', 'uint64': 'LongType()',
            'bool': 'BooleanType()', 'boolean': 'BooleanType()',
            'datetime64[ns]': 'DateType()',
        }
        fields = []
        for c in pdf.columns:
            dt = str(pdf[c].dtype).lower()
            spark_type = type_map.get(dt, 'StringType()')
            # Heuristic: if column dtype is object, infer DateType when every
            # non-null value is either a python date object OR an ISO date
            # string ("YYYY-MM-DD"). CSV-loaded date columns arrive as
            # strings until parsed, so this keeps schema parity with the
            # validator's expectation.
            if spark_type == 'StringType()':
                non_null = pdf[c].dropna()
                if len(non_null) > 0:
                    all_date_objs = all(
                        hasattr(v, 'year') and not hasattr(v, 'hour') for v in non_null
                    )
                    all_iso_strings = all(
                        isinstance(v, str) and bool(_ISO_DATE_RE.match(v)) for v in non_null
                    )
                    if all_date_objs or all_iso_strings:
                        spark_type = 'DateType()'
            nullable = bool(pdf[c].isna().any())
            fields.append(_MockStructField(c, spark_type, nullable))
        return _MockStructType(fields)
    def show(self, n=20, truncate=True):
        # Render in Spark's pipe-table format so the output is parseable by
        # the auto-validator (which expects +---+, |col|, +---+, rows, +---+).
        df = self._pdf.head(n)
        cols = [str(c) for c in df.columns]
        if not cols:
            print("++")
            print("||")
            print("++")
            return
        def _fmt(v):
            if v is None:
                return 'null'
            try:
                if pd.isna(v):
                    return 'null'
            except (TypeError, ValueError):
                pass
            # Date / Timestamp → ISO yyyy-mm-dd (matches Spark show for DateType).
            # Midnight Timestamps (the result of cast('date') / date_trunc) are
            # treated as dates so they don't print as "2026-01-01 00:00:00".
            if hasattr(v, 'strftime'):
                try:
                    cls = v.__class__.__name__
                    if cls == 'date' and not hasattr(v, 'hour'):
                        return v.strftime('%Y-%m-%d')
                    if cls in ('Timestamp', 'datetime'):
                        h = getattr(v, 'hour', 0); m = getattr(v, 'minute', 0); s = getattr(v, 'second', 0)
                        if h == 0 and m == 0 and s == 0:
                            return v.strftime('%Y-%m-%d')
                        return v.strftime('%Y-%m-%d %H:%M:%S')
                    return v.strftime('%Y-%m-%d')
                except Exception:
                    return str(v)
            if isinstance(v, float):
                if math.isnan(v):
                    return 'NaN'
                if math.isinf(v):
                    return 'Infinity' if v > 0 else '-Infinity'
                # Use repr — shortest round-trip representation. '%g' truncates
                # to 6 sig figs (58892.6783 → "58892.7"), which falsely fails
                # the validator's tolerance check downstream.
                return repr(v)
            return str(v)
        cells = [[_fmt(v) for v in df[c]] for c in cols]
        widths = [max(len(c), max((len(cell) for cell in col_cells), default=0)) for c, col_cells in zip(cols, cells)]
        border = '+' + '+'.join('-' * (w + 2) for w in widths) + '+'
        header = '|' + '|'.join(' ' + c.ljust(w) + ' ' for c, w in zip(cols, widths)) + '|'
        print(border)
        print(header)
        print(border)
        for i in range(len(df)):
            row = '|' + '|'.join(' ' + cells[j][i].rjust(widths[j]) + ' ' for j in range(len(cols))) + '|'
            print(row)
        print(border)
        # Spark prints the row-truncation hint when n < total rows
        if len(self._pdf) > n:
            print(f"only showing top {n} rows")
    def count(self):
        return len(self._pdf)
    def printSchema(self):
        print(self._schema.treeString())
    def describe(self, *cols):
        target = self._pdf[list(cols)] if cols else self._pdf
        return _MockDF(target.describe().reset_index().rename(columns={'index': 'summary'}))
    def select(self, *cols):
        names = [c._name if hasattr(c, '_name') else c for c in cols]
        existing = [n for n in names if n in self._pdf.columns]
        missing = [n for n in names if n not in self._pdf.columns]
        pdf = self._pdf[existing].copy() if existing else pd.DataFrame(index=self._pdf.index)
        for m in missing:
            pdf[m] = None
        pdf = pdf[names]
        return _MockDF(pdf)
    def filter(self, cond):
        # Compile the predicate against the underlying pandas DataFrame.
        # When the predicate isn't interpretable, _build_predicate_mask
        # returns "match all" so we degrade to the previous no-op behavior.
        if cond is None:
            return self
        try:
            mask = _build_predicate_mask(self._pdf, cond)
            filtered = self._pdf[mask].reset_index(drop=True)
            return _MockDF(filtered)
        except Exception:
            return self
    def where(self, cond):
        return self.filter(cond)
    def agg(self, *exprs):
        # Bare DataFrame aggregation (no preceding groupBy). Each expression
        # is evaluated against the underlying pandas DF — enabling auto-
        # validation against the task's expectedOutput spec.
        if not exprs:
            return _MockDF(pd.DataFrame())
        row = {}
        for e in exprs:
            name = getattr(e, '_name', 'agg')
            row[name] = _eval_agg_column(self._pdf, e)
        return _MockDF(pd.DataFrame([row]))
    def withColumnRenamed(self, old, new):
        pdf = self._pdf.rename(columns={old: new})
        return _MockDF(pdf)
    def withColumn(self, name, expr):
        pdf = self._pdf.copy()
        # Evaluate the expression against the underlying pandas DF so
        # date_trunc/cast/arith/window-agg/etc. all produce real values.
        # Falls back to a bare column ref for the simple case where expr
        # is a _MockColumn whose _name already matches a column.
        if isinstance(expr, _MockColumn):
            series = _resolve_to_series(pdf, expr)
            if series is not None:
                pdf[name] = series.values if hasattr(series, 'values') else series
            elif expr._name in pdf.columns:
                pdf[name] = pdf[expr._name]
            else:
                pdf[name] = None
        elif isinstance(expr, str) and expr in pdf.columns:
            pdf[name] = pdf[expr]
        else:
            pdf[name] = expr
        return _MockDF(pdf)
    def drop(self, *cols):
        names = [c._name if hasattr(c, '_name') else c for c in cols]
        return _MockDF(self._pdf.drop(columns=names, errors='ignore'))
    def orderBy(self, *cols, **kw):
        # Sort by each column in order; supports col / 'col' / desc(col) /
        # asc(col). The optional ascending= kw mirrors PySpark's API.
        if not cols:
            return self
        sort_by = []
        ascending = []
        for c in cols:
            if isinstance(c, _MockColumn) and c._op == 'sort_desc':
                sort_by.append(c._src); ascending.append(False)
            elif isinstance(c, _MockColumn) and c._op == 'sort_asc':
                sort_by.append(c._src); ascending.append(True)
            else:
                sort_by.append(c._name if hasattr(c, '_name') else c)
                ascending.append(True)
        # Honor a global ascending= override when provided as a list/bool.
        asc_kw = kw.get('ascending')
        if isinstance(asc_kw, bool):
            ascending = [asc_kw] * len(sort_by)
        elif isinstance(asc_kw, (list, tuple)):
            ascending = [bool(a) for a in asc_kw][:len(sort_by)]
        sort_by = [c for c in sort_by if c in self._pdf.columns]
        if not sort_by:
            return self
        try:
            sorted_pdf = self._pdf.sort_values(
                sort_by, ascending=ascending[:len(sort_by)], kind='mergesort'
            ).reset_index(drop=True)
            return _MockDF(sorted_pdf)
        except Exception:
            return self
    def sort(self, *cols, **kw):
        return self.orderBy(*cols, **kw)
    def crossJoin(self, other):
        left = self._pdf.assign(__cj_key=1)
        right = other._pdf.assign(__cj_key=1)
        merged = left.merge(right, on='__cj_key').drop(columns=['__cj_key'])
        return _MockDF(merged)
    def union(self, other):
        # Spark's union() is positional (column names from the left side win).
        # Reset the right side's columns to match, then concat.
        right_pdf = other._pdf.copy()
        right_pdf.columns = self._pdf.columns[:len(right_pdf.columns)]
        merged = pd.concat([self._pdf, right_pdf], ignore_index=True)
        return _MockDF(merged)
    def unionAll(self, other):
        return self.union(other)
    def unionByName(self, other, allowMissingColumns=False):
        # Match by column NAME — fill missing with None when explicitly allowed.
        if allowMissingColumns:
            all_cols = list(self._pdf.columns) + [
                c for c in other._pdf.columns if c not in self._pdf.columns
            ]
            left = self._pdf.reindex(columns=all_cols)
            right = other._pdf.reindex(columns=all_cols)
            merged = pd.concat([left, right], ignore_index=True)
        else:
            cols = list(self._pdf.columns)
            right = other._pdf[cols]
            merged = pd.concat([self._pdf, right], ignore_index=True)
        return _MockDF(merged)
    def groupBy(self, *cols):
        return _MockGrouped(self._pdf, cols)
    def limit(self, n):
        return _MockDF(self._pdf.head(n))
    def collect(self):
        return [_MockRow(dict(row)) for _, row in self._pdf.iterrows()]
    def head(self, n=1):
        rows = self._pdf.head(n)
        return [_MockRow(dict(r)) for _, r in rows.iterrows()]
    def take(self, n):
        return self.head(n)
    def toPandas(self):
        return self._pdf.copy()
    def explain(self, extended=False):
        print("== Physical Plan ==")
        print("*(mock) Scan pandas DataFrame")
    def cache(self):
        return self
    def persist(self, *a):
        return self
    def unpersist(self, *a):
        return self
    def repartition(self, n, *cols):
        return self
    def coalesce(self, n):
        return self
    def distinct(self):
        return _MockDF(self._pdf.drop_duplicates())
    def dropDuplicates(self, subset=None):
        return _MockDF(self._pdf.drop_duplicates(subset=subset))
    def union(self, other):
        return _MockDF(pd.concat([self._pdf, other._pdf], ignore_index=True))
    def join(self, other, on=None, how='inner'):
        if on is not None and hasattr(on, '_name'):
            # MockColumn from df.col == df.col expression — find common columns
            common = list(set(self._pdf.columns) & set(other._pdf.columns))
            on = common if common else None
        try:
            return _MockDF(pd.merge(self._pdf, other._pdf, on=on, how=how))
        except Exception:
            return _MockDF(pd.concat([self._pdf, other._pdf.reindex(self._pdf.index)], axis=1))
    def createOrReplaceTempView(self, name):
        pass
    def na(self):
        return self
    @property
    def _jdf(self):
        return _MockJDF(self._schema)
    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        return _MockColumn(name)
    def __repr__(self):
        return f"DataFrame[{', '.join(self.columns)}]"

class _MockJDF:
    def __init__(self, schema):
        self._schema = schema
    def schema(self):
        return self._schema

class _MockRow:
    def __init__(self, data):
        self._data = data
    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        return self._data.get(name)
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self._data.values())[key]
        return self._data[key]
    def asDict(self):
        return dict(self._data)
    def __repr__(self):
        items = ', '.join(f"{k}={v!r}" for k, v in self._data.items())
        return f"Row({items})"

class _MockGrouped:
    def __init__(self, pdf, cols, pivot_col=None, pivot_values=None):
        self._pdf = pdf
        self._cols = [c._name if hasattr(c, '_name') else c for c in cols]
        # When set, the next .agg() emits one column per pivot_value rather
        # than one column per agg expression. PySpark's pivot semantics.
        self._pivot_col = pivot_col
        self._pivot_values = pivot_values
    def pivot(self, col, values=None):
        return _MockGrouped(self._pdf, self._cols,
                            pivot_col=col, pivot_values=values)
    def count(self):
        r = self._pdf.groupby(self._cols).size().reset_index(name='count')
        return _MockDF(r)
    def sum(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].sum().reset_index()
        return _MockDF(r)
    def avg(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].mean().reset_index()
        return _MockDF(r)
    def mean(self, *cols):
        return self.avg(*cols)
    def max(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].max().reset_index()
        return _MockDF(r)
    def min(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].min().reset_index()
        return _MockDF(r)
    def agg(self, *exprs):
        # Multi-expression aggregation against pandas groupby. Each
        # _MockColumn carries an op + source column, so we evaluate it
        # per group and assemble a Spark-shaped result frame. When a
        # .pivot() preceded this call, emit one column per pivot value
        # instead (matching Spark's pivot semantics).
        keys = self._cols
        if not exprs:
            agg_names = []
        else:
            agg_names = [getattr(e, '_name', 'agg') for e in exprs]

        if self._pivot_col is not None:
            # Determine pivot values — explicit when caller passed them,
            # otherwise discover from the data (sorted, like Spark does).
            pcol = self._pivot_col if isinstance(self._pivot_col, str) else self._pivot_col
            if self._pivot_values:
                pvals = list(self._pivot_values)
            else:
                pvals = sorted([v for v in self._pdf[pcol].dropna().unique()])
            results = []
            iter_groups = (self._pdf.groupby(list(keys), dropna=False) if keys
                           else [((), self._pdf)])
            for key_vals, group in iter_groups:
                if keys and not isinstance(key_vals, tuple):
                    key_vals = (key_vals,)
                row = dict(zip(keys, key_vals)) if keys else {}
                for pv in pvals:
                    sub = group[group[pcol] == pv]
                    if len(exprs) == 1:
                        # Single agg → column name is the pivot value.
                        row[str(pv)] = _eval_agg_column(sub, exprs[0])
                    else:
                        for e in exprs:
                            row[f'{pv}_{getattr(e, "_name", "agg")}'] = _eval_agg_column(sub, e)
                results.append(row)
            col_order = list(keys) + (
                [str(pv) for pv in pvals] if len(exprs) == 1
                else [f'{pv}_{getattr(e, "_name", "agg")}' for pv in pvals for e in exprs]
            )
            return _MockDF(pd.DataFrame(results, columns=col_order))

        if not keys:
            # No grouping → identical to df.agg
            row = {}
            for e in exprs:
                row[getattr(e, '_name', 'agg')] = _eval_agg_column(self._pdf, e)
            return _MockDF(pd.DataFrame([row]))

        # Compute per-group values. Iterate explicitly so each agg can be
        # evaluated against the group's pandas DataFrame using
        # _eval_agg_column (consistent with bare-DF agg semantics).
        results = []
        for key_vals, group in self._pdf.groupby(list(keys), dropna=False):
            if not isinstance(key_vals, tuple):
                key_vals = (key_vals,)
            row = dict(zip(keys, key_vals))
            for e in exprs:
                row[getattr(e, '_name', 'agg')] = _eval_agg_column(group, e)
            results.append(row)
        col_order = list(keys) + agg_names
        out = pd.DataFrame(results, columns=col_order)
        return _MockDF(out)

class _MockStructField:
    def __init__(self, name, dataType, nullable=True):
        self.name = name
        self.dataType = dataType
        self.nullable = nullable
    def __repr__(self):
        return f"StructField('{self.name}', {self.dataType}, {self.nullable})"

class _MockStructType:
    def __init__(self, fields=None):
        self.fields = fields or []
        self._field_map = {f.name: f for f in self.fields}
    def add(self, name, dataType, nullable=True):
        f = _MockStructField(name, dataType, nullable)
        self.fields.append(f)
        self._field_map[name] = f
        return self
    def __getitem__(self, key):
        return self._field_map[key]
    def __iter__(self):
        return iter(self.fields)
    def treeString(self):
        # Match Spark's printSchema output: "long" not "longtype", etc.
        SHORT = {
            'stringtype': 'string',
            'longtype': 'long',
            'doubletype': 'double',
            'floattype': 'float',
            'integertype': 'integer',
            'booleantype': 'boolean',
            'datetype': 'date',
            'timestamptype': 'timestamp',
            'binarytype': 'binary',
        }
        lines = ["root"]
        for f in self.fields:
            dt = f.dataType
            raw = (dt if isinstance(dt, str) else str(dt)).replace('()', '').lower()
            dt_name = SHORT.get(raw, raw)
            lines.append(f" |-- {f.name}: {dt_name} (nullable = {str(f.nullable).lower()})")
        return "\\n".join(lines)
    def __repr__(self):
        return f"StructType([{', '.join(repr(f) for f in self.fields)}])"

class _MockReader:
    def __init__(self):
        self._options = {}
        self._schema = None
    def option(self, k, v):
        self._options[k] = v
        return self
    def schema(self, s):
        self._schema = s
        return self
    def csv(self, path, header=None, inferSchema=None, schema=None):
        opts = dict(self._options)
        if header is not None:
            opts['header'] = header
        if inferSchema is not None:
            opts['inferSchema'] = inferSchema
        use_header = str(opts.get('header', 'true')).lower() == 'true'
        sch = schema or self._schema
        import os
        read_path = path
        if not os.path.exists(read_path):
            basename = os.path.basename(read_path)
            if os.path.exists(basename):
                read_path = basename
        pdf = pd.read_csv(read_path, header=0 if use_header else None)
        if sch and hasattr(sch, 'fields'):
            type_to_dtype = {
                'StringType()': 'object', 'DoubleType()': 'float64',
                'FloatType()': 'float32', 'IntegerType()': 'int32',
                'LongType()': 'int64', 'BooleanType()': 'bool',
            }
            for field in sch.fields:
                if field.name in pdf.columns:
                    target = type_to_dtype.get(str(field.dataType), None)
                    if target and target.startswith('float'):
                        pdf[field.name] = pd.to_numeric(pdf[field.name], errors='coerce')
                    elif target and target.startswith('int'):
                        pdf[field.name] = pd.to_numeric(pdf[field.name], errors='coerce')
            df = _MockDF(pdf, sch)
        else:
            df = _MockDF(pdf)
        self._options = {}
        self._schema = None
        return df
    def parquet(self, path):
        return _MockDF(pd.DataFrame({'_placeholder': []}))
    def json(self, path):
        return _MockDF(pd.read_json(path))

class _MockWriter:
    def __init__(self, df):
        self._df = df
        self._mode = 'error'
        self._options = {}
    def mode(self, m):
        self._mode = m
        return self
    def option(self, k, v):
        self._options[k] = v
        return self
    def partitionBy(self, *cols):
        return self
    def csv(self, path, **kw):
        self._df._pdf.to_csv(path, index=False)
    def parquet(self, path, **kw):
        print(f"(mock) Would write parquet to {path}")
    def json(self, path, **kw):
        print(f"(mock) Would write json to {path}")
    def save(self, path=None, **kw):
        print(f"(mock) Would save to {path}")

_MockDF.write = property(lambda self: _MockWriter(self))

class _MockBuilder:
    def __init__(self):
        self._conf = _MockConf()
        self._name = 'app'
    def appName(self, n):
        b = _MockBuilder()
        b._conf = self._conf
        b._name = n
        b._conf.set('spark.app.name', n)
        return b
    def master(self, m):
        self._conf.set('spark.master', m)
        return self
    def config(self, k, v=None):
        if v is not None:
            self._conf.set(k, v)
        return self
    def enableHiveSupport(self):
        return self
    def getOrCreate(self):
        return _MockSession(self._conf, self._name)

class _MockSession:
    builder = _MockBuilder()
    def __init__(self, conf=None, name='app'):
        self.conf = conf or _MockConf()
        self.read = _MockReader()
        self.sparkContext = types.SimpleNamespace(
            setLogLevel=lambda l: None,
            appName=name,
            isActive=True,
        )
        self.catalog = types.SimpleNamespace(
            listDatabases=lambda: [],
            listTables=lambda db=None: [],
        )
    def createDataFrame(self, data, schema=None):
        if isinstance(schema, _MockStructType):
            col_names = [f.name for f in schema.fields]
            pdf = pd.DataFrame(data, columns=col_names)
            return _MockDF(pdf, schema)
        elif isinstance(schema, list):
            pdf = pd.DataFrame(data, columns=schema)
            return _MockDF(pdf)
        elif hasattr(data, 'columns'):
            return _MockDF(data)
        else:
            pdf = pd.DataFrame(data)
            return _MockDF(pdf)
    def sql(self, query):
        print(f"(mock) SQL not supported: {query}")
        return _MockDF(pd.DataFrame())
    def stop(self):
        pass
    def newSession(self):
        return self

_pyspark = types.ModuleType('pyspark')
_pyspark_sql = types.ModuleType('pyspark.sql')
_pyspark_sql.SparkSession = _MockSession
_pyspark_sql.DataFrame = _MockDF
_pyspark_sql.Row = _MockRow
_pyspark_sql_types = types.ModuleType('pyspark.sql.types')
_pyspark_sql_types.StructType = _MockStructType
_pyspark_sql_types.StructField = _MockStructField
_pyspark_sql_types.StringType = lambda: 'StringType()'
_pyspark_sql_types.DoubleType = lambda: 'DoubleType()'
_pyspark_sql_types.FloatType = lambda: 'FloatType()'
_pyspark_sql_types.IntegerType = lambda: 'IntegerType()'
_pyspark_sql_types.LongType = lambda: 'LongType()'
_pyspark_sql_types.BooleanType = lambda: 'BooleanType()'
_pyspark_sql_types.DateType = lambda: 'DateType()'
_pyspark_sql_types.TimestampType = lambda: 'TimestampType()'
def _col_arg_to_name(c):
    """Coerce a function argument to a source-column name.
    Accepts strings, _MockColumn, or anything stringifiable."""
    if hasattr(c, '_name'):
        # If the inner column has its own op (e.g. round(sum(...))), pass the
        # whole _MockColumn through so _eval_agg_column can recurse.
        return c if c._op is not None else c._name
    return c

_pyspark_sql_functions = types.ModuleType('pyspark.sql.functions')
_pyspark_sql_functions.col = lambda name: _MockColumn(name)
_pyspark_sql_functions.lit = lambda v: _MockColumn(f'lit({v})', op='lit', args={'value': v})
_pyspark_sql_functions.count = lambda c='*': (
    _MockColumn('count', op='count', src='*') if c == '*'
    else _MockColumn(f'count({_col_arg_to_name(c)})', op='count', src=_col_arg_to_name(c))
)
_pyspark_sql_functions.countDistinct = lambda *cols: _MockColumn(
    f"count(DISTINCT {', '.join(str(_col_arg_to_name(c)) for c in cols)})",
    op='count_distinct',
    src=([_col_arg_to_name(c) for c in cols] if len(cols) > 1 else _col_arg_to_name(cols[0]) if cols else None)
)
_pyspark_sql_functions.count_distinct = _pyspark_sql_functions.countDistinct
_pyspark_sql_functions.first = lambda c, ignorenulls=False: _MockColumn(
    f'first({_col_arg_to_name(c)})', op='first', src=_col_arg_to_name(c), args={'ignorenulls': ignorenulls}
)
_pyspark_sql_functions.last = lambda c, ignorenulls=False: _MockColumn(
    f'last({_col_arg_to_name(c)})', op='last', src=_col_arg_to_name(c), args={'ignorenulls': ignorenulls}
)
_pyspark_sql_functions.sum = lambda c: _MockColumn(
    f'sum({_col_arg_to_name(c)})', op='sum', src=_col_arg_to_name(c)
)
_pyspark_sql_functions.avg = lambda c: _MockColumn(
    f'avg({_col_arg_to_name(c)})', op='avg', src=_col_arg_to_name(c)
)
_pyspark_sql_functions.mean = lambda c: _MockColumn(
    f'mean({_col_arg_to_name(c)})', op='mean', src=_col_arg_to_name(c)
)
_pyspark_sql_functions.max = lambda c: _MockColumn(
    f'max({_col_arg_to_name(c)})', op='max', src=_col_arg_to_name(c)
)
_pyspark_sql_functions.min = lambda c: _MockColumn(
    f'min({_col_arg_to_name(c)})', op='min', src=_col_arg_to_name(c)
)
_pyspark_sql_functions.when = lambda cond, val: _MockColumn(
    'when', op='when', args={'conditions': [(cond, val)], 'otherwise': None}
)
_pyspark_sql_functions.upper = lambda c: _MockColumn('upper')
_pyspark_sql_functions.lower = lambda c: _MockColumn('lower')
_pyspark_sql_functions.trim = lambda c: _MockColumn('trim')
_pyspark_sql_functions.round = lambda c, scale=0: _MockColumn(
    f'round({getattr(c, "_name", c)}, {scale})',
    op='round',
    src=c if hasattr(c, '_op') else _MockColumn(str(c), op=None, src=str(c)),
    args={'scale': scale}
)
_pyspark_sql_functions.year = lambda c: _MockColumn('year')
_pyspark_sql_functions.month = lambda c: _MockColumn('month')
_pyspark_sql_functions.dayofmonth = lambda c: _MockColumn('dayofmonth')
_pyspark_sql_functions.cast = lambda c, t: _MockColumn('cast')
_pyspark_sql_functions.concat = lambda *cols: _MockColumn('concat')
_pyspark_sql_functions.concat_ws = lambda sep, *cols: _MockColumn('concat_ws')
_pyspark_sql_functions.coalesce = lambda *cols: _MockColumn('coalesce')
_pyspark_sql_functions.isin = lambda *vals: _MockColumn('isin')

# ── Real implementations for date / cast / hash / abs / window helpers ──────
# Each builds a _MockColumn whose op the row-resolver
# (_resolve_to_series) and agg-evaluator (_eval_agg_column) recognise. See
# those two evaluators above for the actual pandas-backed semantics.
def _mk(op, name=None, src=None, args=None):
    return _MockColumn(name or op, op=op, src=src, args=args or {})

_pyspark_sql_functions.date_trunc = lambda fmt, c: _mk(
    'date_trunc', name=f'date_trunc({fmt})', src=c, args={'unit': fmt})
_pyspark_sql_functions.date_format = lambda c, fmt: _mk(
    'date_format', name=f'date_format({fmt})', src=c, args={'fmt': fmt})
_pyspark_sql_functions.to_date = lambda c, fmt=None: _mk(
    'to_date', src=c, args={'fmt': fmt})
_pyspark_sql_functions.to_timestamp = lambda c, fmt=None: _mk(
    'to_timestamp', src=c, args={'fmt': fmt})
_pyspark_sql_functions.from_utc_timestamp = lambda c, tz: _mk(
    'from_utc_timestamp', src=c, args={'tz': tz})
_pyspark_sql_functions.to_utc_timestamp = lambda c, tz: _mk(
    'to_utc_timestamp', src=c, args={'tz': tz})
_pyspark_sql_functions.year       = lambda c: _mk('year', src=c)
_pyspark_sql_functions.month      = lambda c: _mk('month', src=c)
_pyspark_sql_functions.dayofmonth = lambda c: _mk('dayofmonth', src=c)
_pyspark_sql_functions.weekofyear = lambda c: _mk('weekofyear', src=c)
_pyspark_sql_functions.quarter    = lambda c: _mk('quarter', src=c)
_pyspark_sql_functions.dayofweek  = lambda c: _mk('dayofweek', src=c)
_pyspark_sql_functions.dayofyear  = lambda c: _mk('dayofyear', src=c)
_pyspark_sql_functions.hour       = lambda c: _mk('hour', src=c)
_pyspark_sql_functions.minute     = lambda c: _mk('minute', src=c)
_pyspark_sql_functions.second     = lambda c: _mk('second', src=c)
_pyspark_sql_functions.datediff   = lambda end, start: _mk(
    'datediff', args={'end': end, 'start': start})
_pyspark_sql_functions.date_add   = lambda c, n: _mk('date_add', src=c, args={'n': n})
_pyspark_sql_functions.date_sub   = lambda c, n: _mk('date_sub', src=c, args={'n': n})

# Math
_pyspark_sql_functions.abs   = lambda c: _mk('abs', src=c)
_pyspark_sql_functions.floor = lambda c: _mk('floor', src=c)
_pyspark_sql_functions.ceil  = lambda c: _mk('ceil', src=c)

# Hashing — for salting tasks (M6, S3). Spark's hash() is Murmur3; ours
# is python hash() which is fine for salt-bucket distribution semantics.
_pyspark_sql_functions.hash = lambda c: _mk('hash', src=c)

# Approx aggregates — fall back to exact countDistinct in the mock since
# the dataset sizes are small enough that the answers match.
_pyspark_sql_functions.approx_count_distinct = lambda c, rsd=0.05: _MockColumn(
    f'approx_count_distinct({getattr(c, "_name", c)})',
    op='count_distinct',
    src=str(getattr(c, '_name', c)),
)
_pyspark_sql_functions.approxCountDistinct = _pyspark_sql_functions.approx_count_distinct

# Window-function expressions — produce columns whose op the window
# evaluator recognises when wrapped in .over(window).
_pyspark_sql_functions.row_number   = lambda: _MockColumn('row_number', op='row_number')
_pyspark_sql_functions.rank         = lambda: _MockColumn('rank', op='rank')
_pyspark_sql_functions.dense_rank   = lambda: _MockColumn('dense_rank', op='dense_rank')
_pyspark_sql_functions.percent_rank = lambda: _MockColumn('percent_rank', op='percent_rank')
_pyspark_sql_functions.cume_dist    = lambda: _MockColumn('cume_dist', op='cume_dist')
_pyspark_sql_functions.lag = lambda c, offset=1, default=None: _MockColumn(
    'lag', op='lag', src=getattr(c, '_name', c),
    args={'offset': offset, 'default': default})
_pyspark_sql_functions.lead = lambda c, offset=1, default=None: _MockColumn(
    'lead', op='lead', src=getattr(c, '_name', c),
    args={'offset': offset, 'default': default})

# Sorting helpers — used inside Window.orderBy() and DataFrame.orderBy()
_pyspark_sql_functions.desc = lambda c: _MockColumn(
    f'{getattr(c, "_name", c)} DESC', op='sort_desc',
    src=str(getattr(c, '_name', c)))
_pyspark_sql_functions.asc = lambda c: _MockColumn(
    f'{getattr(c, "_name", c)} ASC', op='sort_asc',
    src=str(getattr(c, '_name', c)))

# Broadcast → identity (the join hint doesn't matter in the mock; the
# data still has to be physically joinable).
_pyspark_sql_functions.broadcast = lambda df: df

# Stubs that still return placeholders — these aren't wired through the
# evaluator yet. Listed so imports succeed; senior tasks that lean on
# them won't validate but won't crash on import either.
_pyspark_sql_functions.unix_timestamp = lambda c=None, fmt=None: _MockColumn('unix_timestamp')
_pyspark_sql_functions.from_unixtime  = lambda c, fmt=None: _MockColumn('from_unixtime')
_pyspark_sql_functions.current_date      = lambda: _MockColumn('current_date')
_pyspark_sql_functions.current_timestamp = lambda: _MockColumn('current_timestamp')
_pyspark_sql_functions.add_months    = lambda c, n: _MockColumn('add_months')
_pyspark_sql_functions.months_between = lambda a, b: _MockColumn('months_between')
_pyspark_sql_functions.last_day      = lambda c: _MockColumn('last_day')
_pyspark_sql_functions.next_day      = lambda c, day: _MockColumn('next_day')
_pyspark_sql_functions.window        = lambda c, dur, slide=None, start=None: _MockColumn('window')
_pyspark_sql_functions.expr          = lambda s: _MockColumn(f'expr({s})')
_pyspark_sql_functions.sqrt          = lambda c: _MockColumn('sqrt')
_pyspark_sql_functions.pow           = lambda a, b: _MockColumn('pow')
_pyspark_sql_functions.log           = lambda c, base=None: _MockColumn('log')
_pyspark_sql_functions.exp           = lambda c: _MockColumn('exp')
_pyspark_sql_functions.greatest      = lambda *cols: _MockColumn('greatest')
_pyspark_sql_functions.least         = lambda *cols: _MockColumn('least')
_pyspark_sql_functions.length        = lambda c: _MockColumn('length')
_pyspark_sql_functions.substring     = lambda c, pos, length: _MockColumn('substring')
_pyspark_sql_functions.split         = lambda c, sep, limit=-1: _MockColumn('split')
_pyspark_sql_functions.regexp_extract = lambda c, pat, idx: _MockColumn('regexp_extract')
_pyspark_sql_functions.regexp_replace = lambda c, pat, repl: _MockColumn('regexp_replace')
_pyspark_sql_functions.like          = lambda c, pat: _MockColumn('like')
_pyspark_sql_functions.startswith    = lambda c, p: _MockColumn('startswith')
_pyspark_sql_functions.endswith      = lambda c, p: _MockColumn('endswith')
_pyspark_sql_functions.array         = lambda *cols: _MockColumn('array')
_pyspark_sql_functions.struct        = lambda *cols: _MockColumn('struct')
_pyspark_sql_functions.explode       = lambda c: _MockColumn('explode')
_pyspark_sql_functions.posexplode    = lambda c: _MockColumn('posexplode')
_pyspark_sql_functions.collect_list  = lambda c: _MockColumn('collect_list')
_pyspark_sql_functions.collect_set   = lambda c: _MockColumn('collect_set')
_pyspark_sql_functions.size          = lambda c: _MockColumn('size')
_pyspark_sql_functions.sequence      = lambda start, stop, step=None: _MockColumn('sequence')
_pyspark_sql_functions.ntile         = lambda n: _MockColumn('ntile')
_pyspark_sql_functions.grouping      = lambda c: _MockColumn('grouping')
_pyspark_sql_functions.grouping_id   = lambda *cols: _MockColumn('grouping_id')

sys.modules['pyspark'] = _pyspark
sys.modules['pyspark.sql'] = _pyspark_sql
sys.modules['pyspark.sql.types'] = _pyspark_sql_types
sys.modules['pyspark.sql.functions'] = _pyspark_sql_functions

# ── Window — real implementation, evaluated by _eval_window_agg ─────────────
class _MockWindowSpec:
    def __init__(self, parts=None, orders=None, frame=None):
        self._parts = list(parts or [])
        self._orders = list(orders or [])
        self._frame = frame
    def partitionBy(self, *cols):
        return _MockWindowSpec(list(cols), self._orders, self._frame)
    def orderBy(self, *cols):
        return _MockWindowSpec(self._parts, list(cols), self._frame)
    def rowsBetween(self, start, end):
        return _MockWindowSpec(self._parts, self._orders, ('rows', start, end))
    def rangeBetween(self, start, end):
        return _MockWindowSpec(self._parts, self._orders, ('range', start, end))

class _MockWindow:
    unboundedPreceding = -2**31
    unboundedFollowing = 2**31 - 1
    currentRow = 0
    @staticmethod
    def partitionBy(*cols):
        return _MockWindowSpec(list(cols))
    @staticmethod
    def orderBy(*cols):
        return _MockWindowSpec(orders=list(cols))
    @staticmethod
    def rowsBetween(start, end):
        return _MockWindowSpec(frame=('rows', start, end))
    @staticmethod
    def rangeBetween(start, end):
        return _MockWindowSpec(frame=('range', start, end))

_pyspark_sql_window = types.ModuleType('pyspark.sql.window')
_pyspark_sql_window.Window = _MockWindow
_pyspark_sql_window.WindowSpec = _MockWindowSpec
sys.modules['pyspark.sql.window'] = _pyspark_sql_window

# .over(spec) wraps the inner agg/rank column in a window_agg op so
# _resolve_to_series can route to _eval_window_agg.
def _column_over(self, spec):
    return _MockColumn(
        f'{self._name} OVER (...)',
        op='window_agg',
        args={'inner': self, 'spec': spec},
    )
_MockColumn.over = _column_over

# .cast on a _MockColumn — used in S5 / S9 etc. for explicit type coercion.
def _column_cast(self, t):
    return _MockColumn(
        f'CAST({self._name} AS {t})',
        op='cast',
        src=self,
        args={'to': str(t)},
    )
_MockColumn.cast = _column_cast

DataFrame = _MockDF
StructType = _MockStructType
StructField = _MockStructField

# ── Call-log instrumentation ─────────────────────────────────────────────────
# Tracks which mock methods the user's code actually invoked. The validator
# uses this as proof-of-work: a hardcoded createDataFrame solution never
# calls .groupBy()/.agg()/etc. and gets rejected even if the printed output
# happens to match the expected spec. The set is reset per run by the JS
# runner before each invocation; it's read back via Pyodide globals after.
_PYSPARK_CALL_LOG = set()

def _logged(name, fn):
    def wrapped(*args, **kwargs):
        _PYSPARK_CALL_LOG.add(name)
        return fn(*args, **kwargs)
    wrapped.__name__ = getattr(fn, '__name__', name)
    return wrapped

# DataFrame methods that signal real work happened.
for _m in (
    'groupBy', 'agg', 'filter', 'where', 'withColumn', 'withColumnRenamed',
    'select', 'orderBy', 'sort', 'join', 'distinct', 'crossJoin',
    'union', 'unionAll', 'unionByName', 'drop', 'limit',
    'createOrReplaceTempView',
):
    if hasattr(_MockDF, _m):
        setattr(_MockDF, _m, _logged(_m, getattr(_MockDF, _m)))

# Grouped methods — log unprefixed so requiredApis can match either the
# DataFrame.agg or the Grouped.agg path under the same name.
for _m in ('agg', 'pivot', 'count', 'sum', 'avg', 'mean', 'max', 'min'):
    if hasattr(_MockGrouped, _m):
        setattr(_MockGrouped, _m, _logged(_m, getattr(_MockGrouped, _m)))

# Column methods (over, cast).
for _m in ('over', 'cast', 'alias', 'isNotNull', 'isNull', 'between', 'isin'):
    if hasattr(_MockColumn, _m):
        setattr(_MockColumn, _m, _logged(_m, getattr(_MockColumn, _m)))

# Functions module — wrap each callable so the call-log captures the
# semantic intent (e.g. "approx_count_distinct" vs "countDistinct").
for _name in (
    'sum', 'avg', 'mean', 'min', 'max', 'count', 'countDistinct',
    'count_distinct', 'approx_count_distinct', 'approxCountDistinct',
    'first', 'last', 'when', 'lit', 'col', 'round',
    'date_trunc', 'date_format', 'to_date', 'to_timestamp',
    'from_utc_timestamp', 'to_utc_timestamp',
    'year', 'month', 'quarter', 'weekofyear', 'dayofmonth',
    'dayofweek', 'dayofyear', 'hour', 'minute', 'second',
    'datediff', 'date_add', 'date_sub',
    'abs', 'floor', 'ceil', 'hash',
    'row_number', 'rank', 'dense_rank', 'percent_rank', 'cume_dist',
    'lag', 'lead',
    'desc', 'asc', 'broadcast',
    'concat', 'concat_ws', 'coalesce', 'upper', 'lower', 'trim',
):
    _orig = getattr(_pyspark_sql_functions, _name, None)
    if callable(_orig):
        setattr(_pyspark_sql_functions, _name, _logged(_name, _orig))

# Window class — track partitionBy / orderBy / rowsBetween / rangeBetween.
# Logged with a 'Window.' prefix so a task can require Window-style usage
# specifically (vs. the same method names on a sorted DataFrame).
def _wrap_window_static(name):
    _orig = getattr(_MockWindow, name)
    def wrapped(*args, **kwargs):
        _PYSPARK_CALL_LOG.add(f'Window.{name}')
        return _orig(*args, **kwargs)
    return staticmethod(wrapped)
for _m in ('partitionBy', 'orderBy', 'rowsBetween', 'rangeBetween'):
    setattr(_MockWindow, _m, _wrap_window_static(_m))

for _m in ('partitionBy', 'orderBy', 'rowsBetween', 'rangeBetween'):
    if hasattr(_MockWindowSpec, _m):
        setattr(_MockWindowSpec, _m,
                _logged(f'Window.{_m}', getattr(_MockWindowSpec, _m)))

# ── End PySpark Mock ─────────────────────────────────────────────────────────
`.trim();

/* ── Error cleaner ──────────────────────────────────────────────────────────── */

function cleanPyodideError(message: string): string {
  const lines = message.split('\n');
  const filtered = lines.filter((line) => {
    const execMatch = line.match(/File "<exec>", line (\d+)/);
    if (execMatch) {
      const lineNum = parseInt(execMatch[1], 10);
      if (lineNum < 10) return false;
    }
    return true;
  });
  return filtered.join('\n').trim();
}

/* ── Schema parser ──────────────────────────────────────────────────────────── */

interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
}

function parseSchemaFromScaffold(scaffold: string): SchemaField[] {
  const fields: SchemaField[] = [];
  // Match StructField('name', TypeType(), nullable)
  const re = /StructField\(\s*['"](\w+)['"]\s*,\s*(\w+)\(\)\s*(?:,\s*(True|False))?\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(scaffold)) !== null) {
    fields.push({
      name: m[1],
      type: m[2].replace('Type', ''),
      nullable: m[3] !== 'False',
    });
  }
  return fields;
}

/* ── Dataset Preview (inline for left panel) ────────────────────────────────── */

interface CsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  previewRows: number;
}

function DatasetPanel({
  datasets,
  topic,
}: {
  datasets: PracticeSetDataset[];
  topic: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    datasets.length === 1 ? datasets[0].id : null,
  );
  const [dataCache, setDataCache] = useState<Record<string, CsvData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(
    async (ds: PracticeSetDataset) => {
      if (dataCache[ds.id]) return;
      setLoading((prev) => ({ ...prev, [ds.id]: true }));
      setErrors((prev) => {
        if (!(ds.id in prev)) return prev;
        const next = { ...prev };
        delete next[ds.id];
        return next;
      });
      try {
        const params = new URLSearchParams({ topic, file: ds.file });
        const res = await fetch(`/api/operations/datasets?${params}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json: CsvData = await res.json();
        setDataCache((prev) => ({ ...prev, [ds.id]: json }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          [ds.id]:
            error instanceof Error
              ? `Couldn't load preview (${error.message}).`
              : "Couldn't load preview.",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, [ds.id]: false }));
      }
    },
    [topic, dataCache],
  );

  useEffect(() => {
    if (expandedId) {
      const ds = datasets.find((d) => d.id === expandedId);
      if (ds && !dataCache[ds.id] && !loading[ds.id]) {
        fetchData(ds);
      }
    }
  }, [expandedId, datasets, dataCache, loading, fetchData]);

  if (datasets.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--rm-text-secondary)' }}>
        No datasets for this task.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {datasets.map((ds) => {
        const isExpanded = expandedId === ds.id;
        const data = dataCache[ds.id];
        const isLoading = loading[ds.id];
        const errorMessage = errors[ds.id];

        return (
          <div
            key={ds.id}
            className="rounded-[14px] overflow-hidden"
            style={{
              border: '1px solid var(--rm-border)',
              backgroundColor: 'var(--rm-bg-elevated)',
            }}
          >
            <button
              onClick={() => {
                setExpandedId(isExpanded ? null : ds.id);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              <Table2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[12px] font-medium flex-1 truncate">
                {ds.file}
                {data && (
                  <span className="ml-2 opacity-50">
                    ({data.totalRows} row{data.totalRows !== 1 ? 's' : ''})
                  </span>
                )}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--rm-border)' }}>
                {isLoading && (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={i}
                        className="h-4 rounded animate-pulse"
                        style={{
                          backgroundColor: 'var(--rm-border)',
                          width: `${80 - i * 10}%`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {!isLoading && errorMessage && (
                  <div className="p-4 flex items-center justify-between gap-3 text-[12px]" style={{ color: 'var(--rm-text-secondary)' }}>
                    <span>{errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => fetchData(ds)}
                      className="rounded-[8px] px-3 py-1.5 text-[11px] font-medium transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'var(--rm-text)',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}
                {data && (
                  <div className="overflow-x-auto" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    <table className="w-full text-[11px] font-mono border-collapse">
                      <thead>
                        <tr>
                          {data.headers.map((h, i) => (
                            <th
                              key={i}
                              className="sticky top-0 px-3 py-2 text-left font-semibold whitespace-nowrap"
                              style={{
                                // Per-mode header surface: light cream in
                                // book/kindle, near-black in dark/black, etc.
                                // The previous --rm-code-bg fallback rendered
                                // as a dark bar in light reading modes.
                                backgroundColor: 'var(--rm-table-header-bg, var(--rm-bg-elevated))',
                                color: 'var(--rm-text-heading, var(--rm-text))',
                                borderBottom: '1px solid var(--rm-border)',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="px-3 py-1.5 whitespace-nowrap"
                                style={{
                                  color: 'var(--rm-text-secondary)',
                                  borderBottom: '1px solid var(--rm-border)',
                                }}
                              >
                                {cell || <span className="opacity-30">null</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.totalRows > data.previewRows && (
                      <div
                        className="px-3 py-2 text-[11px] text-center"
                        style={{
                          color: 'var(--rm-text-secondary)',
                          backgroundColor: 'var(--rm-code-bg, #0d1117)',
                          borderTop: '1px solid var(--rm-border)',
                        }}
                      >
                        Showing {data.previewRows} of {data.totalRows} rows
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Validation helpers ─────────────────────────────────────────────────────── */

function getCorrectValue(field: TemplateField): string {
  if (field.correctAnswer != null) return String(field.correctAnswer);
  return field.correct ?? '';
}

/* ── FieldRenderer ──────────────────────────────────────────────────────────── */

function getOptionsGridClass(count: number): string {
  if (count <= 2) return 'grid grid-cols-2 gap-3 sm:gap-3.5';
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5';
  if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5';
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5';
}

function FieldRenderer({
  field,
  value,
  result,
  checked,
  readOnly,
  showResult,
  onChange,
  gridLayout = false,
  hideLabel = false,
}: {
  field: TemplateField;
  value: string;
  result: boolean | null;
  checked: boolean;
  readOnly: boolean;
  showResult: boolean;
  onChange: (v: string) => void;
  gridLayout?: boolean;
  hideLabel?: boolean;
}) {
  const correctValue = getCorrectValue(field);
  const showFeedback = checked && showResult;
  const optionsContainerClass =
    gridLayout && field.type === 'single_select' && field.options
      ? getOptionsGridClass(field.options.length)
      : 'space-y-2';

  return (
    <div className="space-y-3">
      {/* Field label */}
      {!hideLabel && (
        <div className="flex items-start gap-2">
          <span className="text-[13px] leading-relaxed flex-1" style={{ color: 'var(--rm-text)' }}>
            {field.label}
          </span>
          {showFeedback && result === true && (
            <div className="flex items-center gap-1 shrink-0">
              <Check className="h-3.5 w-3.5" style={{ color: `rgb(${SUCCESS_RGB})` }} />
              <span className="text-[11px] font-semibold" style={{ color: `rgb(${SUCCESS_RGB})` }}>Correct</span>
            </div>
          )}
          {showFeedback && result === false && (
            <div className="flex items-center gap-1 shrink-0">
              <X className="h-3.5 w-3.5" style={{ color: `rgb(${ERROR_RGB})` }} />
              <span className="text-[11px] font-semibold" style={{ color: `rgb(${ERROR_RGB})` }}>Incorrect</span>
            </div>
          )}
        </div>
      )}

      {/* Single/multi select options */}
      {(field.type === 'single_select' || field.type === 'multi_select') && field.options && (
        <div className={optionsContainerClass}>
          {field.options.map((opt) => {
            const selected = value === opt;
            const isCorrectOption = opt.toLowerCase() === correctValue.toLowerCase();
            const showCorrectHighlight = showFeedback && result === false && isCorrectOption;

            let borderStyle = '1px solid var(--rm-border)';
            let iconElement: React.ReactNode = null;

            if (showCorrectHighlight) {
              borderStyle = `1.5px solid rgba(${SUCCESS_RGB},0.55)`;
              iconElement = <Check className="h-[18px] w-[18px] shrink-0" style={{ color: `rgb(${SUCCESS_RGB})` }} />;
            } else if (selected && showFeedback && result === true) {
              borderStyle = `1.5px solid rgba(${SUCCESS_RGB},0.55)`;
              iconElement = <Check className="h-[18px] w-[18px] shrink-0" style={{ color: `rgb(${SUCCESS_RGB})` }} />;
            } else if (selected && showFeedback && result === false) {
              borderStyle = `1.5px solid rgba(${ERROR_RGB},0.55)`;
              iconElement = <X className="h-[18px] w-[18px] shrink-0" style={{ color: `rgb(${ERROR_RGB})` }} />;
            } else if (selected) {
              // Selected (pre-check) — white indicator with bg-color check
              // so it auto-inverts in light reading modes too.
              borderStyle = `1.5px solid var(--rm-text-heading, var(--rm-text))`;
              iconElement = (
                <div className="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--rm-text-heading, #ffffff)' }}>
                  <Check className="h-3 w-3" style={{ color: 'var(--rm-bg, #000000)' }} strokeWidth={3} />
                </div>
              );
            }

            const interactive = !(readOnly || checked);
            return (
              <button
                key={opt}
                onClick={() => !readOnly && !checked && onChange(opt)}
                disabled={readOnly || checked}
                className={`group w-full h-full text-left rounded-[14px] px-4 py-3.5 text-[13px] leading-[1.75] transition-all duration-200 ${
                  interactive
                    ? 'cursor-pointer hover:brightness-[1.06] hover:-translate-y-px'
                    : 'cursor-default'
                }`}
                style={{
                  border: borderStyle,
                  backgroundColor: showCorrectHighlight
                    ? `rgba(${SUCCESS_RGB},0.1)`
                    : selected && showFeedback && result === true
                      ? `rgba(${SUCCESS_RGB},0.1)`
                      : selected && showFeedback && result === false
                        ? `rgba(${ERROR_RGB},0.1)`
                        : 'var(--rm-bg-elevated)',
                }}
              >
                <span className="flex items-start gap-3.5">
                  {iconElement && <span className="mt-0.5">{iconElement}</span>}
                  {!iconElement && !showFeedback && (
                    <div
                      className="w-[18px] h-[18px] rounded-full shrink-0 mt-0.5 transition-all duration-200"
                      style={{
                        border: selected ? 'none' : '1.5px solid var(--rm-border)',
                        background: 'transparent',
                      }}
                    />
                  )}
                  {!iconElement && showFeedback && (
                    <div className="w-[18px] h-[18px] shrink-0 mt-0.5" />
                  )}
                  <span
                    className="flex-1"
                    style={{
                      color: showCorrectHighlight
                        ? `rgb(${SUCCESS_RGB})`
                        : selected && showFeedback && result === true
                          ? `rgb(${SUCCESS_RGB})`
                          : selected && showFeedback && result === false
                            ? `rgb(${ERROR_RGB})`
                            : 'var(--rm-text)',
                      fontWeight: (showCorrectHighlight || (selected && showFeedback)) ? 600 : 400,
                    }}
                  >
                    {opt}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Text / numeric inputs */}
      {(field.type === 'short_text' || field.type === 'numeric') && (
        <input
          type={field.type === 'numeric' ? 'number' : 'text'}
          value={value}
          onChange={(e) => !readOnly && !checked && onChange(e.target.value)}
          readOnly={readOnly || checked}
          placeholder={field.type === 'numeric' ? 'Enter a number' : 'Type your answer...'}
          className="w-full rounded-[14px] px-4 py-3.5 text-[13px] leading-relaxed outline-none transition-all duration-200"
          style={{
            border: showFeedback && result === true
              ? `1.5px solid rgba(${SUCCESS_RGB},0.55)`
              : showFeedback && result === false
                ? `1.5px solid rgba(${ERROR_RGB},0.55)`
                : '1px solid var(--rm-border)',
            backgroundColor: showFeedback && result === true
              ? `rgba(${SUCCESS_RGB},0.1)`
              : showFeedback && result === false
                ? `rgba(${ERROR_RGB},0.1)`
                : 'var(--rm-bg-elevated)',
            color: 'var(--rm-text)',
          }}
        />
      )}

      {/* Show correct answer when wrong (text/numeric) */}
      {showFeedback && result === false && (field.type === 'short_text' || field.type === 'numeric') && (
        <div
          className="rounded-[14px] px-3 py-2 text-[12px] flex items-center gap-2"
          style={{
            background: `rgba(${SUCCESS_RGB},0.1)`,
            border: `1px solid rgba(${SUCCESS_RGB},0.25)`,
            color: `rgb(${SUCCESS_RGB})`,
            fontWeight: 600,
          }}
        >
          <Check className="h-3 w-3 shrink-0" />
          Correct answer: {correctValue}
        </div>
      )}
    </div>
  );
}

/* ── Code Verdict Banner ────────────────────────────────────────────────────── */

function CodeVerdictBanner({
  allCorrect,
  selfReview,
  reasons,
  hasExpectedOutput,
}: {
  allCorrect: boolean;
  selfReview?: boolean;
  reasons?: string[];
  hasExpectedOutput: boolean;
}) {
  // Three states: success (validator returned 'success'), failure
  // (validator returned 'failure'), self_review (no spec OR output couldn't
  // be parsed — neutral acknowledgement, not a wrong-answer signal).
  const isSelfReview = !!selfReview;
  const isSuccess = !isSelfReview && allCorrect;
  const isFailure = !isSelfReview && !allCorrect;

  // First reason is the most actionable diagnostic from the validator.
  const headlineReason = (reasons ?? []).find((r) => r && r.length > 0);

  let icon: React.ReactNode = null;
  let title = '';
  let subtitle = '';
  let tintRgb = '';
  let bg = '';
  let border = '';
  let titleColor = '';

  if (isSuccess) {
    icon = <Check className="h-4 w-4" strokeWidth={3} style={{ color: `rgb(${SUCCESS_RGB})` }} />;
    title = 'Correct';
    subtitle = headlineReason ?? 'Schema and values match the expected output.';
    tintRgb = SUCCESS_RGB;
    bg = `rgba(${SUCCESS_RGB},0.10)`;
    border = `rgba(${SUCCESS_RGB},0.32)`;
    titleColor = `rgb(${SUCCESS_RGB})`;
  } else if (isFailure) {
    icon = <X className="h-4 w-4" strokeWidth={3} style={{ color: `rgb(${ERROR_RGB})` }} />;
    title = 'Not quite';
    subtitle = headlineReason ?? 'The output doesn’t match the expected spec.';
    tintRgb = ERROR_RGB;
    bg = `rgba(${ERROR_RGB},0.10)`;
    border = `rgba(${ERROR_RGB},0.32)`;
    titleColor = `rgb(${ERROR_RGB})`;
  } else {
    // self-review — show neutral
    icon = (
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: 'var(--rm-text-secondary)', opacity: 0.85 }}
      >
        <span className="block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rm-bg)' }} />
      </span>
    );
    title = 'Submitted';
    subtitle = hasExpectedOutput
      ? headlineReason ?? 'Run the code to compare against the expected output.'
      : 'Self-review — no automatic check is configured for this task.';
    bg = 'var(--rm-bg-elevated)';
    border = 'var(--rm-border)';
    titleColor = 'var(--rm-text-heading, var(--rm-text))';
  }

  return (
    <div
      className="px-4 pt-3 pb-3"
      style={{
        animation: 'fadeSlideUp 220ms cubic-bezier(.16,1,.3,1) both',
      }}
    >
      <div
        className="flex items-start gap-3 rounded-[14px] px-4 py-3"
        style={{
          background: bg,
          border: `1px solid ${border}`,
          // Hairline highlight on top edge — the Apple "lift" trick.
          boxShadow: tintRgb
            ? `inset 0 1px 0 rgba(${tintRgb},0.08)`
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        role="status"
        aria-live="polite"
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p
            className="text-[14px] font-semibold tracking-[-0.01em] leading-tight"
            style={{ color: titleColor }}
          >
            {title}
          </p>
          <p
            className="mt-0.5 text-[12.5px] leading-snug"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            {subtitle}
          </p>
          {/* Surface up to 3 detail lines from the validator (if present
              and not the same as the headline). Helps the user diagnose
              "why failure" without opening dev tools. */}
          {isFailure && reasons && reasons.length > 1 && (
            <ul className="mt-2 space-y-0.5">
              {reasons.slice(1, 4).map((r, i) => (
                <li
                  key={i}
                  className="text-[11.5px] leading-snug"
                  style={{ color: 'var(--rm-text-secondary)', opacity: 0.85 }}
                >
                  · {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Expected Output Preview ────────────────────────────────────────────────── */

function ExpectedOutputPreview({ spec }: { spec: any }) {
  if (!spec || typeof spec !== 'object') return null;

  // Legacy prose shape (`{pattern, notes}`) — render as before.
  if (typeof spec.pattern === 'string') {
    return (
      <>
        <pre
          className="font-mono text-[12px] whitespace-pre-wrap"
          style={{ color: 'var(--rm-text)' }}
        >
          {spec.pattern}
        </pre>
        {typeof spec.notes === 'string' && (
          <p className="mt-2 text-[11px] italic" style={{ color: 'var(--rm-text-secondary)' }}>
            {spec.notes}
          </p>
        )}
      </>
    );
  }

  // Structured shape used by the auto-validator: schema / rowCount /
  // requiredValues / cellValues. Render each section that's present.
  const schema: Array<{ name: string; type: string }> | undefined = spec.schema;
  const rowCount: number | undefined = spec.rowCount;
  const requiredValues: Array<unknown> | undefined = spec.requiredValues;
  const cellValues: Array<{ row: number; col: number | string; value: unknown; tolerance?: number }> | undefined = spec.cellValues;

  const formatRequiredValue = (v: unknown): string => {
    if (v && typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
      const obj = v as { value: unknown; tolerance?: number };
      return `${String(obj.value)}${obj.tolerance != null ? ` (±${obj.tolerance})` : ''}`;
    }
    return String(v);
  };

  return (
    <div className="space-y-3 text-[12px]" style={{ color: 'var(--rm-text)' }}>
      {schema && schema.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--rm-text-secondary)' }}>
            Schema
          </p>
          <ul className="font-mono space-y-0.5">
            {schema.map((field) => (
              <li key={field.name}>
                <span style={{ color: 'var(--rm-text-heading, var(--rm-text))' }}>{field.name}</span>
                <span style={{ color: 'var(--rm-text-secondary)' }}>{': '}</span>
                <span style={{ color: 'var(--rm-accent)' }}>{field.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {typeof rowCount === 'number' && (
        <div className="font-mono">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--rm-text-secondary)' }}>
            Rows
          </span>
          <span className="ml-2">{rowCount}</span>
        </div>
      )}

      {requiredValues && requiredValues.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--rm-text-secondary)' }}>
            Must contain
          </p>
          <p className="font-mono leading-relaxed">
            {requiredValues.map(formatRequiredValue).join(', ')}
          </p>
        </div>
      )}

      {cellValues && cellValues.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--rm-text-secondary)' }}>
            Cell checks
          </p>
          <ul className="font-mono space-y-0.5">
            {cellValues.map((cell, i) => (
              <li key={i}>
                row {cell.row}, col {String(cell.col)} = {String(cell.value)}
                {cell.tolerance != null ? ` (±${cell.tolerance})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Rationale Card ─────────────────────────────────────────────────────────── */

function RationaleCard({ field, result }: { field: TemplateField; result: boolean | null }) {
  const rationale = field.rationale || field.distractorRationale;
  if (!rationale) return null;

  const isCorrect = result === true;
  const tint = isCorrect ? SUCCESS_RGB : ERROR_RGB;

  return (
    <div
      className="rounded-[14px] px-4 py-3 text-[13px] leading-relaxed"
      style={{
        background: `rgba(${tint},0.08)`,
        border: `1px solid rgba(${tint},0.2)`,
        color: 'var(--rm-text)',
      }}
    >
      <span className="font-semibold" style={{ color: `rgb(${tint})` }}>
        {isCorrect ? 'Correct' : 'Explanation'}:
      </span>{' '}
      {rationale}
    </div>
  );
}

/* ── Evidence Panel ─────────────────────────────────────────────────────────── */

/** Reformat Spark explain plan text for readability */
function formatExplainPlan(text: string): string {
  const metaKeys = ['Batched:', 'DataFilters:', 'Format:', 'PushedFilters:', 'ReadSchema:', 'PartitionFilters:', 'Location:', 'SelectedBucketing:', 'PushedAggregation:'];

  const formatted = text.split('\n').map((line) => {
    // Break FileScan metadata: split after column list "]" before first metadata key
    const keyCount = metaKeys.filter((k) => line.includes(k)).length;
    if (keyCount >= 2) {
      const indent = line.match(/^(\s*)/)?.[1] ?? '';
      const metaPad = indent + '        ';
      let result = line;
      // Break before each metadata key onto its own line
      for (const key of metaKeys) {
        result = result.replace(
          new RegExp(`\\s*,?\\s*(?=${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`),
          `\n${metaPad}`
        );
      }
      return result;
    }
    return line;
  }).join('\n');

  // Add a blank line before major operator nodes for visual grouping
  // (lines starting with tree connectors at low indent depth)
  return formatted.split('\n').reduce<string[]>((acc, line, i) => {
    if (i > 0) {
      const prevIndent = (acc[acc.length - 1]?.match(/^(\s*)/)?.[1] ?? '').length;
      const currIndent = (line.match(/^(\s*)/)?.[1] ?? '').length;
      const isOperator = /^\s*[\+:\|]-?\s*(FileScan|Exchange|BroadcastExchange|Sort|HashAggregate|Filter|Project|SortMergeJoin|BroadcastHashJoin|Execute|AdaptiveSparkPlan)\b/.test(line);
      // Insert blank line before top-level branches (indent <= 6) that start a new operator
      if (isOperator && currIndent <= prevIndent && currIndent <= 6 && acc[acc.length - 1]?.trim() !== '') {
        acc.push('');
      }
    }
    acc.push(line);
    return acc;
  }, []).join('\n');
}

/** Syntax-highlight a Spark explain plan as HTML */
function highlightSparkPlan(text: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc(text)
    // Section headers: == Physical Plan ==
    .replace(/(==\s*.*?\s*==)/g, '<span style="color:#99f7ff;font-weight:600">$1</span>')
    // Operators: Project, Filter, FileScan, Sort, Exchange, HashAggregate, BroadcastHashJoin, etc.
    .replace(/\b(Project|Filter|FileScan|Sort|Exchange|HashAggregate|SortMergeJoin|BroadcastHashJoin|BroadcastExchange|AdaptiveSparkPlan|Execute|InsertIntoHadoopFsRelationCommand|RoundRobinPartitioning|BroadcastNestedLoopJoin|CartesianProduct|Union|Expand|Window|TakeOrderedAndProject|GlobalLimit|LocalLimit|Subquery|ReusedExchange)\b/g,
      '<span style="color:#7ee787">$1</span>')
    // Metadata keys
    .replace(/\b(Batched|DataFilters|Format|PushedFilters|PushedAggregation|ReadSchema|PartitionFilters|Location|isFinalPlan|Inner|LeftOuter|RightOuter|FullOuter|BuildRight|BuildLeft|Overwrite|Append|ASC|DESC|NULLS FIRST|NULLS LAST|ENSURE_REQUIREMENTS|REPARTITION_BY_NUM)\b/g,
      '<span style="color:#d2a8ff">$1</span>')
    // Boolean & null
    .replace(/\b(true|false|null)\b/g, '<span style="color:#ffa657">$1</span>')
    // Numbers (standalone, not inside identifiers)
    .replace(/(?<![#\w])(\d+)(?![#\w])/g, '<span style="color:#ffa657">$1</span>')
    // Column references: name#id
    .replace(/(\w+)(#\d+)/g, '<span style="color:#79c0ff">$1</span><span style="color:#484f58">$2</span>')
    // Functions: isnotnull(...), EqualTo(...), IsNotNull(...)
    .replace(/\b(isnotnull|isnull|EqualTo|IsNotNull|IsNull|GreaterThan|GreaterThanOrEqual|LessThan|LessThanOrEqual|In|Not|And|Or|StringStartsWith|Contains)\s*(?=\()/g,
      '<span style="color:#d2a8ff">$1</span>')
    // Tree connectors: +- :- : (dim them)
    .replace(/^(\s*)([\+:\|]\-?\s)/gm, '$1<span style="color:#484f58">$2</span>')
    // parquet / csv / orc file format keywords
    .replace(/\b(parquet|csv|orc|json|avro)\b/gi, '<span style="color:#ffa657">$1</span>')
    // struct<...> type definitions
    .replace(/(struct)(&lt;)/g, '<span style="color:#d2a8ff">$1</span>$2');
}

function EvidenceLabelledBlock({ content, label, isCode = true }: { content: string; label?: string; isCode?: boolean }) {
  const displayContent = isCode ? content : formatExplainPlan(content);
  const lines = displayContent.split('\n');
  // Remove single trailing empty line
  if (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  const lineCount = lines.length;

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ backgroundColor: 'var(--rm-code-bg, #0d1117)', border: '1px solid var(--rm-border)' }}>
      {/* Toolbar — mirrors solution.py header */}
      {label && (
        <div
          className="flex items-center px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--rm-border)' }}
        >
          <span className="w-2 h-2 rounded-full shrink-0 mr-2" style={{ backgroundColor: 'var(--rm-text-secondary)', opacity: 0.4 }} />
          <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--rm-text-secondary)' }}>
            {label}
          </span>
        </div>
      )}
      {/* Code area with line numbers */}
      <div className="overflow-x-auto">
        <div className="flex">
          {/* Line numbers */}
          <div
            className="select-none text-right pr-3 pl-4 py-4 font-mono text-[13px] leading-relaxed shrink-0"
            style={{ color: 'var(--rm-text-secondary)', opacity: 0.3, borderRight: '1px solid var(--rm-border)' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Content */}
          <pre
            className="flex-1 font-mono text-[13px] leading-relaxed p-4 whitespace-pre-wrap break-words"
            style={{ color: 'var(--rm-code-text, #e2e8f0)', minWidth: 0 }}
            dangerouslySetInnerHTML={{ __html: isCode ? highlightPython(displayContent) : highlightSparkPlan(displayContent) }}
          />
        </div>
      </div>
    </div>
  );
}

function EvidencePanel({ evidence }: { evidence: any }) {
  if (!evidence) return null;
  const ev = evidence;
  // Skip rendering if evidence is an empty object
  if (typeof ev === 'object' && !Array.isArray(ev) && Object.keys(ev).length === 0) return null;

  // Handle array of structured evidence items (tables, code blocks, etc.)
  if (Array.isArray(ev)) {
    if (ev.length === 0) return null;
    return (
      <div>
        <h4
          className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
          style={{ color: 'var(--rm-text-secondary)' }}
        >
          Evidence
        </h4>
        <div className="space-y-4">
          {ev.map((item: any, idx: number) => {
            if (item.type === 'table' && item.headers && item.rows) {
              return (
                <div key={item.id ?? idx}>
                  {item.title && (
                    <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--rm-text)' }}>{item.title}</p>
                  )}
                  {item.caption && (
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--rm-text-secondary)' }}>{item.caption}</p>
                  )}
                  <div className="overflow-x-auto rounded-[10px]" style={{ border: '1px solid var(--rm-border)' }}>
                    <table className="w-full text-[11px] font-mono border-collapse">
                      <thead>
                        <tr>
                          {item.headers.map((h: string, hi: number) => (
                            <th
                              key={hi}
                              className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                              style={{ backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text-secondary)', borderBottom: '1px solid var(--rm-border)' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {item.rows.map((row: string[], ri: number) => (
                          <tr key={ri}>
                            {row.map((cell: string, ci: number) => (
                              <td
                                key={ci}
                                className="px-3 py-1.5"
                                style={{ color: 'var(--rm-text)', borderBottom: ri < item.rows.length - 1 ? '1px solid var(--rm-border)' : 'none' }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
            if (item.type === 'code_block' && item.content) {
              return (
                <div key={item.id ?? idx}>
                  {item.title && (
                    <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--rm-text)' }}>{item.title}</p>
                  )}
                  <EvidenceLabelledBlock content={item.content} label={item.label} isCode />
                </div>
              );
            }
            if (item.type === 'text' && item.content) {
              return (
                <div key={item.id ?? idx}>
                  {item.title && (
                    <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--rm-text)' }}>{item.title}</p>
                  )}
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--rm-text)' }}>{item.content}</p>
                </div>
              );
            }
            if (item.type === 'policy_document' && item.sections) {
              return (
                <div key={item.id ?? idx} className="space-y-3">
                  {item.title && (
                    <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--rm-text)' }}>{item.title}</p>
                  )}
                  {item.caption && (
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--rm-text-secondary)' }}>{item.caption}</p>
                  )}
                  {(item.sections as Array<{ section: string; text: string }>).map((sec, si) => (
                    <div
                      key={si}
                      className="rounded-[10px] px-4 py-3"
                      style={{ backgroundColor: 'var(--rm-bg-elevated)', border: '1px solid var(--rm-border)' }}
                    >
                      <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--rm-text)' }}>{sec.section}</p>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--rm-text-secondary)' }}>{sec.text}</p>
                    </div>
                  ))}
                </div>
              );
            }
            if (item.type === 'incident_timeline_panel' && item.fields) {
              return (
                <div key={item.id ?? idx} className="space-y-2">
                  {item.title && (
                    <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--rm-text)' }}>{item.title}</p>
                  )}
                  {item.caption && (
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--rm-text-secondary)' }}>{item.caption}</p>
                  )}
                  {(item.fields as Array<{ id: string; label: string; value_source?: string }>).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-[10px] px-4 py-2.5"
                      style={{ backgroundColor: 'var(--rm-bg-elevated)', border: '1px solid var(--rm-border)' }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'rgba(153,247,255,0.4)' }} />
                      <span className="text-[12px]" style={{ color: 'var(--rm-text)' }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4
        className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
        style={{ color: 'var(--rm-text-secondary)' }}
      >
        Evidence
      </h4>
      <div className="space-y-3">
        {/* Simple content string — syntax highlighted */}
        {ev.content && typeof ev.content === 'string' && (
          <EvidenceLabelledBlock content={ev.content} isCode={ev.type === 'code_block' || ev.language === 'python'} />
        )}

        {/* Scenario with layers — syntax highlighted */}
        {ev.layers && (
          <div className="space-y-2">
            {Object.entries(ev.layers as Record<string, string>).map(([key, val]) => (
              <EvidenceLabelledBlock key={key} content={val} label={key.replace(/([A-Z])/g, ' $1').trim()} />
            ))}
          </div>
        )}

        {/* two_plans — planA / planB each with code + plan */}
        {ev.planA && ev.planB && (
          <div className="space-y-3">
            {[ev.planA, ev.planB].map((plan: any, idx: number) => (
              <div key={idx} className="space-y-2">
                {plan.label && (
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--rm-text-secondary)' }}>{plan.label}</p>
                )}
                {plan.code && <EvidenceLabelledBlock content={plan.code} />}
                {plan.plan && <EvidenceLabelledBlock content={plan.plan} label="Execution Plan" isCode={false} />}
              </div>
            ))}
          </div>
        )}

        {/* Combined: code block */}
        {ev.codeBlock && (
          <EvidenceLabelledBlock
            content={ev.codeBlock.content ?? (typeof ev.codeBlock === 'string' ? ev.codeBlock : '')}
            label={ev.codeBlock.label}
          />
        )}

        {/* Combined: execution plan */}
        {ev.executionPlan && (
          <EvidenceLabelledBlock content={ev.executionPlan.content} label={ev.executionPlan.label ?? 'Execution Plan'} isCode={false} />
        )}

        {/* Combined: stage metrics */}
        {ev.stageMetrics && (
          <EvidenceLabelledBlock content={ev.stageMetrics.content} label={ev.stageMetrics.label ?? 'Stage Metrics'} isCode={false} />
        )}

        {/* Combined: cluster dashboard */}
        {ev.clusterDashboard && (
          <EvidenceLabelledBlock
            content={ev.clusterDashboard.content}
            label={ev.clusterDashboard.label ?? ev.clusterDashboard.description ?? 'Cluster Dashboard'}
            isCode={false}
          />
        )}

        {ev.errorLog && (
          <div className="rounded-[14px] p-3" style={{ backgroundColor: `rgba(${RED_RGB},0.05)`, border: `1px solid rgba(${RED_RGB},0.15)` }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: `rgb(${RED_RGB})` }}>Error Log</p>
            <pre className="font-mono text-[12px] whitespace-pre-wrap" style={{ color: 'var(--rm-code-text)' }}>
              {ev.errorLog.content ?? ev.errorLog}
            </pre>
          </div>
        )}
        {ev.runtimeOutput && (
          <div className="rounded-[14px] p-3" style={{ backgroundColor: 'var(--rm-callout-bg)', border: '1px solid var(--rm-callout-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--rm-text-secondary)' }}>Runtime Output</p>
            <pre className="font-mono text-[12px] whitespace-pre-wrap" style={{ color: 'var(--rm-code-text)' }}>
              {ev.runtimeOutput.content ?? ev.runtimeOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

export function SplitPanelCodeTask({
  task,
  practiceSet,
  topic,
  taskState,
  isReview,
  onAnswerChange,
  onOutputChange,
  onCheck,
  onNext,
  onSkip,
  onPrev,
  isFirst,
  checked,
  isLast,
  unlockedHints: unlockedHintsProp,
  onUnlockHint,
}: SplitPanelCodeTaskProps) {
  /* Determine if this is a code task or a template-based task */
  const isCodeTask = !!(task.starterScaffold);
  const fields = task.template?.fields ?? [];

  /* MCQ-only tasks render full-width: shared scenario on top, then per-question
     cards with options laid out as a responsive grid. The split-panel UX is
     wasteful for pure multiple-choice (left side has just "Select the best
     answer"), so we collapse it into a single column flow. */
  const isMcqOnlyTask =
    !isCodeTask &&
    fields.length > 0 &&
    fields.every((f) => f.type === 'single_select');

  /* Multi-question MCQ tasks (e.g. JA6 refactor-reading with 4-5 sub-Qs)
     would otherwise show all questions stacked on the right, which makes
     "Q1 mentions Line 11, Q2 mentions Line 22" cross-referencing hard:
     20 answer cards on screen at once is overload. For these tasks we
     switch to a vertical stack — code block on top (height-capped, scrolls
     internally), one question at a time below — with a stepper to walk
     through the questions while the code stays anchored. */
  const isMultiQuestionMcqTask = isMcqOnlyTask && fields.length > 1;
  // currentFieldIndex = which sub-question is active in the right-side
  // answers panel (the panel is always visible in multi-q mode; the
  // question navigator at the top of the panel switches between them).
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  useEffect(() => {
    setCurrentFieldIndex(0);
  }, [task.id]);
  const clampedFieldIndex = Math.min(
    Math.max(0, currentFieldIndex),
    Math.max(0, fields.length - 1),
  );
  const goToField = useCallback(
    (next: number) => {
      const max = Math.max(0, fields.length - 1);
      setCurrentFieldIndex(Math.min(Math.max(0, next), max));
    },
    [fields.length],
  );
  // Wrap onAnswerChange so that, in multi-q mode, picking an answer for
  // the first time auto-advances to the next question after a short delay
  // (long enough that the option's selected state is visible before the
  // panel slides). Re-selecting an existing answer doesn't trigger advance,
  // so users can correct without losing their place.
  //
  // Pending timeouts are tracked in a ref so that:
  //   1. Navigating to a different task while an advance is pending
  //      cancels the timer — otherwise the stale timer would fire on the
  //      newly-mounted task and jump its field index to 1 (the bug we
  //      saw "moving towards different chapters").
  //   2. Concurrent picks (e.g., correcting an answer mid-timer) coalesce
  //      to the latest one.
  const advanceTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current != null) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [task.id]);
  useEffect(
    () => () => {
      if (advanceTimeoutRef.current != null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    },
    [],
  );
  const handleSelectAnswer = useCallback(
    (fieldId: string, value: string) => {
      const previousValue = (taskState.answers[fieldId]?.value ?? '').trim();
      onAnswerChange(fieldId, value);
      if (
        !isMultiQuestionMcqTask ||
        taskState.checked ||
        isReview ||
        previousValue.length > 0 ||
        clampedFieldIndex >= fields.length - 1
      ) {
        return;
      }
      const next = clampedFieldIndex + 1;
      const taskIdAtScheduleTime = task.id;
      // Cancel any prior pending advance — keep only the latest.
      if (advanceTimeoutRef.current != null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
      // 320ms gives the user enough time to see the selected state lock
      // in before the panel begins its slide. Combined with a 460ms slide,
      // total click-to-arrival is ~780ms — Apple-pacing rather than snappy.
      advanceTimeoutRef.current = window.setTimeout(() => {
        advanceTimeoutRef.current = null;
        // Bail if the task changed while waiting (user clicked Continue or
        // navigated via the navigator chips). The cleanup useEffect would
        // normally clear the timer on task change, but guarding here is
        // cheap and protects against any timing window where the timer
        // fires before the cleanup runs.
        if (task.id !== taskIdAtScheduleTime) return;
        setCurrentFieldIndex((cur) => (cur === clampedFieldIndex ? next : cur));
      }, 320);
    },
    [
      clampedFieldIndex,
      fields.length,
      isMultiQuestionMcqTask,
      isReview,
      onAnswerChange,
      task.id,
      taskState.answers,
      taskState.checked,
    ],
  );
  // Keyboard nav between sub-questions when focus is on a navigator chip
  // inside the answers panel. ←/↑ previous, →/↓ next.
  useEffect(() => {
    if (!isMultiQuestionMcqTask) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const inNavigator = !!target?.closest('[data-question-nav]');
      if (!inNavigator) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentFieldIndex((i) => {
          const next = Math.max(0, i - 1);
          requestAnimationFrame(() => {
            const all = document.querySelectorAll<HTMLElement>('[data-question-nav]');
            all[next]?.focus();
          });
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentFieldIndex((i) => {
          const next = Math.min(fields.length - 1, i + 1);
          requestAnimationFrame(() => {
            const all = document.querySelectorAll<HTMLElement>('[data-question-nav]');
            all[next]?.focus();
          });
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMultiQuestionMcqTask, fields.length]);

  /* Track viewport size so we can stack panels vertically on mobile,
     where a 50/50 horizontal split leaves the editor unusably narrow. */
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Left panel tab */
  const [leftTab, setLeftTab] = useState<LeftTab>('context');

  /* Tiered hints — when the parent owns this state (lifted form, used by
     the practice runner so it can dock reward on hint usage), defer to the
     prop. Otherwise fall back to local state so any standalone caller still
     works. */
  const [localUnlockedHints, setLocalUnlockedHints] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    task.hints?.forEach((h) => {
      if (h.tier === 'H1') initial.add(h.tier);
    });
    return initial;
  });
  const unlockedHints = unlockedHintsProp ?? localUnlockedHints;

  /* Live reward state — what the user will earn for solving this task
     given which hints they've already unlocked. Surfaced as a small ring
     in the editor toolbar so the cost-of-help is always visible. The
     same calc runs in PracticeSetViewer's reward-dock effect, so what
     the ring shows = what the user actually receives on success. */
  const rewardTrackSlug = (() => {
    const raw = (practiceSet.metadata?.trackLevel ?? 'junior').toLowerCase();
    return raw.replace(/-level$/, '');
  })();
  const reward = effectiveReward(task, unlockedHints, rewardTrackSlug);

  /* Tracks the most recently unlocked hint so we can play one-shot
     animations (kWh float, badge punch, card flash) without re-triggering
     them on every re-render. Cleared after the longest animation finishes. */
  const [recentUnlock, setRecentUnlock] = useState<{ tier: string; cost: number } | null>(null);
  const handleUnlockHint = useCallback(
    (tier: string, cost: number = 0) => {
      if (onUnlockHint) {
        onUnlockHint(tier);
      } else {
        setLocalUnlockedHints((prev) => new Set(prev).add(tier));
      }
      setRecentUnlock({ tier, cost });
      // Hold past the longest animation (kwhFloat 1100ms) so it isn't
      // cut short by the cleanup. Slight buffer for slow paint frames.
      window.setTimeout(() => {
        setRecentUnlock((cur) => (cur?.tier === tier ? null : cur));
      }, 1300);
    },
    [onUnlockHint],
  );

  /* Code state */
  const scaffold = task.starterScaffold?.content ?? '';
  const initialCode = taskState.answers['__code']?.value || scaffold;
  const [code, setCode] = useState(initialCode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Execution state — initialized from persisted taskState so a refresh
     mid-session shows the last run's output and verdict alongside the
     restored code, instead of an empty console. */
  const [output, setOutput] = useState<string | null>(taskState.output ?? null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  // Run-evidence — call log + numeric literals from the user's code. Set
  // by handleRun and pushed to the parent via onOutputChange so the
  // validator can do proof-of-work and hardcode-detection checks.
  const [lastRunMeta, setLastRunMeta] = useState<RunMeta | null>(null);

  /* One-way sync: reducer → local. When the reducer state's __code or
     output value changes externally (e.g. session-restore from
     sessionStorage on page refresh), adopt it locally so the editor and
     console reflect the persisted attempt. The local-edit path still
     pushes UP via onAnswerChange / onOutputChange, but it must NOT push
     the just-synced value back up — doing so would dispatch SET_ANSWER,
     which resets `checked = false` and wipes the restored verdict.
     `lastPushedCodeRef` tracks the last value we sent up, so the push-up
     effect skips the round-trip on synced values. */
  const lastPushedCodeRef = useRef<string>(initialCode);
  const externalCode = taskState.answers['__code']?.value;
  useEffect(() => {
    if (typeof externalCode === 'string' && externalCode !== code) {
      setCode(externalCode);
      lastPushedCodeRef.current = externalCode;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCode]);
  const externalOutput = taskState.output;
  useEffect(() => {
    if (typeof externalOutput === 'string' && externalOutput !== output) {
      setOutput(externalOutput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOutput]);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputCollapsed, setOutputCollapsed] = useState(false);

  /* Surface the run shortcut so users discover Cmd/Ctrl+Enter without
     having to read docs or stumble onto it. */
  const runShortcutLabel = useMemo(() => {
    if (typeof navigator === 'undefined') return 'Ctrl + Enter';
    return /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ Enter' : 'Ctrl + Enter';
  }, []);

  /* Sync code changes to parent — but skip if the change came from a
     reducer→local sync (lastPushedCodeRef tracks what we already know
     parent has), otherwise SET_ANSWER would reset `checked` and wipe the
     restored verdict. */
  useEffect(() => {
    if (code === lastPushedCodeRef.current) return;
    lastPushedCodeRef.current = code;
    onAnswerChange('__code', code);
  }, [code, onAnswerChange]);

  /* Sync run output + meta up so CHECK_ANSWERS can validate against
     expectedOutput AND the anti-cheat heuristics. */
  useEffect(() => {
    if (output != null && onOutputChange) {
      onOutputChange(output, lastRunMeta ?? undefined);
    }
  }, [output, lastRunMeta, onOutputChange]);

  /* Datasets for this task */
  const taskDatasets = useMemo(() => {
    const allDs = (practiceSet as any).datasets as PracticeSetDataset[] | undefined;
    if (!allDs) return [];
    return allDs.filter(
      (ds) => !ds.usedByTasks || ds.usedByTasks.includes(task.id),
    );
  }, [practiceSet, task.id]);

  /* Schema fields from scaffold */
  const schemaFields = useMemo(() => parseSchemaFromScaffold(scaffold), [scaffold]);

  /* Available left tabs */
  const availableTabs = useMemo(() => {
    const tabs: LeftTab[] = ['context'];
    if (taskDatasets.length > 0) tabs.push('dataset');
    if (task.description.validationHint || (task.hints && task.hints.length > 0)) tabs.push('hints');
    return tabs;
  }, [taskDatasets, task.description.validationHint, task.hints]);

  /* For MCQ-only tasks the left panel is only worth showing when it carries
     real shared context (scenario, datasets, hints). For checkpoint-style
     tasks where each question stands alone, drop the panel entirely so the
     question + options are the only thing on screen. */
  const mcqHasMeaningfulLeft =
    isMcqOnlyTask &&
    Boolean(
      task.description.context ||
        task.description.task ||
        taskDatasets.length > 0 ||
        (task.hints && task.hints.length > 0) ||
        task.description.validationHint
    );
  const showLeftForMcq = isMcqOnlyTask ? mcqHasMeaningfulLeft : true;

  /* Stable ref to handleRun for keyboard shortcut */
  const handleRunRef = useRef<() => void>();

  /* Tab → 4 spaces; Enter → smart auto-indent (match previous line's
     indent and add 4 more after a colon — Python indentation that
     would otherwise require multiple Tab taps to recreate on mobile);
     Cmd/Ctrl+Enter → run. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newCode = code.substring(0, start) + '    ' + code.substring(end);
        setCode(newCode);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
        return;
      }
      // Cmd/Ctrl + Enter to run
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!running && !isReview) {
          handleRunRef.current?.();
        }
        return;
      }
      // Plain Enter — preserve indent + extend after a trailing colon.
      // Skipped when a modifier (Shift/Alt) is held so power users keep
      // their browser-native behavior.
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start !== end) return; // selection-replace: defer to default
        const before = code.substring(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const currentLine = before.slice(lineStart);
        const indentMatch = currentLine.match(/^[ \t]*/);
        const indent = indentMatch ? indentMatch[0] : '';
        const trimmed = currentLine.trimEnd();
        const extraIndent = trimmed.endsWith(':') ? '    ' : '';
        const insert = '\n' + indent + extraIndent;
        if (!indent && !extraIndent) return; // nothing to add — let browser handle
        e.preventDefault();
        const newCode = before + insert + code.substring(end);
        setCode(newCode);
        requestAnimationFrame(() => {
          const next = start + insert.length;
          ta.selectionStart = ta.selectionEnd = next;
        });
      }
    },
    [code, running, isReview],
  );

  /* Insert a character at the textarea cursor — used by the mobile
     quick-insert toolbar so users can type Tab / brackets / quotes /
     colon without those keys being absent from soft keyboards. */
  const insertAtCursor = useCallback(
    (chars: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart ?? code.length;
      const end = ta.selectionEnd ?? code.length;
      const newCode = code.substring(0, start) + chars + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        const next = start + chars.length;
        ta.selectionStart = ta.selectionEnd = next;
        ta.focus({ preventScroll: true });
      });
    },
    [code],
  );

  /* Fetch dataset content for execution */
  const fetchFullCsv = useCallback(
    async (file: string): Promise<string> => {
      const params = new URLSearchParams({ topic, file, full: 'true' });
      const res = await fetch(`/api/operations/datasets?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch dataset: ${file}`);
      const json = await res.json();
      return json.rawCsv ?? json.rawJson ?? '';
    },
    [topic],
  );

  /* Run code */
  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    setError(null);
    setOutputCollapsed(false);

    try {
      if (!pyodideReady) {
        setPyodideLoading(true);
      }
      const pyodide = await getPyodide();
      setPyodideReady(true);
      setPyodideLoading(false);

      // Write CSV datasets to virtual filesystem
      if (taskDatasets.length > 0) {
        const dirs = new Set<string>();
        for (const ds of taskDatasets) {
          const parts = ds.file.split('/');
          if (parts.length > 1) {
            for (let i = 1; i <= parts.length - 1; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
          }
        }
        for (const dir of dirs) {
          try {
            pyodide.FS.mkdir(dir);
          } catch {
            /* may exist */
          }
        }

        for (const ds of taskDatasets) {
          const csvContent = await fetchFullCsv(ds.file);
          pyodide.FS.writeFile(ds.file, csvContent);
          const underscoreName = ds.file.replace(/\//g, '_');
          pyodide.FS.writeFile(underscoreName, csvContent);
          // Also write to data/bronze/ for capstone scaffold compatibility
          const basename = ds.file.split('/').pop() ?? ds.file;
          if (basename !== ds.file) {
            pyodide.FS.writeFile(basename, csvContent);
          }
          try {
            pyodide.FS.mkdir('data');
          } catch { /* exists */ }
          try {
            pyodide.FS.mkdir('data/bronze');
          } catch { /* exists */ }
          pyodide.FS.writeFile(`data/bronze/${basename}`, csvContent);
        }
      }

      const isPySpark =
        (task.starterScaffold?.language ?? 'python') === 'python' &&
        (code.includes('pyspark') ||
          code.includes('SparkSession') ||
          code.includes('spark.read') ||
          Boolean(task.setupCode));

      // Prepend hidden setup code (e.g. capstone chapter dependencies)
      const setupPrefix = task.setupCode ? `${task.setupCode}\n` : '';
      const fullCode = isPySpark ? `${PYSPARK_MOCK}\n\n${setupPrefix}${code}` : `${setupPrefix}${code}`;

      await pyodide.runPythonAsync(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
try:
    _PYSPARK_CALL_LOG.clear()
except NameError:
    pass
`);

      try {
        await pyodide.runPythonAsync(fullCode);
      } catch (pyErr: unknown) {
        const partialOut = await pyodide.runPythonAsync('sys.stdout.getvalue()');
        const stderrOut = await pyodide.runPythonAsync('sys.stderr.getvalue()');
        await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
        const outStr = String(partialOut || '');
        const errStr = String(stderrOut || '');
        const pyMessage = pyErr instanceof Error ? pyErr.message : String(pyErr);
        const cleanError = cleanPyodideError(pyMessage);
        if (outStr) setOutput(outStr);
        setError(errStr ? `${errStr}\n${cleanError}` : cleanError);
        // Stamp the meta with this run's source so the validator's
        // tamper-detection heuristic still has a userCode reference;
        // call log + literals are intentionally empty so an exception
        // can't leak the previous run's evidence.
        setLastRunMeta({ callLog: [], literals: [], userCode: code });
        return;
      }

      // Set the AST source AFTER user code finishes — if we set it
      // before, the user's own code could `_USER_CODE_FOR_AST = '...'`
      // mid-execution and we'd parse the fake string. Setting it
      // post-run means whatever the user reassigned during exec gets
      // overwritten right before extraction.
      try {
        const py = pyodide as unknown as { globals?: { set?: (k: string, v: unknown) => void } };
        py.globals?.set?.('_USER_CODE_FOR_AST', code);
      } catch {
        /* pyodide.globals may be unavailable in older versions; AST step degrades */
      }

      const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

      // Pull out the run-evidence: which mock methods got called +
      // numeric literals from the user's code. Both feed the
      // validator's anti-cheat checks (proof-of-work + hardcode
      // detection). The trailing bare-expression (`_CALL_LOG_JSON` /
      // `_LITERALS_JSON`) is required — pyodide.runPythonAsync returns
      // the value of the last EXPRESSION, not the value of a try/except
      // block (which is a statement). Without it the result is None and
      // every legitimate solution gets flagged "missing apis".
      let callLogJson = '[]';
      let literalsJson = '[]';
      try {
        callLogJson = String(await pyodide.runPythonAsync(`
import json as _json_extract
_CALL_LOG_JSON = '[]'
try:
    _CALL_LOG_JSON = _json_extract.dumps(sorted(_PYSPARK_CALL_LOG))
except Exception:
    pass
_CALL_LOG_JSON
`)) || '[]';
      } catch { /* leave default */ }
      try {
        literalsJson = String(await pyodide.runPythonAsync(`
import ast as _ast_extract, json as _json_extract2
_LITERALS_JSON = '[]'
try:
    _tree = _ast_extract.parse(_USER_CODE_FOR_AST)
    _lits = sorted({
        n.value for n in _ast_extract.walk(_tree)
        if isinstance(n, _ast_extract.Constant) and isinstance(n.value, (int, float))
        and not isinstance(n.value, bool)
    }, key=lambda v: (str(type(v)), v))
    _LITERALS_JSON = _json_extract2.dumps(_lits)
except Exception:
    pass
_LITERALS_JSON
`)) || '[]';
      } catch { /* leave default */ }

      let callLog: string[] = [];
      let literals: number[] = [];
      try { callLog = JSON.parse(callLogJson) as string[]; } catch { /* keep [] */ }
      try { literals = JSON.parse(literalsJson) as number[]; } catch { /* keep [] */ }

      await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

      const outStr = String(stdout || '');
      const errStr = String(stderr || '');
      const meta: RunMeta = { callLog, literals, userCode: code };
      setLastRunMeta(meta);
      if (outStr) setOutput(outStr);
      if (errStr) setError(errStr);
      if (!outStr && !errStr) setOutput('(Code executed successfully with no output)');
    } catch (err) {
      setPyodideLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(cleanPyodideError(msg));
    } finally {
      setRunning(false);
    }
  }, [code, taskDatasets, task.starterScaffold?.language, topic, pyodideReady, fetchFullCsv]);

  /* Keep ref in sync for keyboard shortcut */
  handleRunRef.current = handleRun;

  /* Copy code */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  /* Reset */
  const handleReset = useCallback(() => {
    setCode(scaffold);
    setOutput(null);
    setError(null);
  }, [scaffold]);

  /* Clear output */
  const handleClearOutput = useCallback(() => {
    setOutput(null);
    setError(null);
  }, []);

  const lineCount = code.split('\n').length;

  const showLeft = showLeftForMcq;
  const showRight = true;

  /* ── Resizable split ───────────────────────────────────────────────────────── */
  // Default favors the right (code) panel — code lines + scrollbars typically
  // need more horizontal room than the prose-only left panel.
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  /* ── Render ─────────────────────────────────────────────────────────────────── */

  return (
    <div className="relative">
      {/* Live reward ring — floats ABOVE the card on the page
          background, hugging the right edge of the editor column. Lives
          as a sibling of the card (not inside it) so the card's
          rounded `overflow-hidden` doesn't clip it. The capsule sits
          fully above the card top edge — bottom-12 ≈ 60px clearance so
          the Reset/Copy row underneath stays unobstructed. */}
      {isCodeTask && !isReview && reward.base > 0 && (
        <div
          className="absolute z-20"
          style={{
            // Anchor at the wrapper's top edge, then translate the ring
            // UP by its own height plus 12px breathing room so it sits
            // fully above the card without overlapping Reset/Copy.
            top: 0,
            right: 12,
            transform: 'translateY(calc(-100% - 12px))',
          }}
        >
          <RewardRing
            effective={reward.effective}
            base={reward.base}
            zeroed={reward.zeroed}
          />
        </div>
      )}

    <div
      className={
        isMcqOnlyTask
          ? 'w-full'
          : 'rounded-[18px] overflow-hidden'
      }
      style={
        isMcqOnlyTask
          ? undefined
          : {
              // Code tasks keep the single composite card. MCQ tasks are
              // rendered as two independent cards (code + answers) below.
              border: `1.5px solid var(--rm-border)`,
              backgroundColor: 'var(--rm-card-bg, var(--rm-bg-elevated))',
              boxShadow: 'var(--rm-card-shadow, none), 0 18px 36px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)',
            }
      }
    >
      {/* ─ Split Panels ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={
          isMcqOnlyTask
            ? 'flex flex-col md:flex-row md:gap-3 lg:gap-4 items-stretch md:justify-center'
            : 'flex flex-col lg:flex-row'
        }
        style={{ minHeight: isMobile || isMcqOnlyTask ? undefined : '560px' }}
      >
        {/* ─ Answers Panel (all MCQ tasks) ─────────────────────────────────
            Self-contained: question heading + options + rationale + inline
            footer (Back / Check / Continue). Multi-question variants get a
            numbered question navigator at the top of the header. */}
        {isMcqOnlyTask && showRight && (() => {
          const showFeedback = taskState.checked;
          const answeredCount = fields.filter(
            (f) => (taskState.answers[f.id]?.value ?? '').length > 0,
          ).length;
          const correctCount = fields.filter(
            (f) => taskState.answers[f.id]?.result === true,
          ).length;
          const field = fields[clampedFieldIndex];
          const answer = taskState.answers[field.id];
          const result = answer?.result ?? null;
          return (
            <section
              id={`answers-panel-${field.id}`}
              className="flex flex-col shrink-0"
              style={{
                // Flex order pushes the panel to the rightmost position
                // visually (after the code panel) without re-ordering JSX.
                order: 2,
                width: isMobile ? '100%' : 360,
                borderRadius: isMobile ? 0 : 14,
                border: `1.5px solid var(--rm-border)`,
                backgroundColor: 'var(--rm-card-bg, var(--rm-bg-elevated))',
                boxShadow: isMobile
                  ? undefined
                  : 'var(--rm-card-shadow, none), 0 18px 36px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)',
                position: isMobile ? undefined : 'sticky',
                top: isMobile ? undefined : 0,
                alignSelf: isMobile ? undefined : 'flex-start',
                maxHeight: isMobile ? undefined : '100vh',
                overflow: 'hidden',
              }}
            >
              {/* Header — single-q shows just a "Question" label; multi-q
                  also surfaces a numbered question navigator below it. */}
              <div
                className="px-4 py-3 shrink-0 space-y-2"
                style={{ borderBottom: '1px solid var(--rm-border)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--rm-text-secondary)' }}
                  >
                    {isMultiQuestionMcqTask ? 'Questions' : 'Question'}
                  </span>
                  {(isMultiQuestionMcqTask || taskState.checked) && (
                    <span
                      className="text-[10px] font-mono tracking-[0.1em]"
                      style={{
                        color: showFeedback
                          ? taskState.allCorrect
                            ? `rgb(${SUCCESS_RGB})`
                            : `rgb(${ERROR_RGB})`
                          : 'var(--rm-text-secondary)',
                      }}
                    >
                      {showFeedback
                        ? `${correctCount}/${fields.length}`
                        : `${answeredCount}/${fields.length}`}
                    </span>
                  )}
                </div>
                {isMultiQuestionMcqTask && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {fields.map((f, i) => {
                      const isActive = i === clampedFieldIndex;
                      const isAnswered = (taskState.answers[f.id]?.value ?? '').length > 0;
                      const fieldResult = showFeedback
                        ? taskState.answers[f.id]?.result ?? null
                        : null;
                      // Resolve chip visual state. Priority order:
                      //   1. Post-check correct  → green tinted, ✓ icon
                      //   2. Post-check wrong    → red tinted, ✗ icon
                      //   3. Pre-check answered  → filled chip (inverted)
                      //   4. Pre-check empty     → outlined number only
                      // Active chip gets a heavier border so the cursor
                      // is always findable on top of the base style.
                      let chipBg = 'transparent';
                      let chipBorder = 'var(--rm-border)';
                      let chipColor = 'var(--rm-text-secondary)';
                      if (showFeedback && fieldResult === true) {
                        chipBg = `rgba(${SUCCESS_RGB},0.12)`;
                        chipBorder = `rgb(${SUCCESS_RGB})`;
                        chipColor = `rgb(${SUCCESS_RGB})`;
                      } else if (showFeedback && fieldResult === false) {
                        chipBg = `rgba(${ERROR_RGB},0.12)`;
                        chipBorder = `rgb(${ERROR_RGB})`;
                        chipColor = `rgb(${ERROR_RGB})`;
                      } else if (isAnswered) {
                        chipBg = 'var(--rm-text-heading, var(--rm-text))';
                        chipBorder = 'var(--rm-text-heading, var(--rm-text))';
                        chipColor = 'var(--rm-bg)';
                      }
                      return (
                        <button
                          key={f.id}
                          type="button"
                          data-question-nav
                          onClick={() => goToField(i)}
                          aria-current={isActive ? 'step' : undefined}
                          aria-label={`Go to question ${i + 1}${isAnswered ? ' (answered)' : ''}`}
                          className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                          style={{
                            backgroundColor: chipBg,
                            border: `${isActive ? '1.5px' : '1px'} solid ${
                              isActive ? 'var(--rm-text-heading, var(--rm-text))' : chipBorder
                            }`,
                            color: chipColor,
                            // Outer ring on the active chip — visually
                            // separates it from the filled-answered look.
                            boxShadow: isActive
                              ? '0 0 0 2px var(--rm-card-bg, var(--rm-bg-elevated))'
                              : undefined,
                          }}
                        >
                          {showFeedback && fieldResult === true ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          ) : showFeedback && fieldResult === false ? (
                            <X className="h-3 w-3" strokeWidth={3} />
                          ) : (
                            i + 1
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Body — active question's heading + options + rationale.
                  Keyed on clampedFieldIndex so each question switch fades
                  + slides the new content in (no exit animation — keep it
                  cheap and predictable for keyboard/auto-advance). */}
              <div
                key={`q-body-${clampedFieldIndex}`}
                className="flex-1 overflow-y-auto p-4 space-y-4 question-body-anim"
              >
                <div className="flex items-start gap-2">
                  <h3
                    className="flex-1 text-[14px] sm:text-[15px] leading-snug font-semibold tracking-[-0.005em]"
                    style={{ color: 'var(--rm-text-heading, var(--rm-text))' }}
                  >
                    {field.label}
                  </h3>
                  {showFeedback && result === true && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] shrink-0 mt-1"
                      style={{ color: `rgb(${SUCCESS_RGB})` }}
                    >
                      <Check className="h-3 w-3" /> Correct
                    </span>
                  )}
                  {showFeedback && result === false && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] shrink-0 mt-1"
                      style={{ color: `rgb(${ERROR_RGB})` }}
                    >
                      <X className="h-3 w-3" /> Incorrect
                    </span>
                  )}
                </div>
                <FieldRenderer
                  field={field}
                  value={answer?.value ?? ''}
                  result={result}
                  checked={taskState.checked}
                  readOnly={isReview}
                  showResult={taskState.checked}
                  onChange={(v) => handleSelectAnswer(field.id, v)}
                  hideLabel
                />
                {showFeedback && (
                  <RationaleCard field={field} result={result} />
                )}
              </div>

              {/* Footer — Previous / Check Answer / Continue inline so the
                  user never has to scroll out to the outer footer. */}
              {(() => {
                const allFieldsFilled = fields.every((f) => {
                  const val = taskState.answers[f.id]?.value?.trim();
                  return val && val.length > 0;
                });
                const showCheck = !isReview && !taskState.checked;
                const showContinue = taskState.checked || isReview;
                return (
                  <div
                    className="flex items-center gap-2 px-4 py-3 shrink-0"
                    style={{
                      borderTop: '1px solid var(--rm-border)',
                      backgroundColor: 'var(--rm-bg-elevated)',
                    }}
                  >
                    {onPrev && !isFirst && (
                      <button
                        type="button"
                        onClick={onPrev}
                        className="inline-flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-[12px] font-medium transition-all duration-150 cursor-pointer hover:brightness-105"
                        style={{
                          border: '1px solid var(--rm-border)',
                          backgroundColor: 'var(--rm-bg-elevated)',
                          color: 'var(--rm-text-secondary)',
                        }}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </button>
                    )}
                    <div className="flex-1" />
                    {showCheck && (
                      <button
                        type="button"
                        onClick={onCheck}
                        disabled={!allFieldsFilled}
                        className="inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-[12px] font-semibold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          background: allFieldsFilled
                            ? 'var(--rm-text-heading)'
                            : 'var(--rm-bg-elevated)',
                          border: `1px solid ${
                            allFieldsFilled
                              ? 'var(--rm-text-heading)'
                              : 'var(--rm-border)'
                          }`,
                          color: allFieldsFilled
                            ? 'var(--rm-bg)'
                            : 'var(--rm-text-secondary)',
                        }}
                      >
                        Check Answer
                      </button>
                    )}
                    {showContinue && (
                      <button
                        type="button"
                        onClick={onNext}
                        className="inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-[12px] font-semibold transition-all duration-150 cursor-pointer hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          background: 'var(--rm-text-heading)',
                          border: '1px solid var(--rm-text-heading)',
                          color: 'var(--rm-bg)',
                        }}
                      >
                        {isLast ? 'See Results' : 'Continue'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </section>
          );
        })()}

        {/* ─ Left Panel ──────────────────────────────────────────────────── */}
        {showLeft && (
          <div
            className={
              isMcqOnlyTask
                ? 'shrink min-w-0 overflow-hidden'
                : 'overflow-y-auto'
            }
            style={{
              width: isMobile
                ? '100%'
                : isMcqOnlyTask
                  ? undefined
                  : `${splitPct}%`,
              // MCQ tasks: cap to ~95-char code width so the panel never
              // stretches to full screen on big monitors. Lines longer
              // than the cap wrap; shorter snippets size to content.
              maxWidth: isMcqOnlyTask && !isMobile ? 920 : undefined,
              // Code tasks cap the panel and let it scroll internally;
              // MCQ tasks let the panel grow naturally so all of the code
              // renders, with the page handling overflow.
              maxHeight: isMobile || isMcqOnlyTask ? undefined : '80vh',
              borderRadius: isMcqOnlyTask && !isMobile ? 14 : undefined,
              border: isMcqOnlyTask
                ? '1.5px solid var(--rm-border)'
                : undefined,
              backgroundColor: isMcqOnlyTask
                ? 'var(--rm-card-bg, var(--rm-bg-elevated))'
                : undefined,
              boxShadow:
                isMcqOnlyTask && !isMobile
                  ? 'var(--rm-card-shadow, none), 0 18px 36px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)'
                  : undefined,
            }}
          >
            {/* Sub-tabs — sticky on desktop where the left panel is its
                own scroll container; on mobile the page scrolls and there
                is no useful scroll-container to stick to. */}
            {availableTabs.length > 1 && (
              <div
                className="flex items-center gap-1 px-4 py-2.5 lg:sticky lg:top-0 lg:z-10"
                style={{
                  borderBottom: '1px solid var(--rm-border)',
                  backgroundColor: 'var(--rm-bg-elevated)',
                }}
              >
                {availableTabs.map((tab) => {
                  const active = leftTab === tab;
                  const tabConfig: Record<LeftTab, { icon: typeof FileText; label: string }> = {
                    context: { icon: FileText, label: 'Context' },
                    dataset: { icon: Database, label: 'Dataset' },
                    hints: { icon: Lightbulb, label: 'Hints' },
                  };
                  const { icon: TabIcon, label } = tabConfig[tab];
                  return (
                    <button
                      key={tab}
                      onClick={() => setLeftTab(tab)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-[11px] font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        color: active ? 'var(--rm-text)' : 'var(--rm-text-secondary)',
                        backgroundColor: active ? 'var(--rm-bg-elevated)' : 'transparent',
                        border: active ? '1px solid var(--rm-border)' : '1px solid transparent',
                      }}
                    >
                      <TabIcon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab content */}
            {leftTab === 'context' && (
              <div className="p-5 space-y-6">
                {/* Time estimate */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--rm-text-secondary)' }}>
                    <Clock className="h-3 w-3" />
                    ~{task.estimatedMinutes} min
                  </span>
                </div>

                {/* Title */}
                <h2
                  className="text-[17px] font-medium leading-snug"
                  style={{ color: 'var(--rm-text-heading, var(--rm-text))' }}
                >
                  {task.title}
                </h2>

                {/* Function signature — drill tasks ship a short API
                    snippet so the user sees the surface they're learning
                    before reading the scenario prose. */}
                {task.description.signature && (
                  <div>
                    <h4
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
                      style={{ color: 'var(--rm-text-secondary)' }}
                    >
                      Signature
                    </h4>
                    <pre
                      className="rounded-[14px] px-4 py-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words overflow-x-auto"
                      style={{
                        backgroundColor: 'var(--rm-code-bg, #0d1117)',
                        border: '1px solid var(--rm-border)',
                        color: 'var(--rm-code-text, #e2e8f0)',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightPython(task.description.signature),
                      }}
                    />
                  </div>
                )}

                {/* Context */}
                {task.description.context && (
                  <div>
                    <h4
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
                      style={{ color: 'var(--rm-text-secondary)' }}
                    >
                      Context
                    </h4>
                    <p className="text-[13px] leading-[1.75]" style={{ color: 'var(--rm-text)' }}>
                      {task.description.context}
                    </p>
                  </div>
                )}

                {/* Task — hidden for MCQ-only tasks because the same prompt
                    is the field label on the right (avoids duplication). */}
                {!isMcqOnlyTask && (
                  <div>
                    <h4
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
                      style={{ color: 'var(--rm-text-secondary)' }}
                    >
                      Task
                    </h4>
                    {(() => {
                      const raw = task.description.task ?? '';
                      const sentences = raw.split(/(?<=\.)\s+/).filter(Boolean);
                      if (sentences.length <= 1) {
                        return <p className="text-[13px] leading-[1.75]" style={{ color: 'var(--rm-text)' }}>{raw}</p>;
                      }
                      return (
                        <ul className="space-y-1.5 pl-4 list-disc marker:text-white/20">
                          {sentences.map((s, i) => (
                            <li key={i} className="text-[13px] leading-[1.75]" style={{ color: 'var(--rm-text)' }}>{s}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                )}

                {/* Schema grid */}
                {schemaFields.length > 0 && (
                  <div>
                    <h4
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
                      style={{ color: 'var(--rm-text-secondary)' }}
                    >
                      Schema
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {schemaFields.map((field) => (
                        <div
                          key={field.name}
                          className="rounded-[14px] px-3 py-2.5"
                          style={{
                            backgroundColor: 'var(--rm-bg-elevated)',
                            border: '1px solid var(--rm-border)',
                          }}
                        >
                          <code
                            className="text-[12px] font-mono font-medium block mb-1"
                            style={{ color: 'var(--rm-text)' }}
                          >
                            {field.name}
                          </code>
                          <span
                            className="text-[10px]"
                            style={{ color: 'var(--rm-text-secondary)' }}
                          >
                            {field.type} {field.nullable ? '(nullable)' : '(non-null)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence (for non-code tasks, reference material) */}
                {task.evidence && (
                  <EvidencePanel evidence={task.evidence} />
                )}

                {/* Dataset references (for non-code tasks that reference datasets) */}
                {!isCodeTask && (task as any).datasets && (practiceSet as any).datasets && (() => {
                  const taskDatasetIds = ((task as any).datasets as string[]);
                  const allDatasets = ((practiceSet as any).datasets as Array<{id: string; file: string; description: string; schema?: {columns: Array<{name: string; type: string; nullable: boolean}>}}>);
                  const referenced = allDatasets.filter(ds => taskDatasetIds.includes(ds.id));
                  if (referenced.length === 0) return null;
                  return (
                    <div>
                      <h4
                        className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
                        style={{ color: 'var(--rm-text-secondary)' }}
                      >
                        Datasets
                      </h4>
                      <div className="space-y-3">
                        {referenced.map(ds => (
                          <div key={ds.id} className="rounded-[14px] p-3" style={{ backgroundColor: 'var(--rm-bg-elevated)', border: '1px solid var(--rm-border)' }}>
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-[12px] font-mono font-bold" style={{ color: `rgb(${ACCENT})` }}>{ds.file}</code>
                            </div>
                            <p className="text-[11px] mb-2" style={{ color: 'var(--rm-text-secondary)' }}>{ds.description}</p>
                            {ds.schema?.columns && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--rm-border)' }}>
                                      <th className="text-left py-1 pr-3 font-semibold uppercase tracking-widest" style={{ color: 'var(--rm-text-secondary)' }}>Column</th>
                                      <th className="text-left py-1 pr-3 font-semibold uppercase tracking-widest" style={{ color: 'var(--rm-text-secondary)' }}>Type</th>
                                      <th className="text-left py-1 font-semibold uppercase tracking-widest" style={{ color: 'var(--rm-text-secondary)' }}>Nullable</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ds.schema.columns.map(col => (
                                      <tr key={col.name} style={{ borderBottom: '1px solid var(--rm-border)' }}>
                                        <td className="py-1 pr-3 font-mono" style={{ color: 'var(--rm-text)' }}>{col.name}</td>
                                        <td className="py-1 pr-3" style={{ color: 'var(--rm-text-secondary)' }}>{col.type}</td>
                                        <td className="py-1" style={{ color: col.nullable ? `rgba(${RED_RGB},0.7)` : `rgba(${GREEN_RGB},0.7)` }}>{col.nullable ? 'yes' : 'no'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Scaffold (for non-code tasks that have a scaffold reference) */}
                {!isCodeTask && task.scaffold && (
                  <div>
                    <h4
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2.5"
                      style={{ color: 'var(--rm-text-secondary)' }}
                    >
                      Scaffold
                    </h4>
                    <pre
                      className="rounded-[14px] p-4 text-[12px] leading-relaxed overflow-x-auto font-mono"
                      style={{
                        backgroundColor: 'var(--rm-code-bg)',
                        border: '1px solid var(--rm-border)',
                        color: 'var(--rm-code-text)',
                      }}
                    >
                      {task.scaffold}
                    </pre>
                  </div>
                )}


                {/* Post-check: expected output and assertions */}
                {checked && (
                  <div
                    className="space-y-4"
                    style={{
                      opacity: 0,
                      animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    {task.expectedOutput && (
                      <div
                        className="rounded-[14px] p-4"
                        style={{
                          backgroundColor: 'var(--rm-callout-bg)',
                          border: '1px solid var(--rm-callout-border)',
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                          style={{ color: 'var(--rm-accent)' }}
                        >
                          Expected Output
                        </p>
                        <ExpectedOutputPreview spec={task.expectedOutput} />
                      </div>
                    )}

                    {task.assertions && task.assertions.length > 0 && (
                      <div
                        className="rounded-[14px] p-4"
                        style={{
                          backgroundColor: 'var(--rm-bg-elevated)',
                          border: '1px solid var(--rm-border)',
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                          style={{ color: 'var(--rm-text-secondary)' }}
                        >
                          Self-Check Assertions
                        </p>
                        <div className="space-y-2">
                          {task.assertions.map((a) => (
                            <div key={a.id} className="flex items-start gap-2">
                              <Check
                                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                                style={{ color: `rgb(${GREEN_RGB})` }}
                              />
                              <div>
                                <p className="text-[12px]" style={{ color: 'var(--rm-text)' }}>
                                  {a.description}
                                </p>
                                <code
                                  className="text-[11px] font-mono"
                                  style={{ color: 'var(--rm-text-secondary)' }}
                                >
                                  {a.check}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {leftTab === 'dataset' && (
              <DatasetPanel datasets={taskDatasets} topic={topic} />
            )}

            {leftTab === 'hints' && (
              <div className="p-5 space-y-4">
                {/* Legacy single validation hint */}
                {task.description.validationHint && (!task.hints || task.hints.length === 0) && (
                  <div
                    className="rounded-[14px] px-4 py-3.5 text-[13px] leading-relaxed"
                    style={{
                      backgroundColor: 'rgba(59,130,246,0.06)',
                      border: '1px solid rgba(59,130,246,0.12)',
                      color: 'var(--rm-text)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-3.5 w-3.5" style={{ color: 'rgba(59,130,246,0.8)' }} />
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: 'rgba(59,130,246,0.8)' }}
                      >
                        Validation Hint
                      </span>
                    </div>
                    {task.description.validationHint}
                  </div>
                )}

                {/* Tiered hints */}
                {task.hints && task.hints.length > 0 && (
                  <div className="space-y-3">
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'var(--rm-text-secondary)', opacity: 0.6 }}
                    >
                      Higher tiers reveal more detail. Each unlocked tier subtracts from the reward; unlocking the final tier zeros it. Live reward shown as the ring above the editor.
                    </p>
                    {task.hints.map((hint, i) => {
                      const isUnlocked = unlockedHints.has(hint.tier);
                      const isRecent = recentUnlock?.tier === hint.tier;
                      const tierNum = parseInt(hint.tier.replace('H', ''), 10) || (i + 1);
                      const TIER_LABELS = ['Direction', 'Guidance', 'Walkthrough', 'Solution'];
                      const label = TIER_LABELS[tierNum - 1] ?? `Tier ${tierNum}`;

                      return (
                        <div
                          key={hint.tier}
                          className="relative rounded-[14px] overflow-hidden transition-all duration-300"
                          style={{
                            // Single contrasting palette driven by the
                            // reading-mode tokens — no per-tier hue. The
                            // visible difference between locked and unlocked
                            // is opacity / weight, not color.
                            border: '1px solid var(--rm-border)',
                            backgroundColor: isUnlocked
                              ? 'var(--rm-bg-elevated)'
                              : 'transparent',
                            // Two parallel animations on unlock: a gold
                            // ring-flash highlights WHICH card was unlocked,
                            // and a subtle scale-lift gives the whole
                            // element a tactile "settle in" beat.
                            animation: isRecent
                              ? 'hintCardFlash 900ms cubic-bezier(0.16, 1, 0.3, 1), hintCardLift 600ms cubic-bezier(0.16, 1, 0.3, 1)'
                              : undefined,
                          }}
                        >
                          {/* Shimmer sweep — a brief diagonal gloss that
                              moves left→right across the card surface on
                              unlock. Pointer-events:none so it doesn't
                              swallow the body's text selection. */}
                          {isRecent && (
                            <div
                              aria-hidden
                              className="pointer-events-none absolute inset-0 z-[1]"
                              style={{
                                background:
                                  'linear-gradient(110deg, transparent 30%, rgba(255,201,101,0.18) 50%, transparent 70%)',
                                animation: 'hintShimmer 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          )}

                          {/* Floating kWh deduction badge — fires on click,
                              floats up + fades. Skipped for free hints. */}
                          {isRecent && recentUnlock && recentUnlock.cost > 0 && (
                            <div
                              className="pointer-events-none absolute right-3 top-2 z-[2] font-mono text-[12px] font-bold tracking-wide"
                              style={{
                                color: '#ffc965',
                                textShadow: '0 0 12px rgba(255,201,101,0.55)',
                                animation: 'kwhFloat 1100ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                              }}
                            >
                              −{recentUnlock.cost} kWh
                            </div>
                          )}

                          {/* Header — always visible */}
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold transition-colors duration-300"
                                style={{
                                  backgroundColor: isUnlocked
                                    ? 'var(--rm-text-heading, var(--rm-text))'
                                    : 'var(--rm-bg-elevated)',
                                  color: isUnlocked
                                    ? 'var(--rm-bg)'
                                    : 'var(--rm-text-secondary)',
                                  border: isUnlocked
                                    ? 'none'
                                    : '1px solid var(--rm-border)',
                                  animation: isRecent
                                    ? 'unlockPunch 420ms cubic-bezier(0.16, 1, 0.3, 1)'
                                    : undefined,
                                }}
                              >
                                {tierNum}
                              </div>
                              <span
                                className="text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300"
                                style={{
                                  color: isUnlocked
                                    ? 'var(--rm-text-heading, var(--rm-text))'
                                    : 'var(--rm-text-secondary)',
                                }}
                              >
                                {hint.tier} · {label}
                              </span>
                            </div>
                            {!isUnlocked && (
                              <button
                                type="button"
                                onClick={() => handleUnlockHint(hint.tier, hint.xp_cost)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium tracking-wide uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.92] cursor-pointer"
                                style={{
                                  border: '1px solid var(--rm-border)',
                                  backgroundColor: 'var(--rm-bg-elevated)',
                                  color: 'var(--rm-text)',
                                }}
                              >
                                {hint.xp_cost > 0 ? `Unlock · −${hint.xp_cost} kWh` : 'Reveal'}
                              </button>
                            )}
                          </div>

                          {/* Body — revealed content */}
                          {isUnlocked && (
                            <div
                              className="px-4 pb-4 text-[13px] leading-[1.75] whitespace-pre-wrap overflow-hidden"
                              style={{
                                color: 'var(--rm-text)',
                                // Only animate the freshly-unlocked tier so the
                                // panel doesn't re-animate every Hints-tab visit.
                                animation: isRecent
                                  ? 'hintReveal 360ms cubic-bezier(0.16, 1, 0.3, 1)'
                                  : undefined,
                              }}
                            >
                              {hint.text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─ Resize Handle ───────────────────────────────────────────────── */}
        {showLeft && showRight && !isMobile && (
          <div
            onPointerDown={onDragStart}
            className="shrink-0 cursor-col-resize group flex items-center justify-center hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
            style={{ width: '6px', borderLeft: '1px solid var(--rm-border)' }}
          >
            <div className="w-[2px] h-8 rounded-full bg-white/[0.08] group-hover:bg-white/[0.2] group-active:bg-white/[0.3] transition-colors" />
          </div>
        )}

        {/* ─ Right Panel ─────────────────────────────────────────────────── */}
        {showRight && isCodeTask && (
          <div
            className="flex flex-col"
            style={{
              width: isMobile ? '100%' : `${100 - splitPct}%`,
              borderTop: isMobile ? '1px solid var(--rm-border)' : undefined,
              backgroundColor: 'var(--rm-code-bg, #0d1117)',
            }}
          >
            {/* Editor toolbar */}
            <div
              className="flex items-center justify-between px-4 py-2.5 shrink-0"
              style={{ borderBottom: '1px solid var(--rm-border)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: RUN_GREEN }}
                />
                <span
                  className="text-[11px] font-mono font-medium"
                  style={{ color: 'var(--rm-text-secondary)' }}
                >
                  solution.py
                </span>
                {/* Language pill — surfaces the practice topic so the user
                    knows the runtime context at a glance (e.g. PySpark
                    vs plain Python). */}
                <span
                  className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-[0.14em]"
                  style={{
                    fontSize: 9.5,
                    color: `rgb(${ACCENT})`,
                    border: `1px solid rgba(${ACCENT},0.28)`,
                    backgroundColor: `rgba(${ACCENT},0.08)`,
                  }}
                >
                  {(() => {
                    const t = (topic || '').toLowerCase();
                    if (t === 'pyspark') return 'PySpark';
                    if (t === 'sql') return 'SQL';
                    if (t === 'python' || t === 'python-de') return 'Python';
                    if (t === 'fabric') return 'Fabric';
                    return topic || 'Code';
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isReview && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px] text-[11px] font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                    title="Reset to starter scaffold"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px] text-[11px] font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    color: copied ? `rgb(${GREEN_RGB})` : 'rgba(255,255,255,0.7)',
                    border: `1px solid ${copied ? `rgba(${GREEN_RGB},0.3)` : 'rgba(255,255,255,0.12)'}`,
                    backgroundColor: copied ? `rgba(${GREEN_RGB},0.05)` : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Mobile-only quick-insert toolbar — soft keyboards lack
                Tab, brackets, colon, and proper straight quotes (iOS
                substitutes smart quotes that break string literals).
                Horizontally scrollable so the strip never wraps. The Run
                pill on the right keeps the primary action reachable
                without scrolling past a tall editor. */}
            {isMobile && !isReview && (
              <div
                className="flex items-stretch gap-1.5 px-2 py-1.5 overflow-x-auto"
                style={{
                  borderBottom: '1px solid var(--rm-border)',
                  backgroundColor: 'var(--rm-bg-elevated)',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {[
                  { label: '⇥', value: '    ', title: 'Tab (4 spaces)' },
                  { label: '(', value: '(' },
                  { label: ')', value: ')' },
                  { label: '[', value: '[' },
                  { label: ']', value: ']' },
                  { label: '{', value: '{' },
                  { label: '}', value: '}' },
                  { label: ':', value: ':' },
                  { label: ',', value: ',' },
                  { label: "'", value: "'" },
                  { label: '"', value: '"' },
                  { label: '_', value: '_' },
                  { label: '=', value: '=' },
                  { label: '.', value: '.' },
                  { label: '#', value: '#' },
                ].map((k) => (
                  <button
                    key={k.label}
                    type="button"
                    aria-label={k.title ?? `Insert ${k.label}`}
                    onClick={() => insertAtCursor(k.value)}
                    // mousedown (not touchstart) is what blurs the textarea —
                    // preventing it here keeps focus + caret position so
                    // tapping a symbol button doesn't dismiss the keyboard.
                    onMouseDown={(e) => e.preventDefault()}
                    className="shrink-0 inline-flex items-center justify-center font-mono font-semibold rounded-[12px] transition-colors active:opacity-70"
                    style={{
                      minWidth: 44,
                      height: 40,
                      padding: '0 12px',
                      fontSize: 17,
                      color: 'var(--rm-text)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--rm-border)',
                    }}
                  >
                    {k.label}
                  </button>
                ))}
                {/* Run pill — primary action, sticks to the right end */}
                <button
                  type="button"
                  onClick={() => handleRunRef.current?.()}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={running}
                  aria-label="Run code"
                  className="shrink-0 ml-auto inline-flex items-center justify-center gap-1.5 rounded-[12px] font-semibold transition-all active:scale-[0.97] disabled:opacity-60"
                  style={{
                    minWidth: 72,
                    height: 40,
                    padding: '0 16px',
                    fontSize: 14,
                    color: '#fff',
                    backgroundColor: running ? `rgba(${GREEN_RGB},0.45)` : RUN_GREEN,
                    border: 'none',
                  }}
                >
                  {running ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Code editor area */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, overscrollBehavior: 'contain' }}>
              <div className="flex" style={{ minHeight: isMobile ? '55svh' : '280px' }}>
                {/* Line numbers — match editor font size so rows line up.
                   16px on mobile prevents iOS focus-zoom on the textarea. */}
                <div
                  className="select-none text-right pr-3 pl-4 py-4 font-mono text-[16px] lg:text-[13px] leading-relaxed shrink-0"
                  style={{
                    color: 'var(--rm-text-secondary)',
                    opacity: 0.3,
                    borderRight: '1px solid var(--rm-border)',
                  }}
                >
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Editor with syntax highlighting overlay */}
                <div className="relative flex-1" style={{ minHeight: isMobile ? '55svh' : '280px' }}>
                  {/* Highlighted code layer.
                      Wrapping must match the textarea's native behavior:
                      `whitespace-pre-wrap` only — no `break-words`. The
                      textarea wraps at whitespace and never inside a token,
                      so adding `break-words` here mid-wraps long identifiers
                      in the overlay only, which desyncs the cursor from the
                      colored character on narrow screens. */}
                  <pre
                    className="absolute inset-0 font-mono text-[16px] lg:text-[13px] leading-relaxed p-4 pointer-events-none whitespace-pre-wrap overflow-hidden"
                    aria-hidden
                    style={{ color: 'var(--rm-code-text, #e2e8f0)' }}
                    dangerouslySetInnerHTML={{ __html: highlightPython(code) + '\n' }}
                  />
                  {/* Textarea input layer */}
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => !isReview && setCode(e.target.value)}
                    onKeyDown={isReview ? undefined : handleKeyDown}
                    onFocus={(e) => {
                      // iOS Safari keeps `vh` constant when the keyboard
                      // opens, so the editor's bottom can sit under the
                      // keyboard. Scroll the editor block to the top of
                      // the viewport on focus — keyboard then occupies
                      // only the empty area below.
                      if (isMobile) {
                        requestAnimationFrame(() => {
                          e.currentTarget.scrollIntoView({
                            block: 'start',
                            behavior: 'smooth',
                          });
                        });
                      }
                    }}
                    readOnly={isReview}
                    rows={Math.max(14, lineCount + 2)}
                    className="relative z-10 w-full h-full font-mono text-[16px] lg:text-[13px] leading-relaxed p-4 resize-none focus:outline-none overflow-hidden"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'transparent',
                      caretColor: 'var(--rm-code-text, #e2e8f0)',
                      minHeight: isMobile ? '55svh' : '280px',
                    }}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    // iOS Safari ignores spellCheck without these — without
                    // them, "result" gets autocapitalized to "Result" and
                    // smart quotes corrupt every string literal.
                  />
                </div>
              </div>
            </div>

            {/* Verdict banner — shown the moment auto-validation completes
                so the user sees Correct / Not quite / Submitted alongside
                the Output console below. Apple-style: tinted surface,
                hairline border in the same hue, SF-flavored typography,
                no all-caps yelling. */}
            {isCodeTask && taskState.checked && !isReview && (
              <CodeVerdictBanner
                allCorrect={taskState.allCorrect}
                selfReview={taskState.selfReview}
                reasons={taskState.validationReasons}
                hasExpectedOutput={Boolean((task as { expectedOutput?: unknown }).expectedOutput)}
              />
            )}

            {/* Output console */}
            <div
              className="shrink-0"
              style={{ borderTop: '1px solid var(--rm-border)' }}
            >
              {/* Output header */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <button
                  onClick={() => setOutputCollapsed((p) => !p)}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ color: 'var(--rm-text-secondary)' }}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest">
                    Output
                  </span>
                  {(output || error) && (
                    outputCollapsed
                      ? <ChevronRight className="h-3 w-3" />
                      : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  {(output || error) && (
                    <button
                      onClick={handleClearOutput}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px] text-[11px] font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        color: 'var(--rm-text-secondary)',
                        border: '1px solid var(--rm-border)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                  {!isReview && !isMobile && (
                    <button
                      onClick={handleRun}
                      disabled={running}
                      title={`Run code (${runShortcutLabel})`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-[11px] font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                      style={{
                        color: running ? 'rgba(255,255,255,0.5)' : '#fff',
                        backgroundColor: running ? `rgba(${GREEN_RGB},0.15)` : RUN_GREEN,
                        border: 'none',
                      }}
                    >
                      {running ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {pyodideLoading ? 'Loading Python...' : 'Running...'}
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Run code
                          <kbd className="ml-1 hidden sm:inline-block rounded px-1.5 py-0.5 text-[9px] font-mono opacity-80" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.35)' }}>
                            {runShortcutLabel}
                          </kbd>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Pyodide loading indicator */}
              {!pyodideReady && !running && !(output || error) && (
                <div className="px-4 pb-3">
                  <p
                    className="text-[11px] flex items-center gap-1.5"
                    style={{ color: 'var(--rm-text-secondary)', opacity: 0.5 }}
                  >
                    <Terminal className="h-3 w-3" />
                    Python runtime will load on first run
                  </p>
                </div>
              )}

              {/* Output content */}
              {(output || error) && !outputCollapsed && (
                <div
                  className="px-4 pb-4 overflow-x-auto"
                  style={{ maxHeight: '240px', overflowY: 'auto' }}
                >
                  {output && (
                    <pre
                      className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: `rgb(${GREEN_RGB})` }}
                    >
                      {output}
                    </pre>
                  )}
                  {error && (
                    <pre
                      className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: `rgb(${RED_RGB})` }}
                    >
                      {error}
                    </pre>
                  )}
                </div>
              )}

              {/* Keyboard shortcut hint — desktop only; mobile has the
                  toolbar Run pill anchored above the editor instead. */}
              {!isReview && !running && !(output || error) && !isMobile && (
                <div className="px-4 pb-3">
                  <p className="text-[10px]" style={{ color: 'var(--rm-text-secondary)', opacity: 0.35 }}>
                    {typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'}+Enter to run
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─ Resize Handle (non-code, non-MCQ tasks only) ────────────────── */}
        {showLeft && showRight && !isCodeTask && !isMobile && !isMcqOnlyTask && (
          <div
            onPointerDown={onDragStart}
            className="shrink-0 cursor-col-resize group flex items-center justify-center hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
            style={{ width: '6px', borderLeft: '1px solid var(--rm-border)' }}
          >
            <div className="w-[2px] h-8 rounded-full bg-white/[0.08] group-hover:bg-white/[0.2] group-active:bg-white/[0.3] transition-colors" />
          </div>
        )}

        {/* ─ Right Panel: Answer Fields (non-code tasks) ─────────────────── */}
        {showRight && !isCodeTask && !isMcqOnlyTask && (
          <div
            className="flex flex-col"
            style={{
              width: isMobile ? '100%' : `${100 - splitPct}%`,
              borderTop: isMobile ? '1px solid var(--rm-border)' : undefined,
              backgroundColor: 'var(--rm-bg-elevated)',
            }}
          >
            {/* Answer header */}
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--rm-border)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--rm-text-heading, #ffffff)' }}
                />
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: 'var(--rm-text-secondary)' }}
                >
                  Answer
                </span>
              </div>
              {checked && (
                <div className="flex items-center gap-1.5">
                  {taskState.allCorrect ? (
                    <Check className="h-3.5 w-3.5" style={{ color: `rgb(${SUCCESS_RGB})` }} />
                  ) : (
                    <X className="h-3.5 w-3.5" style={{ color: `rgb(${ERROR_RGB})` }} />
                  )}
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: taskState.allCorrect ? `rgb(${SUCCESS_RGB})` : `rgb(${ERROR_RGB})` }}
                  >
                    {taskState.allCorrect ? 'All Correct' : 'Review Below'}
                  </span>
                </div>
              )}
            </div>

            {/* Answer fields area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ maxHeight: isMobile ? undefined : '80vh' }}>
              {fields.length > 0 && fields.map((field) => (
                <div key={field.id} className="space-y-3">
                  <FieldRenderer
                    field={field}
                    value={taskState.answers[field.id]?.value ?? ''}
                    result={taskState.answers[field.id]?.result ?? null}
                    checked={taskState.checked}
                    readOnly={isReview}
                    showResult={taskState.checked}
                    onChange={(v) => onAnswerChange(field.id, v)}
                  />

                  {/* Rationale after check */}
                  {taskState.checked && (
                    <RationaleCard
                      field={field}
                      result={taskState.answers[field.id]?.result ?? null}
                    />
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
    </div>
  );
}
