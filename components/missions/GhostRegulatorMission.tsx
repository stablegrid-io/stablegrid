'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { createMissionProgressRequestKey } from '@/lib/api/requestKeys';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { MissionState } from '@/types/missions';
import { LightbulbPulseFeedback } from '@/components/feedback/LightbulbPulseFeedback';

const MISSION_SLUG = 'ghost-regulator';

const ACTS = [
  { id: 0, label: 'The Alarm', icon: '🚨' },
  { id: 1, label: 'The Investigation', icon: '🔍' },
  { id: 2, label: 'The Fix', icon: '⚡' },
  { id: 3, label: 'The Report', icon: '📋' }
] as const;

type MissionActor = 'ops' | 'lena' | 'mario' | 'sara' | 'you';

interface ChatMessage {
  id: number;
  from: MissionActor;
  name: string;
  color: string;
  delay: number;
  text: string;
  isYou?: boolean;
}

interface MissionTask {
  id: string;
  title: string;
  description: string;
  hint: string;
  correctAnswer: string;
  fakeOutput: string;
  energyUnits: number;
  reaction?: {
    from: 'sara' | 'mario';
    text: string;
  };
}

interface MissionTheme {
  isDark: boolean;
  rootBg: string;
  rootText: string;
  headerBg: string;
  headerBorder: string;
  missionStripBg: string;
  missionStripBorder: string;
  panelBg: string;
  panelBgStrong: string;
  panelBorder: string;
  panelSubBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textTertiary: string;
  textQuaternary: string;
  bubbleBg: string;
  bubbleBorder: string;
  selfBubbleBg: string;
  selfBubbleBorder: string;
  dangerText: string;
  dangerBg: string;
  dangerBorder: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentGradient: string;
  accentShadow: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;
  success: string;
  successSoft: string;
  successBorder: string;
  codeBg: string;
  codeOutputBg: string;
  codeText: string;
  codeBorder: string;
  frequencyLine: string;
  frequencyGrid: string;
  optionBg: string;
  successBg: string;
  typingDot: string;
}

const ACT0_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: 'ops',
    name: 'GridOS Ops',
    color: '#f87171',
    delay: 0,
    text: '🔴 CRITICAL · Frequency deviation +0.42 Hz detected · Zone: Zaragoza-Lleida corridor'
  },
  {
    id: 2,
    from: 'ops',
    name: 'GridOS Ops',
    color: '#f87171',
    delay: 800,
    text: '🔴 SCADA event ordering anomaly confirmed · 847 telemetry records arrived out-of-sequence in last 12 minutes'
  },
  {
    id: 3,
    from: 'lena',
    name: 'Lena Kovač',
    color: '#64a0dc',
    delay: 2200,
    text: "You're online. Good. We've seen this signature before — controlled, not chaotic. Something is actively smoothing the frequency."
  },
  {
    id: 4,
    from: 'mario',
    name: 'Mario Bauer',
    color: '#f0a032',
    delay: 3800,
    text: "I already restarted the collector. Didn't help. Logs look clean which is the problem — they're TOO clean."
  },
  {
    id: 5,
    from: 'sara',
    name: 'Sara Okonkwo',
    color: '#4db87a',
    delay: 5200,
    text: "I've attached the phasor snapshot window. Look at 02:17–02:44 UTC. The frequency trace is suspiciously smooth right before the cascade. I'm calling it a control loop artifact."
  },
  {
    id: 6,
    from: 'lena',
    name: 'Lena Kovač',
    color: '#64a0dc',
    delay: 6800,
    text: 'Your job: find the algorithm. We have DB access to the grid telemetry replica. Start with the time-series. Confirm the missing slice first.'
  },
  {
    id: 7,
    from: 'you',
    name: 'You',
    color: '#a5b4fc',
    delay: 0,
    text: 'Understood. Pulling the telemetry window now.',
    isYou: true
  }
] ;

const ACT1_TASKS: MissionTask[] = [
  {
    id: 'find-gap',
    title: 'Task 1 — Find the missing time slice',
    description:
      'The telemetry table has a suspicious gap. Query the phasor snapshot data between 02:00 and 03:00 UTC on 16/02/2026 and find which 3-minute window has fewer than expected readings.',
    hint: `# Expected: ~180 records per 3-min window (1/sec)
# The Ghost Regulator erases records that would reveal instability`,
    correctAnswer: `df = spark.read.table("grid.phasor_snapshots")
  .filter(
    (col("ts") >= "2026-02-16 02:00:00") &
    (col("ts") < "2026-02-16 03:00:00")
  )

window_counts = df
  .withColumn("window", date_trunc("3 minutes", col("ts")))
  .groupBy("window")
  .count()
  .orderBy("count")

window_counts.show(5)`,
    fakeOutput: `+-------------------+-----+
|window             |count|
+-------------------+-----+
|2026-02-16 02:17:00|  23 | ← ANOMALY
|2026-02-16 02:20:00| 179 |
|2026-02-16 02:23:00| 180 |
|2026-02-16 02:26:00| 181 |
|2026-02-16 02:29:00| 180 |
+-------------------+-----+
⚠ Window 02:17–02:20 UTC: only 23/180 records. 157 deleted.`,
    energyUnits: 180,
    reaction: {
      from: 'sara',
      text: "That's it. 02:17. Exactly when the cascade started. The algorithm deleted its own footprint."
    }
  },
  {
    id: 'event-order',
    title: 'Task 2 — Detect inverted event ordering',
    description:
      "SCADA events should arrive in monotonically increasing timestamp order. Write a window function query to find any events where the arrival_ts is EARLIER than the previous event's event_ts. These are the Ghost's fingerprints.",
    hint: `# Use lag() to compare adjacent rows
# The Ghost Regulator replays old events after the fact
# to make the log look stable — but arrival order betrays it`,
    correctAnswer: `from pyspark.sql.window import Window
from pyspark.sql.functions import lag

w = Window.partitionBy("zone_id").orderBy("arrival_ts")

df = spark.read.table("grid.scada_events")

inverted = df
  .withColumn("prev_event_ts", lag("event_ts", 1).over(w))
  .filter(col("event_ts") < col("prev_event_ts"))
  .select("zone_id", "event_ts", "arrival_ts", "event_type")

inverted.show(10)`,
    fakeOutput: `+----------+-------------------+-------------------+-----------------+
|zone_id   |event_ts           |arrival_ts         |event_type       |
+----------+-------------------+-------------------+-----------------+
|ZGZ-04    |2026-02-16 02:14:33|2026-02-16 02:18:02|FREQ_DEVIATION   |
|ZGZ-04    |2026-02-16 02:15:11|2026-02-16 02:18:04|LOAD_SPIKE       |
|LLE-09    |2026-02-16 02:16:44|2026-02-16 02:18:07|VOLTAGE_SAG      |
|ZGZ-04    |2026-02-16 02:16:58|2026-02-16 02:18:09|FREQ_DEVIATION   |
+----------+-------------------+-------------------+-----------------+
847 inverted events found. All arrival_ts cluster at 02:18:00–02:18:12 UTC.
Ghost injected old events 2–4 minutes late to reconstruct a "clean" log.`,
    energyUnits: 220,
    reaction: {
      from: 'mario',
      text: "847 events injected in a 12-second window. That's not a bug. That's a scheduled job."
    }
  }
] ;

const ACT2_TASK: MissionTask = {
  id: 'identify-signature',
  title: "Task 3 — Identify the Ghost Regulator's control signature",
  description:
    'The algorithm leaves a mathematical fingerprint in the frequency data: it targets a specific Hz range and applies exponential smoothing with a fixed alpha. Compute the autocorrelation of frequency residuals to extract the smoothing coefficient.',
  hint: `# If a control loop is smoothing frequency, the residuals
# (actual - rolling_mean) will have a specific autocorrelation
# at lag 1 that reveals alpha. Ghost uses alpha ≈ 0.94.`,
  correctAnswer: `from pyspark.sql.window import Window
from pyspark.sql.functions import avg, sum, lag

w7 = Window.partitionBy("zone_id").orderBy("ts").rowsBetween(-60, 0)

df = spark.read.table("grid.frequency_telemetry")
  .filter(col("ts").between("2026-02-16 01:00:00", "2026-02-16 03:00:00"))

residuals = df
  .withColumn("rolling_mean", avg("freq_hz").over(w7))
  .withColumn("residual", col("freq_hz") - col("rolling_mean"))
  .withColumn("lag_residual", lag("residual", 1).over(Window.partitionBy("zone_id").orderBy("ts")))

alpha = residuals
  .filter(col("lag_residual").isNotNull())
  .groupBy("zone_id")
  .agg(
    (sum(col("residual") * col("lag_residual")) /
     sum(col("lag_residual") * col("lag_residual"))).alias("alpha")
  )

alpha.show()`,
  fakeOutput: `+----------+------+
|zone_id   |alpha |
+----------+------+
|ZGZ-04    |0.9401|  ← Ghost signature confirmed
|ZGZ-05    |0.9398|  ← Ghost signature confirmed
|LLE-09    |0.9403|  ← Ghost signature confirmed
|MAD-01    |0.4821|  ← Normal controller
|BAR-03    |0.5102|  ← Normal controller
+----------+------+

Ghost Regulator α = 0.94 ± 0.002
Affected zones: ZGZ-04, ZGZ-05, LLE-09 (Zaragoza–Lleida corridor)
Algorithm is an exponential smoother targeting σ < 0.02 Hz`,
  energyUnits: 400
};

const REPORT_OPTIONS = [
  {
    id: 'a',
    text: 'A misconfigured automatic generation control (AGC) unit that was never decommissioned after a 2019 grid upgrade.'
  },
  {
    id: 'b',
    text: "A deliberate control algorithm deployed by an unknown party to 'stabilise' the Iberian grid — optimising for low frequency variance at the cost of data integrity."
  },
  {
    id: 'c',
    text: 'A firmware bug in Siemens SCADA units deployed across the Zaragoza corridor that creates phantom smoothing as a side-effect.'
  }
] as const;

type Task = MissionTask;

function Zap({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CopyIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function PlayIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
  );
}

const FrequencyWave = memo(function FrequencyWave({
  glitch,
  width = 260,
  height = 32,
  accent = '#64a0dc',
  grid = '#1e3a4a'
}: {
  glitch: boolean;
  width?: number;
  height?: number;
  accent?: string;
  grid?: string;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setPhase((value) => value + 0.05);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const pathData = useMemo(() => {
    const points: string[] = [];
    for (let index = 0; index <= 80; index += 1) {
      const x = (index / 80) * width;
      const p = (index / 80) * Math.PI * 6 + phase;
      let y =
        Math.sin(p) * 9 +
        Math.sin(p * 2.1) * 2 +
        Math.sin(p * 0.5 + phase * 0.3) * 1.5;

      if (glitch && index > 38 && index < 56) {
        y +=
          Math.sin(index * 2.3 + phase * 5) *
          9 *
          Math.sin(((index - 38) / 18) * Math.PI);
      }

      points.push(
        `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(height / 2 - y).toFixed(1)}`
      );
    }
    return points.join(' ');
  }, [glitch, height, phase, width]);

  return (
    <svg width={width} height={height} style={{ willChange: 'transform' }}>
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke={grid}
        strokeWidth={1}
        strokeDasharray="3 8"
      />
      {glitch ? (
        <rect
          x={width * 0.475}
          y={0}
          width={width * 0.22}
          height={height}
          fill="rgba(248,113,113,0.06)"
          rx={2}
        />
      ) : null}
      <path
        d={pathData}
        fill="none"
        stroke={glitch ? '#f87171' : accent}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
});

const ChatBubble = memo(function ChatBubble({
  message,
  theme
}: {
  message: ChatMessage;
  theme: MissionTheme;
}) {
  const isOps = message.from === 'ops';

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        animation: 'msgIn 0.3s ease',
        flexDirection: message.isYou ? 'row-reverse' : 'row'
      }}
    >
      {!message.isYou ? (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: `${message.color}22`,
            border: `1px solid ${message.color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: message.color,
            flexShrink: 0
          }}
        >
          {message.name[0]}
        </div>
      ) : null}

      <div style={{ maxWidth: '80%' }}>
        {!message.isYou ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: message.color }}>{message.name}</span>
            {isOps ? (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  color: theme.dangerText,
                  background: theme.dangerBg,
                  border: `1px solid ${theme.dangerBorder}`,
                  padding: '1px 5px',
                  borderRadius: 4
                }}
              >
                SYSTEM
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            padding: '9px 13px',
            borderRadius: message.isYou ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
            background: isOps
              ? theme.dangerBg
              : message.isYou
                ? theme.selfBubbleBg
                : theme.bubbleBg,
            border: `1px solid ${
              isOps
                ? theme.dangerBorder
                : message.isYou
                  ? theme.selfBubbleBorder
                  : theme.bubbleBorder
            }`
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: isOps
                ? theme.dangerText
                : message.isYou
                  ? theme.textPrimary
                  : theme.textSecondary,
              lineHeight: 1.58,
              fontFamily: 'system-ui,sans-serif'
            }}
          >
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
});

const TypingIndicator = memo(function TypingIndicator({
  name,
  color,
  theme
}: {
  name: string;
  color: string;
  theme: MissionTheme;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', animation: 'msgIn 0.3s ease' }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: `${color}22`,
          border: `1px solid ${color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          color,
          flexShrink: 0
        }}
      >
        {name[0]}
      </div>
      <div
        style={{
          padding: '9px 14px',
          borderRadius: '12px 12px 12px 3px',
          background: theme.bubbleBg,
          border: `1px solid ${theme.bubbleBorder}`
        }}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: theme.typingDot,
                animation: `typeDot 1.2s ease ${index * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

const CodeEditor = memo(function CodeEditor({
  task,
  completed,
  onComplete,
  theme
}: {
  task: Task;
  completed: boolean;
  onComplete: (units: number) => void;
  theme: MissionTheme;
}) {
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ success: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = () => {
    if (!code.trim() || completed || running) {
      return;
    }

    setRunning(true);
    setOutput(null);

    window.setTimeout(() => {
      setRunning(false);
      const solved =
        code.includes('groupBy') ||
        code.includes('lag') ||
        code.includes('alpha') ||
        code.length > 80;

      setOutput({
        success: solved,
        text: solved
          ? task.fakeOutput
          : 'AnalysisException: cannot resolve column reference.\nCheck your column names and try again.'
      });

      if (solved) {
        onComplete(task.energyUnits);
      }
    }, 1800);
  };

  const showSolution = () => {
    setCode(task.correctAnswer);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code || task.correctAnswer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${theme.codeBorder}`
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: theme.panelBgStrong,
          borderBottom: `1px solid ${theme.codeBorder}`
        }}
      >
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444', '#f59e0b', '#10b981'].map((color) => (
            <div
              key={color}
              style={{ width: 9, height: 9, borderRadius: '50%', background: color }}
            />
          ))}
        </div>

        <span
          style={{
            fontSize: 10,
            color: theme.textTertiary,
            fontFamily: "'Courier New',monospace",
            marginLeft: 4
          }}
        >
          pyspark_shell.py
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={copyCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 6,
              border: `1px solid ${theme.accentBorder}`,
              background: theme.bubbleBg,
              color: theme.textMuted,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copied ? <CheckIcon size={9} /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            type="button"
            onClick={showSolution}
            style={{
              padding: '3px 9px',
              borderRadius: 6,
              border: `1px solid ${theme.warningBorder}`,
              background: theme.warningSoft,
              color: theme.warning,
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Show Solution
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder={`# ${task.title}\n# Write your PySpark query here…\n\n${task.hint}`}
        style={{
          width: '100%',
          minHeight: 160,
          padding: '14px 16px',
          background: theme.codeBg,
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          fontFamily: "'Fira Code','Courier New',monospace",
          fontSize: 12,
          color: theme.codeText,
          lineHeight: 1.85,
          borderBottom: `1px solid ${theme.codeBorder}`
        }}
      />

      <div
        style={{
          padding: '10px 14px',
          background: theme.panelBgStrong,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={running || completed}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 18px',
            borderRadius: 9,
            border: 'none',
            background: running
              ? theme.accentSoft
              : completed
                ? theme.successSoft
                : theme.accentGradient,
            color: completed ? theme.success : '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: running || completed ? 'default' : 'pointer',
            fontFamily: 'system-ui,sans-serif'
          }}
        >
          {completed ? (
            <>
              <CheckIcon size={10} /> Validated
            </>
          ) : running ? (
            '⚙ Running…'
          ) : (
            <>
              <PlayIcon size={10} /> Run Query
            </>
          )}
        </button>

        <span style={{ fontSize: 10, color: theme.textTertiary }}>{task.energyUnits} kWh on first pass</span>

        {output && !output.success ? (
          <span style={{ fontSize: 10, color: '#f87171', marginLeft: 'auto' }}>
            ✗ Query failed — check syntax
          </span>
        ) : null}
      </div>

      {output ? (
        <div style={{ borderTop: `1px solid ${theme.codeBorder}`, background: theme.codeOutputBg }}>
          <div
            style={{
              padding: '6px 14px',
              borderBottom: `1px solid ${theme.codeBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: output.success ? theme.success : '#f87171',
                fontFamily: 'system-ui,sans-serif'
              }}
            >
              {output.success ? '✓ QUERY COMPLETE' : '✗ ERROR'}
            </span>
          </div>
          <pre
            style={{
              padding: '14px 16px',
              fontFamily: "'Fira Code','Courier New',monospace",
              fontSize: 11,
              color: output.success ? theme.textSecondary : '#f87171',
              lineHeight: 1.85,
              overflowX: 'auto',
              margin: 0
            }}
          >
            {output.text}
          </pre>
        </div>
      ) : null}
    </div>
  );
});

const EnergyToast = memo(function EnergyToast({
  units,
  theme
}: {
  units: number | null;
  theme: MissionTheme;
}) {
  if (!units) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 24,
        zIndex: 999,
        padding: '12px 20px',
        borderRadius: 12,
        background: theme.accentGradient,
        color: theme.isDark ? '#0a0a0a' : '#fff',
        fontWeight: 900,
        fontSize: 14,
        boxShadow: theme.accentShadow,
        animation: 'toastIn 0.4s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'system-ui,sans-serif'
      }}
    >
      <Zap size={14} /> +{units} kWh injected
    </div>
  );
});

export function GhostRegulatorMission() {
  const addXP = useProgressStore((state) => state.addXP);
  const { resolvedTheme } = useTheme();

  const [act, setAct] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [typingWho, setTypingWho] = useState<{ name: string; color: string } | null>(null);
  const [messagesDone, setMessagesDone] = useState(false);
  const [task1Done, setTask1Done] = useState(false);
  const [task2Done, setTask2Done] = useState(false);
  const [investigationTaskIndex, setInvestigationTaskIndex] = useState(0);
  const [task3Done, setTask3Done] = useState(false);
  const [reportAnswer, setReportAnswer] = useState<string | null>(null);
  const [sessionEnergy, setSessionEnergy] = useState(0);
  const [toast, setToast] = useState<number | null>(null);
  const [missionDone, setMissionDone] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const messageIndexRef = useRef(0);
  const completionPersistedRef = useRef(false);

  const postMissionState = useCallback(async (state: MissionState) => {
    try {
      const response = await fetch('/api/missions/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': createMissionProgressRequestKey({
            missionSlug: MISSION_SLUG,
            state,
            unlocked: true
          })
        },
        body: JSON.stringify({
          missionSlug: MISSION_SLUG,
          state,
          unlocked: true
        })
      });

      if (!response.ok) {
        return 0;
      }

      if (state !== 'completed') {
        return 0;
      }

      const payload = (await response.json()) as { reward_awarded_units?: number };
      return Number(payload.reward_awarded_units ?? 0);
    } catch {
      return 0;
    }
  }, []);

  const persistCompletion = useCallback(async () => {
    if (completionPersistedRef.current) {
      return;
    }

    completionPersistedRef.current = true;
    const rewardUnits = await postMissionState('completed');
    if (rewardUnits > 0) {
      addXP(rewardUnits, {
        source: 'mission',
        label: 'Mission complete: GHOST REGULATOR'
      });
    }
  }, [addXP, postMissionState]);

  useEffect(() => {
    void postMissionState('in_progress');
  }, [postMissionState]);

  useEffect(() => {
    if (!chatRef.current) {
      return;
    }
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [visibleMessages, typingWho]);

  useEffect(() => {
    if (act !== 0 || messagesDone) {
      return;
    }

    const index = messageIndexRef.current;
    if (index >= ACT0_MESSAGES.length) {
      setMessagesDone(true);
      return;
    }

    const next = ACT0_MESSAGES[index];
    const showTyping = next.from !== 'ops' && !next.isYou;

    const schedule = () => {
      if (showTyping) {
        setTypingWho({ name: next.name, color: next.color });
        window.setTimeout(() => {
          setTypingWho(null);
          setVisibleMessages((current) => [...current, next]);
          messageIndexRef.current = index + 1;
          if (index + 1 >= ACT0_MESSAGES.length) {
            setMessagesDone(true);
          }
        }, 1200);
      } else {
        setVisibleMessages((current) => [...current, next]);
        messageIndexRef.current = index + 1;
        if (index + 1 >= ACT0_MESSAGES.length) {
          setMessagesDone(true);
        }
      }
    };

    const delay = index === 0 ? 600 : next.delay;
    const timer = window.setTimeout(schedule, showTyping ? Math.max(delay - 1200, 100) : delay);

    return () => window.clearTimeout(timer);
  }, [act, messagesDone, visibleMessages]);

  const awardEnergy = useCallback((units: number) => {
    setSessionEnergy((current) => current + units);
    setToast(units);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const handleTask1 = useCallback(
    (units: number) => {
      setTask1Done(true);
      awardEnergy(units);
    },
    [awardEnergy]
  );

  const handleTask2 = useCallback(
    (units: number) => {
      setTask2Done(true);
      awardEnergy(units);
    },
    [awardEnergy]
  );

  const handleTask3 = useCallback(
    (units: number) => {
      setTask3Done(true);
      awardEnergy(units);
    },
    [awardEnergy]
  );

  const handleReportAnswer = useCallback(
    (answerId: string) => {
      if (missionDone) {
        return;
      }

      setReportAnswer(answerId);
      if (answerId === 'b') {
        awardEnergy(600);
        window.setTimeout(() => {
          setMissionDone(true);
          void persistCompletion();
        }, 500);
      }
    },
    [awardEnergy, missionDone, persistCompletion]
  );

  const canAdvanceAct0 = messagesDone;
  const canAdvanceAct1 = task1Done && task2Done;
  const canAdvanceAct2 = task3Done;
  const currentInvestigationTask = ACT1_TASKS[investigationTaskIndex] ?? ACT1_TASKS[0];
  const currentInvestigationDone =
    investigationTaskIndex === 0 ? task1Done : task2Done;
  const currentInvestigationReaction = currentInvestigationTask?.reaction;
  const isDarkMode = resolvedTheme !== 'light';
  const theme = useMemo<MissionTheme>(
    () =>
      isDarkMode
        ? {
            rootBg: '#0a0a0a',
            rootText: '#f0f0f0',
            isDark: true,
            headerBg: 'rgba(10,10,10,0.98)',
            headerBorder: '1px solid rgba(255,255,255,0.08)',
            missionStripBg: 'linear-gradient(135deg,#111111,#0a0a0a)',
            missionStripBorder: '1px solid rgba(255,255,255,0.07)',
            panelBg: '#111111',
            panelBgStrong: '#191919',
            panelBorder: '1px solid rgba(255,255,255,0.08)',
            panelSubBorder: '1px solid rgba(255,255,255,0.07)',
            textPrimary: '#f0f0f0',
            textSecondary: '#c8c8c8',
            textMuted: '#a8a8a8',
            textTertiary: '#8c8c8c',
            textQuaternary: '#737373',
            bubbleBg: '#171717',
            bubbleBorder: 'rgba(255,255,255,0.08)',
            selfBubbleBg: 'rgba(229,229,229,0.07)',
            selfBubbleBorder: 'rgba(229,229,229,0.16)',
            dangerText: '#f87171',
            dangerBg: 'rgba(239,68,68,0.1)',
            dangerBorder: 'rgba(239,68,68,0.28)',
            accent: '#e5e5e5',
            accentSoft: 'rgba(229,229,229,0.08)',
            accentBorder: 'rgba(229,229,229,0.18)',
            accentGradient: 'linear-gradient(135deg,#2a2a2a,#e5e5e5)',
            accentShadow: '0 6px 24px rgba(229,229,229,0.14)',
            warning: '#f59e0b',
            warningSoft: 'rgba(245,158,11,0.08)',
            warningBorder: 'rgba(245,158,11,0.2)',
            success: '#22b999',
            successSoft: 'rgba(34,185,153,0.1)',
            successBorder: 'rgba(34,185,153,0.28)',
            codeBg: '#080808',
            codeOutputBg: '#0c0c0c',
            codeText: '#c0c0c0',
            codeBorder: 'rgba(255,255,255,0.08)',
            frequencyLine: '#e5e5e5',
            frequencyGrid: '#2b2b2b',
            optionBg: 'rgba(255,255,255,0.04)',
            successBg: 'rgba(255,255,255,0.03)',
            typingDot: '#737373'
          }
        : {
            rootBg: '#f3f5f9',
            rootText: '#0f172a',
            isDark: false,
            headerBg: 'rgba(255,255,255,0.96)',
            headerBorder: '1px solid rgba(15,23,42,0.08)',
            missionStripBg: 'rgba(248,250,252,0.98)',
            missionStripBorder: '1px solid rgba(15,23,42,0.08)',
            panelBg: '#ffffff',
            panelBgStrong: '#f8fafc',
            panelBorder: '1px solid rgba(15,23,42,0.12)',
            panelSubBorder: '1px solid rgba(15,23,42,0.08)',
            textPrimary: '#0f172a',
            textSecondary: '#1f2937',
            textMuted: '#334155',
            textTertiary: '#64748b',
            textQuaternary: '#475569',
            bubbleBg: '#ffffff',
            bubbleBorder: 'rgba(15,23,42,0.14)',
            selfBubbleBg: 'rgba(37,99,235,0.12)',
            selfBubbleBorder: 'rgba(37,99,235,0.28)',
            dangerText: '#dc2626',
            dangerBg: 'rgba(220,38,38,0.08)',
            dangerBorder: 'rgba(220,38,38,0.24)',
            accent: '#2563eb',
            accentSoft: 'rgba(37,99,235,0.08)',
            accentBorder: 'rgba(37,99,235,0.24)',
            accentGradient: 'linear-gradient(135deg,#1a5fa8,#64a0dc)',
            accentShadow: '0 6px 24px rgba(100,160,220,0.25)',
            warning: '#d97706',
            warningSoft: 'rgba(217,119,6,0.08)',
            warningBorder: 'rgba(217,119,6,0.2)',
            success: '#16a34a',
            successSoft: 'rgba(22,163,74,0.08)',
            successBorder: 'rgba(22,163,74,0.2)',
            codeBg: '#060d18',
            codeOutputBg: '#040c14',
            codeText: '#a5b4fc',
            codeBorder: 'rgba(100,160,220,0.1)',
            frequencyLine: '#2563eb',
            frequencyGrid: '#94a3b8',
            optionBg: 'rgba(15,23,42,0.03)',
            successBg: 'rgba(15,23,42,0.03)',
            typingDot: '#64748b'
          },
    [isDarkMode]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.rootBg,
        color: theme.rootText,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <div style={{ minHeight: '100vh' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typeDot { 0%,100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes unlockGlow { 0% { box-shadow: 0 0 0 0 rgba(100,160,220,0.5); } 100% { box-shadow: 0 0 0 20px rgba(100,160,220,0); } }
      `}</style>

      <EnergyToast units={toast} theme={theme} />

      <div
        style={{
          height: 50,
          borderBottom: theme.headerBorder,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
          background: theme.headerBg,
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <Link
          href="/missions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 7,
            border: `1px solid ${theme.accentBorder}`,
            color: theme.textMuted,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'system-ui,sans-serif',
            textDecoration: 'none'
          }}
        >
          <ArrowLeftIcon size={11} /> Exit Mission
        </Link>

        <div style={{ display: 'flex', gap: 3, marginLeft: 16 }}>
          {ACTS.map((entry) => {
            const done =
              (entry.id === 0 && canAdvanceAct0) ||
              (entry.id === 1 && canAdvanceAct1) ||
              (entry.id === 2 && canAdvanceAct2) ||
              (entry.id === 3 && missionDone);

            const active = act === entry.id;
            const locked =
              (entry.id === 1 && !canAdvanceAct0) ||
              (entry.id === 2 && !canAdvanceAct1) ||
              (entry.id === 3 && !canAdvanceAct2);

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  if (!locked) {
                    setAct(entry.id);
                  }
                }}
                disabled={locked}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 8,
                  border: `1px solid ${
                    active
                      ? 'rgba(248,113,113,0.4)'
                      : done
                        ? theme.accentBorder
                        : 'transparent'
                  }`,
                  background: active
                    ? 'rgba(248,113,113,0.08)'
                    : done
                      ? theme.accentSoft
                      : 'transparent',
                  color: active
                    ? '#f87171'
                    : done
                      ? theme.accent
                      : locked
                        ? theme.textQuaternary
                        : theme.textTertiary,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: locked ? 'not-allowed' : 'pointer',
                  fontFamily: 'system-ui,sans-serif',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: 13 }}>{entry.icon}</span>
                {done && !active ? <CheckIcon size={9} /> : null}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FrequencyWave
            glitch={act === 1 || act === 2}
            width={200}
            height={28}
            accent={theme.frequencyLine}
            grid={theme.frequencyGrid}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 99,
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)'
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#f87171',
                animation: 'pulse 1s infinite'
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#f87171',
                fontFamily: 'system-ui,sans-serif'
              }}
            >
              GHOST ACTIVE
            </span>
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              background: theme.accentSoft,
              border: `1px solid ${theme.accentBorder}`
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: theme.accent,
                fontFamily: "'Courier New',monospace"
              }}
            >
              +{sessionEnergy} kWh
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '18px 24px 14px',
          borderBottom: theme.missionStripBorder,
          background: theme.missionStripBg
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '3px 9px',
                borderRadius: 6,
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)'
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: '#f87171',
                  fontFamily: 'system-ui,sans-serif'
                }}
              >
                CLASSIFIED · MISSION 003
              </span>
            </div>

            <div
              style={{
                padding: '3px 9px',
                borderRadius: 6,
                background: theme.warningSoft,
                border: `1px solid ${theme.warningBorder}`
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: theme.warning,
                  fontFamily: 'system-ui,sans-serif'
                }}
              >
                HARD · 90 MIN
              </span>
            </div>

            <span
              style={{
                fontSize: 9,
                color: theme.textTertiary,
                fontFamily: 'system-ui,sans-serif',
                fontWeight: 600
              }}
            >
              ENTSO-E Grid Intelligence
            </span>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: theme.textPrimary,
              letterSpacing: '-0.5px',
              marginTop: 8
            }}
          >
            THE GHOST REGULATOR
          </h1>
          <p
            style={{
              fontSize: 13,
              color: theme.textQuaternary,
              fontFamily: 'system-ui,sans-serif',
              marginTop: 3
            }}
          >
            {ACTS[act].icon} Act {act + 1} — {ACTS[act].label}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
        {act === 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 320px',
              gap: 16,
              animation: 'fadeUp 0.35s ease'
            }}
          >
            <div
              style={{
                borderRadius: 16,
                border: theme.panelBorder,
                background: theme.panelBg,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: theme.panelSubBorder,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#f87171',
                    fontWeight: 800,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  # incident-iberia
                </span>
                <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
                <span
                  style={{
                    fontSize: 10,
                    color: theme.textTertiary,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  16/02/2026 · 02:18 UTC · Zaragoza anomaly
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#f87171',
                      animation: 'pulse 1s infinite'
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: '#f87171',
                      fontWeight: 700,
                      fontFamily: 'system-ui,sans-serif'
                    }}
                  >
                    LIVE
                  </span>
                </div>
              </div>

              <div
                ref={chatRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  minHeight: 340
                }}
              >
                {visibleMessages.map((message) => (
                  <ChatBubble key={message.id} message={message} theme={theme} />
                ))}
                {typingWho ? (
                  <TypingIndicator name={typingWho.name} color={typingWho.color} theme={theme} />
                ) : null}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  animation: 'fadeUp 0.4s ease 0.1s both'
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: '#f87171',
                    marginBottom: 10,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  ACTIVE ALERTS
                </p>

                {[
                  { code: 'FR-001', text: 'Frequency +0.42 Hz', zone: 'ZGZ-04' },
                  {
                    code: 'EV-847',
                    text: 'Out-of-order SCADA events',
                    zone: 'Corridor'
                  },
                  {
                    code: 'TS-157',
                    text: 'Missing telemetry records',
                    zone: 'LLE-09'
                  }
                ].map((alert) => (
                  <div
                    key={alert.code}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '7px 9px',
                      borderRadius: 8,
                      background: 'rgba(248,113,113,0.05)',
                      border: '1px solid rgba(248,113,113,0.12)',
                      marginBottom: 6
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        flexShrink: 0,
                        borderRadius: 99,
                        background: '#f87171'
                      }}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#f87171',
                          fontFamily: "'Courier New',monospace"
                        }}
                      >
                        {alert.code}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: theme.textSecondary,
                          fontFamily: 'system-ui,sans-serif'
                        }}
                      >
                        {alert.text}
                      </p>
                      <p
                        style={{
                          fontSize: 9,
                          color: theme.textTertiary,
                          fontFamily: 'system-ui,sans-serif'
                        }}
                      >
                        Zone: {alert.zone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: theme.panelBg,
                  border: theme.panelBorder
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: theme.textTertiary,
                    marginBottom: 10,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  FREQUENCY · 02:17–02:21 UTC
                </p>
                <FrequencyWave
                  glitch
                  width={264}
                  height={48}
                  accent={theme.frequencyLine}
                  grid={theme.frequencyGrid}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 9,
                      color: theme.textTertiary,
                      fontFamily: "'Courier New',monospace"
                    }}
                  >
                    02:17:00
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#f87171',
                      fontFamily: "'Courier New',monospace"
                    }}
                  >
                    ANOMALY
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: theme.textTertiary,
                      fontFamily: "'Courier New',monospace"
                    }}
                  >
                    02:21:00
                  </span>
                </div>
              </div>

              {canAdvanceAct0 ? (
                <button
                  type="button"
                  onClick={() => setAct(1)}
                  style={{
                    padding: 13,
                    borderRadius: 12,
                    border: 'none',
                    background: theme.accentGradient,
                    color: theme.isDark ? '#0a0a0a' : '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'system-ui,sans-serif',
                    boxShadow: theme.accentShadow,
                    animation: 'unlockGlow 0.8s ease'
                  }}
                >
                  Begin Investigation →
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {act === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.35s ease' }}>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: theme.accentSoft,
                border: theme.panelBorder
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  lineHeight: 1.7,
                  fontFamily: 'system-ui,sans-serif'
                }}
              >
                <strong style={{ color: theme.accent }}>Lena Kovač:</strong> You have read access to the telemetry replica. Two tasks. First: confirm the missing time slice. Second: prove the event ordering inversion. Both together make the Ghost undeniable.
              </p>
            </div>

            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${currentInvestigationDone ? theme.successBorder : theme.accentBorder}`,
                background: theme.panelBg,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: theme.panelSubBorder
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: theme.accent,
                      fontFamily: 'system-ui,sans-serif'
                    }}
                  >
                    {currentInvestigationTask.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: theme.textTertiary,
                        fontWeight: 700,
                        fontFamily: 'system-ui,sans-serif'
                      }}
                    >
                      Task {investigationTaskIndex + 1} of {ACT1_TASKS.length}
                    </span>
                    {currentInvestigationDone ? (
                      <span
                        style={{
                          fontSize: 10,
                          color: theme.success,
                          fontWeight: 700,
                          fontFamily: 'system-ui,sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <CheckIcon size={9} /> +{currentInvestigationTask.energyUnits} kWh
                      </span>
                    ) : null}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    lineHeight: 1.72,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  {currentInvestigationTask.description}
                </p>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <CodeEditor
                  task={currentInvestigationTask}
                  completed={currentInvestigationDone}
                  onComplete={investigationTaskIndex === 0 ? handleTask1 : handleTask2}
                  theme={theme}
                />

                {currentInvestigationDone && currentInvestigationReaction ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: theme.successSoft,
                      border: `1px solid ${theme.successBorder}`,
                      display: 'flex',
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
                    <p
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        lineHeight: 1.6,
                        fontFamily: 'system-ui,sans-serif'
                      }}
                    >
                      <strong
                        style={{
                          color:
                            currentInvestigationReaction.from === 'mario'
                              ? theme.warning
                              : theme.success
                        }}
                      >
                        {currentInvestigationReaction.from === 'mario' ? 'Mario Bauer' : 'Sara Okonkwo'}:
                      </strong>{' '}
                      {currentInvestigationReaction.text}
                    </p>
                  </div>
                ) : null}

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setInvestigationTaskIndex((current) => Math.max(0, current - 1))}
                    disabled={investigationTaskIndex === 0}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: theme.panelBorder,
                      background: theme.panelBgStrong,
                      color: theme.textMuted,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: investigationTaskIndex === 0 ? 'not-allowed' : 'pointer',
                      opacity: investigationTaskIndex === 0 ? 0.5 : 1
                    }}
                  >
                    Previous task
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInvestigationTaskIndex((current) =>
                        Math.min(ACT1_TASKS.length - 1, current + 1)
                      )
                    }
                    disabled={
                      investigationTaskIndex >= ACT1_TASKS.length - 1 || !currentInvestigationDone
                    }
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background:
                        investigationTaskIndex >= ACT1_TASKS.length - 1 || !currentInvestigationDone
                          ? theme.optionBg
                          : theme.accentGradient,
                      color:
                        investigationTaskIndex >= ACT1_TASKS.length - 1 || !currentInvestigationDone
                          ? theme.textTertiary
                          : theme.isDark
                            ? '#0a0a0a'
                            : '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor:
                        investigationTaskIndex >= ACT1_TASKS.length - 1 || !currentInvestigationDone
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    Next task
                  </button>
                </div>
              </div>
            </div>

            {canAdvanceAct1 ? (
              <button
                type="button"
                onClick={() => setAct(2)}
                style={{
                  padding: 13,
                  borderRadius: 12,
                  border: 'none',
                  background: theme.accentGradient,
                  color: theme.isDark ? '#0a0a0a' : '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'system-ui,sans-serif',
                  boxShadow: theme.accentShadow
                }}
              >
                Proceed to The Fix →
              </button>
            ) : null}
          </div>
        ) : null}

        {act === 2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.35s ease' }}>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(248,113,113,0.05)',
                border: '1px solid rgba(248,113,113,0.15)'
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  lineHeight: 1.7,
                  fontFamily: 'system-ui,sans-serif'
                }}
              >
                <strong style={{ color: '#f87171' }}>Lena Kovač:</strong> We know it&apos;s there. Now we need its fingerprint — the alpha coefficient. That&apos;s the smoking gun. If it&apos;s consistent across zones, this wasn&apos;t random. Someone designed it.
              </p>
            </div>

            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${task3Done ? theme.successBorder : theme.warningBorder}`,
                background: theme.panelBg,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: theme.panelSubBorder,
                  background: theme.warningSoft
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: theme.warning,
                      fontFamily: 'system-ui,sans-serif'
                    }}
                  >
                    {ACT2_TASK.title}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171',
                      fontWeight: 700,
                      fontFamily: 'system-ui,sans-serif'
                    }}
                  >
                    HARDEST · {ACT2_TASK.energyUnits} kWh
                  </span>
                  {task3Done ? (
                    <span
                      style={{
                        fontSize: 10,
                        color: theme.success,
                        fontWeight: 700,
                        fontFamily: 'system-ui,sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <CheckIcon size={9} /> Completed
                    </span>
                  ) : null}
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: theme.textMuted,
                    lineHeight: 1.7,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  {ACT2_TASK.description}
                </p>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <CodeEditor
                  task={ACT2_TASK}
                  completed={task3Done}
                  onComplete={handleTask3}
                  theme={theme}
                />
                {task3Done ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: 'rgba(248,113,113,0.06)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      animation: 'fadeUp 0.4s ease'
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#f87171',
                        marginBottom: 6,
                        fontFamily: 'system-ui,sans-serif'
                      }}
                    >
                      Lena Kovač — 02:44 UTC
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        lineHeight: 1.65,
                        fontFamily: 'system-ui,sans-serif'
                      }}
                    >
                      α = 0.94. Identical across three zones. This wasn&apos;t a bug in one unit — it was the same algorithm deployed in three places simultaneously. Someone pushed this. Write the report.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {canAdvanceAct2 ? (
              <button
                type="button"
                onClick={() => setAct(3)}
                style={{
                  padding: 13,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg,#7a1a1a,#f87171)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'system-ui,sans-serif',
                  boxShadow: '0 6px 24px rgba(248,113,113,0.25)'
                }}
              >
                Write the Incident Report →
              </button>
            ) : null}
          </div>
        ) : null}

        {act === 3 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.35s ease' }}>
            <div
              style={{
                padding: '18px 22px',
                borderRadius: 14,
                background: theme.panelBg,
                border: theme.panelBorder
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  color: theme.textTertiary,
                  marginBottom: 12,
                  fontFamily: 'system-ui,sans-serif'
                }}
              >
                INCIDENT REPORT · IR-2026-0216 · ZARAGOZA CORRIDOR
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  lineHeight: 1.75,
                  marginBottom: 18,
                  fontFamily: 'system-ui,sans-serif'
                }}
              >
                Based on your findings: 157 deleted phasor records (02:17–02:20 UTC), 847 out-of-order SCADA events injected at 02:18:00–02:18:12, and exponential smoothing coefficient α = 0.94 consistent across ZGZ-04, ZGZ-05, LLE-09 — what is the most accurate classification of the Ghost Regulator?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {REPORT_OPTIONS.map((option) => {
                  const selected = reportAnswer === option.id;
                  const correct = option.id === 'b';
                  const revealed = reportAnswer !== null;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleReportAnswer(option.id)}
                      disabled={missionDone}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '14px 16px',
                        borderRadius: 12,
                        cursor: missionDone ? 'default' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        border: `1px solid ${
                          revealed && correct
                            ? theme.successBorder
                            : revealed && selected && !correct
                              ? 'rgba(248,113,113,0.4)'
                              : selected
                                ? theme.accentBorder
                                : theme.panelSubBorder
                        }`,
                        background:
                          revealed && correct
                            ? theme.successSoft
                            : revealed && selected && !correct
                              ? 'rgba(248,113,113,0.06)'
                              : theme.optionBg,
                        fontFamily: 'system-ui,sans-serif'
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginTop: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1.5px solid ${
                            revealed && correct
                              ? theme.success
                              : revealed && selected && !correct
                                ? '#f87171'
                                : theme.accentBorder
                          }`
                        }}
                      >
                        {revealed && correct ? <CheckIcon size={9} /> : null}
                        {revealed && selected && !correct ? (
                          <span style={{ fontSize: 10, color: '#f87171' }}>✕</span>
                        ) : null}
                        {!revealed ? (
                          <span style={{ fontSize: 10, color: theme.textQuaternary, fontWeight: 700 }}>
                            {option.id.toUpperCase()}
                          </span>
                        ) : null}
                      </div>

                      <p
                        style={{
                          fontSize: 12.5,
                          color:
                            revealed && correct
                              ? theme.success
                              : revealed && selected && !correct
                                ? '#f87171'
                                : theme.textSecondary,
                          lineHeight: 1.6
                        }}
                      >
                        {option.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {missionDone ? (
              <div
                style={{
                  padding: '24px 28px',
                  borderRadius: 16,
                  background: theme.isDark
                    ? 'linear-gradient(135deg, rgba(34,185,153,0.08), rgba(229,229,229,0.07))'
                    : 'linear-gradient(135deg,rgba(77,184,122,0.08),rgba(100,160,220,0.08))',
                  border: `1px solid ${theme.successBorder}`,
                  animation: 'fadeUp 0.5s ease'
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: theme.success,
                    marginBottom: 12,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  ✓ MISSION COMPLETE · GHOST REGULATOR IDENTIFIED
                </p>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: theme.textPrimary,
                    letterSpacing: '-0.4px',
                    marginBottom: 10
                  }}
                >
                  The Night Spain Went Quiet — Solved.
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    lineHeight: 1.75,
                    marginBottom: 20,
                    fontFamily: 'system-ui,sans-serif'
                  }}
                >
                  The Ghost Regulator was a deliberate exponential smoothing algorithm deployed across three zones in the Zaragoza–Lleida corridor, targeting σ &lt; 0.02 Hz. It deleted its own evidence. It optimised for stability — and in doing so, erased the signals that would have prevented the cascade. <em style={{ color: theme.textSecondary }}>Spain didn&apos;t black out like a storm. It blacked out like a corrupted dataset.</em>
                </p>
                <div
                  style={{
                    marginBottom: 18,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1px solid ${theme.successBorder}`,
                    background: theme.isDark
                      ? 'rgba(34,185,153, 0.08)'
                      : 'rgba(34,185,153, 0.06)'
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: theme.textPrimary,
                      marginBottom: 4
                    }}
                  >
                    Mission timeline stabilized
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: theme.textTertiary,
                      fontFamily: 'system-ui,sans-serif'
                    }}
                  >
                    Completion energy was committed and the waveform state is now synced to your profile.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { icon: '⚡', label: `${sessionEnergy} kWh`, sub: 'injected into the twin' },
                    { icon: '🏅', label: 'Grid Investigator', sub: 'badge unlocked' },
                    { icon: '📄', label: 'Incident Report', sub: 'PDF ready' },
                    { icon: '🔍', label: 'Fragment 1/4', sub: 'Ghost origin: unknown' }
                  ].map(({ icon, label, sub }) => (
                    <div
                      key={label}
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: theme.successBg,
                        border: theme.panelBorder,
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: theme.textPrimary, marginBottom: 3 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 10, color: theme.textTertiary, fontFamily: 'system-ui,sans-serif' }}>
                        {sub}
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: theme.textTertiary,
                    marginTop: 18,
                    fontFamily: 'system-ui,sans-serif',
                    fontStyle: 'italic'
                  }}
                >
                  Next fragment: who deployed it, and what were they optimising for? Mission 004 unlocked.
                </p>
                <div style={{ marginTop: 16 }}>
                  <LightbulbPulseFeedback
                    contextType="mission"
                    contextId={MISSION_SLUG}
                    prompt="How was this mission?"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
