'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Lock } from 'lucide-react';
import {
  trackProductEvent,
  trackProductEventOnce
} from '@/lib/analytics/productAnalytics';
import { completeOnboarding } from '@/app/onboarding/actions';
import { ComponentCatalogDemo } from '@/components/home/landing/ComponentCatalogDemo';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface OnboardingFlowProps {
  displayName: string;
}

type Topic = 'pyspark' | 'fabric';
type TierId = 'junior' | 'mid' | 'senior';

type Step = 'welcome' | 'topic' | 'tracks' | 'economy' | 'grid' | 'ready';

const STEPS: Step[] = ['welcome', 'topic', 'tracks', 'economy', 'grid', 'ready'];

/* ── Visual tokens ────────────────────────────────────────────────────────── */

// Cyan on concept steps, amber on decision/commit steps (see plan).
const STEP_ACCENT: Record<Step, { rgb: string; hex: string }> = {
  welcome:  { rgb: '153,247,255', hex: '#99f7ff' },
  topic:    { rgb: '255,201,101', hex: '#ffc965' },
  tracks:   { rgb: '153,247,255', hex: '#99f7ff' },
  economy:  { rgb: '153,247,255', hex: '#99f7ff' },
  grid:     { rgb: '153,247,255', hex: '#99f7ff' },
  ready:    { rgb: '255,201,101', hex: '#ffc965' }
};

/* ── Content data ─────────────────────────────────────────────────────────── */

const TOPICS: Array<{
  id: Topic;
  label: string;
  description: string;
  logo: string;
  rgb: string;
}> = [
  {
    id: 'pyspark',
    label: 'PySpark',
    description: 'Distributed data processing at scale with Spark 3.4+',
    logo: '/brand/pyspark-logo.svg',
    rgb: '255,154,96'
  },
  {
    id: 'fabric',
    label: 'Microsoft Fabric',
    description: 'Unified analytics — Lakehouse, pipelines, and governance',
    logo: '/brand/microsoft-fabric-2023.svg',
    rgb: '155,89,224'
  }
];

const TRACKS: Array<{
  id: TierId;
  label: string;
  subtitle: string;
  portrait: string;
  threshold: number;
  multiplier: string;
  rgb: string;
}> = [
  {
    id: 'junior',
    label: 'Junior',
    subtitle: 'Foundational modules',
    portrait: '/brand/profile-junior.png',
    threshold: 0,
    multiplier: '1.0×',
    rgb: '153,247,255'
  },
  {
    id: 'mid',
    label: 'Mid',
    subtitle: 'Advanced systems',
    portrait: '/brand/profile-mid.png',
    threshold: 500,
    multiplier: '1.5×',
    rgb: '255,201,101'
  },
  {
    id: 'senior',
    label: 'Senior',
    subtitle: 'Platform architecture',
    portrait: '/brand/profile-senior.png',
    threshold: 2500,
    multiplier: '3.0×',
    rgb: '255,113,108'
  }
];

const EARN_RATES: Array<{ label: string; kwh: number }> = [
  { label: 'Lesson read', kwh: 5 },
  { label: 'Module complete', kwh: 25 },
  { label: 'Track complete', kwh: 200 }
];

const BATTERY_CAPACITY = 5000;

/* ── Component ────────────────────────────────────────────────────────────── */

export function OnboardingFlow({ displayName }: OnboardingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedTopics, setSelectedTopics] = useState<Set<Topic>>(new Set());
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const signupTrackedRef = useRef(false);

  const stepIndex = STEPS.indexOf(step);
  const accent = STEP_ACCENT[step];

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const canAdvance = () => {
    if (step === 'topic') return selectedTopics.size > 0;
    return true;
  };

  const advance = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  useEffect(() => {
    if (signupTrackedRef.current) return;
    if (searchParams.get('signup') !== '1') return;
    signupTrackedRef.current = true;
    void trackProductEventOnce('signup_completed', 'signup_completed', {
      method: searchParams.get('method') ?? 'unknown'
    });
  }, [searchParams]);

  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setFinishError(null);
    const destination = '/learn';
    // Emit legacy selectedGoal/selectedLevel keys as null for one release to
    // keep dashboards that key on them from breaking silently. Remove after audit.
    await trackProductEvent('onboarding_completed', {
      selectedTopics: Array.from(selectedTopics),
      selectedGoal: null,
      selectedLevel: null,
      destination
    });
    const result = await completeOnboarding();
    if (!result.ok) {
      setIsFinishing(false);
      setFinishError(result.error);
      return;
    }
    router.push(destination);
    router.refresh();
  };

  const skip = async () => {
    // Skipping is a real choice — write the flag so we don't prompt again.
    // Emit as onboarding_completed with a skipped marker so dashboards keyed
    // on completion still count this, and a dedicated filter can break it out.
    setIsFinishing(true);
    await trackProductEvent('onboarding_completed', {
      selectedTopics: Array.from(selectedTopics),
      selectedGoal: null,
      selectedLevel: null,
      destination: '/home',
      skipped: true,
      skippedAtStep: step
    });
    const result = await completeOnboarding();
    // Even if the flag write fails, honor the skip and navigate — the next
    // visit will re-evaluate; we just accept a possible re-prompt rather than
    // blocking the user here.
    router.push('/home');
    if (result.ok) router.refresh();
  };

  const firstName = displayName.split(' ')[0];

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: '#0a0c0e',
        color: 'rgba(255,255,255,0.92)',
        fontFamily:
          '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif'
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `
        }}
      />

      {/* Step indicator — 7 dots */}
      <div className="sticky top-0 z-30 flex items-center justify-center gap-1.5 px-6 py-5">
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const cur = i === stepIndex;
          return (
            <div
              key={s}
              style={{
                width: cur ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: done
                  ? `rgba(${STEP_ACCENT[s].rgb},0.45)`
                  : cur
                    ? STEP_ACCENT[s].hex
                    : 'rgba(255,255,255,0.08)',
                transition: 'all 420ms cubic-bezier(.16,1,.3,1)'
              }}
            />
          );
        })}
      </div>

      {/* Step body — re-keyed per step so the animation replays */}
      <div
        key={step}
        className="mx-auto flex w-full max-w-4xl flex-col items-stretch px-6 pb-10"
        style={{
          opacity: 0,
          animation: 'fadeSlideUp 500ms cubic-bezier(.16,1,.3,1) forwards'
        }}
      >
        {step === 'welcome' && <WelcomeStep firstName={firstName} />}
        {step === 'topic' && (
          <TopicStep
            selected={selectedTopics}
            onToggle={toggleTopic}
          />
        )}
        {step === 'tracks' && <TracksStep />}
        {step === 'economy' && <EconomyStep active />}
        {step === 'grid' && <GridStep />}
        {step === 'ready' && (
          <ReadyStep
            firstName={firstName}
            selectedTopics={selectedTopics}
          />
        )}

        {/* Navigation row */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={back}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                }}
              >
                ← Back
              </button>
            )}
            {step !== 'ready' && (
              <button
                type="button"
                onClick={skip}
                disabled={isFinishing}
                className="font-mono text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-40"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseOver={(e) => {
                  if (!isFinishing) e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
                }}
              >
                Skip setup
              </button>
            )}
          </div>

          {step === 'ready' ? (
            <PrimaryButton
              accent={accent}
              onClick={finish}
              disabled={isFinishing}
              label={isFinishing ? 'Entering…' : 'Enter the grid'}
            />
          ) : (
            <PrimaryButton
              accent={accent}
              onClick={advance}
              disabled={!canAdvance()}
              label={step === 'welcome' ? "Let's go" : 'Continue'}
            />
          )}
        </div>

        {finishError && (
          <p
            className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.18em]"
            style={{ color: '#ff716c' }}
          >
            Something went wrong — {finishError}. Try again.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Shared UI bits ───────────────────────────────────────────────────────── */

function SurfaceCard({
  children,
  accentRgb,
  style,
  emphasized = false,
  padding = true
}: {
  children: React.ReactNode;
  accentRgb: string;
  style?: CSSProperties;
  emphasized?: boolean;
  padding?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#0f1215',
        border: emphasized
          ? `1px solid rgba(${accentRgb},0.35)`
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        boxShadow: emphasized
          ? `0 0 0 1px rgba(${accentRgb},0.08), 0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(${accentRgb},0.12)`
          : '0 20px 60px rgba(0,0,0,0.35)',
        ...style
      }}
    >
      {/* L-bracket corners */}
      <Corner position="top-left" accentRgb={accentRgb} />
      <Corner position="bottom-right" accentRgb={accentRgb} />
      {padding ? <div className="relative p-7">{children}</div> : children}
    </div>
  );
}

function Corner({
  position,
  accentRgb
}: {
  position: 'top-left' | 'bottom-right';
  accentRgb: string;
}) {
  const baseStyle: CSSProperties = {
    position: 'absolute',
    zIndex: 20,
    pointerEvents: 'none'
  };
  const color = `rgba(${accentRgb},0.5)`;
  if (position === 'top-left') {
    return (
      <div style={{ ...baseStyle, top: 0, left: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 1, background: color }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 20, background: color }} />
      </div>
    );
  }
  return (
    <div style={{ ...baseStyle, bottom: 0, right: 0 }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 1, background: color }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 1, height: 20, background: color }} />
    </div>
  );
}

function Eyebrow({ accentHex, children }: { accentHex: string; children: React.ReactNode }) {
  return (
    <p
      className="font-mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.22em',
        color: accentHex,
        textTransform: 'uppercase',
        fontWeight: 700,
        marginBottom: 14
      }}
    >
      {children}
    </p>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontSize: 'clamp(2rem, 3.4vw, 2.75rem)',
        fontWeight: 800,
        letterSpacing: '-0.035em',
        lineHeight: 1.05,
        color: 'rgba(255,255,255,0.98)',
        margin: 0
      }}
    >
      {children}
    </h1>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 15,
        lineHeight: 1.55,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 14,
        maxWidth: 560
      }}
    >
      {children}
    </p>
  );
}

function PrimaryButton({
  accent,
  onClick,
  disabled,
  label
}: {
  accent: { rgb: string; hex: string };
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 transition-all disabled:cursor-not-allowed"
      style={{
        padding: '14px 22px',
        borderRadius: 14,
        background: disabled ? 'rgba(255,255,255,0.06)' : accent.hex,
        color: disabled ? 'rgba(255,255,255,0.3)' : '#0a0c0e',
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        border: disabled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        boxShadow: disabled ? undefined : `0 8px 30px rgba(${accent.rgb},0.25)`
      }}
      onMouseOver={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 14px 40px rgba(${accent.rgb},0.4)`;
      }}
      onMouseOut={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 8px 30px rgba(${accent.rgb},0.25)`;
      }}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
}

/* ── Step 1: Welcome ──────────────────────────────────────────────────────── */

function WelcomeStep({ firstName }: { firstName: string }) {
  return (
    <SurfaceCard accentRgb="153,247,255" emphasized padding={false}>
      {/* Hero portrait banner */}
      <div className="relative h-56 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/brand/track-junior.png)',
            backgroundPosition: 'center 30%'
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(153,247,255,0.4) 0%, transparent 65%)',
            opacity: 0.4
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 25%, #0f1215 98%)' }}
        />
      </div>

      <div className="relative px-8 pb-10 -mt-6">
        <Eyebrow accentHex="#99f7ff">Hello, {firstName.toUpperCase()}</Eyebrow>
        <Title>Rebuild the grid, one lesson at a time.</Title>
        <Subtitle>
          You&apos;re about to learn serious data engineering while restoring a simulated power grid.
          We&apos;ll walk you through how it works in seven quick steps.
        </Subtitle>

        <div className="mt-10 grid grid-cols-3 gap-3">
          <Stat value="20+" label="tracks" />
          <Stat value="5,000" label="kWh cap" />
          <Stat value="10" label="grid nodes" />
        </div>
      </div>
    </SurfaceCard>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: '-0.02em',
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif'
        }}
      >
        {value}
      </div>
      <div
        className="font-mono"
        style={{
          marginTop: 4,
          fontSize: 9.5,
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Step 2: Topic ────────────────────────────────────────────────────────── */

function TopicStep({
  selected,
  onToggle
}: {
  selected: Set<Topic>;
  onToggle: (t: Topic) => void;
}) {
  return (
    <div>
      <Eyebrow accentHex="#ffc965">Step 2 · Choose your topic</Eyebrow>
      <Title>What do you want to learn first?</Title>
      <Subtitle>Pick one or more. You can always explore the others from the Learn hub.</Subtitle>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {TOPICS.map((t) => {
          const isSelected = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              className="group relative text-left overflow-hidden"
              style={{
                background: '#0f1215',
                border: isSelected
                  ? `1px solid rgba(${t.rgb},0.5)`
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                boxShadow: isSelected
                  ? `0 0 0 1px rgba(${t.rgb},0.1), 0 20px 60px rgba(0,0,0,0.5), 0 0 50px rgba(${t.rgb},0.15)`
                  : '0 10px 30px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(.16,1,.3,1)'
              }}
            >
              <Corner position="top-left" accentRgb={t.rgb} />
              <Corner position="bottom-right" accentRgb={t.rgb} />
              <div
                className="relative flex items-center justify-center"
                style={{
                  height: 180,
                  background: `radial-gradient(ellipse at center, rgba(${t.rgb},0.18) 0%, transparent 70%)`
                }}
              >
                <Image
                  src={t.logo}
                  alt=""
                  width={120}
                  height={120}
                  style={{ height: 80, width: 'auto', opacity: isSelected ? 1 : 0.75 }}
                />
                {isSelected && (
                  <div
                    className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      background: `rgba(${t.rgb},0.18)`,
                      border: `1px solid rgba(${t.rgb},0.45)`
                    }}
                  >
                    <Check className="h-3.5 w-3.5" style={{ color: `rgb(${t.rgb})` }} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="px-7 pb-7 pt-1">
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'rgba(255,255,255,0.95)',
                    margin: 0
                  }}
                >
                  {t.label}
                </h3>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'rgba(255,255,255,0.5)'
                  }}
                >
                  {t.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step 3: Tracks (progression) ─────────────────────────────────────────── */

function TracksStep() {
  return (
    <div>
      <Eyebrow accentHex="#99f7ff">Step 3 · Track progression</Eyebrow>
      <Title>Everyone starts at Junior.</Title>
      <Subtitle>
        You don&apos;t pick a tier — you earn it. Finish Junior modules to bank kWh, then Mid and Senior
        unlock automatically. Higher tiers pay out more per lesson, so progress compounds.
      </Subtitle>

      <div className="mt-10 flex flex-col gap-4">
        {TRACKS.map((tr, i) => {
          const isStart = tr.id === 'junior';
          const isLocked = !isStart;
          return (
            <div
              key={tr.id}
              className="relative flex items-stretch overflow-hidden"
              style={{
                background: '#0f1215',
                border: isStart
                  ? `1px solid rgba(${tr.rgb},0.45)`
                  : '1px solid rgba(255,255,255,0.05)',
                borderRadius: 20,
                boxShadow: isStart
                  ? `0 0 0 1px rgba(${tr.rgb},0.1), 0 20px 50px rgba(0,0,0,0.45), 0 0 40px rgba(${tr.rgb},0.15)`
                  : '0 10px 30px rgba(0,0,0,0.3)',
                opacity: 0,
                animation: `fadeSlideUp 500ms cubic-bezier(.16,1,.3,1) ${i * 100}ms forwards`
              }}
            >
              <Corner
                position="top-left"
                accentRgb={isLocked ? '255,255,255' : tr.rgb}
              />
              <Corner
                position="bottom-right"
                accentRgb={isLocked ? '255,255,255' : tr.rgb}
              />

              {/* Portrait thumbnail */}
              <div
                className="relative shrink-0"
                style={{ width: 140, minHeight: 140, overflow: 'hidden' }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${tr.portrait})`,
                    backgroundPosition: 'center 25%',
                    filter: isLocked ? 'grayscale(1) brightness(0.55)' : undefined
                  }}
                />
                <div
                  className="absolute inset-0 mix-blend-overlay"
                  style={{
                    background: isLocked
                      ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)'
                      : `radial-gradient(ellipse at center, rgba(${tr.rgb},0.35) 0%, transparent 70%)`,
                    opacity: 0.5
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to right, transparent 40%, #0f1215 100%)'
                  }}
                />
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-6 w-6" style={{ color: 'rgba(255,255,255,0.25)' }} strokeWidth={2} />
                  </div>
                )}
              </div>

              {/* Body */}
              <div
                className="relative flex flex-1 items-center justify-between gap-6 px-6 py-5"
                style={{ opacity: isLocked ? 0.55 : 1 }}
              >
                <div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      color: isLocked ? 'rgba(255,255,255,0.35)' : `rgb(${tr.rgb})`,
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginBottom: 4
                    }}
                  >
                    {tr.subtitle}
                  </div>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'rgba(255,255,255,0.95)',
                      margin: 0
                    }}
                  >
                    {tr.label}
                  </h3>
                  {isStart && (
                    <p
                      className="font-mono"
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase'
                      }}
                    >
                      ← You start here
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <TrackStat
                    label="Unlock at"
                    value={tr.threshold === 0 ? 'Start' : `${tr.threshold.toLocaleString()} kWh`}
                  />
                  <TrackStat
                    label="Multiplier"
                    value={tr.multiplier}
                    accentHex={isLocked ? 'rgba(255,255,255,0.55)' : `rgb(${tr.rgb})`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackStat({
  label,
  value,
  accentHex
}: {
  label: string;
  value: string;
  accentHex?: string;
}) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        className="font-mono"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        {label}
      </div>
      <div
        className="font-mono tabular-nums"
        style={{
          marginTop: 4,
          fontSize: 16,
          fontWeight: 700,
          color: accentHex ?? 'rgba(255,255,255,0.9)',
          letterSpacing: '-0.01em'
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Step 5: Economy (kWh) ────────────────────────────────────────────────── */

function EconomyStep({ active }: { active: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const DURATION = 1200;
    const TARGET = BATTERY_CAPACITY;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setCount(Math.floor(TARGET * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const fillRatio = count / BATTERY_CAPACITY;

  return (
    <div>
      <Eyebrow accentHex="#99f7ff">Step 4 · The kWh economy</Eyebrow>
      <Title>Learn. Earn. Bank.</Title>
      <Subtitle>
        Every lesson you finish pays kWh into your Battery Energy Storage System — the BESS.
        The BESS caps at 5,000 kWh. That&apos;s the energy you&apos;ll spend in the Grid.
      </Subtitle>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Battery visualization */}
        <SurfaceCard accentRgb="153,247,255" emphasized>
          <div className="flex items-baseline gap-3">
            <div
              className="font-mono tabular-nums"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'rgba(255,255,255,0.97)',
                lineHeight: 1
              }}
            >
              {count.toLocaleString()}
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 14,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.95)',
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              kWh · cap
            </div>
          </div>
          <p
            className="font-mono"
            style={{
              marginTop: 10,
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              fontWeight: 700
            }}
          >
            Battery Energy Storage System
          </p>

          {/* Apple-style progress bar */}
          <div
            className="mt-7"
            role="img"
            aria-label={`Battery filling to ${count.toLocaleString()} kilowatt hours of ${BATTERY_CAPACITY.toLocaleString()}`}
          >
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(1, fillRatio)) * 100}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: '#99f7ff',
                  transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </div>
          </div>
        </SurfaceCard>

        {/* Earn rates */}
        <SurfaceCard accentRgb="153,247,255">
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: '#99f7ff',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 18
            }}
          >
            How you earn
          </p>
          <div className="flex flex-col gap-1">
            {EARN_RATES.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between py-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>{r.label}</span>
                <span
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.97)',
                    letterSpacing: '-0.01em'
                  }}
                >
                  +{r.kwh} kWh
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: 18,
              fontSize: 12,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.4)'
            }}
          >
            Mid tier earns 1.5×. Senior earns 3×. Deep work compounds.
          </p>
        </SurfaceCard>
      </div>
    </div>
  );
}

/* ── Step 6: Grid ─────────────────────────────────────────────────────────── */

function GridStep() {
  return (
    <div>
      <Eyebrow accentHex="#99f7ff">Step 5 · The grid</Eyebrow>
      <Title>Spend kWh. Bring Lithuania back online.</Title>
      <Subtitle>
        Ten components, six categories, one grid to restore. Deploy substations, relays, and storage
        on a 3D map — each node you bring online tells a piece of the story.
      </Subtitle>

      <div className="mt-10">
        <ComponentCatalogDemo readOnly />
      </div>
    </div>
  );
}

/* ── Step 7: Ready ────────────────────────────────────────────────────────── */

function ReadyStep({
  firstName,
  selectedTopics
}: {
  firstName: string;
  selectedTopics: Set<Topic>;
}) {
  const topicLabels = Array.from(selectedTopics)
    .map((t) => TOPICS.find((tp) => tp.id === t)?.label)
    .filter(Boolean)
    .join(' · ');

  return (
    <SurfaceCard accentRgb="255,201,101" emphasized padding={false}>
      <div className="relative h-60 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/brand/track-senior.png)',
            backgroundPosition: 'center 25%'
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,201,101,0.4) 0%, transparent 65%)',
            opacity: 0.4
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 30%, #0f1215 98%)' }}
        />
        <div className="absolute top-5 left-5 flex h-11 w-11 items-center justify-center rounded-full"
             style={{
               background: 'rgba(255,201,101,0.18)',
               border: '1px solid rgba(255,201,101,0.45)',
               backdropFilter: 'blur(8px)'
             }}>
          <Check className="h-5 w-5" style={{ color: '#ffc965' }} strokeWidth={3} />
        </div>
      </div>

      <div className="relative px-8 pb-10 -mt-6">
        <Eyebrow accentHex="#ffc965">You&apos;re set, {firstName.toUpperCase()}</Eyebrow>
        <Title>The grid is waiting.</Title>
        <Subtitle>
          We&apos;ll drop you into theory so you can start earning your first kWh. Everything else unlocks from there.
        </Subtitle>

        {topicLabels && (
          <div className="mt-8 flex flex-wrap gap-2">
            <RecapChip label="Topics" value={topicLabels} />
            <RecapChip label="Starting" value="Junior tier" />
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

function RecapChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        padding: '8px 14px',
        borderRadius: 100,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
        {value}
      </span>
    </div>
  );
}
