'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Flame, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import {
  formatUnitsAsKwh,
  getAvailableBudgetUnits,
  unitsToKwh
} from '@/lib/energy';
import { useProgressStore } from '@/lib/stores/useProgressStore';

interface HomeHeroHeaderProps {
  firstName: string;
  greeting: string;
  streak: number;
  totalEnergyUnits: number;
  energyTodayUnits: number;
  questionsCompleted: number;
  overallAccuracy: number;
  chaptersCompleted: number;
  overallProgress: number;
}

export const HomeHeroHeader = ({
  firstName,
  greeting,
  streak,
  totalEnergyUnits,
  energyTodayUnits,
  questionsCompleted,
  overallAccuracy,
  chaptersCompleted,
  overallProgress
}: HomeHeroHeaderProps) => {
  const deployedNodeIds = useProgressStore((state) => state.deployedNodeIds);
  const availableBudgetUnits = getAvailableBudgetUnits(totalEnergyUnits, deployedNodeIds);
  const energyBalanceKwh = unitsToKwh(availableBudgetUnits);
  const todayKwh = unitsToKwh(energyTodayUnits);
  const batteryPct = Math.max(8, Math.min(100, Math.round((energyBalanceKwh % 10) * 10)));
  const [showEnergyBurst, setShowEnergyBurst] = useState(false);
  const previousEnergyRef = useRef(totalEnergyUnits);

  useEffect(() => {
    const previous = previousEnergyRef.current;
    previousEnergyRef.current = totalEnergyUnits;

    if (totalEnergyUnits <= previous) return;

    setShowEnergyBurst(true);
    const timeoutId = window.setTimeout(() => {
      setShowEnergyBurst(false);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [totalEnergyUnits]);

  const statCards = [
    {
      label: 'Deployment budget',
      value: formatUnitsAsKwh(availableBudgetUnits),
      icon: Zap,
      subLabel: 'available to spend'
    },
    {
      label: 'Current streak',
      value: `${streak} days`,
      icon: Flame,
      subLabel: 'consistency'
    },
    {
      label: 'Questions done',
      value: questionsCompleted.toLocaleString(),
      icon: Target,
      subLabel: `${overallAccuracy}% accuracy`
    },
    {
      label: 'Chapters read',
      value: chaptersCompleted.toLocaleString(),
      icon: BookOpen,
      subLabel: 'theory completion'
    }
  ] as const;

  const progressRadius = 40;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset =
    progressCircumference * (1 - overallProgress / 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        background: 'linear-gradient(135deg, #071c12 0%, #0a1a0e 100%)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.06)'
      }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #10b981, transparent 70%)'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(rgba(16,185,129,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative z-10">
        <div className="grid gap-5 px-5 pb-6 pt-6 sm:px-6 md:grid-cols-[1fr_auto] md:items-start lg:px-7">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-500">{greeting}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#ecfdf5]">
              {firstName}, continue your learning plan.
            </h1>
            <p className="mt-2 text-sm text-[#4b7a63]">
              {streak > 0
                ? `${streak}-day streak. Keep momentum with one focused session today.`
                : 'Start a focused session today to establish your streak.'}
            </p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
              <div className="relative h-4 w-10 overflow-hidden rounded-sm border border-emerald-400/30 bg-emerald-950/40">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-emerald-400"
                  animate={{ width: `${batteryPct}%` }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                />
                <AnimatePresence>
                  {showEnergyBurst &&
                    [0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="pointer-events-none absolute top-1/2 h-1 w-1 rounded-full bg-emerald-300"
                        initial={{
                          opacity: 0.8,
                          x: 8 + index * 6,
                          y: -2
                        }}
                        animate={{
                          opacity: 0,
                          x: 14 + index * 9,
                          y: -8 - index * 3
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, delay: index * 0.06 }}
                      />
                    ))}
                </AnimatePresence>
              </div>
              <div className="text-xs text-emerald-200">
                Budget: <span className="font-semibold">{formatUnitsAsKwh(availableBudgetUnits)}</span>
              </div>
              <div className="text-xs text-emerald-300">
                Today +{todayKwh.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
              </div>
              <Link
                href="/energy"
                data-pulse-target="home-energy-lab"
                className="rounded-md border border-emerald-400/30 px-2 py-1 text-[11px] font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Open Grid
              </Link>
            </div>
          </div>

          <div className="flex justify-center md:justify-end md:pr-1">
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-24 w-24">
                <svg
                  viewBox="0 0 96 96"
                  width="96"
                  height="96"
                  className="-rotate-90"
                  aria-label={`Overall progress ${overallProgress}%`}
                >
                  <circle
                    cx="48"
                    cy="48"
                    r={progressRadius}
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.15)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={progressRadius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={progressCircumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[22px] font-bold leading-none tabular-nums text-[#ecfdf5]">
                    {overallProgress}%
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4b7a63]">
                    done
                  </span>
                </div>
              </div>
              <span className="mt-2 text-xs text-[#4b7a63]">Overall progress</span>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-2 border-t lg:grid-cols-4"
          style={{ borderColor: 'rgba(16, 185, 129, 0.12)' }}
        >
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const cellClass = [
              'px-5 py-4 sm:px-6 lg:px-7',
              index % 2 === 0 ? 'border-r' : '',
              index < 2 ? 'border-b' : '',
              index < 3 ? 'lg:border-r' : 'lg:border-r-0',
              'lg:border-b-0'
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={card.label}
                className={cellClass}
                style={{ borderColor: 'rgba(16, 185, 129, 0.10)' }}
              >
                <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-emerald-500">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-medium uppercase tracking-[0.12em]">
                    {card.label}
                  </span>
                </div>
                <div className="text-2xl font-semibold text-[#ecfdf5]">{card.value}</div>
                <div className="text-xs text-[#4b7a63]">{card.subLabel}</div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
