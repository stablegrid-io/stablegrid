'use client';

import { GripVertical, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { TheorySection } from '@/components/learn/theory/TheorySection';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import type {
  AdminTheoryDocPayload,
  AdminTheoryDocId,
  AdminTheoryLessonMutationPayload,
  AdminTheoryTopicSummary
} from '@/lib/admin/types';
import type {
  BlockType,
  CalloutBlock,
  ComparisonBlock,
  ContentBlock,
  DiagramBlock as TheoryDiagramBlock,
  KeyConceptBlock,
  ListBlock,
  TableBlock,
  TheoryChapter,
  TheoryCodeBlock,
  TheorySection as TheorySectionModel
} from '@/types/theory';

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

type EditorMode = 'visual' | 'json';
type EditTarget = 'lessons' | 'tasks';
type DropIndicator = { index: number; edge: 'before' | 'after' } | null;

const THEORY_TRACK_FALLBACKS: Array<{ value: AdminTheoryDocId; label: string }> = [
  { value: 'pyspark', label: 'PySpark: The Full Stack' },
  { value: 'pyspark-data-engineering-track', label: 'PySpark: Data Engineering Track' },
  { value: 'fabric', label: 'Fabric: End-to-End Platform' },
  { value: 'fabric-data-engineering-track', label: 'Fabric: Data Engineering Track' },
  { value: 'fabric-business-intelligence-track', label: 'Fabric: Business Intelligence Track' },
  { value: 'airflow', label: 'Apache Airflow: Beginner Track' },
  { value: 'airflow-intermediate-track', label: 'Apache Airflow: Intermediate Track' }
];

const EDIT_TARGET_OPTIONS: Array<{ value: EditTarget; label: string; helper: string }> = [
  {
    value: 'lessons',
    label: 'Theory',
    helper: 'Published theory lessons'
  },
  {
    value: 'tasks',
    label: 'Tasks',
    helper: 'Task editing coming next'
  }
];

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
  { value: 'comparison', label: 'Comparison' }
];

const INPUT_CLASS_NAME =
  'mt-2 w-full  border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition focus:border-brand-400/40 focus:bg-surface-container-high focus:ring-2 focus:ring-brand-500/15';

const SECONDARY_BUTTON_CLASS_NAME =
  ' border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm font-medium text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-primary/30 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:border-outline-variant/20 disabled:bg-surface-container-high disabled:text-[#d0ded8] disabled:opacity-100';

const PRIMARY_BUTTON_CLASS_NAME =
  ' border border-brand-300/45 bg-primary/92 px-5 py-3 text-sm font-semibold text-[#06110d] shadow-[0_18px_40px_-24px_rgba(34,185,153,0.42)] transition hover:bg-primary disabled:cursor-not-allowed disabled:border-outline-variant/20 disabled:bg-surface-container-high disabled:text-on-surface disabled:shadow-none disabled:opacity-100';

const ICON_BUTTON_CLASS_NAME =
  ' border border-outline-variant/20 bg-black/15 px-2.5 py-2 text-xs font-medium text-[#dbe7e1] transition hover:border-primary/30 hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }

  return payload.data;
}

const InlineMessage = ({
  tone,
  message
}: {
  tone: 'error' | 'success';
  message: string;
}) => (
  <div
    className={` border px-4 py-3 text-sm ${
      tone === 'error'
        ? 'border-error/25 bg-error/10 text-error'
        : 'border-brand-400/25 bg-primary/10 text-[#d7f6ec]'
    }`}
  >
    {message}
  </div>
);

const Field = ({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[#8ca79a]">
      {label}
    </span>
    {children}
  </label>
);

const BlockCard = ({
  title,
  subtitle,
  children,
  actions
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions: ReactNode;
}) => (
  <div className="rounded-[26px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">{actions}</div>
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </div>
);

const createDefaultBlock = (type: BlockType): ContentBlock => {
  switch (type) {
    case 'heading':
      return { type, content: 'New heading' };
    case 'subheading':
      return { type, content: 'New subheading' };
    case 'code':
      return { type, language: 'python', label: '', content: '' };
    case 'diagram':
      return { type, title: '', content: '', caption: '' };
    case 'callout':
      return { type, variant: 'info', title: '', content: '' };
    case 'bullet-list':
      return { type, items: ['New bullet'] };
    case 'numbered-list':
      return { type, items: ['New step'] };
    case 'table':
      return {
        type,
        headers: ['Column 1', 'Column 2'],
        rows: [['Value 1', 'Value 2']],
        caption: ''
      };
    case 'key-concept':
      return { type, term: 'New concept', definition: '', analogy: '' };
    case 'comparison':
      return {
        type,
        title: '',
        left: { label: 'Option A', points: ['First point'] },
        right: { label: 'Option B', points: ['First point'] }
      };
    case 'paragraph':
    default:
      return { type: 'paragraph', content: 'New paragraph' };
  }
};

const cloneBlock = (block: ContentBlock): ContentBlock =>
  JSON.parse(JSON.stringify(block)) as ContentBlock;

const toLineItems = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const fromLineItems = (items: string[]) => items.join('\n');

const fromTableRows = (rows: string[][]) => rows.map((row) => row.join(' | ')).join('\n');

const toTableRows = (value: string) =>
  value
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) =>
      row
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
    );

const getDocSummary = (doc: AdminTheoryDocPayload['doc']) => ({
  chapterCount: doc.chapters.length,
  lessonCount: doc.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0)
});

const getBlockLabel = (block: ContentBlock) =>
  BLOCK_TYPE_OPTIONS.find((option) => option.value === block.type)?.label ?? block.type;

const clip = (value: string, max = 82) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const getBlockSummary = (block: ContentBlock) => {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'subheading':
      return clip(block.content);
    case 'callout':
      return clip(block.title ? `${block.title}: ${block.content}` : block.content);
    case 'bullet-list':
    case 'numbered-list':
      return clip(block.items.join(' • '));
    case 'key-concept':
      return clip(`${block.term}: ${block.definition}`);
    case 'code':
      return clip(block.label ? `${block.label} · ${block.language}` : block.language);
    case 'diagram':
      return clip(block.title ? `${block.title} · ${block.caption ?? ''}` : block.caption ?? 'Diagram');
    case 'table':
      return clip(block.headers.join(' • '));
    case 'comparison':
      return clip(`${block.left.label} vs ${block.right.label}`);
    default:
      return 'Block content';
  }
};

const normalizeJsonBlocks = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return {
        blocks: null,
        error: 'Lesson blocks must be a JSON array.'
      };
    }

    return {
      blocks: parsed as ContentBlock[],
      error: null
    };
  } catch (error) {
    return {
      blocks: null,
      error: error instanceof Error ? error.message : 'Invalid JSON.'
    };
  }
};

export function TheoryLessonsSection({
  onMutation,
  onOpenTaskEditor
}: {
  onMutation: (message: string) => void;
  onOpenTaskEditor?: () => void;
}) {
  const [editTarget, setEditTarget] = useState<EditTarget>('lessons');
  const [selectedTopic, setSelectedTopic] = useState<AdminTheoryDocId>('pyspark');
  const [trackSummaries, setTrackSummaries] = useState<AdminTheoryTopicSummary[]>([]);
  const [docPayload, setDocPayload] = useState<AdminTheoryDocPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [lessonSearch, setLessonSearch] = useState('');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [isWritingMode, setIsWritingMode] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [blocksDraft, setBlocksDraft] = useState<ContentBlock[]>([]);
  const [blocksJson, setBlocksJson] = useState('[]');
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [newBlockType, setNewBlockType] = useState<BlockType>('paragraph');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const draggedBlockIndexRef = useRef<number | null>(null);
  const topicRequestIdRef = useRef(0);

  const replaceBlocks = useCallback((nextBlocks: ContentBlock[]) => {
    setBlocksDraft(nextBlocks);
    setBlocksJson(JSON.stringify(nextBlocks, null, 2));
  }, []);

  const loadTrackSummaries = useCallback(async () => {
    try {
      const data = await requestJson<AdminTheoryTopicSummary[]>('/api/admin/theory-docs');
      setTrackSummaries(data);
    } catch (error) {
      console.error('Failed to load theory track summaries:', error);
    }
  }, []);

  const loadTopicDoc = useCallback(async (topic: AdminTheoryDocId) => {
    const requestId = topicRequestIdRef.current + 1;
    topicRequestIdRef.current = requestId;
    setLoading(true);
    setLoadError(null);

    try {
      const data = await requestJson<AdminTheoryDocPayload>(
        `/api/admin/theory-docs?topic=${encodeURIComponent(topic)}`
      );
      if (topicRequestIdRef.current !== requestId) {
        return;
      }

      setDocPayload(data);
    } catch (error) {
      if (topicRequestIdRef.current !== requestId) {
        return;
      }

      setLoadError(error instanceof Error ? error.message : 'Failed to load theory topic.');
    } finally {
      if (topicRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadTrackSummaries();
  }, [loadTrackSummaries]);

  useEffect(() => {
    void loadTopicDoc(selectedTopic);
  }, [loadTopicDoc, selectedTopic]);

  useEffect(() => {
    setDocPayload(null);
    setSelectedChapterId('');
    setSelectedLessonId('');
    setLessonTitle('');
    setEstimatedMinutes(5);
    replaceBlocks([]);
    setSelectedBlockIndex(0);
    setSaveError(null);
    setSaveSuccess(null);
  }, [replaceBlocks, selectedTopic]);

  useEffect(() => {
    if (!docPayload) {
      return;
    }

    const chapter =
      docPayload.doc.chapters.find((entry) => entry.id === selectedChapterId) ??
      docPayload.doc.chapters[0] ??
      null;
    const lesson =
      chapter?.sections.find((entry) => entry.id === selectedLessonId) ??
      chapter?.sections[0] ??
      null;

    if (chapter && chapter.id !== selectedChapterId) {
      setSelectedChapterId(chapter.id);
    }
    if (lesson && lesson.id !== selectedLessonId) {
      setSelectedLessonId(lesson.id);
    }
  }, [docPayload, selectedChapterId, selectedLessonId]);

  const selectedChapter = useMemo<TheoryChapter | null>(() => {
    if (!docPayload) {
      return null;
    }

    return docPayload.doc.chapters.find((entry) => entry.id === selectedChapterId) ?? null;
  }, [docPayload, selectedChapterId]);

  const selectedLesson = useMemo<TheorySectionModel | null>(() => {
    if (!selectedChapter) {
      return null;
    }

    return selectedChapter.sections.find((entry) => entry.id === selectedLessonId) ?? null;
  }, [selectedChapter, selectedLessonId]);

  useEffect(() => {
    if (!selectedLesson) {
      return;
    }

    setLessonTitle(selectedLesson.title);
    setEstimatedMinutes(selectedLesson.estimatedMinutes);
    replaceBlocks(selectedLesson.blocks);
    setSelectedBlockIndex(0);
    setEditorMode('visual');
    setSaveError(null);
    setSaveSuccess(null);
  }, [replaceBlocks, selectedLesson]);

  useEffect(() => {
    setSelectedBlockIndex((current) => {
      if (!blocksDraft.length) {
        return 0;
      }

      return Math.min(current, blocksDraft.length - 1);
    });
  }, [blocksDraft.length]);

  const parsedBlocksState = useMemo(() => {
    if (editorMode !== 'json') {
      return {
        blocks: blocksDraft,
        error: null
      };
    }

    return normalizeJsonBlocks(blocksJson);
  }, [blocksDraft, blocksJson, editorMode]);

  const previewLesson = useMemo<TheorySectionModel | null>(() => {
    if (!selectedLesson || !parsedBlocksState.blocks) {
      return selectedLesson;
    }

    return {
      ...selectedLesson,
      title: lessonTitle,
      estimatedMinutes,
      blocks: parsedBlocksState.blocks
    };
  }, [estimatedMinutes, lessonTitle, parsedBlocksState.blocks, selectedLesson]);

  const selectedBlock = blocksDraft[selectedBlockIndex] ?? null;

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedLesson) {
      return false;
    }

    return (
      lessonTitle !== selectedLesson.title ||
      estimatedMinutes !== selectedLesson.estimatedMinutes ||
      JSON.stringify(blocksDraft) !== JSON.stringify(selectedLesson.blocks)
    );
  }, [blocksDraft, estimatedMinutes, lessonTitle, selectedLesson]);

  const filteredChapters = useMemo(() => {
    const chapters = docPayload?.doc.chapters ?? [];
    const query = lessonSearch.trim().toLowerCase();

    if (!query) {
      return chapters;
    }

    return chapters
      .map((chapter) => ({
        ...chapter,
        sections: chapter.sections.filter((lesson) => {
          const haystack = `${lesson.title} ${lesson.id}`.toLowerCase();
          return haystack.includes(query);
        })
      }))
      .filter((chapter) => chapter.sections.length > 0);
  }, [docPayload?.doc.chapters, lessonSearch]);

  useEffect(() => {
    if (!filteredChapters.length) {
      return;
    }

    const chapter =
      filteredChapters.find((entry) => entry.id === selectedChapterId) ?? filteredChapters[0];
    const lesson =
      chapter.sections.find((entry) => entry.id === selectedLessonId) ?? chapter.sections[0] ?? null;

    if (chapter.id !== selectedChapterId) {
      setSelectedChapterId(chapter.id);
    }

    if (lesson && lesson.id !== selectedLessonId) {
      setSelectedLessonId(lesson.id);
    }
  }, [filteredChapters, selectedChapterId, selectedLessonId]);

  const filteredLessonCount = useMemo(
    () => filteredChapters.reduce((sum, chapter) => sum + chapter.sections.length, 0),
    [filteredChapters]
  );

  const selectedFilteredChapter = useMemo(
    () => filteredChapters.find((entry) => entry.id === selectedChapterId) ?? filteredChapters[0] ?? null,
    [filteredChapters, selectedChapterId]
  );

  const selectedFilteredLesson = useMemo(
    () =>
      selectedFilteredChapter?.sections.find((entry) => entry.id === selectedLessonId) ??
      selectedFilteredChapter?.sections[0] ??
      null,
    [selectedFilteredChapter, selectedLessonId]
  );

  const selectedTrackSummary = useMemo(
    () => trackSummaries.find((entry) => entry.topic === selectedTopic) ?? null,
    [selectedTopic, trackSummaries]
  );

  const availableTracks = useMemo(
    () => {
      if (!trackSummaries.length) {
        return THEORY_TRACK_FALLBACKS.map((track) => ({
          value: track.value,
          label: track.label,
          chapterCount: null,
          lessonCount: null
        }));
      }

      return trackSummaries.map((track) => ({
        value: track.topic,
        label:
          THEORY_TRACK_FALLBACKS.find((fallback) => fallback.value === track.topic)?.label ??
          track.title,
        chapterCount: track.chapterCount,
        lessonCount: track.lessonCount
      }));
    },
    [trackSummaries]
  );

  const selectedTrackLabel =
    availableTracks.find((track) => track.value === selectedTopic)?.label ??
    selectedTrackSummary?.title ??
    'Track';

  useEffect(() => {
    if (!availableTracks.length) {
      return;
    }

    if (!availableTracks.some((track) => track.value === selectedTopic)) {
      setSelectedTopic(availableTracks[0].value);
    }
  }, [availableTracks, selectedTopic]);

  const updateBlockAtIndex = useCallback(
    (index: number, nextBlock: ContentBlock) => {
      replaceBlocks(blocksDraft.map((block, blockIndex) => (blockIndex === index ? nextBlock : block)));
    },
    [blocksDraft, replaceBlocks]
  );

  const removeBlockAtIndex = useCallback(
    (index: number) => {
      const nextBlocks = blocksDraft.filter((_, blockIndex) => blockIndex !== index);
      replaceBlocks(nextBlocks);
      setSelectedBlockIndex((current) => {
        if (!nextBlocks.length) {
          return 0;
        }
        if (current > index) {
          return current - 1;
        }
        return Math.min(current, nextBlocks.length - 1);
      });
    },
    [blocksDraft, replaceBlocks]
  );

  const duplicateBlockAtIndex = useCallback(
    (index: number) => {
      const nextBlocks = [...blocksDraft];
      nextBlocks.splice(index + 1, 0, cloneBlock(blocksDraft[index]));
      replaceBlocks(nextBlocks);
      setSelectedBlockIndex(index + 1);
    },
    [blocksDraft, replaceBlocks]
  );

  const clearBlockDragState = useCallback(() => {
    draggedBlockIndexRef.current = null;
    setDraggedBlockIndex(null);
    setDropIndicator(null);
  }, []);

  const moveBlockToIndex = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!blocksDraft.length) {
        return;
      }

      const boundedTargetIndex = Math.max(0, Math.min(toIndex, blocksDraft.length));
      const targetIndex =
        fromIndex < boundedTargetIndex ? boundedTargetIndex - 1 : boundedTargetIndex;

      if (targetIndex === fromIndex) {
        return;
      }

      const nextBlocks = [...blocksDraft];
      const [block] = nextBlocks.splice(fromIndex, 1);
      nextBlocks.splice(targetIndex, 0, block);
      replaceBlocks(nextBlocks);
      setSelectedBlockIndex(targetIndex);
    },
    [blocksDraft, replaceBlocks]
  );

  const moveBlockByStep = useCallback(
    (index: number, direction: -1 | 1) => {
      if (direction === -1) {
        moveBlockToIndex(index, index - 1);
        return;
      }

      moveBlockToIndex(index, index + 2);
    },
    [moveBlockToIndex]
  );

  const addBlock = useCallback(() => {
    const nextBlocks = [...blocksDraft, createDefaultBlock(newBlockType)];
    replaceBlocks(nextBlocks);
    setSelectedBlockIndex(nextBlocks.length - 1);
    clearBlockDragState();
  }, [blocksDraft, clearBlockDragState, newBlockType, replaceBlocks]);

  const handleJsonChange = (value: string) => {
    setBlocksJson(value);
    const parsed = normalizeJsonBlocks(value);
    if (parsed.blocks) {
      setBlocksDraft(parsed.blocks);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedChapter || !selectedLesson) {
      setSaveError('Select a lesson before saving.');
      return;
    }

    if (!parsedBlocksState.blocks) {
      setSaveError(parsedBlocksState.error ?? 'Lesson body is invalid.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const requestBody = {
        topic: selectedTopic,
        chapterId: selectedChapter.id,
        lessonId: selectedLesson.id,
        title: lessonTitle,
        estimatedMinutes,
        blocks: parsedBlocksState.blocks
      };
      await requestJson<AdminTheoryLessonMutationPayload>('/api/admin/theory-docs/lessons', {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey(
            'admin_theory_lesson_update',
            requestBody
          )
        },
        body: JSON.stringify(requestBody)
      });

      await loadTopicDoc(selectedTopic);
      setSaveSuccess('Lesson saved to the published theory doc.');
      onMutation(`Lesson updated: ${selectedLesson.id}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => {
    if (!selectedLesson) {
      return;
    }

    setLessonTitle(selectedLesson.title);
    setEstimatedMinutes(selectedLesson.estimatedMinutes);
    replaceBlocks(selectedLesson.blocks);
    setSelectedBlockIndex(0);
    setEditorMode('visual');
    setSaveError(null);
    setSaveSuccess(null);
    clearBlockDragState();
  };

  useEffect(() => {
    if (editTarget !== 'lessons') {
      setIsWritingMode(false);
    }
  }, [editTarget]);

  const { chapterCount, lessonCount } = docPayload
    ? getDocSummary(docPayload.doc)
    : { chapterCount: 0, lessonCount: 0 };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    const commonActions = (
      <>
        <select
          className=" border border-outline-variant/20 bg-black/20 px-3 py-2 text-xs font-medium text-on-surface outline-none transition focus:border-brand-400/40"
          value={block.type}
          onChange={(event) =>
            updateBlockAtIndex(index, createDefaultBlock(event.target.value as BlockType))
          }
        >
          {BLOCK_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => duplicateBlockAtIndex(index)}
          className={ICON_BUTTON_CLASS_NAME}
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => removeBlockAtIndex(index)}
          className={ICON_BUTTON_CLASS_NAME}
        >
          Delete
        </button>
      </>
    );

    switch (block.type) {
      case 'paragraph':
      case 'heading':
      case 'subheading':
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Simple text content"
            actions={commonActions}
          >
            <Field label="Text">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[24rem] resize-y px-5 py-4 text-[1.02rem] leading-8 sm:min-h-[28rem]`}
                value={block.content}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...block, content: event.target.value })
                }
              />
            </Field>
          </BlockCard>
        );
      case 'callout': {
        const calloutBlock = block as CalloutBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Highlighted note, warning, or tip"
            actions={commonActions}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Variant">
                <select
                  className={INPUT_CLASS_NAME}
                  value={calloutBlock.variant}
                  onChange={(event) =>
                    updateBlockAtIndex(index, {
                      ...calloutBlock,
                      variant: event.target.value as CalloutBlock['variant']
                    })
                  }
                >
                  {['info', 'warning', 'tip', 'danger', 'insight'].map((variant) => (
                    <option key={variant} value={variant}>
                      {variant}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title">
                <input
                  className={INPUT_CLASS_NAME}
                  value={calloutBlock.title ?? ''}
                  onChange={(event) =>
                    updateBlockAtIndex(index, { ...calloutBlock, title: event.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Content">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[18rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                value={calloutBlock.content}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...calloutBlock, content: event.target.value })
                }
              />
            </Field>
          </BlockCard>
        );
      }
      case 'bullet-list':
      case 'numbered-list': {
        const listBlock = block as ListBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="One line per item"
            actions={commonActions}
          >
            <Field label="Items">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[16rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                value={fromLineItems(listBlock.items)}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...listBlock, items: toLineItems(event.target.value) })
                }
              />
            </Field>
          </BlockCard>
        );
      }
      case 'key-concept': {
        const keyConceptBlock = block as KeyConceptBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Term, definition, and optional analogy"
            actions={commonActions}
          >
            <Field label="Term">
              <input
                className={INPUT_CLASS_NAME}
                value={keyConceptBlock.term}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...keyConceptBlock, term: event.target.value })
                }
              />
            </Field>
            <Field label="Definition">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[14rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                value={keyConceptBlock.definition}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...keyConceptBlock, definition: event.target.value })
                }
              />
            </Field>
            <Field label="Analogy">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[10rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                value={keyConceptBlock.analogy ?? ''}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...keyConceptBlock, analogy: event.target.value })
                }
              />
            </Field>
          </BlockCard>
        );
      }
      case 'code': {
        const codeBlock = block as TheoryCodeBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Language, optional label, and code body"
            actions={commonActions}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Language">
                <input
                  className={INPUT_CLASS_NAME}
                  value={codeBlock.language}
                  onChange={(event) =>
                    updateBlockAtIndex(index, { ...codeBlock, language: event.target.value })
                  }
                />
              </Field>
              <Field label="Label">
                <input
                  className={INPUT_CLASS_NAME}
                  value={codeBlock.label ?? ''}
                  onChange={(event) =>
                    updateBlockAtIndex(index, { ...codeBlock, label: event.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Code">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[18rem] resize-y px-5 py-4 font-mono text-xs leading-6`}
                value={codeBlock.content}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...codeBlock, content: event.target.value })
                }
                spellCheck={false}
              />
            </Field>
          </BlockCard>
        );
      }
      case 'diagram': {
        const diagramBlock = block as TheoryDiagramBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Diagram source plus optional framing"
            actions={commonActions}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  className={INPUT_CLASS_NAME}
                  value={diagramBlock.title ?? ''}
                  onChange={(event) =>
                    updateBlockAtIndex(index, { ...diagramBlock, title: event.target.value })
                  }
                />
              </Field>
              <Field label="Caption">
                <input
                  className={INPUT_CLASS_NAME}
                  value={diagramBlock.caption ?? ''}
                  onChange={(event) =>
                    updateBlockAtIndex(index, { ...diagramBlock, caption: event.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Diagram content">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[16rem] resize-y px-5 py-4 font-mono text-xs leading-6`}
                value={diagramBlock.content}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...diagramBlock, content: event.target.value })
                }
                spellCheck={false}
              />
            </Field>
          </BlockCard>
        );
      }
      case 'table': {
        const tableBlock = block as TableBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Headers on one line, rows one per line using | between cells"
            actions={commonActions}
          >
            <Field label="Headers">
              <input
                className={INPUT_CLASS_NAME}
                value={tableBlock.headers.join(' | ')}
                onChange={(event) =>
                  updateBlockAtIndex(index, {
                    ...tableBlock,
                    headers: event.target.value
                      .split('|')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
              />
            </Field>
            <Field label="Rows">
              <textarea
                className={`${INPUT_CLASS_NAME} min-h-[14rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                value={fromTableRows(tableBlock.rows)}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...tableBlock, rows: toTableRows(event.target.value) })
                }
              />
            </Field>
            <Field label="Caption">
              <input
                className={INPUT_CLASS_NAME}
                value={tableBlock.caption ?? ''}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...tableBlock, caption: event.target.value })
                }
              />
            </Field>
          </BlockCard>
        );
      }
      case 'comparison': {
        const comparisonBlock = block as ComparisonBlock;
        return (
          <BlockCard
            key={`${block.type}-${index}`}
            title={`Block ${index + 1} · ${getBlockLabel(block)}`}
            subtitle="Left and right comparisons with line-based points"
            actions={commonActions}
          >
            <Field label="Title">
              <input
                className={INPUT_CLASS_NAME}
                value={comparisonBlock.title ?? ''}
                onChange={(event) =>
                  updateBlockAtIndex(index, { ...comparisonBlock, title: event.target.value })
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4  border border-outline-variant/20 bg-black/10 p-4">
                <Field label="Left label">
                  <input
                    className={INPUT_CLASS_NAME}
                    value={comparisonBlock.left.label}
                    onChange={(event) =>
                      updateBlockAtIndex(index, {
                        ...comparisonBlock,
                        left: { ...comparisonBlock.left, label: event.target.value }
                      })
                    }
                  />
                </Field>
                <Field label="Left points">
                  <textarea
                    className={`${INPUT_CLASS_NAME} min-h-[14rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                    value={fromLineItems(comparisonBlock.left.points)}
                    onChange={(event) =>
                      updateBlockAtIndex(index, {
                        ...comparisonBlock,
                        left: { ...comparisonBlock.left, points: toLineItems(event.target.value) }
                      })
                    }
                  />
                </Field>
              </div>
              <div className="space-y-4  border border-outline-variant/20 bg-black/10 p-4">
                <Field label="Right label">
                  <input
                    className={INPUT_CLASS_NAME}
                    value={comparisonBlock.right.label}
                    onChange={(event) =>
                      updateBlockAtIndex(index, {
                        ...comparisonBlock,
                        right: { ...comparisonBlock.right, label: event.target.value }
                      })
                    }
                  />
                </Field>
                <Field label="Right points">
                  <textarea
                    className={`${INPUT_CLASS_NAME} min-h-[14rem] resize-y px-5 py-4 text-[1rem] leading-8`}
                    value={fromLineItems(comparisonBlock.right.points)}
                    onChange={(event) =>
                      updateBlockAtIndex(index, {
                        ...comparisonBlock,
                        right: { ...comparisonBlock.right, points: toLineItems(event.target.value) }
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </BlockCard>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[19rem_minmax(0,1fr)]">
      <section className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(12,18,16,0.92),rgba(8,12,11,0.97))] shadow-[0_36px_90px_-56px_rgba(0,0,0,0.88)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,185,153,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_32%)]" />

        <div className="relative space-y-5 px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[#7fbba7]">Library</p>
            <h2
              className="text-[1.7rem] font-semibold tracking-tight text-on-surface sm:text-[1.95rem]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {editTarget === 'lessons' ? 'Content editor' : 'Task editor'}
            </h2>
            <p className="max-w-sm text-sm leading-6 text-[#9caea7]">
              {editTarget === 'lessons'
                ? 'Choose a track, narrow to a module, and start editing with less noise.'
                : 'Task editing will live in this same quiet workflow so lessons and tasks feel consistent.'}
            </p>
          </div>

          {loadError ? <InlineMessage tone="error" message={loadError} /> : null}

          <div className=" border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.028))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Field label="Edit target">
              <select
                className={INPUT_CLASS_NAME}
                value={editTarget}
                onChange={(event) => setEditTarget(event.target.value as EditTarget)}
              >
                {EDIT_TARGET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <p className="mt-3 text-xs leading-5 text-on-surface-variant">
              {EDIT_TARGET_OPTIONS.find((option) => option.value === editTarget)?.helper}
            </p>
          </div>

          {editTarget === 'lessons' ? (
            <>
              <div className="space-y-4  border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[#8ca79a]">
                      Track
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Choose which theory track you want to edit.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadTopicDoc(selectedTopic)}
                    className={SECONDARY_BUTTON_CLASS_NAME}
                  >
                    Reload
                  </button>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86a79b]" />
                  <input
                    className="w-full  border border-outline-variant/20 bg-black/15 py-3 pl-11 pr-4 text-sm text-on-surface outline-none transition focus:border-brand-400/40 focus:bg-surface-container-high focus:ring-2 focus:ring-brand-500/15"
                    value={lessonSearch}
                    onChange={(event) => setLessonSearch(event.target.value)}
                    placeholder="Search lesson title or id"
                  />
                </div>

                <Field label="Track">
                  <select
                    className={INPUT_CLASS_NAME}
                    value={selectedTopic}
                    onChange={(event) => {
                      setSelectedTopic(event.target.value);
                      setLessonSearch('');
                    }}
                  >
                    {availableTracks.map((track) => (
                      <option key={track.value} value={track.value}>
                        {track.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {loading ? (
                  <p className="text-sm text-on-surface-variant">Loading lessons...</p>
                ) : !filteredChapters.length ? (
                  <div className=" border border-dashed border-outline-variant/20 bg-surface-container-low px-4 py-8 text-sm text-[#9fb1aa]">
                    No lessons match that search yet.
                  </div>
                ) : (
                  <>
                    <Field label="Module">
                      <select
                        className={INPUT_CLASS_NAME}
                        value={selectedFilteredChapter?.id ?? ''}
                        onChange={(event) => {
                          const nextChapter =
                            filteredChapters.find((chapter) => chapter.id === event.target.value) ?? null;
                          setSelectedChapterId(event.target.value);
                          setSelectedLessonId(nextChapter?.sections[0]?.id ?? '');
                        }}
                      >
                        {filteredChapters.map((chapter) => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.title}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Lesson">
                      <select
                        className={INPUT_CLASS_NAME}
                        value={selectedFilteredLesson?.id ?? ''}
                        onChange={(event) => setSelectedLessonId(event.target.value)}
                      >
                        {(selectedFilteredChapter?.sections ?? []).map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
              </div>

              <div className=" border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="space-y-1">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[#8ca79a]">
                    Add block
                  </p>
                  <p className="text-xs leading-5 text-on-surface-variant">
                    Add a new block to the end of this lesson, then refine it in the editor.
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  <Field label="New block">
                    <select
                      className={INPUT_CLASS_NAME}
                      value={newBlockType}
                      onChange={(event) => setNewBlockType(event.target.value as BlockType)}
                      disabled={!selectedLesson}
                    >
                      {BLOCK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <button
                    type="button"
                    onClick={addBlock}
                    disabled={!selectedLesson}
                    className={`${PRIMARY_BUTTON_CLASS_NAME} w-full`}
                  >
                    Add block
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className=" border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-sm font-semibold text-on-surface">Task editor is reserved next</p>
              <p className="mt-2 text-sm leading-6 text-[#9fb1aa]">
                We kept this area intentionally quiet. When task copy editing lands, it will use the same track-first flow as lesson editing.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpenTaskEditor?.()}
                  className={PRIMARY_BUTTON_CLASS_NAME}
                  disabled={!onOpenTaskEditor}
                >
                  Open task editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget('lessons')}
                  className={SECONDARY_BUTTON_CLASS_NAME}
                >
                  Back to lessons
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(11,16,15,0.88),rgba(7,10,9,0.95))] shadow-[0_36px_90px_-56px_rgba(0,0,0,0.88)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,185,153,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_34%)]" />
          <div className="relative border-b border-outline-variant/20 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8ca79a]">
                  <span>Composer</span>
                  {editTarget === 'lessons' ? (
                    <span className=" border border-outline-variant/20 bg-surface-container-low px-2.5 py-1 text-[10px] tracking-[0.14em] text-[#dbe7e1]">
                      {selectedTrackLabel}
                    </span>
                  ) : null}
                  {editTarget === 'lessons' && selectedChapter ? (
                    <span className=" border border-outline-variant/20 bg-surface-container-low px-2.5 py-1 text-[10px] tracking-[0.14em] text-[#dbe7e1]">
                      {selectedChapter.title}
                    </span>
                  ) : null}
                  {editTarget === 'lessons' && hasUnsavedChanges ? (
                    <span className=" border border-brand-300/35 bg-primary/12 px-2.5 py-1 text-[10px] tracking-[0.14em] text-primary">
                      Unsaved
                    </span>
                  ) : editTarget === 'lessons' ? (
                    <span className=" border border-outline-variant/20 bg-black/15 px-2.5 py-1 text-[10px] tracking-[0.14em] text-[#b9cac3]">
                      Synced
                    </span>
                  ) : null}
                </div>
                <h2
                  className="mt-4 max-w-5xl text-[1.9rem] font-semibold tracking-tight text-on-surface sm:text-[2.35rem]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {editTarget === 'lessons'
                    ? selectedLesson?.title ?? 'Choose a lesson to begin editing'
                    : 'Task editor coming next'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a8b9b2]">
                  {editTarget === 'lessons'
                    ? `Editing ${selectedTrackLabel.toLowerCase()} lesson content in data/learn/theory/published/${selectedTopic}.json.`
                    : 'This pane is reserved for future task copy editing, so lessons and tasks can share one editing system.'}
                </p>
              </div>
              {editTarget === 'lessons' ? (
                <div className="w-full max-w-[14rem]">
                  <Field label="Editor mode">
                    <select
                      className={INPUT_CLASS_NAME}
                      value={editorMode}
                      onChange={(event) => setEditorMode(event.target.value as EditorMode)}
                    >
                      <option value="visual">Visual Editor</option>
                      <option value="json">Advanced JSON</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div className=" border border-outline-variant/20 bg-black/15 px-4 py-2.5 text-sm font-medium text-[#d0e0d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  Task mode placeholder
                </div>
              )}
            </div>
          </div>

          <form className="relative space-y-5 px-5 py-5 sm:px-6" onSubmit={handleSave}>
            {saveError ? <InlineMessage tone="error" message={saveError} /> : null}
            {saveSuccess ? <InlineMessage tone="success" message={saveSuccess} /> : null}

            {editTarget === 'lessons' ? (
              <>
                <div className="rounded-[26px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
                      <Field label="Lesson title">
                        <input
                          className={INPUT_CLASS_NAME}
                          value={lessonTitle}
                          onChange={(event) => setLessonTitle(event.target.value)}
                          disabled={!selectedLesson}
                        />
                      </Field>
                      <Field label="Estimated minutes">
                        <input
                          className={INPUT_CLASS_NAME}
                          min={1}
                          type="number"
                          value={estimatedMinutes}
                          onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
                          disabled={!selectedLesson}
                        />
                      </Field>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={!selectedLesson || !!parsedBlocksState.error || !parsedBlocksState.blocks?.length || saving}
                        className={PRIMARY_BUTTON_CLASS_NAME}
                      >
                        {saving ? 'Saving...' : 'Save lesson'}
                      </button>
                      <button
                        type="button"
                        onClick={resetDraft}
                        className={SECONDARY_BUTTON_CLASS_NAME}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {editorMode === 'visual' ? (
                  <div className="space-y-4">
                    <div className="rounded-[26px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">Lesson structure</p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Focus on one block at a time. Select a block from the map, then edit its content on the right.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                          <button
                            type="button"
                            onClick={() => setIsWritingMode((current) => !current)}
                            className={SECONDARY_BUTTON_CLASS_NAME}
                          >
                            {isWritingMode ? 'Show map' : 'Writing mode'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {!blocksDraft.length ? (
                      <div className="rounded-[26px] border border-dashed border-outline-variant/20 bg-surface-container-low px-5 py-10 text-sm text-[#9fb1aa]">
                        This lesson has no blocks yet. Add a block to start writing.
                      </div>
                    ) : (
                      <div
                        className={`grid gap-4 ${
                          isWritingMode
                            ? 'grid-cols-1'
                            : 'xl:grid-cols-[16rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(0,1fr)]'
                        }`}
                      >
                        {!isWritingMode ? (
                          <div className="rounded-[26px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-on-surface">Lesson map</p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                  {blocksDraft.length} blocks in this lesson
                                </p>
                              </div>
                              <span className=" border border-outline-variant/20 bg-black/15 px-3 py-1 text-[11px] font-medium text-[#d5e4de]">
                                {selectedBlockIndex + 1}/{blocksDraft.length}
                              </span>
                            </div>
                            <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#7fbba7]">
                              Drag cards to reorder
                            </p>
                            <div className="space-y-2">
                              {blocksDraft.map((block, index) => (
                                <div
                                  key={`${block.type}-${index}`}
                                  className="relative"
                                >
                                  {dropIndicator?.index === index && dropIndicator.edge === 'before' ? (
                                    <div className="absolute inset-x-4 -top-1 z-10 h-0.5  bg-primary/90 shadow-[0_0_18px_rgba(34,185,153,0.55)]" />
                                  ) : null}
                                  <button
                                    data-testid="lesson-map-item"
                                    draggable={blocksDraft.length > 1}
                                    type="button"
                                    onClick={() => setSelectedBlockIndex(index)}
                                    onKeyDown={(event) => {
                                      if (!event.shiftKey) {
                                        return;
                                      }

                                      if (event.key === 'ArrowUp') {
                                        event.preventDefault();
                                        moveBlockByStep(index, -1);
                                      }

                                      if (event.key === 'ArrowDown') {
                                        event.preventDefault();
                                        moveBlockByStep(index, 1);
                                      }
                                    }}
                                    onDragStart={(event) => {
                                      draggedBlockIndexRef.current = index;
                                      setDraggedBlockIndex(index);
                                      setSelectedBlockIndex(index);
                                      event.dataTransfer.effectAllowed = 'move';
                                      event.dataTransfer.setData('text/plain', String(index));
                                    }}
                                    onDragOver={(event) => {
                                      if (draggedBlockIndexRef.current === null) {
                                        return;
                                      }

                                      event.preventDefault();
                                      event.dataTransfer.dropEffect = 'move';

                                      const rect = event.currentTarget.getBoundingClientRect();
                                      const offsetY = event.clientY - rect.top;
                                      const edge =
                                        rect.height > 0 && offsetY > rect.height / 2 ? 'after' : 'before';
                                      setDropIndicator({ index, edge });
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault();

                                      const activeDraggedBlockIndex = draggedBlockIndexRef.current;
                                      if (activeDraggedBlockIndex === null) {
                                        return;
                                      }

                                      const rect = event.currentTarget.getBoundingClientRect();
                                      const offsetY = event.clientY - rect.top;
                                      const edge =
                                        rect.height > 0 && offsetY > rect.height / 2 ? 'after' : 'before';
                                      const targetIndex = edge === 'before' ? index : index + 1;

                                      moveBlockToIndex(activeDraggedBlockIndex, targetIndex);
                                      clearBlockDragState();
                                    }}
                                    onDragEnd={clearBlockDragState}
                                    className={`w-full  border px-3.5 py-3 text-left transition ${
                                      selectedBlockIndex === index
                                        ? 'border-brand-300/35 bg-primary/12 shadow-[0_18px_40px_-30px_rgba(34,185,153,0.16)]'
                                        : 'border-outline-variant/20 bg-black/12 hover:border-brand-400/25 hover:bg-surface-container'
                                    } ${
                                      draggedBlockIndex === index ? 'cursor-grabbing opacity-65' : 'cursor-grab'
                                    }`}
                                    aria-label={`Block ${index + 1}: ${getBlockLabel(block)}. Drag to reorder.`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center  border border-outline-variant/20 bg-black/20 text-[11px] font-semibold text-[#dbe7e1]">
                                        {index + 1}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-on-surface">{getBlockLabel(block)}</p>
                                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                                          {getBlockSummary(block)}
                                        </p>
                                      </div>
                                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center  border border-outline-variant/20 bg-black/20 text-on-surface-variant">
                                        <GripVertical className="h-4 w-4" />
                                      </span>
                                    </div>
                                  </button>
                                  {dropIndicator?.index === index && dropIndicator.edge === 'after' ? (
                                    <div className="absolute inset-x-4 -bottom-1 z-10 h-0.5  bg-primary/90 shadow-[0_0_18px_rgba(34,185,153,0.55)]" />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-4">
                          {isWritingMode ? (
                            <div className=" border border-brand-300/20 bg-primary/8 px-4 py-3 text-sm text-[#d7f6ec]">
                              Writing mode is on. The lesson map is hidden so the editor can use the full width.
                            </div>
                          ) : null}
                          {selectedBlock ? (
                            renderBlockEditor(selectedBlock, selectedBlockIndex)
                          ) : (
                            <div className="rounded-[26px] border border-dashed border-outline-variant/20 bg-surface-container-low px-5 py-10 text-sm text-[#9fb1aa]">
                              Select a block from the lesson map to edit it.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[26px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <Field label="Lesson blocks JSON">
                      <textarea
                        className={`${INPUT_CLASS_NAME} min-h-[480px] font-mono text-xs leading-6`}
                        value={blocksJson}
                        onChange={(event) => handleJsonChange(event.target.value)}
                        disabled={!selectedLesson}
                        spellCheck={false}
                      />
                    </Field>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Advanced mode is here for structural edits, but the visual editor is the default writing surface.
                    </p>
                    {parsedBlocksState.error ? (
                      <p className="mt-2 text-sm text-rose-200">JSON issue: {parsedBlocksState.error}</p>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <div className=" border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-7">
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#8ca79a]">Task editor</p>
                <h3
                  className="mt-3 text-[1.8rem] font-semibold tracking-tight text-on-surface sm:text-[2.15rem]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Editing mode reserved for tasks
                </h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#a8b9b2]">
                  You asked for a future filter to choose whether you are editing lessons or tasks. The selector is now in place, and this pane is the dedicated future slot for task copy, instructions, and task-level content.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className=" border border-outline-variant/20 bg-black/12 p-4">
                    <p className="text-sm font-semibold text-on-surface">What will land here</p>
                    <p className="mt-2 text-sm leading-6 text-[#9fb1aa]">
                      Task title editing, task descriptions, and task guidance in the same glass editor flow as lessons.
                    </p>
                  </div>
                  <div className=" border border-outline-variant/20 bg-black/12 p-4">
                    <p className="text-sm font-semibold text-on-surface">What still works today</p>
                    <p className="mt-2 text-sm leading-6 text-[#9fb1aa]">
                      Task assignment, ordering, status changes, and overrides are still available in the admin assignments section.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>

        <section className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(11,16,15,0.88),rgba(7,10,9,0.95))] shadow-[0_36px_90px_-56px_rgba(0,0,0,0.88)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,185,153,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_34%)]" />
          <div className="relative border-b border-outline-variant/20 px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[#7fbba7]">Preview</p>
            <h2
              className="mt-3 text-[1.9rem] font-semibold tracking-tight text-on-surface sm:text-[2.3rem]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {editTarget === 'lessons' ? 'Live lesson preview' : 'Task preview slot'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a8b9b2]">
              {editTarget === 'lessons'
                ? 'Review the lesson exactly as it will render in the learning experience before you save.'
                : 'Task preview will appear here once task editing is connected to the content model.'}
            </p>
          </div>
          <div className="relative px-5 py-5 sm:px-6">
            {editTarget !== 'lessons' ? (
              <div className=" border border-dashed border-outline-variant/20 bg-surface-container-low px-5 py-12 text-sm leading-7 text-[#9fb1aa]">
                This preview pane is reserved for future task content rendering so the lessons and tasks workflow can stay aligned.
              </div>
            ) : !previewLesson || !selectedChapter ? (
              <p className="text-sm text-on-surface-variant">Select a lesson to preview it.</p>
            ) : parsedBlocksState.error ? (
              <p className="text-sm text-rose-200">Fix the lesson JSON to preview the rendered lesson.</p>
            ) : (
              <div className=" border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <TheorySection
                  section={previewLesson}
                  lessonIndex={selectedChapter.sections.findIndex((entry) => entry.id === previewLesson.id)}
                  lessonTotal={selectedChapter.sections.length}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
