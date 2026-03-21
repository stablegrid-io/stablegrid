'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import type {
  ActivationBoardCard,
  ActivationBoardPayload,
  ActivationCatalogTaskOption,
  ActivationTaskGroup,
  ActivationTaskType
} from '@/components/home/activation-table/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_TRACK_OPTIONS_BY_SLUG: Record<string, Array<{ slug: string; label: string }>> = {
  pyspark: [
    { slug: 'full-stack', label: 'PySpark: The Full Stack' },
    { slug: 'data-engineering-track', label: 'PySpark: Data Engineering Track' }
  ],
  'pyspark-data-engineering-track': [
    { slug: 'data-engineering-track', label: 'PySpark: Data Engineering Track' }
  ],
  fabric: [{ slug: 'full-stack', label: 'Fabric: End-to-End Platform' }],
  'fabric-data-engineering-track': [
    { slug: 'data-engineering-track', label: 'Fabric: Data Engineering Track' }
  ],
  'fabric-business-intelligence-track': [
    { slug: 'business-intelligence-track', label: 'Fabric: Business Intelligence Track' }
  ],
  airflow: [{ slug: 'beginner-track', label: 'Apache Airflow: Beginner Track' }]
};

const MODAL_LABEL_CLASS =
  'font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-white/30';

const MODAL_SELECT_BTN_BASE =
  'flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-r border-[rgba(255,255,255,0.08)] last:border-r-0';
const MODAL_SELECT_BTN_ACTIVE = 'bg-[#22b99a] text-black';
const MODAL_SELECT_BTN_INACTIVE =
  'bg-transparent text-[#555] hover:text-[#aaa] hover:bg-[rgba(255,255,255,0.04)]';

const resolveCopyPreview = ({
  taskType,
  taskGroup,
  scopeType,
  requestedCount,
  trackTitle
}: {
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  scopeType: 'count' | 'all_remaining';
  requestedCount: number | null;
  trackTitle: string | null;
}) => {
  if (taskType === 'theory') {
    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle ?? 'track'} theory`,
        description: 'Continue through the next theory units in this track.'
      };
    }
    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle ?? 'track'} ${count === 1 ? 'module' : 'modules'}`,
      description: 'Continue through the next theory units in this track.'
    };
  }

  if (taskGroup === 'flashcards') {
    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle ?? 'track'} flashcards`,
        description: 'Apply your learning through guided practical work.'
      };
    }
    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle ?? 'track'} ${count === 1 ? 'flashcard' : 'flashcards'}`,
      description: 'Apply your learning through guided practical work.'
    };
  }

  if (taskGroup === 'notebooks') {
    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle ?? 'track'} notebooks`,
        description: 'Apply your learning through guided practical work.'
      };
    }
    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle ?? 'track'} ${count === 1 ? 'notebook' : 'notebooks'}`,
      description: 'Apply your learning through guided practical work.'
    };
  }

  if (scopeType === 'all_remaining') {
    return {
      title: 'Complete all remaining missions',
      description: 'Apply your learning through guided practical work.'
    };
  }
  const count = requestedCount ?? 1;
  return {
    title: `Complete ${count} ${count === 1 ? 'mission' : 'missions'}`,
    description: 'Apply your learning through guided practical work.'
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  /** null = create mode; non-null = edit mode. Parent uses key= to reset on change. */
  editingCard: ActivationBoardCard | null;
  catalog: ActivationBoardPayload['catalog'] | null;
  tracks: Array<{ slug: string; title: string }>;
  /** ID of a task currently being deleted (disables the delete button in edit mode). */
  pendingDeleteId: string | null;
  /** Error injected from the parent (e.g. delete failure while editing). */
  forceError: string | null;
  onClose: () => void;
  onBoardUpdate: (board: ActivationBoardPayload) => void;
  onRefresh: () => void;
  onRequestDelete: (card: ActivationBoardCard) => void;
}

export function CreateTaskModal({
  editingCard,
  catalog,
  tracks,
  pendingDeleteId,
  forceError,
  onClose,
  onBoardUpdate,
  onRefresh,
  onRequestDelete
}: CreateTaskModalProps) {
  // ── Form state (initialised from editingCard; key= on parent ensures reset) ──
  const [taskType, setTaskType] = useState<ActivationTaskType>(
    editingCard?.taskType ?? 'theory'
  );
  const [taskGroup, setTaskGroup] = useState<ActivationTaskGroup>(
    editingCard?.taskGroup ?? 'theory'
  );
  const [trackSlug, setTrackSlug] = useState<string>(
    editingCard?.trackSlug ?? tracks[0]?.slug ?? 'pyspark'
  );
  const [subjectTrackSlug, setSubjectTrackSlug] = useState<string>('full-stack');
  const [selectedTaskOptionId, setSelectedTaskOptionId] = useState<string>(
    editingCard?.taskType === 'task' ? (editingCard.primaryContentItemId ?? '') : ''
  );
  const [selectedTheoryModuleId, setSelectedTheoryModuleId] = useState<string>(
    editingCard?.taskType === 'theory' && editingCard.primaryContentItemId
      ? editingCard.primaryContentItemId
      : ''
  );
  const [scopeValue, setScopeValue] = useState<'1' | '2' | '3' | 'all'>(
    editingCard?.scopeType === 'all_remaining'
      ? 'all'
      : editingCard?.requestedCount === 2
        ? '2'
        : editingCard?.requestedCount === 3
          ? '3'
          : '1'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived catalog values ─────────────────────────────────────────────────
  const taskOptionsByGroup = catalog?.taskOptions ?? {
    theory: [] as ActivationCatalogTaskOption[],
    theoryCompleted: [] as ActivationCatalogTaskOption[],
    flashcards: [] as ActivationCatalogTaskOption[],
    notebooks: [] as ActivationCatalogTaskOption[],
    missions: [] as ActivationCatalogTaskOption[]
  };

  const activeTrack = tracks.find((t) => t.slug === trackSlug) ?? tracks[0] ?? null;

  const subjectTracks = useMemo(() => {
    const predefined = SUBJECT_TRACK_OPTIONS_BY_SLUG[trackSlug];
    if (predefined?.length) return predefined;
    const subjectTitle = activeTrack?.title ?? 'Track';
    return [{ slug: 'full-stack', label: `${subjectTitle}: The Full Stack` }];
  }, [activeTrack?.title, trackSlug]);

  const availableTheoryModules = taskOptionsByGroup.theory.filter(
    (opt) => opt.trackSlug === trackSlug
  );
  const completedTheoryModules = taskOptionsByGroup.theoryCompleted.filter(
    (opt) => opt.trackSlug === trackSlug
  );
  const selectedTheoryModule =
    availableTheoryModules.find((opt) => opt.id === selectedTheoryModuleId) ?? null;
  const isSpecificTheorySelection = taskType === 'theory' && selectedTheoryModuleId !== '';

  const activeTaskOptions =
    taskType === 'task'
      ? taskGroup === 'flashcards'
        ? taskOptionsByGroup.flashcards
        : taskGroup === 'notebooks'
          ? taskOptionsByGroup.notebooks
          : taskGroup === 'missions'
            ? taskOptionsByGroup.missions
            : []
      : [];
  const selectedTaskOption =
    activeTaskOptions.find((opt) => opt.id === selectedTaskOptionId) ?? null;

  const scopeType = scopeValue === 'all' ? 'all_remaining' : 'count';
  const requestedCount = scopeValue === 'all' ? null : Number(scopeValue);

  const preview = useMemo(() => {
    if (taskType === 'task') {
      if (selectedTaskOption) {
        return {
          title: `Complete ${selectedTaskOption.title}`,
          description: 'Apply your learning through guided practical work.'
        };
      }
      return {
        title: 'No available items right now',
        description: 'Complete pending or active items first, then create a new task.'
      };
    }
    if (isSpecificTheorySelection && selectedTheoryModule) {
      return {
        title: `Complete ${selectedTheoryModule.title}`,
        description: 'Continue through this theory module in your track.'
      };
    }
    return resolveCopyPreview({
      taskType,
      taskGroup,
      scopeType,
      requestedCount,
      trackTitle: taskGroup === 'missions' ? null : activeTrack?.title ?? null
    });
  }, [
    activeTrack?.title,
    isSpecificTheorySelection,
    requestedCount,
    scopeType,
    selectedTaskOption,
    selectedTheoryModule,
    taskGroup,
    taskType
  ]);

  // ── Form sync effects ──────────────────────────────────────────────────────

  useEffect(() => {
    if (taskType === 'theory') { setTaskGroup('theory'); return; }
    if (taskGroup === 'theory') setTaskGroup('flashcards');
  }, [taskGroup, taskType]);

  useEffect(() => {
    if (taskType !== 'theory' || !tracks.length) return;
    if (!tracks.some((t) => t.slug === trackSlug)) setTrackSlug(tracks[0].slug);
  }, [taskType, trackSlug, tracks]);

  useEffect(() => {
    if (taskType !== 'theory') return;
    setSelectedTheoryModuleId('');
  }, [taskType, trackSlug]);

  useEffect(() => {
    if (taskType !== 'theory' || !subjectTracks.length) return;
    if (!subjectTracks.some((t) => t.slug === subjectTrackSlug))
      setSubjectTrackSlug(subjectTracks[0].slug);
  }, [subjectTrackSlug, subjectTracks, taskType]);

  useEffect(() => {
    if (taskType !== 'task') return;
    if (!activeTaskOptions.length) { setSelectedTaskOptionId(''); return; }
    if (!activeTaskOptions.some((item) => item.id === selectedTaskOptionId))
      setSelectedTaskOptionId(activeTaskOptions[0].id);
  }, [activeTaskOptions, selectedTaskOptionId, taskType]);

  useEffect(() => {
    if (taskType !== 'theory' || !selectedTheoryModuleId) return;
    const ids = new Set(availableTheoryModules.map((m) => m.id));
    if (!ids.has(selectedTheoryModuleId)) setSelectedTheoryModuleId('');
  }, [availableTheoryModules, selectedTheoryModuleId, taskType]);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || submitting) return;
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { taskType, taskGroup };

      if (taskType === 'task') {
        if (!selectedTaskOptionId) throw new Error('Select one item to continue.');
        payload.contentItemId = selectedTaskOptionId;
        payload.scopeType = 'count';
        payload.requestedCount = 1;
      } else {
        if (selectedTheoryModuleId) {
          payload.contentItemIds = [selectedTheoryModuleId];
          payload.scopeType = 'count';
          payload.requestedCount = 1;
          payload.trackSlug = trackSlug;
        } else {
          payload.scopeType = scopeType;
          payload.trackSlug = trackSlug;
          if (scopeType === 'count') payload.requestedCount = requestedCount;
        }
      }

      const isEditing = editingCard !== null;
      const requestScope = isEditing ? 'activation_task_update' : 'activation_task_create';
      const response = await fetch(
        isEditing ? `/api/activation-tasks/${editingCard.id}` : '/api/activation-tasks',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': createPayloadRequestKey(requestScope, {
              taskId: editingCard?.id ?? null,
              ...payload
            })
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );

      const responsePayload = (await response.json()) as {
        data?: { board?: ActivationBoardPayload };
        error?: string;
        remainingCount?: number;
      };

      if (!response.ok) {
        if (response.status === 422 && typeof responsePayload.remainingCount === 'number') {
          throw new Error(
            `${responsePayload.error ?? 'Not enough eligible items.'} Remaining: ${responsePayload.remainingCount}.`
          );
        }
        throw new Error(
          responsePayload.error ??
            (isEditing ? 'Failed to edit task.' : 'Failed to create task.')
        );
      }

      if (responsePayload.data?.board) {
        onBoardUpdate(responsePayload.data.board);
      } else {
        onRefresh();
      }
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : editingCard
            ? 'Failed to edit task.'
            : 'Failed to create task.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const displayError = error ?? forceError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060809]/80 px-4 backdrop-blur-sm"
      onClick={() => { if (!submitting) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-modal-title"
        className="relative w-full max-w-[42rem] overflow-hidden rounded-[10px] border"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: '#000',
          backdropFilter: 'blur(24px)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.04) inset, 0 40px 120px -40px rgba(0,0,0,0.95)'
        }}
      >
        {/* Top accent stripe */}
        <div
          className="h-[1px] w-full"
          style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.25), transparent 60%)' }}
        />
        {/* Corner brackets */}
        <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-white/20" />
        <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-white/20" />
        <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-white/20" />
        <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-white/20" />
        {/* Tactical dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="relative max-h-[88vh] overflow-y-auto px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
                {editingCard ? '// OPS · EDIT-TASK' : '// OPS · NEW-OBJECTIVE'}
              </p>
              <h3
                id="create-modal-title"
                className="mt-2 font-mono text-[1.5rem] font-bold uppercase leading-[1.1] tracking-[0.02em] text-white"
              >
                {editingCard ? 'Update commitment' : 'New commitment'}
              </h3>
              <div className="mt-2 h-[1px] w-12 bg-white/30" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 transition-colors hover:text-white/70"
            >
              ✕ Close
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Type selector */}
            <div>
              <span className={MODAL_LABEL_CLASS}>What do you want to work on?</span>
              <div className="mt-1 flex overflow-hidden rounded-[6px] border border-[rgba(255,255,255,0.08)]">
                {(['theory', 'task'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTaskType(type)}
                    className={`${MODAL_SELECT_BTN_BASE} ${taskType === type ? MODAL_SELECT_BTN_ACTIVE : MODAL_SELECT_BTN_INACTIVE}`}
                  >
                    {type === 'theory' ? '⬡ Theory' : '⚑ Task'}
                  </button>
                ))}
              </div>
            </div>

            {/* Task group selector */}
            {taskType === 'task' ? (
              <div>
                <span className={MODAL_LABEL_CLASS}>Choose task group</span>
                <div className="mt-1 flex overflow-hidden rounded-[6px] border border-[rgba(255,255,255,0.08)]">
                  {(['flashcards', 'notebooks', 'missions'] as const).map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setTaskGroup(group)}
                      className={`${MODAL_SELECT_BTN_BASE} ${taskGroup === group ? MODAL_SELECT_BTN_ACTIVE : MODAL_SELECT_BTN_INACTIVE}`}
                    >
                      {group === 'flashcards'
                        ? '▤ Cards'
                        : group === 'notebooks'
                          ? '◫ Notebooks'
                          : '◈ Missions'}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Theory: subject + track selectors */}
            {taskType === 'theory' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={MODAL_LABEL_CLASS}>Choose subject</span>
                  <div className="relative mt-1">
                    <select
                      value={trackSlug}
                      onChange={(e) => setTrackSlug(e.target.value)}
                      className="h-10 w-full appearance-none rounded-[6px] border border-white/10 bg-white/[0.04] px-3 pr-8 font-mono text-[12px] text-white/70 outline-none transition-all focus:border-white/25 focus:bg-white/[0.06]"
                    >
                      {tracks.map((track) => (
                        <option key={track.slug} value={track.slug}>
                          {track.title}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/25">
                      ▾
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className={MODAL_LABEL_CLASS}>Choose track</span>
                  <div className="relative mt-1">
                    <select
                      value={subjectTrackSlug}
                      onChange={(e) => setSubjectTrackSlug(e.target.value)}
                      className="h-10 w-full appearance-none rounded-[6px] border border-white/10 bg-white/[0.04] px-3 pr-8 font-mono text-[12px] text-white/70 outline-none transition-all focus:border-white/25 focus:bg-white/[0.06]"
                    >
                      {subjectTracks.map((subjectTrack) => (
                        <option
                          key={`${trackSlug}-${subjectTrack.slug}`}
                          value={subjectTrack.slug}
                        >
                          {subjectTrack.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/25">
                      ▾
                    </span>
                  </div>
                </label>
              </div>
            ) : null}

            {/* Task item selector */}
            {taskType === 'task' ? (
              <label className="block">
                <span className={MODAL_LABEL_CLASS}>
                  {taskGroup === 'notebooks'
                    ? 'Choose notebook'
                    : taskGroup === 'flashcards'
                      ? 'Choose flashcard'
                      : 'Choose mission'}
                </span>
                <div className="relative mt-1">
                  <select
                    value={selectedTaskOptionId}
                    onChange={(e) => setSelectedTaskOptionId(e.target.value)}
                    className="h-10 w-full appearance-none rounded-[6px] border border-white/10 bg-white/[0.04] px-3 pr-8 font-mono text-[12px] text-white/70 outline-none transition-all focus:border-white/25 focus:bg-white/[0.06]"
                  >
                    {activeTaskOptions.length === 0 ? (
                      <option value="">No available items</option>
                    ) : (
                      activeTaskOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/25">
                    ▾
                  </span>
                </div>
              </label>
            ) : (
              <label className="block">
                <span className={MODAL_LABEL_CLASS}>Module (optional)</span>
                <div className="relative mt-1">
                  <select
                    value={selectedTheoryModuleId}
                    onChange={(e) => setSelectedTheoryModuleId(e.target.value)}
                    className="h-10 w-full appearance-none rounded-[6px] border border-white/10 bg-white/[0.04] px-3 pr-8 font-mono text-[12px] text-white/70 outline-none transition-all focus:border-white/25 focus:bg-white/[0.06]"
                  >
                    <option value="">Auto-select next module</option>
                    {availableTheoryModules.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                    {completedTheoryModules.map((option) => (
                      <option key={`done-${option.id}`} value="" disabled>
                        {option.title} (completed)
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/25">
                    ▾
                  </span>
                </div>
              </label>
            )}

            {/* Preview panel */}
            <div
              className="relative overflow-hidden rounded-[8px] border px-4 py-3"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)'
              }}
            >
              <div className="mb-3 h-[1px] w-full bg-white/10" />
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-white/30">
                Preview
              </p>
              <p className="mt-1.5 font-mono text-[13px] font-semibold text-white">
                {preview.title}
              </p>
              <p className="mt-0.5 text-[12px] text-white/40">{preview.description}</p>
            </div>

            {displayError ? (
              <p className="font-mono text-[11px] text-[#f04060]">⚠ {displayError}</p>
            ) : null}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-[rgba(255,255,255,0.05)] pt-4">
              {editingCard ? (
                <button
                  type="button"
                  onClick={() => onRequestDelete(editingCard)}
                  disabled={submitting || pendingDeleteId === editingCard.id}
                  className="mr-auto rounded-[6px] border border-[rgba(240,64,96,0.25)] bg-[rgba(240,64,96,0.06)] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#f04060]/70 transition-colors hover:border-[rgba(240,64,96,0.4)] hover:text-[#f04060] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-[6px] border border-white/10 bg-white/[0.03] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || (taskType === 'task' && !selectedTaskOptionId)}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-[6px] border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  borderColor: 'rgba(34,185,154,0.5)',
                  background:
                    'linear-gradient(135deg, rgba(34,185,154,0.9), rgba(34,185,154,0.7))',
                  color: '#060809',
                  boxShadow: '0 0 20px rgba(34,185,154,0.2)'
                }}
              >
                <span className="relative z-10">
                  {submitting
                    ? editingCard
                      ? 'Saving...'
                      : 'Creating...'
                    : editingCard
                      ? 'Save task'
                      : '[ + Commit ]'}
                </span>
                {!submitting && <ArrowRight className="relative z-10 h-3 w-3" />}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(34,185,154,1), rgba(34,185,154,0.85))'
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
