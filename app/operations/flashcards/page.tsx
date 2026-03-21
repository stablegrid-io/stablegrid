import Link from 'next/link';
import { BookOpen, Cpu, Sparkles, Wind, Lock } from 'lucide-react';
import { learnTopics } from '@/data/learn';
import { createClient } from '@/lib/supabase/server';

const TOPIC_ACCENTS: Record<string, { color: string; rgb: string }> = {
  pyspark: { color: '#99f7ff', rgb: '153,247,255' },
  fabric: { color: '#bf81ff', rgb: '191,129,255' },
  airflow: { color: '#ffc965', rgb: '255,201,101' },
};

const TOPIC_ICONS: Record<string, typeof BookOpen> = {
  pyspark: Sparkles,
  fabric: Cpu,
  airflow: Wind,
};

const DECK_NAMES: Record<string, string> = {
  pyspark: 'PYSPARK',
  fabric: 'MICROSOFT FABRIC',
  airflow: 'APACHE AIRFLOW',
};

export default async function OperationsFlashcardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let topicProgress: Record<string, { total?: number; completionPct?: number }> = {};
  if (user) {
    const { data } = await supabase.from('user_progress').select('topic_progress').eq('user_id', user.id).maybeSingle();
    topicProgress = (data?.topic_progress as Record<string, any>) ?? {};
  }

  const topics = learnTopics.filter((t) => ['pyspark', 'fabric', 'airflow'].includes(t.id));

  return (
    <main className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-10 max-w-4xl">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-xs font-mono text-primary/50 tracking-[0.4em]">OPERATIONS // 04</span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-headline font-bold text-on-surface tracking-tighter mb-3">
            Neural Flashcards
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed text-sm">
            Optimize long-term memory retention via prioritized neural synchronization. Select a deck to begin the sub-vocal recall sequence.
          </p>
        </header>

        {/* Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
          {topics.map((topic, index) => {
            const accent = TOPIC_ACCENTS[topic.id] ?? TOPIC_ACCENTS.pyspark;
            const Icon = TOPIC_ICONS[topic.id] ?? BookOpen;
            const deckName = DECK_NAMES[topic.id] ?? topic.title.toUpperCase();
            const progress = topicProgress[topic.id] as Record<string, any> | undefined;
            const attempted = Math.max(0, Math.floor(Number(progress?.total ?? 0)));
            const recallRate = Number(progress?.completionPct ?? 0);
            const mastered = Math.round((recallRate / 100) * Math.max(attempted, topic.functionCount));
            const totalCards = Math.max(topic.functionCount, 50);
            const filledBars = Math.round((mastered / totalCards) * 8);
            const modId = `MOD_${String((index + 1) * 12).padStart(3, '0')}`;

            return (
              <div
                key={topic.id}
                className="group relative bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(153,247,255,0.1)] transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 p-3 font-mono text-[10px] tracking-widest" style={{ color: `rgba(${accent.rgb},0.3)` }}>
                  {modId}
                </div>

                {/* Icon + Title + Progress */}
                <div className="p-6 pb-3 flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 mb-6 flex items-center justify-center border group-hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: `rgba(${accent.rgb},0.05)`, borderColor: `rgba(${accent.rgb},0.1)` }}
                  >
                    <Icon className="h-7 w-7" style={{ color: accent.color }} />
                  </div>
                  <h3 className="text-lg font-headline font-semibold text-on-surface tracking-tight mb-2 uppercase">
                    {deckName}
                  </h3>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div
                        key={i}
                        className="w-3 h-1.5"
                        style={{
                          backgroundColor: i < filledBars ? accent.color : `rgba(${accent.rgb},0.2)`,
                          boxShadow: i < filledBars && i < 2 ? `0 0 8px rgba(${accent.rgb},0.6)` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-auto bg-black/40 p-5 space-y-2.5 border-t border-white/5">
                  <div className="flex justify-between text-[10px] font-mono tracking-widest">
                    <span className="text-on-surface-variant">MASTERED</span>
                    <span style={{ color: accent.color }}>{mastered} / {totalCards}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono tracking-widest">
                    <span className="text-on-surface-variant">RECALL RATE</span>
                    <span style={{ color: accent.color }}>{recallRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono tracking-widest">
                    <span className="text-on-surface-variant">NEXT REVIEW</span>
                    <span className={attempted > 0 ? 'text-tertiary' : 'text-on-surface-variant'}>
                      {attempted > 0 ? 'IMMEDIATE' : 'DORMANT'}
                    </span>
                  </div>
                  <Link
                    href={`/practice/${topic.id}`}
                    className="block w-full mt-3 py-2.5 border text-center font-mono text-[10px] font-bold tracking-widest transition-all active:scale-[0.98] uppercase"
                    style={{
                      borderColor: `rgba(${accent.rgb},0.3)`,
                      backgroundColor: `rgba(${accent.rgb},0.05)`,
                      color: accent.color
                    }}
                  >
                    START RECALL SESSION
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom stats */}
        <div className="mt-12 flex flex-wrap gap-12 border-t border-outline-variant/10 pt-6">
          <div className="flex flex-col">
            <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-[0.3em]">TOTAL_RETAINED</span>
            <span className="text-2xl font-headline font-black text-on-surface">{topics.reduce((s, t) => s + t.functionCount, 0).toLocaleString()} <span className="text-sm text-on-surface-variant">CARDS</span></span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-[0.3em]">SYSTEM_STATUS</span>
            <span className="text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-mono text-sm text-primary font-bold">OPTIMIZED</span>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
