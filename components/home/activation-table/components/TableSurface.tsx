'use client';

import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import { ActivationCategoryCard } from '@/components/home/activation-table/components/ActivationCategoryCard';
import { SurfaceGlowLayer } from '@/components/home/activation-table/components/SurfaceGlowLayer';
import type { ActivationPhase } from '@/components/home/activation-table/state/activationMachine';
import {
  ACTIVATION_EASE_OUT,
  ACTIVATION_EASE_STANDARD
} from '@/components/home/activation-table/state/activationTimings';
import type {
  ActivationCategoryCardData,
  ActivationCategoryKind,
  HomeActivationTableData
} from '@/components/home/activation-table/types';

interface TableSurfaceProps {
  data: HomeActivationTableData;
  phase: ActivationPhase;
  containerRef: RefObject<HTMLDivElement>;
  primaryActionRef: RefObject<HTMLAnchorElement>;
}

const isSurfaceAwake = (phase: ActivationPhase) =>
  phase === 'reveal' || phase === 'ready';

const areCardsVisible = (phase: ActivationPhase) =>
  phase === 'reveal' || phase === 'ready';

const categoryOrder: ActivationCategoryKind[] = ['theory', 'tasks', 'grid'];

export const TableSurface = ({
  data,
  phase,
  containerRef,
  primaryActionRef
}: TableSurfaceProps) => {
  const surfaceAwake = isSurfaceAwake(phase);
  const cardsVisible = areCardsVisible(phase);
  const orderedCategories = categoryOrder
    .map((kind) => data.categories.find((category) => category.kind === kind))
    .filter((category): category is ActivationCategoryCardData => Boolean(category));
  const visibleCategories = orderedCategories.length > 0 ? orderedCategories : data.categories;

  return (
    <motion.section
      ref={containerRef}
      data-testid="activation-table-surface"
      initial={false}
      animate={{
        opacity: surfaceAwake ? 1 : 0.25,
        scale: surfaceAwake ? 1 : 0.992,
        y: surfaceAwake ? 0 : 10
      }}
      transition={{ duration: 0.28, ease: ACTIVATION_EASE_STANDARD }}
      className="relative overflow-hidden rounded-[2rem] border border-dark-border bg-[#07090b]/95 p-4 sm:p-6 lg:p-8"
    >
      <SurfaceGlowLayer phase={phase} />

      <div className="relative">
        <motion.header
          initial={false}
          animate={{ opacity: surfaceAwake ? 1 : 0, y: surfaceAwake ? 0 : -8 }}
          transition={{ duration: 0.24, ease: ACTIVATION_EASE_OUT }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
            Activation Table
          </p>
          <h1
            data-testid="activation-greeting"
            className="mt-2 text-xl font-semibold text-text-dark-primary sm:text-2xl"
          >
            {data.greeting.title}
          </h1>
          <p className="mt-1 text-sm text-text-dark-secondary">{data.greeting.subtitle}</p>
        </motion.header>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {visibleCategories.map((category, index) => (
            <motion.div
              key={category.kind}
              initial={false}
              animate={{ opacity: cardsVisible ? 1 : 0, y: cardsVisible ? 0 : 12 }}
              transition={{
                duration: 0.22,
                delay: cardsVisible ? 0.04 + index * 0.05 : 0,
                ease: ACTIVATION_EASE_OUT
              }}
              className={index === 0 ? 'md:col-span-2 xl:col-span-1' : undefined}
            >
              <ActivationCategoryCard
                ref={category.kind === 'theory' ? primaryActionRef : undefined}
                data={category}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
