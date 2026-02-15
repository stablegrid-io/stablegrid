'use client';

import { motion } from 'framer-motion';
import { BookOpen, Flame, Target, Zap } from 'lucide-react';

interface HomeHeroHeaderProps {
  firstName: string;
  greeting: string;
  streak: number;
  totalXP: number;
  questionsCompleted: number;
  overallAccuracy: number;
  chaptersCompleted: number;
  overallProgress: number;
}

export const HomeHeroHeader = ({
  firstName,
  greeting,
  streak,
  totalXP,
  questionsCompleted,
  overallAccuracy,
  chaptersCompleted,
  overallProgress
}: HomeHeroHeaderProps) => {
  const statCards = [
    {
      label: 'Total XP',
      value: totalXP.toLocaleString(),
      icon: Zap,
      subLabel: 'all sessions'
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

      <div className="relative">
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
          </div>

          <div className="flex justify-center md:justify-end md:pr-1">
            <div className="flex flex-col items-center">
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
