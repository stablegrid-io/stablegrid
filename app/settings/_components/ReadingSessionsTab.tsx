'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Brain, Clock3, RotateCcw, Zap } from 'lucide-react';
import {
  buildTheorySessionTimeline,
  clampTheorySessionConfig,
  formatTheorySessionDuration,
  getTheorySessionMethod,
  getTheorySessionTotalMinutes,
  THEORY_SESSION_METHODS,
  type TheorySessionConfig,
  type TheorySessionMethodId,
  type TheorySessionRange
} from '@/lib/learn/theorySession';
import {
  resolveTheorySessionMethodConfigs,
  useTheorySessionPreferencesStore
} from '@/lib/stores/useTheorySessionPreferencesStore';
import { SettingsCard } from './ui';

interface ReadingSessionsTabProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const methodIconMap = {
  pomodoro: Clock3,
  'deep-focus': Brain,
  sprint: Zap,
  'free-read': BookOpen
} satisfies Record<TheorySessionMethodId, typeof Clock3>;

const methodAccentMap: Record<TheorySessionMethodId, { color: string; rgb: string }> = {
  sprint: { color: '#99f7ff', rgb: '153,247,255' },
  pomodoro: { color: '#ff716c', rgb: '255,113,108' },
  'deep-focus': { color: '#bf81ff', rgb: '191,129,255' },
  'free-read': { color: '#ffc965', rgb: '255,201,101' },
};

const TimelinePreview = ({ config }: { config: TheorySessionConfig }) => {
  const method = getTheorySessionMethod(config.methodId);
  const accent = methodAccentMap[config.methodId];

  if (!method) return null;

  if (!method.isTimed) {
    return (
      <div className="rounded-[14px] border border-outline-variant/20 bg-surface-container-low p-4">
        <div className="flex items-center justify-between text-[9px] font-mono font-medium uppercase tracking-widest text-on-surface-variant">
          <span>RHYTHM</span>
          <span>No timer</span>
        </div>
        <div className="mt-3 h-1.5 bg-surface-container-highest/20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 10px, transparent 10px 18px)' }} />
      </div>
    );
  }

  const segments = buildTheorySessionTimeline(config);
  const totalMinutes = getTheorySessionTotalMinutes(config);

  return (
    <div className="rounded-[14px] border border-outline-variant/20 bg-surface-container-low p-4">
      <div className="flex items-center justify-between text-[9px] font-mono font-medium uppercase tracking-widest text-on-surface-variant">
        <span>RHYTHM</span>
        <span>{formatTheorySessionDuration(totalMinutes * 60)}</span>
      </div>

      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden">
        {segments.map((segment) => (
          <div
            key={segment.key}
            style={{ flex: segment.minutes, backgroundColor: segment.kind === 'focus' ? accent.color : `rgba(${accent.rgb},0.2)` }}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center gap-4 text-[9px] text-on-surface-variant">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-3" style={{ backgroundColor: accent.color }} />
          Focus
        </span>
        {config.breakMinutes > 0 ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-3" style={{ backgroundColor: `rgba(${accent.rgb},0.2)` }} />
            Break
          </span>
        ) : null}
      </div>
    </div>
  );
};

const MetaPill = ({ label, value }: { label: string; value: string }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1.5 text-[10px]">
    <span className="text-on-surface-variant font-mono font-medium uppercase tracking-widest">{label}</span>
    <span className="font-bold text-on-surface">{value}</span>
  </div>
);

const MethodSelectorCard = ({
  methodId,
  config,
  isSelected,
  onSelect
}: {
  methodId: TheorySessionMethodId;
  config: TheorySessionConfig;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const method = getTheorySessionMethod(methodId);
  if (!method) return null;

  const Icon = methodIconMap[methodId];
  const accent = methodAccentMap[methodId];
  const totalMinutes = getTheorySessionTotalMinutes(config);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[14px] p-4 text-left transition-all border ${
        isSelected
          ? 'border-primary/40 bg-surface-container-low shadow-[0_0_12px_rgba(153,247,255,0.1)]'
          : 'border-outline-variant/20 bg-surface-container hover:border-primary/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border"
          style={{ borderColor: `rgba(${accent.rgb},0.3)`, backgroundColor: `rgba(${accent.rgb},0.1)` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent.color }} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface">
            {method.label}
          </div>
          <div className="mt-0.5 text-[9px] text-on-surface-variant">
            {method.isTimed
              ? `${config.focusMinutes} / ${config.breakMinutes} \u00b7 ${config.rounds} rounds`
              : 'No timer'}
          </div>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-on-surface-variant">
        {method.isTimed ? formatTheorySessionDuration(totalMinutes * 60) : 'Open-ended'}
      </div>
    </button>
  );
};

const AdjustableRow = ({
  label,
  value,
  displayValue,
  hint,
  range,
  onChange
}: {
  label: string;
  value: number;
  displayValue: string;
  hint: string;
  range: TheorySessionRange;
  onChange: (next: number) => void;
}) => (
  <div className="rounded-[14px] border border-outline-variant/20 bg-surface-container-low p-4">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </div>
        <div className="mt-2 text-xl font-bold text-on-surface">
          {displayValue}
        </div>
        <div className="mt-1 text-[9px] text-on-surface-variant/60">
          {hint}
        </div>
      </div>
      <div className="inline-flex items-center rounded-[10px] border border-outline-variant/30 bg-surface-container">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(range.min, value - range.step))}
          disabled={value <= range.min}
          className="flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          -
        </button>
        <div className="h-5 w-px bg-outline-variant/30" />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(range.max, value + range.step))}
          disabled={value >= range.max}
          className="flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  </div>
);

const StaticRow = ({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="rounded-[14px] border border-outline-variant/20 bg-surface-container-low p-4">
    <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-on-surface-variant">
      {label}
    </div>
    <div className="mt-2 text-xl font-bold text-on-surface">
      {value}
    </div>
    <div className="mt-1 text-[9px] text-on-surface-variant/60">
      {hint}
    </div>
  </div>
);

export function ReadingSessionsTab({ onToast }: ReadingSessionsTabProps) {
  const { methodConfigs, hasHydrated, setMethodConfig, resetMethodConfig } =
    useTheorySessionPreferencesStore((state) => ({
      methodConfigs: state.methodConfigs,
      hasHydrated: state.hasHydrated,
      setMethodConfig: state.setMethodConfig,
      resetMethodConfig: state.resetMethodConfig
    }));
  const [selectedMethodId, setSelectedMethodId] =
    useState<TheorySessionMethodId>('pomodoro');

  const resolvedConfigs = useMemo(
    () => resolveTheorySessionMethodConfigs(methodConfigs),
    [methodConfigs]
  );

  if (!hasHydrated) {
    return (
      <SettingsCard
        title="Reading Sessions"
        description="Loading your session tracker presets."
        icon={<Clock3 className="h-4 w-4" />}
      >
        <p className="text-[10px] text-on-surface-variant">
          Loading session configuration...
        </p>
      </SettingsCard>
    );
  }

  const activeMethod = getTheorySessionMethod(selectedMethodId);
  const activeConfig = resolvedConfigs[selectedMethodId];
  const ActiveIcon = methodIconMap[selectedMethodId];
  const activeAccent = methodAccentMap[selectedMethodId];
  const totalMinutes = getTheorySessionTotalMinutes(activeConfig);

  if (!activeMethod) return null;

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Reading Sessions"
        description="Adjust the saved timing for each learning approach. The theory popup lets the user choose an approach, then starts it with the preset saved here."
        icon={<Clock3 className="h-4 w-4" />}
      >
        <p className="text-[10px] text-on-surface-variant">
          Saved automatically on this browser. The popup only chooses the approach.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {THEORY_SESSION_METHODS.filter((m) => m.id !== 'free-read').map((method) => (
            <MethodSelectorCard
              key={method.id}
              methodId={method.id}
              config={resolvedConfigs[method.id]}
              isSelected={selectedMethodId === method.id}
              onSelect={() => setSelectedMethodId(method.id)}
            />
          ))}
        </div>

        <section className="mt-5 rounded-[22px] border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="flex flex-col gap-4 border-b border-outline-variant/20 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border"
                style={{ borderColor: `rgba(${activeAccent.rgb},0.3)`, backgroundColor: `rgba(${activeAccent.rgb},0.1)` }}
              >
                <ActiveIcon className="h-5 w-5" style={{ color: activeAccent.color }} />
              </div>
              <div>
                <h3 className="text-xl font-mono font-bold text-on-surface uppercase tracking-wider">
                  {activeMethod.label}
                </h3>
                <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-on-surface-variant">
                  {activeMethod.bestFor}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                resetMethodConfig(activeMethod.id);
                onToast(`${activeMethod.label} reset to its default timing.`, 'info');
              }}
              className="inline-flex items-center gap-1.5 self-start rounded-[14px] border border-outline-variant/30 px-3 py-1.5 text-[10px] font-mono font-medium text-on-surface-variant uppercase tracking-widest transition-colors hover:border-primary/40 hover:text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1fr)]">
            <div className="space-y-4">
              <TimelinePreview config={activeConfig} />
              <div className="flex flex-wrap gap-2">
                <MetaPill label="Cadence" value={activeMethod.cadenceLabel} />
                <MetaPill
                  label="Total"
                  value={activeMethod.isTimed ? formatTheorySessionDuration(totalMinutes * 60) : 'Open'}
                />
              </div>
            </div>

            <div className="space-y-3">
              {activeMethod.focusRange ? (
                <AdjustableRow
                  label="Focus"
                  value={activeConfig.focusMinutes}
                  displayValue={`${activeConfig.focusMinutes} min`}
                  hint={`${activeMethod.focusRange.min}-${activeMethod.focusRange.max} min`}
                  range={activeMethod.focusRange}
                  onChange={(focusMinutes) =>
                    setMethodConfig(activeMethod.id, clampTheorySessionConfig({ ...activeConfig, focusMinutes }))
                  }
                />
              ) : (
                <StaticRow label="Focus" value="Open" hint="This approach has no countdown." />
              )}

              {activeMethod.breakRange ? (
                <AdjustableRow
                  label="Break"
                  value={activeConfig.breakMinutes}
                  displayValue={`${activeConfig.breakMinutes} min`}
                  hint={`${activeMethod.breakRange.min}-${activeMethod.breakRange.max} min`}
                  range={activeMethod.breakRange}
                  onChange={(breakMinutes) =>
                    setMethodConfig(activeMethod.id, clampTheorySessionConfig({ ...activeConfig, breakMinutes }))
                  }
                />
              ) : (
                <StaticRow
                  label="Break"
                  value={activeMethod.isTimed ? `${activeConfig.breakMinutes} min` : 'No timer'}
                  hint={activeMethod.isTimed ? 'Break timing is fixed for this approach.' : 'No break countdown.'}
                />
              )}

              {activeMethod.roundRange ? (
                <AdjustableRow
                  label="Rounds"
                  value={activeConfig.rounds}
                  displayValue={`${activeConfig.rounds} round${activeConfig.rounds === 1 ? '' : 's'}`}
                  hint={`${activeMethod.roundRange.min}-${activeMethod.roundRange.max} rounds`}
                  range={activeMethod.roundRange}
                  onChange={(rounds) =>
                    setMethodConfig(activeMethod.id, clampTheorySessionConfig({ ...activeConfig, rounds }))
                  }
                />
              ) : (
                <StaticRow
                  label="Rounds"
                  value={`${activeConfig.rounds} round${activeConfig.rounds === 1 ? '' : 's'}`}
                  hint="Round count is fixed for this approach."
                />
              )}
            </div>
          </div>
        </section>
      </SettingsCard>
    </div>
  );
}
