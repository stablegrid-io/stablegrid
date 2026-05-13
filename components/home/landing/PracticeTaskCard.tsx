'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, X } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  isCorrect?: boolean;
}

interface PracticeTaskCardProps {
  setTitle: string;
  tier: string;
  taskNumber: string;
  title: string;
  context: string;
  task: string;
  question: string;
  options: Option[];
  explanation: string;
}

/**
 * Landing-page practice task preview — full MCQ widget. Idle state is a
 * two-column read; once the visitor commits to an option the right column
 * flips to a reveal panel with a "continue learning" CTA aimed at /login.
 * Sized intentionally compact (lighter padding than the curriculum lesson
 * card above it) so the section reads as a quick interactive demo, not a
 * second full-page artefact.
 */
export function PracticeTaskCard({
  setTitle,
  tier,
  taskNumber,
  title,
  context,
  task,
  question,
  options,
  explanation
}: PracticeTaskCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const answered = selectedId !== null;
  const selected = options.find((o) => o.id === selectedId) ?? null;
  const isCorrect = selected?.isCorrect ?? false;
  const correct = options.find((o) => o.isCorrect) ?? null;

  return (
    <article className="border border-outline-variant bg-paper-dark">
      <header className="px-4 sm:px-6 py-3 border-b border-outline-variant flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant">
          {setTitle}
        </span>
        <span className="font-data-mono uppercase text-[10px] tracking-wider text-primary">
          {tier} · TASK {taskNumber}
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-outline-variant">
        {/* ── LEFT: context + task ───────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-4">
          <h3 className="font-serif text-[18px] sm:text-[20px] leading-snug text-on-surface mb-3">
            {title}
          </h3>
          <div className="mb-3">
            <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-1.5">
              CONTEXT
            </span>
            <p className="font-body text-[13px] leading-snug text-on-surface">
              {context}
            </p>
          </div>
          <div>
            <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-1.5">
              TASK
            </span>
            <p className="font-body text-[13px] leading-snug text-on-surface">
              {task}
            </p>
          </div>
        </div>

        {/* ── RIGHT: MCQ or reveal ───────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-4 border-t border-outline-variant md:border-t-0">
          <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-2">
            QUESTION
          </span>
          <p className="font-serif text-[15px] leading-snug text-on-surface mb-3">
            {question}
          </p>

          <ul className="flex flex-col gap-1.5 mb-3">
            {options.map((opt, i) => {
              const isPicked = opt.id === selectedId;
              const isCorrectOpt = !!opt.isCorrect;
              let cls =
                'group w-full text-left flex items-start gap-3 px-3 py-2 border transition-colors font-body text-[13px] leading-snug';
              let badgeCls = 'font-data-mono tabular-nums text-[11px] pt-0.5 shrink-0 w-5';
              if (!answered) {
                // Idle — transparent fill, warm outline. The lift against
                // the card bg comes from the border alone; hover swaps in
                // the full salmon Spark for the click target.
                cls +=
                  ' border-outline text-on-surface hover:bg-primary hover:border-primary hover:text-on-primary cursor-pointer';
                badgeCls += ' text-on-surface-variant group-hover:text-on-primary';
              } else if (isPicked && isCorrectOpt) {
                // Selected & correct — full salmon fill, dark ink text.
                cls += ' border-primary bg-primary text-on-primary';
                badgeCls += ' text-on-primary';
              } else if (isPicked && !isCorrectOpt) {
                // Selected & wrong — error border, no fill.
                cls += ' border-error text-on-surface';
                badgeCls += ' text-error';
              } else if (isCorrectOpt) {
                // Unpicked correct answer — ghost salmon outline, no fill.
                cls += ' border-primary text-primary';
                badgeCls += ' text-primary';
              } else {
                // Unpicked wrong options — dimmed, no fill.
                cls += ' border-outline-variant text-on-surface-variant/50';
                badgeCls += ' text-on-surface-variant/50';
              }
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => setSelectedId(opt.id)}
                    className={cls}
                  >
                    <span className={badgeCls}>{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{opt.label}</span>
                    {answered && isPicked && isCorrectOpt ? (
                      <Check className="h-4 w-4 text-on-primary shrink-0 mt-0.5" strokeWidth={2.25} />
                    ) : null}
                    {answered && isPicked && !isCorrectOpt ? (
                      <X className="h-4 w-4 text-error shrink-0 mt-0.5" strokeWidth={2.25} />
                    ) : null}
                    {answered && !isPicked && isCorrectOpt ? (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {answered ? (
            <div className="border-t border-outline-variant pt-3">
              <div
                className={`font-data-mono uppercase text-[10px] tracking-wider mb-1.5 ${
                  isCorrect ? 'text-primary' : 'text-error'
                }`}
              >
                {isCorrect ? 'Correct.' : 'Not quite.'}
                {!isCorrect && correct ? ` Answer: ${correct.id.toUpperCase()}.` : null}
              </div>
              <p className="font-body text-[12px] leading-snug text-on-surface">
                {explanation}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="px-4 sm:px-6 py-3 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
        {answered ? (
          <>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
              Continue learning?
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-primary bg-primary border border-primary px-4 py-2 hover:bg-primary-dim hover:border-primary-dim transition-colors"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </>
        ) : (
          <>
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant">
              30 PRACTICE SETS · SERVER-GRADED
            </span>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider text-on-surface hover:text-primary transition-colors border-b border-on-surface hover:border-primary pb-1"
            >
              Browse all sets <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </>
        )}
      </footer>
    </article>
  );
}
