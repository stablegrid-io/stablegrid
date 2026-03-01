'use client';

import { Lightbulb } from 'lucide-react';
import type {
  ComparisonBlock,
  ContentBlock,
  KeyConceptBlock,
  ListBlock,
  TableBlock,
  TheorySection as TheorySectionType
} from '@/types/theory';
import { CodeBlock } from '@/components/learn/CodeBlock';
import { DiagramBlock } from '@/components/learn/theory/DiagramBlock';
import { CalloutBlock } from '@/components/learn/theory/CalloutBlock';

interface TheorySectionProps {
  section: TheorySectionType;
  lessonIndex: number;
  lessonTotal: number;
  showHeader?: boolean;
}

const RenderList = ({ block }: { block: ListBlock }) => {
  if (block.type === 'numbered-list') {
    return (
      <ol className="space-y-2">
        {block.items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-3 text-sm text-text-light-secondary dark:text-text-dark-secondary"
          >
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="space-y-2">
      {block.items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex items-start gap-3 text-sm text-text-light-secondary dark:text-text-dark-secondary"
        >
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
          {item}
        </li>
      ))}
    </ul>
  );
};

const RenderTable = ({ block }: { block: TableBlock }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-light-surface dark:bg-dark-surface">
            {block.headers.map((header) => (
              <th
                key={header}
                className="border-b border-light-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:border-dark-border dark:text-text-dark-tertiary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr
              key={`${row.join('|')}-${rowIndex}`}
              className="border-b border-light-border last:border-b-0 hover:bg-light-hover dark:border-dark-border dark:hover:bg-dark-hover"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${cell}-${cellIndex}`}
                  className="px-4 py-3 text-text-light-secondary dark:text-text-dark-secondary"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.caption ? (
        <div className="border-t border-light-border bg-light-surface px-4 py-2 text-xs italic text-text-light-tertiary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary">
          {block.caption}
        </div>
      ) : null}
    </div>
  );
};

const RenderKeyConcept = ({ block }: { block: KeyConceptBlock }) => {
  return (
    <div className="rounded-lg border-l-4 border-brand-500 bg-light-surface p-5 dark:bg-dark-surface">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-500">
        Key Concept
      </div>
      <div className="mb-2 text-base font-bold text-text-light-primary dark:text-text-dark-primary">
        {block.term}
      </div>
      <p className="mb-3 text-sm leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
        {block.definition}
      </p>
      {block.analogy ? (
        <div className="flex items-start gap-2 text-xs italic text-text-light-tertiary dark:text-text-dark-tertiary">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning-500" />
          Analogy: {block.analogy}
        </div>
      ) : null}
    </div>
  );
};

const RenderComparison = ({ block }: { block: ComparisonBlock }) => {
  return (
    <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
      {block.title ? (
        <div className="border-b border-light-border bg-light-surface px-4 py-3 text-sm font-medium dark:border-dark-border dark:bg-dark-surface">
          {block.title}
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {[block.left, block.right].map((side) => (
          <div
            key={side.label}
            className="border-b border-light-border p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 dark:border-dark-border"
          >
            <div className="mb-3 text-sm font-semibold">{side.label}</div>
            <ul className="space-y-1.5">
              {side.points.map((point, index) => (
                <li
                  key={`${point}-${index}`}
                  className="flex items-start gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary"
                >
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-text-light-tertiary dark:bg-text-dark-tertiary" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const RenderBlock = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="leading-relaxed text-text-light-secondary dark:text-text-dark-secondary">
          {block.content}
        </p>
      );
    case 'heading':
      return <h2 className="mb-3 mt-8 text-xl font-bold">{block.content}</h2>;
    case 'subheading':
      return <h3 className="mb-2 mt-6 text-base font-semibold">{block.content}</h3>;
    case 'code':
      return <CodeBlock code={block.content} label={block.label} />;
    case 'diagram':
      return (
        <DiagramBlock
          title={block.title}
          content={block.content}
          caption={block.caption}
        />
      );
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'bullet-list':
    case 'numbered-list':
      return <RenderList block={block} />;
    case 'table':
      return <RenderTable block={block} />;
    case 'key-concept':
      return <RenderKeyConcept block={block} />;
    case 'comparison':
      return <RenderComparison block={block} />;
    default:
      return null;
  }
};

export const TheorySection = ({
  section,
  lessonIndex,
  lessonTotal,
  showHeader = true
}: TheorySectionProps) => {
  return (
    <section id={section.id} data-section-id={section.id}>
      {showHeader ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 font-semibold uppercase tracking-[0.12em] text-brand-500">
              Lesson {lessonIndex + 1} of {lessonTotal}
            </span>
            <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
              ~{section.estimatedMinutes} min
            </span>
          </div>
          <h2 className="mb-6 border-b border-light-border pb-3 text-xl font-semibold dark:border-dark-border">
            {section.title}
          </h2>
        </>
      ) : null}
      <div className="space-y-5">
        {section.blocks.map((block, index) => (
          <RenderBlock key={`${section.id}-${index}`} block={block} />
        ))}
      </div>
    </section>
  );
};
