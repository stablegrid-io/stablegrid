'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clock, Lightbulb, Play, Trophy } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface CapstoneAssertion { id: string; xp: number; description: string; check: string; failure_message: string }
interface CapstoneHint { tier: string; xp_cost: number; text: string }
interface CapstoneScaffold { filename: string; language: string; preamble_comment: string; code: string }
interface CapstoneChapter { id: string; title: string; chapter_type: string; base_xp: number; narrative_context: string; task: string; validation_hint: string; scaffold: CapstoneScaffold; grading: { type: string; method: string; assertions: CapstoneAssertion[] }; hints: CapstoneHint[] }

export interface CapstoneProjectRunnerProps { project: any; topic: string; level: string }

const ACCENT: Record<string, { color: string; rgb: string }> = {
  junior: { color: '#99f7ff', rgb: '153,247,255' },
  mid:    { color: '#ffc965', rgb: '255,201,101' },
  senior: { color: '#ff716c', rgb: '255,113,108' },
};

function buildInitialCode(ch: CapstoneChapter): string {
  return ch.scaffold.preamble_comment ? `${ch.scaffold.preamble_comment}\n\n${ch.scaffold.code}` : ch.scaffold.code;
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export function CapstoneProjectRunner({ project, topic, level }: CapstoneProjectRunnerProps) {
  const ta = ACCENT[level.toLowerCase()] ?? ACCENT.junior;
  const chapters: CapstoneChapter[] = project?.chapters ?? [];
  const total = chapters.length;
  const backHref = `/learn/${topic}/theory/${level}?capstone=true`;

  const [cur, setCur] = useState(0);
  const [code, setCode] = useState(() => chapters.length > 0 ? buildInitialCode(chapters[0]) : '');
  const [hints, setHints] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());

  const chapter = chapters[cur];
  if (!chapter) return (
    <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">
      <p className="text-on-surface-variant/50 text-sm">No chapters found.</p>
    </div>
  );

  const earnedXp = Array.from(done).reduce((acc, idx) => {
    const ch = chapters[idx];
    if (!ch) return acc;
    const cost = ch.hints.filter((h) => hints.has(`${idx}-${h.tier}`)).reduce((s, h) => s + h.xp_cost, 0);
    return acc + Math.max(0, ch.base_xp - cost);
  }, 0);

  const goTo = (i: number) => {
    if (i < 0 || i >= total) return;
    setCur(i);
    setCode(buildInitialCode(chapters[i]));
    setSubmitted(done.has(i));
  };

  const isLast = cur === total - 1;
  const isComplete = isLast && done.has(cur);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4 lg:px-6" style={{ borderColor: `rgba(${ta.rgb},0.08)`, backgroundColor: '#0c0e10' }}>
        <Link href={backHref} className="flex items-center gap-2 text-on-surface-variant/50 hover:text-on-surface transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-[11px] font-mono font-medium tracking-widest uppercase">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-on-surface-variant/40 tabular-nums">Chapter {cur + 1}/{total}</span>
          <span className="text-on-surface-variant/15 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-[12px] font-semibold truncate max-w-[250px]" style={{ color: ta.color }}>{chapter.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5" style={{ color: `rgba(${ta.rgb},0.5)` }} />
          <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color: ta.color }}>{earnedXp} XP</span>
        </div>
      </div>

      {/* Split panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: instructions */}
        <div key={`l-${cur}`} className="flex flex-col w-full lg:w-1/2 overflow-y-auto border-r pb-6" style={{ borderColor: `rgba(${ta.rgb},0.06)`, opacity: 0, animation: 'fadeSlideUp .35s cubic-bezier(.16,1,.3,1) forwards' }}>
          <div className="p-5 lg:p-7 space-y-6">
            {/* Chapter heading */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `rgba(${ta.rgb},0.1)`, border: `1px solid rgba(${ta.rgb},0.2)` }}>
                <span className="text-[11px] font-bold" style={{ color: ta.color }}>{cur + 1}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-on-surface">{chapter.title}</h2>
                <span className="text-[10px] font-mono font-medium tracking-widest uppercase" style={{ color: `rgba(${ta.rgb},0.4)` }}>{chapter.base_xp} XP · {chapter.chapter_type}</span>
              </div>
            </div>

            {/* Narrative */}
            <div className="rounded-[18px] p-5" style={{ background: '#181c20', border: `1px solid rgba(${ta.rgb},0.08)` }}>
              <p className="text-[14px] leading-[1.85] text-on-surface-variant/65">{chapter.narrative_context}</p>
            </div>

            {/* Task */}
            <div className="rounded-[18px] p-5" style={{ background: `rgba(${ta.rgb},0.04)`, border: `1px solid rgba(${ta.rgb},0.14)` }}>
              <p className="text-[10px] font-mono font-bold tracking-widest uppercase mb-3" style={{ color: `rgba(${ta.rgb},0.6)` }}>Your Task</p>
              <p className="text-[14px] leading-[1.85] text-on-surface/85">{chapter.task}</p>
            </div>

            {/* Validation hint */}
            <div className="flex items-start gap-2.5">
              <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: `rgba(${ta.rgb},0.4)` }} />
              <p className="text-[12px] leading-relaxed text-on-surface-variant/45 italic">{chapter.validation_hint}</p>
            </div>

            {/* Hints */}
            {chapter.hints.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: `rgba(${ta.rgb},0.35)` }}>Hints</p>
                {chapter.hints.map((hint, i) => {
                  const key = `${cur}-${hint.tier}`;
                  const revealed = hints.has(key);
                  return (
                    <div key={hint.tier} className="rounded-[14px] overflow-hidden transition-all" style={{ border: `1px solid rgba(${ta.rgb},${revealed ? '0.18' : '0.08'})`, background: revealed ? `rgba(${ta.rgb},0.04)` : 'transparent' }}>
                      {revealed ? (
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-3.5 w-3.5" style={{ color: ta.color }} />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: ta.color }}>Hint {hint.tier}</span>
                            {hint.xp_cost > 0 && <span className="ml-auto text-[10px] font-mono" style={{ color: `rgba(${ta.rgb},0.35)` }}>-{hint.xp_cost} XP</span>}
                          </div>
                          <p className="text-[13px] leading-relaxed" style={{ color: `rgba(${ta.rgb},0.65)` }}>{hint.text}</p>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setHints(prev => new Set(prev).add(key))} className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer" style={{ color: `rgba(${ta.rgb},0.45)` }}>
                          <span className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" /><span className="text-[12px] font-medium">Hint {hint.tier}{i === 0 ? ' — free' : ''}</span></span>
                          {hint.xp_cost > 0 && <span className="text-[10px] font-mono">-{hint.xp_cost} XP</span>}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: code editor */}
        <div key={`r-${cur}`} className="hidden lg:flex flex-col w-1/2 overflow-y-auto pb-6" style={{ opacity: 0, animation: 'fadeSlideUp .35s cubic-bezier(.16,1,.3,1) 60ms forwards' }}>
          <div className="p-5 lg:p-7 flex flex-col gap-4 h-full">
            {/* File header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgba(${ta.rgb},0.5)` }} />
                <span className="font-mono text-[11px] text-on-surface-variant/45">{chapter.scaffold.filename}</span>
              </div>
              <span className="text-[10px] font-mono font-medium tracking-widest uppercase" style={{ color: `rgba(${ta.rgb},0.3)` }}>{chapter.scaffold.language}</span>
            </div>

            {/* Textarea */}
            <div className="relative flex-1 min-h-[400px] rounded-[18px] overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 w-full h-full resize-none bg-transparent p-5 font-mono text-[13px] leading-[1.75] text-on-surface/85 outline-none placeholder:text-on-surface-variant/20"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* Submit */}
            {!submitted ? (
              <button type="button" onClick={() => { setSubmitted(true); setDone(prev => new Set(prev).add(cur)); }} className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[12px] font-mono font-bold tracking-widest uppercase cursor-pointer" style={{ backgroundColor: ta.color, color: '#0c0e10', boxShadow: `0 0 12px rgba(${ta.rgb},0.15)` }}>
                <Play className="h-3.5 w-3.5" /> Submit Chapter
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[12px] font-mono font-bold tracking-widest uppercase" style={{ background: `rgba(${ta.rgb},0.06)`, border: `1px solid rgba(${ta.rgb},0.15)`, color: ta.color }}>
                <Check className="h-3.5 w-3.5" /> Submitted
              </div>
            )}

            {/* Assertions */}
            {submitted && chapter.grading.assertions.length > 0 && (
              <div className="rounded-[18px] p-5" style={{ background: '#181c20', border: `1px solid rgba(${ta.rgb},0.08)` }}>
                <p className="text-[10px] font-mono font-bold tracking-widest uppercase mb-4" style={{ color: `rgba(${ta.rgb},0.45)` }}>Grading Checks</p>
                {chapter.grading.assertions.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-3 border-b last:border-b-0" style={{ borderColor: `rgba(${ta.rgb},0.06)` }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Clock className="h-3 w-3 text-on-surface-variant/40" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-on-surface/70 leading-snug">{a.description}</p>
                      <span className="text-[10px] font-mono" style={{ color: `rgba(${ta.rgb},0.35)` }}>+{a.xp} XP</span>
                    </div>
                  </div>
                ))}
                <p className="mt-4 text-[11px] text-on-surface-variant/25 italic">Results will be available when PySpark execution is enabled.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex h-14 shrink-0 items-center justify-between border-t px-4 lg:px-6" style={{ borderColor: `rgba(${ta.rgb},0.08)`, backgroundColor: '#0c0e10' }}>
        <button type="button" onClick={() => goTo(cur - 1)} disabled={cur === 0} className="flex items-center gap-2 px-4 py-2 rounded-[14px] text-[11px] font-mono font-medium tracking-widest uppercase disabled:opacity-20 disabled:cursor-default cursor-pointer" style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1.5">
          {chapters.map((_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} className="rounded-full cursor-pointer transition-all duration-300" style={{ width: i === cur ? 20 : 6, height: 6, backgroundColor: done.has(i) ? ta.color : i === cur ? `rgba(${ta.rgb},0.6)` : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        {isComplete ? (
          <Link href={`/learn/${topic}/theory/${level}`} className="flex items-center gap-2 px-5 py-2 rounded-[14px] text-[11px] font-mono font-bold tracking-widest uppercase" style={{ backgroundColor: ta.color, color: '#0c0e10', boxShadow: `0 0 16px rgba(${ta.rgb},0.2)` }}>
            <Trophy className="h-3.5 w-3.5" /> Complete
          </Link>
        ) : (
          <button type="button" onClick={() => { if (submitted) goTo(cur + 1); else if (isLast) { setSubmitted(true); setDone(prev => new Set(prev).add(cur)); } }} disabled={!submitted && !done.has(cur)} className="flex items-center gap-2 px-5 py-2 rounded-[14px] text-[11px] font-mono font-bold tracking-widest uppercase disabled:opacity-30 disabled:cursor-default cursor-pointer" style={{ backgroundColor: ta.color, color: '#0c0e10', boxShadow: submitted ? `0 0 12px rgba(${ta.rgb},0.15)` : 'none' }}>
            {isLast ? <><span>Complete Project</span><Trophy className="h-3.5 w-3.5" /></> : <><span>Next</span><ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        )}
      </div>
    </div>
  );
}
