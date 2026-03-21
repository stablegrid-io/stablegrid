'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Award, BookOpen, Clock } from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { summarizeTrackLessonProgress } from '@/lib/learn/theoryTrackProgress';
import type { TheoryDoc } from '@/types/theory';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type {
  ServerTheoryChapterProgressSnapshot,
  ServerTheoryModuleProgressSnapshot
} from '@/lib/learn/serverTheoryProgress';

interface TheoryTrackGalleryProps {
  doc: TheoryDoc;
  tracks: TheoryTrackSummary[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
}

export const TheoryTrackGallery = ({
  doc,
  tracks,
  completedChapterIds,
  chapterProgressById = {},
  moduleProgressById = {}
}: TheoryTrackGalleryProps) => {
  const {
    completedChapterIds: liveCompletedChapterIds,
  } = useTheoryModuleProgressSnapshots({
    topic: doc.topic,
    initialCompletedChapterIds: completedChapterIds,
    initialModuleProgressById: moduleProgressById
  });
  const topicStyle = getTheoryTopicStyle(doc.topic);
  const accentRgb = topicStyle.accentRgb;
  const accentVars = { '--theory-accent': accentRgb } as CSSProperties;

  // Flatten all chapters across tracks into a single journey
  const allChapters = tracks.flatMap((track) =>
    track.chapters.map((chapter) => ({
      ...chapter,
      trackSlug: track.slug,
      trackLabel: track.label,
      totalLessons: chapter.lessonCount ?? 0,
      estimatedMinutes: chapter.estimatedMinutes ?? 0,
    }))
  );

  const totalModules = allChapters.length;
  const totalMinutes = tracks.reduce((sum, t) => sum + (t.totalMinutes ?? 0), 0);
  const completedCount = allChapters.filter((ch) =>
    liveCompletedChapterIds.includes(ch.id)
  ).length;
  const overallPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const segmentCount = 12;
  const filledSegments = Math.round((overallPct / 100) * segmentCount);
  const allComplete = overallPct >= 100;

  return (
    <div className="relative min-h-screen pb-24 lg:pb-10" style={accentVars}>
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Header banner */}
        <section className="mb-16 relative overflow-hidden glass-panel border border-primary/20 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
            <div className="space-y-4">
              <h2 className="font-mono text-xs tracking-[0.3em] text-primary">JOURNEY_MANIFEST</h2>
              <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-surface tracking-tighter">
                {doc.title}
              </h1>
              <div className="flex gap-12 font-mono text-sm text-on-surface-variant">
                <div><span className="text-primary">TOTAL_MODULES:</span> {totalModules}</div>
                <div><span className="text-primary">SYNC_TIME:</span> {totalMinutes}M</div>
              </div>
            </div>
            <div className="w-full md:w-96 space-y-2">
              <div className="flex justify-between font-mono text-xs text-primary">
                <span>PROGRESS_CORE</span>
                <span>{overallPct}%</span>
              </div>
              <div className="flex gap-1 h-3">
                {Array.from({ length: segmentCount }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${i < filledSegments ? 'bg-primary' : 'bg-surface-container-highest/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* L-bracket corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
        </section>

        {/* Vertical zigzag journey */}
        <div className="relative max-w-4xl mx-auto flex flex-col items-center">
          {/* Central data conduit */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent z-0" />

          {allChapters.map((chapter, index) => {
            const isLeft = index % 2 !== 0;
            const isCompleted = liveCompletedChapterIds.includes(chapter.id);
            const nodeNumber = String(index + 1).padStart(2, '0');
            const completedLessons = isCompleted ? chapter.totalLessons : 0;

            return (
              <div key={chapter.id} className="relative w-full mb-20 flex justify-center">
                {/* Center node */}
                <div className={`absolute left-1/2 -translate-x-1/2 top-10 w-8 h-8 bg-[#0c0e10] border-2 z-10 flex items-center justify-center ${
                  isCompleted
                    ? 'border-primary shadow-[0_0_15px_rgba(153,247,255,0.5)]'
                    : 'border-outline-variant'
                }`}>
                  {isCompleted ? (
                    <div className="w-3 h-3 bg-primary" />
                  ) : (
                    <div className="w-2 h-2 bg-outline-variant" />
                  )}
                </div>

                {/* Module card — alternates left/right */}
                <Link
                  href={`/learn/${doc.topic}/theory/${chapter.trackSlug}?chapter=${encodeURIComponent(chapter.id)}`}
                  className={`group relative w-full md:w-[320px] glass-panel border p-6 transition-all hover:border-primary ${
                    isCompleted ? 'border-primary/30' : 'border-outline-variant/30'
                  } ${isLeft ? 'md:mr-[400px]' : 'md:ml-[400px]'}`}
                >
                  {/* Connector line */}
                  {isLeft ? (
                    <div className="hidden md:block absolute -right-3 top-8 w-3 h-px bg-primary/40" />
                  ) : (
                    <div className="hidden md:block absolute -left-3 top-8 w-3 h-px bg-primary/40" />
                  )}

                  <div className={isLeft ? 'text-right' : ''}>
                    <div className="font-mono text-[10px] text-primary mb-2">
                      [SKILL_NODE_{nodeNumber}]
                    </div>
                    <h3 className="font-headline text-lg font-bold mb-4 tracking-tight">
                      {chapter.title}
                    </h3>
                    <div className={`flex items-center font-mono text-[11px] text-on-surface-variant gap-4 ${
                      isLeft ? 'justify-end flex-row-reverse' : ''
                    }`}>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {isCompleted
                          ? `${completedLessons}/${chapter.totalLessons}`
                          : `${chapter.totalLessons}`} LESSONS
                      </div>
                      {chapter.estimatedMinutes > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {chapter.estimatedMinutes} MIN
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}

          {/* Terminal end node */}
          <div className="relative w-full flex flex-col items-center mt-12">
            <div className={`w-16 h-16 border-4 flex items-center justify-center bg-[#0c0e10] z-10 ${
              allComplete
                ? 'border-primary shadow-[0_0_30px_rgba(153,247,255,0.3)]'
                : 'border-outline-variant'
            }`}>
              <Award className={`h-8 w-8 ${allComplete ? 'text-primary' : 'text-outline-variant'}`} />
            </div>
            <div className="mt-6 text-center">
              <h4 className={`font-headline text-xl font-black uppercase tracking-widest ${
                allComplete ? 'text-primary' : 'text-outline-variant'
              }`}>
                Mastery Complete
              </h4>
              <p className="font-mono text-[10px] text-on-surface-variant mt-1">
                ALL NODES SYNCHRONIZED
              </p>
            </div>
          </div>
        </div>

        {/* System footer */}
        <footer className="mt-32 pt-8 border-t border-primary/10 flex flex-wrap justify-between items-center gap-8 opacity-40">
          <div className="font-mono text-[10px] space-y-1 text-on-surface-variant">
            <div>SYSTEM: DEPLOYMENT_ACTIVE</div>
            <div>ENCRYPTION: AES_256_V2</div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-1 bg-primary" />
            <div className="h-10 w-1 bg-primary/60" />
            <div className="h-10 w-1 bg-primary/30" />
            <div className="h-10 w-1 bg-primary/10" />
          </div>
          <div className="font-mono text-[10px] text-right text-on-surface-variant">
            <div>stableGrid</div>
            <div>SECURE_CONNECTION_STABLE</div>
          </div>
        </footer>
      </div>
    </div>
  );
};
