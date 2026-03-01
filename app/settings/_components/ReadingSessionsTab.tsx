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

const TimelinePreview = ({ config }: { config: TheorySessionConfig }) => {
  const method = getTheorySessionMethod(config.methodId);

  if (!method) {
    return null;
  }

  if (!method.isTimed) {
    return (
      <div className="rounded-[1.25rem] border border-light-border bg-light-surface px-4 py-4 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
          <span>Rhythm</span>
          <span>No timer</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-[repeating-linear-gradient(90deg,rgba(17,17,17,0.18)_0_10px,transparent_10px_18px)] dark:bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.22)_0_10px,transparent_10px_18px)]" />
      </div>
    );
  }

  const segments = buildTheorySessionTimeline(config);
  const totalMinutes = getTheorySessionTotalMinutes(config);

  return (
    <div className="rounded-[1.25rem] border border-light-border bg-light-surface px-4 py-4 dark:border-dark-border dark:bg-dark-surface">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
        <span>Rhythm</span>
        <span>{formatTheorySessionDuration(totalMinutes * 60)}</span>
      </div>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
        {segments.map((segment) => (
          <div
            key={segment.key}
            style={{ flex: segment.minutes }}
            className={
              segment.kind === 'focus'
                ? 'bg-text-light-primary dark:bg-text-dark-primary'
                : 'bg-light-hover dark:bg-dark-hover'
            }
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-3 rounded-full bg-text-light-primary dark:bg-text-dark-primary" />
          Focus
        </span>
        {config.breakMinutes > 0 ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-3 rounded-full bg-light-hover dark:bg-dark-hover" />
            Break
          </span>
        ) : null}
      </div>
    </div>
  );
};

const MetaPill = ({
  label,
  value
}: {
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-light-border bg-light-surface px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-surface">
    <span className="text-text-light-tertiary dark:text-text-dark-tertiary">{label}</span>
    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
      {value}
    </span>
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

  if (!method) {
    return null;
  }

  const Icon = methodIconMap[methodId];
  const totalMinutes = getTheorySessionTotalMinutes(config);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${
        isSelected
          ? 'border-text-light-primary bg-light-bg dark:border-text-dark-primary dark:bg-dark-bg'
          : 'border-light-border bg-light-surface hover:border-text-light-primary/30 dark:border-dark-border dark:bg-dark-surface dark:hover:border-text-dark-primary/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-light-border bg-light-bg text-text-light-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {method.label}
          </div>
          <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {method.isTimed
              ? `${config.focusMinutes} / ${config.breakMinutes} · ${config.rounds} rounds`
              : 'No timer'}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
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
  <div className="rounded-[1.25rem] border border-light-border bg-light-surface px-4 py-4 dark:border-dark-border dark:bg-dark-surface">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
          {label}
        </div>
        <div className="mt-2 text-xl font-semibold tracking-tight text-text-light-primary dark:text-text-dark-primary">
          {displayValue}
        </div>
        <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {hint}
        </div>
      </div>

      <div className="inline-flex items-center rounded-full border border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(range.min, value - range.step))}
          disabled={value <= range.min}
          className="flex h-10 w-10 items-center justify-center text-base text-text-light-secondary transition-colors hover:text-text-light-primary disabled:cursor-not-allowed disabled:opacity-35 dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
        >
          -
        </button>
        <div className="h-4 w-px bg-light-border dark:bg-dark-border" />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(range.max, value + range.step))}
          disabled={value >= range.max}
          className="flex h-10 w-10 items-center justify-center text-base text-text-light-secondary transition-colors hover:text-text-light-primary disabled:cursor-not-allowed disabled:opacity-35 dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
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
  <div className="rounded-[1.25rem] border border-light-border bg-light-surface px-4 py-4 dark:border-dark-border dark:bg-dark-surface">
    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-light-tertiary dark:text-text-dark-tertiary">
      {label}
    </div>
    <div className="mt-2 text-xl font-semibold tracking-tight text-text-light-primary dark:text-text-dark-primary">
      {value}
    </div>
    <div className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
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
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Each learning approach keeps its own saved timing, and the theory popup lets the user choose between them before starting.
        </p>
      </SettingsCard>
    );
  }

  const activeMethod = getTheorySessionMethod(selectedMethodId);
  const activeConfig = resolvedConfigs[selectedMethodId];
  const ActiveIcon = methodIconMap[selectedMethodId];
  const totalMinutes = getTheorySessionTotalMinutes(activeConfig);

  if (!activeMethod) {
    return null;
  }

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Reading Sessions"
        description="Adjust the saved timing for each learning approach. The theory popup lets the user choose an approach, then starts it with the preset saved here."
        icon={<Clock3 className="h-4 w-4" />}
      >
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Saved automatically on this browser. The popup only chooses the approach.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {THEORY_SESSION_METHODS.map((method) => (
            <MethodSelectorCard
              key={method.id}
              methodId={method.id}
              config={resolvedConfigs[method.id]}
              isSelected={selectedMethodId === method.id}
              onSelect={() => setSelectedMethodId(method.id)}
            />
          ))}
        </div>

        <section className="mt-5 rounded-[1.75rem] border border-light-border bg-light-bg p-5 dark:border-dark-border dark:bg-dark-bg">
          <div className="flex flex-col gap-4 border-b border-light-border pb-5 dark:border-dark-border lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-light-border bg-light-surface text-text-light-primary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-primary">
                <ActiveIcon className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-text-light-primary dark:text-text-dark-primary">
                  {activeMethod.label}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
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
              className="inline-flex items-center gap-1 self-start rounded-full border border-light-border px-3 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:border-text-light-primary hover:text-text-light-primary dark:border-dark-border dark:text-text-dark-secondary dark:hover:border-text-dark-primary dark:hover:text-text-dark-primary"
            >
              <RotateCcw className="h-4 w-4" />
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
                  value={
                    activeMethod.isTimed
                      ? formatTheorySessionDuration(totalMinutes * 60)
                      : 'Open'
                  }
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
                    setMethodConfig(
                      activeMethod.id,
                      clampTheorySessionConfig({
                        ...activeConfig,
                        focusMinutes
                      })
                    )
                  }
                />
              ) : (
                <StaticRow
                  label="Focus"
                  value="Open"
                  hint="This approach has no countdown."
                />
              )}

              {activeMethod.breakRange ? (
                <AdjustableRow
                  label="Break"
                  value={activeConfig.breakMinutes}
                  displayValue={`${activeConfig.breakMinutes} min`}
                  hint={`${activeMethod.breakRange.min}-${activeMethod.breakRange.max} min`}
                  range={activeMethod.breakRange}
                  onChange={(breakMinutes) =>
                    setMethodConfig(
                      activeMethod.id,
                      clampTheorySessionConfig({
                        ...activeConfig,
                        breakMinutes
                      })
                    )
                  }
                />
              ) : (
                <StaticRow
                  label="Break"
                  value={activeMethod.isTimed ? `${activeConfig.breakMinutes} min` : 'No timer'}
                  hint={
                    activeMethod.isTimed
                      ? 'Break timing is fixed for this approach.'
                      : 'No break countdown.'
                  }
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
                    setMethodConfig(
                      activeMethod.id,
                      clampTheorySessionConfig({
                        ...activeConfig,
                        rounds
                      })
                    )
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
