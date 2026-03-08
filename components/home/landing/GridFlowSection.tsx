'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { GridFlowSceneCanvas } from '@/components/home/landing/GridFlowSceneCanvas';
import {
  GRID_FLOW_CHAPTERS,
  type GridFlowChapter
} from '@/components/home/landing/gridFlowStory';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getSectionHeightClass = (chapter: GridFlowChapter) => {
  switch (chapter.variant) {
    case 'intro':
      return 'min-h-[124svh] lg:min-h-[144svh]';
    case 'final':
      return 'min-h-[128svh] lg:min-h-[152svh]';
    default:
      return 'min-h-[118svh] lg:min-h-[138svh]';
  }
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

function PrimaryCta({
  source,
  emphasized
}: {
  source: 'grid_flow_primary' | 'grid_flow_final';
  emphasized: boolean;
}) {
  return (
    <Link
      href="/signup"
      onClick={() => {
        void trackProductEvent('landing_cta', { source });
      }}
      className={`group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
        emphasized
          ? 'bg-[#22b999] text-[#08110b] hover:bg-[#6fe89a]'
          : 'border border-[#4de7c0]/40 bg-black/10 text-[#dff5eb] hover:border-[#62efd0] hover:bg-black/20'
      }`}
    >
      Start free
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ScrollHint({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[#7ea08e]">
      <span className="relative flex h-10 w-5 items-start justify-center rounded-full border border-white/12">
        <motion.span
          className="mt-1.5 h-2 w-2 rounded-full bg-[#57edc5]"
          animate={reducedMotion ? { y: 0, opacity: 0.78 } : { y: [0, 12, 0], opacity: [0.28, 1, 0.28] }}
          transition={reducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
      <span>Scroll</span>
    </div>
  );
}

function IntroChapter({
  chapter,
  emphasis,
  reducedMotion
}: {
  chapter: GridFlowChapter;
  emphasis: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      animate={{
        opacity: emphasis,
        y: (1 - emphasis) * 16
      }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-[34rem] pt-24 sm:pt-28 lg:pt-[15svh]"
    >
      <div className="absolute -inset-x-8 -inset-y-10 rounded-[3rem] bg-[radial-gradient(circle_at_22%_28%,rgba(31,190,153,0.2),transparent_0,transparent_44%),radial-gradient(circle_at_78%_16%,rgba(109,168,255,0.14),transparent_0,transparent_34%)] blur-3xl" />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#84d6b0]">
          {chapter.eyebrow}
        </p>
        <h1
          className="mt-4 max-w-[9.2ch] text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[#f3f6f3]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {chapter.title}
        </h1>
        <p className="mt-5 max-w-[24rem] text-[15px] leading-7 text-[#aec8bb]">{chapter.body}</p>
        <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
          {chapter.ctaSource ? (
            <PrimaryCta
              source={chapter.ctaSource}
              emphasized={false}
            />
          ) : null}
          <ScrollHint reducedMotion={reducedMotion} />
        </div>
      </div>
    </motion.div>
  );
}

function StoryChapterCard({
  chapter,
  emphasis
}: {
  chapter: GridFlowChapter;
  emphasis: number;
}) {
  return (
    <motion.div
      animate={{
        opacity: emphasis,
        y: (1 - emphasis) * 20
      }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-[24rem] lg:max-w-[26rem]"
    >
      <div className="absolute -inset-x-8 -inset-y-8 rounded-[2.75rem] bg-[radial-gradient(circle_at_18%_24%,rgba(31,190,153,0.14),transparent_0,transparent_42%),linear-gradient(180deg,rgba(5,12,10,0.24),rgba(5,12,10,0))] blur-2xl" />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#84d6b0]">
          {chapter.eyebrow}
        </p>
        <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#f2f7f3]">
          {chapter.title}
        </h2>
        <p className="mt-4 max-w-[20rem] text-[15px] leading-7 text-[#aec7bb]">{chapter.body}</p>
      </div>
    </motion.div>
  );
}

function FinalSceneOverlay({
  chapter,
  visible
}: {
  chapter: GridFlowChapter;
  visible: boolean;
}) {
  return (
    <motion.div
      className="pointer-events-auto absolute inset-x-3 bottom-5 z-20 flex justify-center sm:inset-x-6 sm:bottom-8 lg:bottom-16"
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="w-full max-w-[42rem] rounded-[1.75rem] border border-white/12 bg-[#06100c]/78 px-4 py-4 text-center shadow-[0_30px_120px_rgba(0,0,0,0.46)] backdrop-blur-xl sm:px-6 sm:py-6 lg:rounded-[2rem] lg:px-8 lg:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#84d6b0]">
          {chapter.eyebrow}
        </p>
        <h2
          className="mt-3 text-[clamp(1.9rem,7vw,4rem)] font-semibold leading-[0.96] tracking-[-0.05em] text-[#f3f7f4]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {chapter.title}
        </h2>
        <p className="mx-auto mt-3 max-w-[27rem] text-sm leading-6 text-[#aec8bb] sm:mt-4 sm:text-base sm:leading-7">
          {chapter.body}
        </p>
        <div className="mt-6 flex justify-center lg:mt-8">
          {chapter.ctaSource ? (
            <PrimaryCta
              source={chapter.ctaSource}
              emphasized
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function ChapterContent({
  chapter,
  emphasis,
  reducedMotion
}: {
  chapter: GridFlowChapter;
  emphasis: number;
  reducedMotion: boolean;
}) {
  if (chapter.variant === 'intro') {
    return (
      <IntroChapter
        chapter={chapter}
        emphasis={emphasis}
        reducedMotion={reducedMotion}
      />
    );
  }

  if (chapter.variant === 'final') {
    return null;
  }

  return (
    <StoryChapterCard
      chapter={chapter}
      emphasis={emphasis}
    />
  );
}

export const GridFlowSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const journeyPositionRef = useRef(0);
  const [journeyPosition, setJourneyPosition] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
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
    journeyPositionRef.current = journeyPosition;
  }, [journeyPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let frameId: number | null = null;

    const commitJourneyPosition = () => {
      frameId = null;
      const root = sectionRef.current;
      const chapters = chapterRefs.current.filter(Boolean) as HTMLElement[];
      if (!root || chapters.length === 0) {
        return;
      }

      const focusPosition = window.scrollY + window.innerHeight * 0.66;
      const chapterCenters = chapters.map((chapter) => {
        const rect = chapter.getBoundingClientRect();
        return window.scrollY + rect.top + rect.height * 0.5;
      });

      if (focusPosition <= chapterCenters[0]) {
        if (Math.abs(journeyPositionRef.current) > 0.004) {
          journeyPositionRef.current = 0;
          setJourneyPosition(0);
        }
        return;
      }

      const lastIndex = chapterCenters.length - 1;
      if (focusPosition >= chapterCenters[lastIndex]) {
        if (Math.abs(journeyPositionRef.current - lastIndex) > 0.004) {
          journeyPositionRef.current = lastIndex;
          setJourneyPosition(lastIndex);
        }
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
      if (Math.abs(journeyPositionRef.current - nextPosition) > 0.004) {
        journeyPositionRef.current = nextPosition;
        setJourneyPosition(nextPosition);
      }
    };

    const scheduleJourneyPosition = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(commitJourneyPosition);
    };

    scheduleJourneyPosition();
    window.addEventListener('scroll', scheduleJourneyPosition, { passive: true });
    window.addEventListener('resize', scheduleJourneyPosition);

    return () => {
      window.removeEventListener('scroll', scheduleJourneyPosition);
      window.removeEventListener('resize', scheduleJourneyPosition);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const activeChapterIndex = Math.min(GRID_FLOW_CHAPTERS.length - 1, Math.floor(journeyPosition));
  const phaseProgress = clamp(journeyPosition - activeChapterIndex, 0, 1);
  const activeChapter = GRID_FLOW_CHAPTERS[activeChapterIndex];
  const nextChapter = GRID_FLOW_CHAPTERS[Math.min(activeChapterIndex + 1, GRID_FLOW_CHAPTERS.length - 1)];
  const finalChapter = GRID_FLOW_CHAPTERS[GRID_FLOW_CHAPTERS.length - 1];
  const showDesktopFinalOverlay = journeyPosition >= GRID_FLOW_CHAPTERS.length - 1 - 0.18;

  return (
    <section
      ref={sectionRef}
      id="grid-flow"
      className="relative overflow-clip bg-[#040807]"
      aria-label="Theory, missions, grid, and HRB product journey"
    >
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden border-y border-[#183025]">
        <div className="pointer-events-none absolute inset-0">
          <GridFlowSceneCanvas
            currentScene={activeChapter.scene}
            nextScene={nextChapter.scene}
            phaseProgress={phaseProgress}
            reducedMotion={reducedMotion}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,transparent_0,transparent_26%,rgba(4,8,7,0.16)_56%,rgba(4,8,7,0.74)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,7,0.72)_0%,rgba(4,8,7,0.16)_24%,rgba(4,8,7,0)_56%,rgba(4,8,7,0.54)_100%)]" />
        <FinalSceneOverlay
          chapter={finalChapter}
          visible={showDesktopFinalOverlay}
        />
      </div>

      <div
        className="relative z-10"
        style={{ marginTop: 'calc(-100vh + 4rem)' }}
      >
        {GRID_FLOW_CHAPTERS.map((chapter, index) => {
          const chapterDistance = Math.abs(journeyPosition - index);
          const emphasis = clamp(1 - chapterDistance * 0.56, 0.34, 1);

          return (
            <article
              key={chapter.id}
              ref={(node) => {
                chapterRefs.current[index] = node;
              }}
              className={`relative ${getSectionHeightClass(chapter)}`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,7,0)_0%,rgba(4,8,7,0.1)_22%,rgba(4,8,7,0.24)_100%)]" />
              <div
                className={`relative mx-auto flex h-full max-w-7xl px-5 sm:px-6 lg:px-10 ${getSectionAlignmentClass(chapter)} ${
                  chapter.variant === 'intro'
                    ? 'pt-4'
                    : chapter.variant === 'final'
                      ? 'items-start pb-[18svh] pt-[12svh] lg:pb-[22svh] lg:pt-[14svh]'
                      : 'pb-[14svh] pt-[24svh] lg:pt-[18svh]'
                }`}
              >
                <ChapterContent
                  chapter={chapter}
                  emphasis={emphasis}
                  reducedMotion={reducedMotion}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
