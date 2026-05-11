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
import { InlineLessonEditor } from '@/components/learn/theory/InlineLessonEditor';
import { splitReadableParagraph } from '@/components/learn/theory/TheoryLessonReading';

interface TheorySectionProps {
  section: TheorySectionType;
  lessonIndex: number;
  lessonTotal: number;
  showHeader?: boolean;
  isAdmin?: boolean;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: (updatedSection?: TheorySectionType) => void;
  editContext?: { topic: string; chapterId: string };
}

export const shouldTrackReadingBlock = (block: ContentBlock) =>
  block.type !== 'heading' && block.type !== 'subheading';

const RenderList = ({ block }: { block: ListBlock }) => {
  if (block.type === 'numbered-list') {
    return (
      <ol className="space-y-2">
        {block.items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-3 text-sm"
            style={{ color: 'var(--rm-text)' }}
          >
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--rm-list-badge-bg)', color: 'var(--rm-list-badge-text)' }}>
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
          className="flex items-start gap-3 text-sm"
          style={{ color: 'var(--rm-text)' }}
        >
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  );
};

const RenderTable = ({ block }: { block: TableBlock }) => {
  // Stacked card layout on narrow phones: each row becomes a labelled
  // card with header → cell pairs, so a 5-column comparison table still
  // reads clearly at 320–400px instead of horizontally clipping.
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden flex flex-col gap-3">
        {block.rows.map((row, rowIndex) => (
          <div
            key={`m-${row.join('|')}-${rowIndex}`}
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)' }}
          >
            <dl className="flex flex-col">
              {row.map((cell, cellIndex) => (
                <div
                  key={`m-${rowIndex}-${cellIndex}`}
                  className="grid grid-cols-[40%_60%] gap-3 border-b last:border-b-0 px-3 py-2"
                  style={{ borderColor: 'var(--rm-border)' }}
                >
                  <dt
                    className="text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: 'var(--rm-text-secondary)' }}
                  >
                    {block.headers[cellIndex] ?? ''}
                  </dt>
                  <dd className="text-[13px] leading-snug" style={{ color: 'var(--rm-text)' }}>
                    {cell}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {block.caption ? (
          <div className="text-xs italic px-1" style={{ color: 'var(--rm-text-secondary)' }}>
            {block.caption}
          </div>
        ) : null}
      </div>

      {/* Desktop / tablet: classic table with overflow-x fallback */}
      <div className="hidden md:block overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--rm-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th
                  key={header}
                  className="border-b px-4 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--rm-table-header-bg)', color: 'var(--rm-text-heading)', borderColor: 'var(--rm-border)' }}
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
                className="border-b last:border-b-0"
                style={{ borderColor: 'var(--rm-border)' }}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="px-4 py-3"
                    style={{ color: 'var(--rm-text)', borderColor: 'var(--rm-border)' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {block.caption ? (
          <div className="border-t px-4 py-2 text-xs italic" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-table-header-bg)', color: 'var(--rm-text)' }}>
            {block.caption}
          </div>
        ) : null}
      </div>
    </>
  );
};

const RenderKeyConcept = ({ block }: { block: KeyConceptBlock }) => {
  return (
    <div className="rounded-lg border-l-4 p-5" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}>
      <div className="mb-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
        Key Concept
      </div>
      <div className="mb-2 text-base font-bold" style={{ color: 'var(--rm-text-heading)' }}>
        {block.term}
      </div>
      <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--rm-text)' }}>
        {block.definition}
      </p>
      {block.analogy ? (
        <div className="flex items-start gap-2 text-xs italic" style={{ color: 'var(--rm-text)' }}>
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning-500" />
          Analogy: {block.analogy}
        </div>
      ) : null}
    </div>
  );
};

const RenderComparison = ({ block }: { block: ComparisonBlock }) => {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)' }}>
      {block.title ? (
        <div className="border-b px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)' }}>
          {block.title}
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {[block.left, block.right].map((side) => (
          <div
            key={side.label}
            className="border-b p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            style={{ borderColor: 'var(--rm-border)' }}
          >
            <div className="mb-3 text-sm font-semibold">{side.label}</div>
            <ul className="space-y-1.5">
              {side.points.map((point, index) => (
                <li
                  key={`${point}-${index}`}
                  className="flex items-start gap-2 text-xs"
                  style={{ color: 'var(--rm-text)' }}
                >
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: 'var(--rm-text)' }} />
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

const RenderParagraph = ({ content, isLead }: { content: string; isLead?: boolean }) => {
  const chunks = splitReadableParagraph(content);
  const isMultiChunk = chunks.length > 1;

  return (
    <div className={isMultiChunk ? 'space-y-4' : ''}>
      {chunks.map((chunk, index) => (
        <p
          key={`${index}-${chunk.slice(0, 24)}`}
          className={`leading-8 ${
            isLead && index === 0
              ? 'text-[1.05rem] leading-8'
              : 'text-[0.98rem] sm:text-[1rem]'
          }`}
          style={{ color: isLead && index === 0 ? 'var(--rm-text-lead)' : 'var(--rm-text)', lineHeight: 'var(--rm-line-height)', fontFamily: 'var(--rm-font)' }}
        >
          {chunk}
        </p>
      ))}
    </div>
  );
};

const RenderBlock = ({ block, isFirstBlock }: { block: ContentBlock; isFirstBlock: boolean }) => {
  switch (block.type) {
    case 'paragraph':
      return <RenderParagraph content={block.content} isLead={isFirstBlock} />;
    case 'heading':
      return (
        <h2 className="mb-3 mt-8 text-xl font-bold tracking-tight" style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}>
          {block.content}
        </h2>
      );
    case 'subheading':
      return (
        <h3 className="mb-2 mt-6 text-base font-semibold tracking-tight" style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}>
          {block.content}
        </h3>
      );
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
  showHeader = true,
  isAdmin = false,
  isEditing = false,
  onEditStart,
  onEditEnd,
  editContext
}: TheorySectionProps) => {
  if (isEditing && editContext && onEditEnd) {
    return (
      <section id={section.id} data-section-id={section.id}>
        <InlineLessonEditor
          section={section}
          topic={editContext.topic}
          chapterId={editContext.chapterId}
          onSave={(updated) => onEditEnd(updated)}
          onCancel={() => onEditEnd()}
        />
      </section>
    );
  }

  return (
    <section id={section.id} data-section-id={section.id}>
      {showHeader ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono font-bold uppercase tracking-[0.12em] text-primary">
              Lesson {lessonIndex + 1} of {lessonTotal}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-on-surface-variant">
                ~{section.estimatedMinutes} min
              </span>
              {isAdmin && onEditStart ? (
                <button
                  onClick={onEditStart}
                  className="hidden rounded-md border border-surface-dim px-2 py-0.5 text-[11px] font-medium text-on-surface-variant transition hover:border-primary-fixed-dim hover:text-primary md:inline-flex"
                >
                  Edit
                </button>
              ) : null}
            </div>
          </div>
          <h2 className="mb-6 border-b pb-3 text-xl font-semibold" style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)', borderColor: 'var(--rm-border)' }}>
            {section.title}
          </h2>
        </>
      ) : isAdmin && onEditStart ? (
        <div className="mb-4 flex justify-end">
          <button
            onClick={onEditStart}
            className="hidden rounded-md border border-surface-dim px-2 py-0.5 text-[11px] font-medium text-on-surface-variant transition hover:border-primary-fixed-dim hover:text-primary md:inline-flex"
          >
            Edit
          </button>
        </div>
      ) : null}
      <div className="space-y-5">
        {section.blocks.map((block, index) => {
          const segmentId = shouldTrackReadingBlock(block)
            ? `${section.id}-segment-${index}`
            : null;

          return (
            <div
              key={`${section.id}-${index}`}
              id={segmentId ?? undefined}
              data-reading-segment-id={segmentId ?? undefined}
            >
              <RenderBlock block={block} isFirstBlock={index === 0} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
