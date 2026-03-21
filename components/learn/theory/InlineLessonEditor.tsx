'use client';

import { useMemo, useState } from 'react';
import { TheorySection as TheorySectionReadView } from '@/components/learn/theory/TheorySection';
import type {
  BlockType,
  CalloutBlock,
  ComparisonBlock,
  ContentBlock,
  DiagramBlock,
  KeyConceptBlock,
  ListBlock,
  TableBlock,
  TheoryCodeBlock,
  TheorySection,
} from '@/types/theory';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface InlineLessonEditorProps {
  section: TheorySection;
  topic: string;
  chapterId: string;
  onSave: (updatedSection: TheorySection) => void;
  onCancel: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BLOCK_TYPE_OPTIONS: Array<{ value: BlockType; label: string }> = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'subheading', label: 'Subheading' },
  { value: 'callout', label: 'Callout' },
  { value: 'bullet-list', label: 'Bullet List' },
  { value: 'numbered-list', label: 'Numbered List' },
  { value: 'key-concept', label: 'Key Concept' },
  { value: 'code', label: 'Code' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'table', label: 'Table' },
  { value: 'comparison', label: 'Comparison' },
];

const CALLOUT_VARIANTS: CalloutBlock['variant'][] = [
  'info',
  'tip',
  'warning',
  'danger',
  'insight',
];

/* ------------------------------------------------------------------ */
/*  Shared style tokens                                                */
/* ------------------------------------------------------------------ */

const inputCls =
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-surface';

const blockCardCls =
  'rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg';

const labelCls =
  'block text-xs font-medium uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary';

const primaryBtnCls =
  'rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed';

const secondaryBtnCls =
  'rounded-lg border border-light-border px-4 py-2 text-sm font-medium text-text-light-secondary transition hover:bg-light-surface dark:border-dark-border dark:text-text-dark-secondary dark:hover:bg-dark-surface';

const actionBtnCls =
  'rounded-md border border-light-border px-2 py-1 text-xs text-text-light-secondary transition hover:bg-light-surface dark:border-dark-border dark:text-text-dark-secondary dark:hover:bg-dark-surface';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const toLineItems = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const fromLineItems = (items: string[]) => items.join('\n');

const fromTableRows = (rows: string[][]) =>
  rows.map((row) => row.join(' | ')).join('\n');

const toTableRows = (value: string) =>
  value
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) =>
      row
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0),
    );

const createDefaultBlock = (type: BlockType): ContentBlock => {
  switch (type) {
    case 'heading':
      return { type, content: 'New heading' };
    case 'subheading':
      return { type, content: 'New subheading' };
    case 'code':
      return { type, language: 'python', content: '# code here' };
    case 'diagram':
      return { type, content: 'Diagram content here' };
    case 'callout':
      return { type, variant: 'info', content: 'Callout content here' };
    case 'bullet-list':
      return { type, items: ['New bullet'] };
    case 'numbered-list':
      return { type, items: ['New step'] };
    case 'table':
      return {
        type,
        headers: ['Column 1', 'Column 2'],
        rows: [['Value 1', 'Value 2']],
      };
    case 'key-concept':
      return { type, term: 'New concept', definition: 'Definition here' };
    case 'comparison':
      return {
        type,
        left: { label: 'Option A', points: ['First point'] },
        right: { label: 'Option B', points: ['First point'] },
      };
    case 'paragraph':
    default:
      return { type: 'paragraph', content: 'New paragraph' };
  }
};

/** Strip empty-string optional fields so the server validator does not reject them. */
const sanitizeBlock = (block: ContentBlock): ContentBlock => {
  const clean = { ...block } as unknown as Record<string, unknown>;
  for (const key of ['title', 'caption', 'label', 'analogy']) {
    if (key in clean && typeof clean[key] === 'string' && (clean[key] as string).trim() === '') {
      delete clean[key];
    }
  }
  return clean as unknown as ContentBlock;
};

const cloneBlock = (block: ContentBlock): ContentBlock =>
  JSON.parse(JSON.stringify(block)) as ContentBlock;

/* ------------------------------------------------------------------ */
/*  Inline field wrapper                                               */
/* ------------------------------------------------------------------ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block type label lookup                                            */
/* ------------------------------------------------------------------ */

function blockTypeLabel(type: BlockType): string {
  return (
    BLOCK_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InlineLessonEditor({
  section,
  topic,
  chapterId,
  onSave,
  onCancel,
}: InlineLessonEditorProps) {
  /* ---- state ---- */
  const [title, setTitle] = useState(section.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    section.estimatedMinutes,
  );
  const [blocks, setBlocks] = useState<ContentBlock[]>(() =>
    section.blocks.map(cloneBlock),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newBlockType, setNewBlockType] = useState<BlockType>('paragraph');

  /* ---- block operations ---- */

  const updateBlockAtIndex = (index: number, updatedBlock: ContentBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updatedBlock : b)));
  };

  const deleteBlockAtIndex = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateBlockAtIndex = (index: number) => {
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, cloneBlock(prev[index]));
      return copy;
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createDefaultBlock(type)]);
  };

  /* ---- save ---- */

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/admin/theory-docs/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          chapterId,
          lessonId: section.id,
          title,
          estimatedMinutes,
          blocks: blocks.map(sanitizeBlock),
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Save failed.');
      }
      const payload = await response.json();
      onSave(payload.data.lesson);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  /* ---- block field renderers ---- */

  const renderBlockFields = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <Field label="Content">
            <textarea
              className={inputCls}
              rows={4}
              value={block.content}
              onChange={(e) =>
                updateBlockAtIndex(index, {
                  ...block,
                  content: e.target.value,
                })
              }
            />
          </Field>
        );

      case 'heading':
      case 'subheading':
        return (
          <Field label="Content">
            <input
              className={inputCls}
              value={block.content}
              onChange={(e) =>
                updateBlockAtIndex(index, {
                  ...block,
                  content: e.target.value,
                })
              }
            />
          </Field>
        );

      case 'callout': {
        const cb = block as CalloutBlock;
        return (
          <div className="space-y-3">
            <Field label="Variant">
              <select
                className={inputCls}
                value={cb.variant}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cb,
                    variant: e.target.value as CalloutBlock['variant'],
                  })
                }
              >
                {CALLOUT_VARIANTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                className={inputCls}
                value={cb.title ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cb,
                    title: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Content">
              <textarea
                className={inputCls}
                rows={4}
                value={cb.content}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cb,
                    content: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        );
      }

      case 'bullet-list':
      case 'numbered-list': {
        const lb = block as ListBlock;
        return (
          <Field label="Items (one per line)">
            <textarea
              className={inputCls}
              rows={6}
              value={fromLineItems(lb.items)}
              onChange={(e) =>
                updateBlockAtIndex(index, {
                  ...lb,
                  items: toLineItems(e.target.value),
                })
              }
            />
          </Field>
        );
      }

      case 'key-concept': {
        const kc = block as KeyConceptBlock;
        return (
          <div className="space-y-3">
            <Field label="Term">
              <input
                className={inputCls}
                value={kc.term}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...kc,
                    term: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Definition">
              <textarea
                className={inputCls}
                rows={3}
                value={kc.definition}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...kc,
                    definition: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Analogy">
              <textarea
                className={inputCls}
                rows={3}
                value={kc.analogy ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...kc,
                    analogy: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        );
      }

      case 'code': {
        const cd = block as TheoryCodeBlock;
        return (
          <div className="space-y-3">
            <Field label="Language">
              <input
                className={inputCls}
                value={cd.language}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cd,
                    language: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Label">
              <input
                className={inputCls}
                value={cd.label ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cd,
                    label: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Content">
              <textarea
                className={`${inputCls} min-h-[14rem] font-mono`}
                value={cd.content}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cd,
                    content: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        );
      }

      case 'diagram': {
        const dg = block as DiagramBlock;
        return (
          <div className="space-y-3">
            <Field label="Title">
              <input
                className={inputCls}
                value={dg.title ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...dg,
                    title: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Caption">
              <input
                className={inputCls}
                value={dg.caption ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...dg,
                    caption: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Content">
              <textarea
                className={`${inputCls} min-h-[12rem] font-mono`}
                value={dg.content}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...dg,
                    content: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        );
      }

      case 'table': {
        const tb = block as TableBlock;
        return (
          <div className="space-y-3">
            <Field label="Headers (pipe-separated)">
              <input
                className={inputCls}
                value={tb.headers.join(' | ')}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...tb,
                    headers: e.target.value
                      .split('|')
                      .map((h) => h.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Rows (pipe-separated per row, one row per line)">
              <textarea
                className={inputCls}
                rows={6}
                value={fromTableRows(tb.rows)}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...tb,
                    rows: toTableRows(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Caption">
              <input
                className={inputCls}
                value={tb.caption ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...tb,
                    caption: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        );
      }

      case 'comparison': {
        const cp = block as ComparisonBlock;
        return (
          <div className="space-y-3">
            <Field label="Title">
              <input
                className={inputCls}
                value={cp.title ?? ''}
                onChange={(e) =>
                  updateBlockAtIndex(index, {
                    ...cp,
                    title: e.target.value,
                  })
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Field label="Left Label">
                  <input
                    className={inputCls}
                    value={cp.left.label}
                    onChange={(e) =>
                      updateBlockAtIndex(index, {
                        ...cp,
                        left: { ...cp.left, label: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Left Points (one per line)">
                  <textarea
                    className={inputCls}
                    rows={4}
                    value={fromLineItems(cp.left.points)}
                    onChange={(e) =>
                      updateBlockAtIndex(index, {
                        ...cp,
                        left: {
                          ...cp.left,
                          points: toLineItems(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
              </div>
              <div className="space-y-3">
                <Field label="Right Label">
                  <input
                    className={inputCls}
                    value={cp.right.label}
                    onChange={(e) =>
                      updateBlockAtIndex(index, {
                        ...cp,
                        right: { ...cp.right, label: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Right Points (one per line)">
                  <textarea
                    className={inputCls}
                    rows={4}
                    value={fromLineItems(cp.right.points)}
                    onChange={(e) =>
                      updateBlockAtIndex(index, {
                        ...cp,
                        right: {
                          ...cp.right,
                          points: toLineItems(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  /* ---- preview section ---- */

  const previewSection = useMemo<TheorySection>(
    () => ({ id: section.id, title, estimatedMinutes, blocks }),
    [section.id, title, estimatedMinutes, blocks]
  );

  /* ---- render ---- */

  return (
    <div>
      {/* Split screen: editor left, preview right */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ---- Editor pane ---- */}
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
            Editor
          </div>

          {/* Title and minutes fields */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Field label="Lesson Title">
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Estimated Minutes">
              <input
                className={inputCls}
                type="number"
                min={1}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              />
            </Field>
          </div>

          {/* Blocks */}
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div key={index} className={blockCardCls}>
                {/* Block header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                    Block {index + 1} &middot; {blockTypeLabel(block.type)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={actionBtnCls}
                      disabled={index === 0}
                      onClick={() => moveBlock(index, 'up')}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className={actionBtnCls}
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 'down')}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className={actionBtnCls}
                      onClick={() => duplicateBlockAtIndex(index)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className={actionBtnCls}
                      onClick={() => deleteBlockAtIndex(index)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Block fields */}
                {renderBlockFields(block, index)}
              </div>
            ))}
          </div>

          {/* Add block dropdown */}
          <div className="mt-4 flex gap-2">
            <select
              className={inputCls}
              value={newBlockType}
              onChange={(e) => setNewBlockType(e.target.value as BlockType)}
            >
              {BLOCK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={secondaryBtnCls}
              onClick={() => addBlock(newBlockType)}
            >
              Add Block
            </button>
          </div>
        </div>

        {/* ---- Preview pane ---- */}
        <div className="hidden xl:block">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
            Preview
          </div>
          <div className="sticky top-0 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-light-border bg-white p-6 dark:border-dark-border dark:bg-[#0a0f0c]">
            <TheorySectionReadView
              section={previewSection}
              lessonIndex={0}
              lessonTotal={1}
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {saveError && (
        <div className="mt-4 text-sm text-rose-500">{saveError}</div>
      )}

      {/* Sticky toolbar */}
      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-light-border bg-white/80 py-4 backdrop-blur-sm dark:border-dark-border dark:bg-[#060809]/80">
        <button type="button" className={secondaryBtnCls} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={primaryBtnCls}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
