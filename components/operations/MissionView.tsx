'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useOperationsStore } from '@/lib/stores/useOperationsStore';
import { MISSIONS, TIERS } from '@/data/operations';
import { GameToast, useGameToast } from '@/components/ui/GameToast';
import { DiagramRenderer } from '@/components/operations/DiagramRenderer';
import { Blackboard } from '@/components/operations/Blackboard';

interface MissionViewProps {
  missionId: string;
}

const TIER_COLORS: Record<number, string> = {
  1: '#22b99a',
  2: '#f0c040',
  3: '#f07030',
  4: '#b060e0',
};

const TIER_RGB: Record<number, string> = {
  1: '34,185,154',
  2: '240,192,64',
  3: '240,112,48',
  4: '176,96,224',
};

export function MissionView({ missionId }: MissionViewProps) {
  const mission = MISSIONS.find((m) => m.id === missionId);

  if (!mission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060809]">
        <p className="font-mono text-sm text-[#3a5a4a]">Mission not found.</p>
      </div>
    );
  }

  const tierColor = TIER_COLORS[mission.tier] ?? '#22b99a';
  const tierRgb = TIER_RGB[mission.tier] ?? '34,185,154';
  const tierName = TIERS[mission.tier]?.name ?? 'TIER';

  const completedOperations = useOperationsStore((s) => s.completedOperations);
  const addCredits = useOperationsStore((s) => s.addCredits);
  const recordOperationResult = useOperationsStore((s) => s.recordOperationResult);
  const existingResult = completedOperations[missionId];

  const [selected, setSelected] = useState<number | null>(
    existingResult ? (existingResult.correct ? mission.correctIndex : -1) : null,
  );
  const [submitted, setSubmitted] = useState(!!existingResult);
  const { toast, show: showToast } = useGameToast();

  const isCorrect =
    submitted &&
    (existingResult?.correct != null ? existingResult.correct : selected === mission.correctIndex);

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    const correct = selected === mission.correctIndex;
    setSubmitted(true);
    if (!existingResult) {
      recordOperationResult(missionId, {
        missionId,
        completed: true,
        correct,
        answeredAt: new Date().toISOString(),
        creditsPaid: correct ? mission.payout : 0,
      });
      if (correct) {
        addCredits(mission.payout);
        showToast(`Mission cleared · +€${mission.payout}`, tierColor);
      } else {
        showToast('Incorrect · No payout', '#f04060');
      }
    }
  };

  const nextMission = (() => {
    const idx = MISSIONS.findIndex((m) => m.id === missionId);
    return MISSIONS[idx + 1] ?? null;
  })();

  return (
    <div className="min-h-screen bg-[#060809] px-6 pb-24 pt-8 lg:px-10">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px',
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(${tierRgb},1), transparent 70%)`,
        }}
      />

      {toast && <GameToast msg={toast.msg} color={toast.color} />}

      <div className="relative mx-auto max-w-6xl">

        {/* Top nav bar */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/operations"
            className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#3a5a4a] transition-colors duration-200 hover:text-[#22b99a]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            All missions
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-[0.3em]"
              style={{ color: `rgba(${tierRgb},0.5)` }}
            >
              {mission.id}
            </span>
            <div
              className="h-3 w-px"
              style={{ backgroundColor: `rgba(${tierRgb},0.2)` }}
            />
            <span
              className="rounded-[3px] border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{ borderColor: `rgba(${tierRgb},0.3)`, color: tierColor, background: `rgba(${tierRgb},0.06)` }}
            >
              {tierName}
            </span>
            <span className="font-mono text-sm font-bold text-[#f0c040]">€{mission.payout}</span>
          </div>
        </div>

        {/* Mission title block */}
        <div className="mb-10">
          <h1 className="text-[2.25rem] font-bold leading-none tracking-[-0.02em] text-white">
            {mission.name}
          </h1>
          <div
            className="mt-3 h-[1.5px] w-20"
            style={{ background: `linear-gradient(90deg, ${tierColor}, transparent)` }}
          />
        </div>

        {/* Full-width single column */}
        <div className="space-y-4">

          {/* 1. Merged Situation + Network Topology card */}
          <div
            className="relative overflow-hidden rounded-[10px] border"
            style={{
              borderColor: `rgba(${tierRgb},0.14)`,
              background: 'rgba(12,17,14,0.85)',
              backdropFilter: 'blur(20px)',
              boxShadow: `0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="h-[1px] w-full" style={{ background: `linear-gradient(90deg, rgba(${tierRgb},0.4), transparent 60%)` }} />
            <span className="absolute left-3 top-3 h-4 w-4 border-l border-t" style={{ borderColor: `rgba(${tierRgb},0.3)` }} />
            <span className="absolute right-3 top-3 h-4 w-4 border-r border-t" style={{ borderColor: `rgba(${tierRgb},0.3)` }} />
            <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l" style={{ borderColor: `rgba(${tierRgb},0.3)` }} />
            <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r" style={{ borderColor: `rgba(${tierRgb},0.3)` }} />

            <div className="flex flex-col gap-0 lg:flex-row">
              {/* Left column: situation + question + options + submit */}
              <div className="flex flex-col px-6 py-5 lg:w-1/2">
                <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.35em]" style={{ color: `rgba(${tierRgb},0.5)` }}>
                  Situation
                </p>
                <p className="text-[13px] leading-[1.75] text-[#8ab8ae]">{mission.brief}</p>

                <div className="my-4 h-px w-full" style={{ background: `linear-gradient(90deg, rgba(${tierRgb},0.15), transparent)` }} />

                {/* Question */}
                <p className="mb-3 text-[14px] font-semibold leading-[1.5] tracking-[-0.01em] text-white">
                  {mission.question}
                </p>

                {/* Options 2×2 */}
                <div className="grid grid-cols-2 gap-2">
                  {mission.options.map((opt, i) => {
                    const isSel = selected === i;
                    const isRight = submitted && i === mission.correctIndex;
                    const isWrong = submitted && isSel && i !== mission.correctIndex;

                    let borderColor = 'rgba(255,255,255,0.07)';
                    let bg = 'rgba(255,255,255,0.02)';
                    let textColor = '#5a8878';
                    let letterBg = 'rgba(255,255,255,0.03)';
                    let letterBorder = 'rgba(255,255,255,0.08)';
                    let letterColor = '#3a5a4a';

                    if (isRight) {
                      borderColor = 'rgba(34,185,154,0.3)';
                      bg = 'rgba(34,185,154,0.06)';
                      textColor = '#22b99a';
                      letterBg = 'rgba(34,185,154,0.12)';
                      letterBorder = 'rgba(34,185,154,0.5)';
                      letterColor = '#22b99a';
                    } else if (isWrong) {
                      borderColor = 'rgba(240,64,96,0.3)';
                      bg = 'rgba(240,64,96,0.05)';
                      textColor = '#f04060';
                      letterBg = 'rgba(240,64,96,0.1)';
                      letterBorder = 'rgba(240,64,96,0.4)';
                      letterColor = '#f04060';
                    } else if (isSel) {
                      borderColor = `rgba(${tierRgb},0.35)`;
                      bg = `rgba(${tierRgb},0.07)`;
                      textColor = '#d0ece4';
                      letterBg = `rgba(${tierRgb},0.15)`;
                      letterBorder = `rgba(${tierRgb},0.5)`;
                      letterColor = tierColor;
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={submitted}
                        onClick={() => !submitted && setSelected(i)}
                        className="flex w-full items-center gap-2.5 rounded-[8px] border px-3 py-2.5 text-left transition-all duration-150 disabled:cursor-default"
                        style={{ borderColor, background: bg }}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold"
                          style={{ background: letterBg, border: `1px solid ${letterBorder}`, color: letterColor }}
                        >
                          {isRight ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-[12px] leading-snug" style={{ color: textColor }}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Result */}
                {submitted && (
                  <div
                    className="mt-3 rounded-[8px] border p-3"
                    style={{
                      borderColor: isCorrect ? 'rgba(34,185,154,0.2)' : 'rgba(240,64,96,0.2)',
                      background: isCorrect ? 'rgba(34,185,154,0.05)' : 'rgba(240,64,96,0.05)',
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#22b99a]" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-[#f04060]" />
                        )}
                        <span
                          className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]"
                          style={{ color: isCorrect ? '#22b99a' : '#f04060' }}
                        >
                          {isCorrect ? 'Mission Cleared' : 'Incorrect'}
                        </span>
                      </div>
                      {isCorrect && !existingResult?.correct && (
                        <span className="font-mono text-sm font-bold text-[#f0c040]">+€{mission.payout}</span>
                      )}
                    </div>
                    <p className="text-[12px] leading-relaxed text-[#7aa898]">{mission.explanation}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="mt-3 flex justify-end">
                  {!submitted ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={selected === null}
                      className="group relative flex items-center gap-2 overflow-hidden rounded-[8px] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:opacity-25"
                      style={{
                        background: selected !== null ? `linear-gradient(135deg, rgba(${tierRgb},0.9), rgba(${tierRgb},0.7))` : 'rgba(255,255,255,0.04)',
                        color: selected !== null ? '#060809' : '#2a4038',
                        border: `1px solid ${selected !== null ? `rgba(${tierRgb},0.5)` : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: selected !== null ? `0 0 20px rgba(${tierRgb},0.2)` : 'none',
                      }}
                    >
                      <span className="relative z-10">Submit answer</span>
                      <ChevronRight className="relative z-10 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      {selected !== null && (
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          style={{ background: `linear-gradient(135deg, rgba(${tierRgb},1), rgba(${tierRgb},0.8))` }}
                        />
                      )}
                    </button>
                  ) : nextMission ? (
                    <Link
                      href={`/operations/${nextMission.id}`}
                      className="group flex items-center gap-2 rounded-[8px] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200"
                      style={{
                        background: `linear-gradient(135deg, rgba(${tierRgb},0.85), rgba(${tierRgb},0.65))`,
                        color: '#060809',
                        border: `1px solid rgba(${tierRgb},0.4)`,
                        boxShadow: `0 0 24px rgba(${tierRgb},0.2)`,
                      }}
                    >
                      <span>Next mission</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/operations"
                      className="group flex items-center gap-2 rounded-[8px] border px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200"
                      style={{ borderColor: `rgba(${tierRgb},0.3)`, color: tierColor, background: `rgba(${tierRgb},0.05)` }}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                      <span>All missions</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Vertical divider */}
              <div className="hidden w-px lg:block" style={{ background: `rgba(${tierRgb},0.1)` }} />

              {/* Right column: diagram — full card height */}
              <div className="flex flex-col px-6 py-5 lg:w-1/2">
                <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-[#2a4038]">
                  Network Topology
                </p>
                <div className="flex flex-1 items-center">
                  <DiagramRenderer diagram={mission.diagram} accentColor={tierColor} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Scratchpad — full width */}
          <Blackboard />

        </div>
      </div>
    </div>
  );
}
