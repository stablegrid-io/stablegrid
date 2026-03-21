'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminLeftRail,
  ADMIN_SECTIONS,
  type AdminNavSectionId
} from '@/components/admin/AdminLeftRail';
import { AdminAnalyticsSection } from '@/components/admin/AdminAnalyticsSection';
import { TheoryLessonsSection } from '@/components/admin/TheoryLessonsSection';
import {
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  AdminInlineMessage,
  AdminSurface
} from '@/components/admin/theme';
import type {
  ActivationBoardCard,
  ActivationBoardData,
  ActivationCatalogTaskOption,
  ActivationTaskGroup,
  ActivationTaskStatus
} from '@/lib/activation/service';
import type {
  AdminActivationBoardResponse,
  AdminAuditEntry,
  AdminCatalogData,
  AdminContentItemRecord,
  AdminRole,
  AdminTrackRecord,
  AdminUserSearchResult
} from '@/lib/admin/types';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';

const CONTENT_TYPE_LABELS = {
  theory_module: 'Theory',
  flashcard: 'Flashcards',
  notebook: 'Notebooks',
  mission: 'Missions'
} as const;

const TASK_GROUP_LABELS: Record<ActivationTaskGroup, string> = {
  theory: 'Theory',
  flashcards: 'Flashcards',
  notebooks: 'Notebooks',
  missions: 'Missions'
};

const STATUS_LABELS: Record<ActivationTaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed'
};

type AdminSectionId = Exclude<AdminNavSectionId, 'customers' | 'financials' | 'bugs' | 'orders'>;
type ActiveFilter = 'all' | 'active' | 'inactive';
type ContentTypeFilter = 'all' | keyof typeof CONTENT_TYPE_LABELS;
type SelectionMode = 'auto' | 'specific';

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

interface ContentFormState {
  id: string | null;
  trackId: string;
  contentType: keyof typeof CONTENT_TYPE_LABELS;
  sourceRef: string;
  title: string;
  sequenceOrder: number;
  isActive: boolean;
}

interface TaskFormState {
  taskGroup: ActivationTaskGroup;
  trackSlug: string;
  scopeType: 'count' | 'all_remaining';
  requestedCount: number;
  selectionMode: SelectionMode;
  contentItemId: string;
  title: string;
  description: string;
}

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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

const toTitleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

const getDefaultTrackId = (
  tracks: AdminTrackRecord[],
  contentType: keyof typeof CONTENT_TYPE_LABELS
) => {
  if (contentType === 'mission') {
    return tracks.find((track) => track.slug === 'global')?.id ?? tracks[0]?.id ?? '';
  }

  return (
    tracks.find((track) => track.slug === 'pyspark')?.id ??
    tracks.find((track) => track.slug === 'fabric')?.id ??
    tracks[0]?.id ??
    ''
  );
};

const createEmptyContentForm = (tracks: AdminTrackRecord[]): ContentFormState => ({
  id: null,
  trackId: getDefaultTrackId(tracks, 'theory_module'),
  contentType: 'theory_module',
  sourceRef: '',
  title: '',
  sequenceOrder: 1,
  isActive: true
});

const createEmptyTaskForm = (board: ActivationBoardData | null): TaskFormState => ({
  taskGroup: 'theory',
  trackSlug: board?.catalog.tracks[0]?.slug ?? 'pyspark',
  scopeType: 'count',
  requestedCount: 1,
  selectionMode: 'auto',
  contentItemId: '',
  title: '',
  description: ''
});

const getOptionsForTaskGroup = (
  board: ActivationBoardData | null,
  taskGroup: ActivationTaskGroup
): ActivationCatalogTaskOption[] => {
  if (!board?.catalog.taskOptions) {
    return [];
  }

  if (taskGroup === 'theory') {
    return board.catalog.taskOptions.theory ?? [];
  }

  return board.catalog.taskOptions[taskGroup] ?? [];
};

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const Surface = AdminSurface;

const SectionHeading = ({
  eyebrow,
  title,
  body,
  action
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-4 border-b border-outline-variant/20 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
    <div>
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#7fbba7]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-on-surface sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9fb1aa]">{body}</p>
    </div>
    {action}
  </div>
);

const InlineMessage = AdminInlineMessage;

const SmallBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center  border border-outline-variant/20 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#9db6aa]">
    {children}
  </span>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-[#8ca79a]">
    {children}
  </label>
);

const InputClassName =
  'mt-2 w-full rounded-[16px] border border-outline-variant/20 bg-white/[0.04] px-4 py-3 text-sm text-on-surface outline-none transition focus:border-brand-400/40 focus:bg-surface-container-high focus:ring-2 focus:ring-brand-500/15';

function TrackEditorCard({
  track,
  onSaved,
  onMutation
}: {
  track: AdminTrackRecord;
  onSaved: () => Promise<void>;
  onMutation: (message: string) => void;
}) {
  const [title, setTitle] = useState(track.title);
  const [isActive, setIsActive] = useState(track.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(track.title);
    setIsActive(track.isActive);
  }, [track.id, track.isActive, track.title]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const requestBody = { title, isActive };
      await requestJson<AdminTrackRecord>(`/api/admin/tracks/${track.id}`, {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey('admin_track_update', {
            trackId: track.id,
            ...requestBody
          })
        },
        body: JSON.stringify(requestBody)
      });
      await onSaved();
      onMutation(`Track updated: ${title}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save track.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className=" border border-outline-variant/20 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-on-surface">{track.slug}</p>
          <p className="mt-1 text-xs text-[#8fa69b]">Track metadata and assignment visibility</p>
        </div>
        <span
          className={` px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] ${
            isActive
              ? 'bg-brand-500/18 text-primary'
              : 'bg-white/[0.08] text-[#98a7a1]'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <FieldLabel>Title</FieldLabel>
          <input
            className={InputClassName}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsActive((current) => !current)}
          className="rounded-[16px] border border-outline-variant/20 bg-white/[0.04] px-4 py-3 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-surface-container-high"
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-[16px] border border-brand-300/45 bg-brand-500/85 px-4 py-3 text-sm font-semibold text-[#06110d] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}

function CatalogSection({ onMutation }: { onMutation: (message: string) => void }) {
  const [catalog, setCatalog] = useState<AdminCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [formState, setFormState] = useState<ContentFormState>(() => createEmptyContentForm([]));
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDeleteToggleId, setPendingDeleteToggleId] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson<AdminCatalogData>('/api/admin/catalog');
      setCatalog(data);
      setFormState((current) => {
        if (current.trackId) {
          return current;
        }
        return createEmptyContentForm(data.tracks);
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return catalog.contentItems.filter((item) => {
      if (trackFilter !== 'all' && item.trackId !== trackFilter) {
        return false;
      }
      if (contentTypeFilter !== 'all' && item.contentType !== contentTypeFilter) {
        return false;
      }
      if (activeFilter === 'active' && !item.isActive) {
        return false;
      }
      if (activeFilter === 'inactive' && item.isActive) {
        return false;
      }
      return true;
    });
  }, [activeFilter, catalog, contentTypeFilter, trackFilter]);

  const compatibleTracks = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return catalog.tracks.filter((track) => {
      if (formState.contentType === 'mission') {
        return track.slug === 'global';
      }
      return track.slug === 'pyspark' || track.slug === 'fabric';
    });
  }, [catalog, formState.contentType]);

  useEffect(() => {
    if (!catalog || compatibleTracks.length === 0) {
      return;
    }

    if (compatibleTracks.some((track) => track.id === formState.trackId)) {
      return;
    }

    setFormState((current) => ({
      ...current,
      trackId: compatibleTracks[0]?.id ?? current.trackId
    }));
  }, [catalog, compatibleTracks, formState.trackId]);

  const resetForm = () => {
    setFormState(createEmptyContentForm(catalog?.tracks ?? []));
    setFormError(null);
    setPendingDeleteToggleId(null);
  };

  const handleEdit = (item: AdminContentItemRecord) => {
    setFormState({
      id: item.id,
      trackId: item.trackId ?? getDefaultTrackId(catalog?.tracks ?? [], item.contentType),
      contentType: item.contentType,
      sourceRef: item.sourceRef,
      title: item.title,
      sequenceOrder: item.sequenceOrder,
      isActive: item.isActive
    });
    setFormError(null);
    setPendingDeleteToggleId(null);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSaving(true);
    setFormError(null);

    try {
      const method = formState.id ? 'PATCH' : 'POST';
      const requestBody = {
        id: formState.id,
        trackId: formState.trackId,
        contentType: formState.contentType,
        sourceRef: formState.sourceRef,
        title: formState.title,
        sequenceOrder: Number(formState.sequenceOrder),
        isActive: formState.isActive
      };
      await requestJson<AdminContentItemRecord>('/api/admin/content-items', {
        method,
        headers: {
          'Idempotency-Key': createPayloadRequestKey(
            formState.id ? 'admin_content_item_update' : 'admin_content_item_create',
            requestBody
          )
        },
        body: JSON.stringify(requestBody)
      });
      await loadCatalog();
      onMutation(
        formState.id ? `Content item updated: ${formState.title}` : `Content item created: ${formState.title}`
      );
      resetForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to save content item.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleQuickToggle = async (item: AdminContentItemRecord) => {
    try {
      const requestBody = {
        id: item.id,
        trackId: item.trackId,
        contentType: item.contentType,
        sourceRef: item.sourceRef,
        title: item.title,
        sequenceOrder: item.sequenceOrder,
        isActive: !item.isActive
      };
      await requestJson<AdminContentItemRecord>('/api/admin/content-items', {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey(
            'admin_content_item_update',
            requestBody
          )
        },
        body: JSON.stringify(requestBody)
      });
      await loadCatalog();
      onMutation(`${item.title} ${item.isActive ? 'deactivated' : 'activated'}`);
      setPendingDeleteToggleId(null);
    } catch (toggleError) {
      setFormError(toggleError instanceof Error ? toggleError.message : 'Failed to update item.');
    }
  };

  const handleReorder = async (
    item: AdminContentItemRecord,
    direction: 'up' | 'down'
  ) => {
    if (!catalog || !item.trackId) {
      return;
    }

    const groupItems = catalog.contentItems
      .filter(
        (candidate) =>
          candidate.trackId === item.trackId && candidate.contentType === item.contentType
      )
      .sort((left, right) => left.sequenceOrder - right.sequenceOrder);

    const currentIndex = groupItems.findIndex((candidate) => candidate.id === item.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= groupItems.length) {
      return;
    }

    const reordered = moveItem(groupItems, currentIndex, targetIndex).map((candidate) => candidate.id);

    try {
      const requestBody = {
        trackId: item.trackId,
        contentType: item.contentType,
        orderedItemIds: reordered
      };
      await requestJson<AdminContentItemRecord[]>('/api/admin/content-items/reorder', {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': createPayloadRequestKey(
            'admin_content_item_reorder',
            requestBody
          )
        },
        body: JSON.stringify(requestBody)
      });
      await loadCatalog();
      onMutation(`Reordered ${CONTENT_TYPE_LABELS[item.contentType]} catalog`);
    } catch (reorderError) {
      setFormError(reorderError instanceof Error ? reorderError.message : 'Failed to reorder items.');
    }
  };

  const totalItems = catalog?.contentItems.length ?? 0;
  const activeItems = catalog?.contentItems.filter((item) => item.isActive).length ?? 0;
  const inactiveItems = totalItems - activeItems;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
      <Surface>
        <SectionHeading
          eyebrow="Catalog"
          title="Activation catalog"
          body="Use the same source tables the live activation system reads from. Track changes here affect future assignments without rewriting lesson content itself."
          action={
            <button
              type="button"
              onClick={resetForm}
              className=" border border-outline-variant/20 bg-white/[0.05] px-4 py-2 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.08]"
            >
              New item
            </button>
          }
        />
        <div className="px-5 py-5 sm:px-6">
          {error ? <InlineMessage tone="error" message={error} /> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-outline-variant/20 bg-white/[0.04] p-4">
              <p className="text-sm text-[#8fa69b]">Total content items</p>
              <p className="mt-3 text-3xl font-semibold text-on-surface">{totalItems}</p>
            </div>
            <div className="rounded-[20px] border border-outline-variant/20 bg-white/[0.04] p-4">
              <p className="text-sm text-[#8fa69b]">Active in rotation</p>
              <p className="mt-3 text-3xl font-semibold text-on-surface">{activeItems}</p>
            </div>
            <div className="rounded-[20px] border border-outline-variant/20 bg-white/[0.04] p-4">
              <p className="text-sm text-[#8fa69b]">Hidden from future picks</p>
              <p className="mt-3 text-3xl font-semibold text-on-surface">{inactiveItems}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div>
              <FieldLabel>Track filter</FieldLabel>
              <select
                className={InputClassName}
                value={trackFilter}
                onChange={(event) => setTrackFilter(event.target.value)}
              >
                <option value="all">All tracks</option>
                {(catalog?.tracks ?? []).map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Type filter</FieldLabel>
              <select
                className={InputClassName}
                value={contentTypeFilter}
                onChange={(event) =>
                  setContentTypeFilter(event.target.value as ContentTypeFilter)
                }
              >
                <option value="all">All content types</option>
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Visibility</FieldLabel>
              <select
                className={InputClassName}
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
              >
                <option value="all">Active and inactive</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-outline-variant/20 bg-[#07100f]/65">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-surface-container-low text-[#8ca79a]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Track</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-[#dde7e2]">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-6 text-[#8fa69b]" colSpan={6}>
                        Loading catalog...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-[#8fa69b]" colSpan={6}>
                        No content items match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-medium text-on-surface">{item.title}</p>
                          <p className="mt-1 text-xs text-[#8fa69b]">{item.sourceRef}</p>
                        </td>
                        <td className="px-4 py-4 align-top">{CONTENT_TYPE_LABELS[item.contentType]}</td>
                        <td className="px-4 py-4 align-top">{item.trackTitle ?? 'Unassigned'}</td>
                        <td className="px-4 py-4 align-top">#{item.sequenceOrder}</td>
                        <td className="px-4 py-4 align-top">
                          <span
                            className={` px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] ${
                              item.isActive
                                ? 'bg-brand-500/18 text-primary'
                                : 'bg-white/[0.08] text-[#98a7a1]'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleReorder(item, 'up')}
                              className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05]"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(item, 'down')}
                              className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05]"
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05]"
                            >
                              Edit
                            </button>
                            {pendingDeleteToggleId === item.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleQuickToggle(item)}
                                  className=" border border-rose-300/35 bg-rose-500/12 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/18"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteToggleId(null)}
                                  className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:bg-white/[0.05]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteToggleId(item.id)}
                                className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-rose-300/30 hover:bg-rose-500/10"
                              >
                                {item.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Surface>

      <div className="space-y-6">
        <Surface>
          <SectionHeading
            eyebrow="Tracks"
            title="Track controls"
            body="Track metadata stays lightweight here. Keep the learning tracks and the global mission bucket aligned with what operations needs live."
          />
          <div className="space-y-4 px-5 py-5 sm:px-6">
            {(catalog?.tracks ?? []).map((track) => (
              <TrackEditorCard
                key={track.id}
                track={track}
                onSaved={loadCatalog}
                onMutation={onMutation}
              />
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionHeading
            eyebrow="Editor"
            title={formState.id ? 'Edit content item' : 'Create content item'}
            body="This writes directly to the activation catalog. Sequence collisions are blocked so the task picker stays deterministic."
          />
          <form className="space-y-4 px-5 py-5 sm:px-6" onSubmit={handleFormSubmit}>
            {formError ? <InlineMessage tone="error" message={formError} /> : null}
            <div>
              <FieldLabel>Content type</FieldLabel>
              <select
                className={InputClassName}
                value={formState.contentType}
                onChange={(event) => {
                  const nextType = event.target.value as keyof typeof CONTENT_TYPE_LABELS;
                  setFormState((current) => ({
                    ...current,
                    contentType: nextType,
                    trackId: getDefaultTrackId(catalog?.tracks ?? [], nextType)
                  }));
                }}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Track</FieldLabel>
              <select
                className={InputClassName}
                value={formState.trackId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, trackId: event.target.value }))
                }
              >
                {compatibleTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Source ref</FieldLabel>
              <input
                className={InputClassName}
                value={formState.sourceRef}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, sourceRef: event.target.value }))
                }
                placeholder="module-21 or fabric-m01-001"
              />
            </div>

            <div>
              <FieldLabel>Title</FieldLabel>
              <input
                className={InputClassName}
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Human-facing title"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <FieldLabel>Sequence order</FieldLabel>
                <input
                  className={InputClassName}
                  min={1}
                  type="number"
                  value={formState.sequenceOrder}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      sequenceOrder: Number(event.target.value)
                    }))
                  }
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormState((current) => ({ ...current, isActive: !current.isActive }))
                }
                className="rounded-[16px] border border-outline-variant/20 bg-white/[0.04] px-4 py-3 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-surface-container-high"
              >
                {formState.isActive ? 'Visible in picker' : 'Hidden from picker'}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={formSaving}
                className="rounded-[16px] border border-brand-300/45 bg-brand-500/85 px-5 py-3 text-sm font-semibold text-[#06110d] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formSaving ? 'Saving...' : formState.id ? 'Save changes' : 'Create item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-[16px] border border-outline-variant/20 bg-white/[0.04] px-5 py-3 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-surface-container-high"
              >
                Reset
              </button>
            </div>
          </form>
        </Surface>
      </div>
    </div>
  );
}

function AssignmentsSection({ onMutation }: { onMutation: (message: string) => void }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserSearchResult | null>(null);
  const [boardData, setBoardData] = useState<AdminActivationBoardResponse | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(() => createEmptyTaskForm(null));
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  const loadBoard = useCallback(async (userId: string) => {
    setBoardLoading(true);
    setBoardError(null);
    try {
      const data = await requestJson<AdminActivationBoardResponse>(
        `/api/admin/users/${userId}/activation-board`
      );
      setBoardData(data);
      setSelectedUser(data.user);
      setTaskForm((current) => ({
        ...current,
        trackSlug: data.board.catalog.tracks[0]?.slug ?? current.trackSlug
      }));
    } catch (loadError) {
      setBoardError(
        loadError instanceof Error ? loadError.message : 'Failed to load activation board.'
      );
    } finally {
      setBoardLoading(false);
    }
  }, []);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchLoading(true);
    setSearchError(null);

    try {
      const data = await requestJson<AdminUserSearchResult[]>(
        `/api/admin/users/search?q=${encodeURIComponent(query)}`
      );
      setSearchResults(data);
    } catch (searchRequestError) {
      setSearchError(
        searchRequestError instanceof Error
          ? searchRequestError.message
          : 'Failed to search users.'
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const resetTaskForm = useCallback(() => {
    setTaskForm(createEmptyTaskForm(boardData?.board ?? null));
    setEditingTaskId(null);
    setTaskFormError(null);
  }, [boardData]);

  const availableSpecificOptions = useMemo(() => {
    const options = getOptionsForTaskGroup(boardData?.board ?? null, taskForm.taskGroup);
    if (taskForm.taskGroup === 'missions') {
      return options;
    }

    return options.filter((option) => option.trackSlug === taskForm.trackSlug);
  }, [boardData, taskForm.taskGroup, taskForm.trackSlug]);

  useEffect(() => {
    if (taskForm.selectionMode !== 'specific') {
      return;
    }

    if (availableSpecificOptions.some((option) => option.id === taskForm.contentItemId)) {
      return;
    }

    setTaskForm((current) => ({
      ...current,
      contentItemId: availableSpecificOptions[0]?.id ?? ''
    }));
  }, [availableSpecificOptions, taskForm.contentItemId, taskForm.selectionMode]);

  const submitTaskForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      setTaskFormError('Select a user before creating a task.');
      return;
    }

    setTaskSaving(true);
    setTaskFormError(null);

    try {
      const payload = {
        taskType: taskForm.taskGroup === 'theory' ? 'theory' : 'task',
        taskGroup: taskForm.taskGroup,
        trackSlug: taskForm.taskGroup === 'missions' ? undefined : taskForm.trackSlug,
        scopeType: taskForm.selectionMode === 'specific' ? 'count' : taskForm.scopeType,
        requestedCount:
          taskForm.selectionMode === 'specific'
            ? 1
            : taskForm.scopeType === 'count'
              ? taskForm.requestedCount
              : undefined,
        contentItemId:
          taskForm.selectionMode === 'specific' ? taskForm.contentItemId : undefined,
        title: taskForm.title.trim() || undefined,
        description: taskForm.description.trim() || undefined
      };

      const endpoint = editingTaskId
        ? `/api/admin/users/${selectedUser.id}/activation-tasks/${editingTaskId}`
        : `/api/admin/users/${selectedUser.id}/activation-tasks`;
      const method = editingTaskId ? 'PATCH' : 'POST';
      const data = await requestJson<{ task: ActivationBoardCard | null; board: ActivationBoardData }>(
        endpoint,
        {
          method,
          headers: {
            'Idempotency-Key': createPayloadRequestKey(
              editingTaskId ? 'admin_activation_task_update' : 'admin_activation_task_create',
              {
                userId: selectedUser.id,
                taskId: editingTaskId,
                ...payload
              }
            )
          },
          body: JSON.stringify(payload)
        }
      );

      setBoardData((current) =>
        current
          ? {
              ...current,
              board: data.board
            }
          : null
      );
      onMutation(
        editingTaskId ? 'Activation task updated for selected user.' : 'Activation task created for selected user.'
      );
      resetTaskForm();
    } catch (saveError) {
      setTaskFormError(saveError instanceof Error ? saveError.message : 'Failed to save task.');
    } finally {
      setTaskSaving(false);
    }
  };

  const startEditingTask = (task: ActivationBoardCard) => {
    setEditingTaskId(task.id);
    setTaskForm({
      taskGroup: task.taskGroup,
      trackSlug: task.trackSlug ?? boardData?.board.catalog.tracks[0]?.slug ?? 'pyspark',
      scopeType: task.scopeType,
      requestedCount: task.requestedCount ?? 1,
      selectionMode: task.primaryContentItemId ? 'specific' : 'auto',
      contentItemId: task.primaryContentItemId ?? '',
      title: task.title,
      description: task.description
    });
    setTaskFormError(null);
    setPendingDeleteTaskId(null);
  };

  const handleTaskAction = async (
    taskId: string,
    action: 'start' | 'move_to_todo' | 'move_to_completed'
  ) => {
    if (!selectedUser) {
      return;
    }

    setBusyActionKey(`${taskId}:${action}`);
    setTaskFormError(null);

    try {
      const requestBody = { action };
      const data = await requestJson<{ task: ActivationBoardCard | null; board: ActivationBoardData }>(
        `/api/admin/users/${selectedUser.id}/activation-tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            'Idempotency-Key': createPayloadRequestKey(
              'admin_activation_task_update',
              {
                userId: selectedUser.id,
                taskId,
                ...requestBody
              }
            )
          },
          body: JSON.stringify(requestBody)
        }
      );
      setBoardData((current) =>
        current
          ? {
              ...current,
              board: data.board
            }
          : null
      );
      onMutation(`Activation task updated: ${action.replace(/_/g, ' ')}`);
    } catch (actionError) {
      setTaskFormError(
        actionError instanceof Error ? actionError.message : 'Failed to update task status.'
      );
    } finally {
      setBusyActionKey(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedUser) {
      return;
    }

    setBusyActionKey(`${taskId}:delete`);
    setTaskFormError(null);

    try {
      const data = await requestJson<{ board: ActivationBoardData }>(
        `/api/admin/users/${selectedUser.id}/activation-tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: {
            'Idempotency-Key': createPayloadRequestKey(
              'admin_activation_task_delete',
              {
                userId: selectedUser.id,
                taskId,
                action: 'delete'
              }
            )
          }
        }
      );
      setBoardData((current) =>
        current
          ? {
              ...current,
              board: data.board
            }
          : null
      );
      setPendingDeleteTaskId(null);
      onMutation('Activation task deleted for selected user.');
      if (editingTaskId === taskId) {
        resetTaskForm();
      }
    } catch (deleteError) {
      setTaskFormError(deleteError instanceof Error ? deleteError.message : 'Failed to delete task.');
    } finally {
      setBusyActionKey(null);
    }
  };

  const handleColumnReorder = async (
    status: ActivationTaskStatus,
    taskId: string,
    direction: 'up' | 'down'
  ) => {
    if (!selectedUser || !boardData) {
      return;
    }

    const column =
      status === 'todo'
        ? boardData.board.todo
        : status === 'in_progress'
          ? boardData.board.inProgress
          : boardData.board.completed;

    const currentIndex = column.findIndex((task) => task.id === taskId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= column.length) {
      return;
    }

    const orderedTaskIds = moveItem(
      column.map((task) => task.id),
      currentIndex,
      nextIndex
    );

    setBusyActionKey(`${taskId}:reorder:${direction}`);
    try {
      const requestBody = {
        status,
        orderedTaskIds
      };
      const data = await requestJson<{ board: ActivationBoardData }>(
        `/api/admin/users/${selectedUser.id}/activation-tasks/reorder`,
        {
          method: 'PATCH',
          headers: {
            'Idempotency-Key': createPayloadRequestKey(
              'admin_activation_task_reorder',
              {
                userId: selectedUser.id,
                ...requestBody
              }
            )
          },
          body: JSON.stringify(requestBody)
        }
      );
      setBoardData((current) =>
        current
          ? {
              ...current,
              board: data.board
            }
          : null
      );
      onMutation(`Reordered ${STATUS_LABELS[status]} column for selected user.`);
    } catch (reorderError) {
      setTaskFormError(
        reorderError instanceof Error ? reorderError.message : 'Failed to reorder tasks.'
      );
    } finally {
      setBusyActionKey(null);
    }
  };

  const columns: Array<{
    id: ActivationTaskStatus;
    title: string;
    tasks: ActivationBoardCard[];
  }> = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: boardData?.board.todo ?? []
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: boardData?.board.inProgress ?? []
    },
    {
      id: 'completed',
      title: 'Completed',
      tasks: boardData?.board.completed ?? []
    }
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <Surface>
          <SectionHeading
            eyebrow="Assignments"
            title="Target any user"
            body="Search profiles by name or email, then operate on the same activation model the member sees on their homepage."
          />
          <div className="space-y-4 px-5 py-5 sm:px-6">
            {searchError ? <InlineMessage tone="error" message={searchError} /> : null}
            <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
              <input
                className={InputClassName}
                placeholder="Search by name or email"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="rounded-[16px] border border-brand-300/45 bg-brand-500/85 px-5 py-3 text-sm font-semibold text-[#06110d] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <p className="text-sm text-[#8fa69b]">Enter at least two characters to search profiles.</p>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => void loadBoard(result.id)}
                    className={`w-full  border px-4 py-3 text-left transition ${
                      selectedUser?.id === result.id
                        ? 'border-primary/30 bg-brand-500/10'
                        : 'border-outline-variant/20 bg-white/[0.04] hover:border-primary/20 hover:bg-surface-container-high'
                    }`}
                  >
                    <p className="font-medium text-on-surface">{result.name ?? 'Unnamed user'}</p>
                    <p className="mt-1 text-sm text-[#8fa69b]">{result.email ?? 'No email on profile'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </Surface>

        <Surface>
          <SectionHeading
            eyebrow="Task Editor"
            title={editingTaskId ? 'Edit activation task' : 'Create activation task'}
            body="This uses the same backend rules as the live board. You can assign by smart pick or pin a specific eligible item."
          />
          <form className="space-y-4 px-5 py-5 sm:px-6" onSubmit={submitTaskForm}>
            {taskFormError ? <InlineMessage tone="error" message={taskFormError} /> : null}
            {!selectedUser ? (
              <p className=" border border-outline-variant/20 bg-white/[0.04] px-4 py-4 text-sm text-[#8fa69b]">
                Pick a user first, then this form will target their activation board.
              </p>
            ) : null}
            <div>
              <FieldLabel>Task group</FieldLabel>
              <select
                className={InputClassName}
                value={taskForm.taskGroup}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    taskGroup: event.target.value as ActivationTaskGroup,
                    selectionMode: 'auto',
                    contentItemId: ''
                  }))
                }
                disabled={!selectedUser}
              >
                {Object.entries(TASK_GROUP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {taskForm.taskGroup !== 'missions' ? (
              <div>
                <FieldLabel>Track</FieldLabel>
                <select
                  className={InputClassName}
                  value={taskForm.trackSlug}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      trackSlug: event.target.value,
                      contentItemId: ''
                    }))
                  }
                  disabled={!selectedUser}
                >
                  {(boardData?.board.catalog.tracks ?? []).map((track) => (
                    <option key={track.slug} value={track.slug}>
                      {track.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <FieldLabel>Selection</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-3">
                {(['auto', 'specific'] as SelectionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setTaskForm((current) => ({
                        ...current,
                        selectionMode: mode,
                        contentItemId:
                          mode === 'specific'
                            ? availableSpecificOptions[0]?.id ?? ''
                            : ''
                      }))
                    }
                    disabled={!selectedUser}
                    className={` border px-4 py-2 text-sm font-medium transition ${
                      taskForm.selectionMode === mode
                        ? 'border-primary/30 bg-primary/12 text-primary'
                        : 'border-outline-variant/20 bg-white/[0.04] text-on-surface hover:border-primary/20 hover:bg-surface-container-high'
                    }`}
                  >
                    {mode === 'auto' ? 'Smart pick' : 'Specific item'}
                  </button>
                ))}
              </div>
            </div>

            {taskForm.selectionMode === 'specific' ? (
              <div>
                <FieldLabel>Eligible item</FieldLabel>
                <select
                  className={InputClassName}
                  value={taskForm.contentItemId}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      contentItemId: event.target.value
                    }))
                  }
                  disabled={!selectedUser || availableSpecificOptions.length === 0}
                >
                  {availableSpecificOptions.length === 0 ? (
                    <option value="">No eligible items available</option>
                  ) : (
                    availableSpecificOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Scope</FieldLabel>
                  <select
                    className={InputClassName}
                    value={taskForm.scopeType}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        scopeType: event.target.value as 'count' | 'all_remaining'
                      }))
                    }
                    disabled={!selectedUser}
                  >
                    <option value="count">Fixed count</option>
                    <option value="all_remaining">All remaining</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Requested count</FieldLabel>
                  <input
                    className={InputClassName}
                    disabled={!selectedUser || taskForm.scopeType !== 'count'}
                    max={3}
                    min={1}
                    type="number"
                    value={taskForm.requestedCount}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        requestedCount: Math.min(3, Math.max(1, Number(event.target.value)))
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className=" border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="mb-4">
                <p className="text-sm font-semibold text-on-surface">Task copy</p>
                <p className="mt-1 text-xs leading-5 text-[#8fa69b]">
                  Leave these blank to keep the smart-generated copy, or write custom copy when this task needs a clearer instruction.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <FieldLabel>Title override</FieldLabel>
                  <input
                    className={InputClassName}
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: event.target.value
                      }))
                    }
                    disabled={!selectedUser}
                    placeholder="Optional custom title"
                  />
                </div>
                <div>
                  <FieldLabel>Description override</FieldLabel>
                  <textarea
                    className={`${InputClassName} min-h-[8.5rem] resize-y`}
                    value={taskForm.description}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                    disabled={!selectedUser}
                    placeholder="Optional custom description"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={!selectedUser || taskSaving}
                className="rounded-[16px] border border-brand-300/45 bg-brand-500/85 px-5 py-3 text-sm font-semibold text-[#06110d] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {taskSaving ? 'Saving...' : editingTaskId ? 'Save task' : 'Create task'}
              </button>
              <button
                type="button"
                onClick={resetTaskForm}
                className="rounded-[16px] border border-outline-variant/20 bg-white/[0.04] px-5 py-3 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-surface-container-high"
              >
                Reset
              </button>
            </div>
          </form>
        </Surface>
      </div>

      <Surface>
        <SectionHeading
          eyebrow="Board"
          title={selectedUser ? selectedUser.name ?? selectedUser.email ?? 'Selected user' : 'Activation board'}
          body={
            selectedUser
              ? `${selectedUser.email ?? 'No email on file'} · Use the same three-column board model as the member experience, with explicit overrides and audit logging.`
              : 'Choose a user from the search results to load their live activation board.'
          }
          action={
            selectedUser ? (
              <button
                type="button"
                onClick={() => void loadBoard(selectedUser.id)}
                className=" border border-outline-variant/20 bg-white/[0.05] px-4 py-2 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.08]"
              >
                Refresh board
              </button>
            ) : null
          }
        />
        <div className="px-5 py-5 sm:px-6">
          {boardError ? <InlineMessage tone="error" message={boardError} /> : null}
          {boardLoading ? (
            <p className="text-sm text-[#8fa69b]">Loading activation board...</p>
          ) : !selectedUser || !boardData ? (
            <p className="rounded-[20px] border border-outline-variant/20 bg-white/[0.04] px-4 py-4 text-sm text-[#8fa69b]">
              No user selected yet.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="rounded-[24px] border border-outline-variant/20 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9eb7ab]">
                      {column.title}
                    </h3>
                    <SmallBadge>{column.tasks.length}</SmallBadge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {column.tasks.length === 0 ? (
                      <div className=" border border-dashed border-outline-variant/20 bg-black/10 px-4 py-6 text-sm text-[#7f9690]">
                        No tasks in this column.
                      </div>
                    ) : (
                      column.tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="rounded-[20px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-on-surface">{task.title}</p>
                              <p className="mt-1 text-sm leading-6 text-[#8fa69b]">{task.description}</p>
                            </div>
                            <SmallBadge>{TASK_GROUP_LABELS[task.taskGroup]}</SmallBadge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#94aba1]">
                            {task.trackTitle ? <span>{task.trackTitle}</span> : null}
                            <span>
                              {task.progress.completed}/{task.progress.total} linked items
                            </span>
                            <span>{STATUS_LABELS[task.status]}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleColumnReorder(column.id, task.id, 'up')}
                              disabled={index === 0 || busyActionKey !== null}
                              className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleColumnReorder(column.id, task.id, 'down')}
                              disabled={index === column.tasks.length - 1 || busyActionKey !== null}
                              className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Down
                            </button>
                            {task.status === 'todo' ? (
                              <button
                                type="button"
                                onClick={() => void handleTaskAction(task.id, 'start')}
                                disabled={busyActionKey !== null}
                                className=" border border-brand-300/35 bg-brand-500/14 px-3 py-2 text-xs font-medium text-[#d7f6ec] transition hover:bg-brand-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {busyActionKey === `${task.id}:start` ? 'Starting...' : 'Start'}
                              </button>
                            ) : null}
                            {task.status === 'in_progress' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleTaskAction(task.id, 'move_to_todo')}
                                  disabled={busyActionKey !== null}
                                  className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Back to To Do
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleTaskAction(task.id, 'move_to_completed')}
                                  disabled={busyActionKey !== null}
                                  className=" border border-brand-300/35 bg-brand-500/14 px-3 py-2 text-xs font-medium text-[#d7f6ec] transition hover:bg-brand-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Complete
                                </button>
                              </>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEditingTask(task)}
                              className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.05]"
                            >
                              Edit
                            </button>
                            {pendingDeleteTaskId === task.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteTask(task.id)}
                                  disabled={busyActionKey !== null}
                                  className=" border border-rose-300/35 bg-rose-500/12 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Confirm delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteTaskId(null)}
                                  className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:bg-white/[0.05]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteTaskId(task.id)}
                                className=" border border-outline-variant/20 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-rose-300/30 hover:bg-rose-500/10"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

function AuditSection({
  refreshKey,
  onMutation
}: {
  refreshKey: number;
  onMutation: (message: string) => void;
}) {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson<AdminAuditEntry[]>('/api/admin/audit?limit=50');
      setEntries(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load audit log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit, refreshKey]);

  return (
    <Surface>
      <SectionHeading
        eyebrow="Audit"
        title="Mutation history"
        body="Every write action from the admin console lands here with actor, target, and state snapshots."
        action={
          <button
            type="button"
            onClick={() => {
              void loadAudit();
              onMutation('Audit log refreshed.');
            }}
            className=" border border-outline-variant/20 bg-white/[0.05] px-4 py-2 text-sm font-medium text-on-surface transition hover:border-primary/30 hover:bg-white/[0.08]"
          >
            Refresh audit
          </button>
        }
      />
      <div className="px-5 py-5 sm:px-6">
        {error ? <InlineMessage tone="error" message={error} /> : null}
        <div className="overflow-hidden rounded-[24px] border border-outline-variant/20 bg-[#07100f]/65">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-surface-container-low text-[#8ca79a]">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-[#dde7e2]">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-[#8fa69b]" colSpan={6}>
                      Loading audit history...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[#8fa69b]" colSpan={6}>
                      No audit events yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-on-surface">{toTitleCase(entry.action)}</p>
                        <p className="mt-1 text-xs text-[#8fa69b]">{entry.entityType}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p>{entry.actorName ?? 'Unknown admin'}</p>
                        <p className="mt-1 text-xs text-[#8fa69b]">{entry.actorEmail ?? 'No email'}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p>{entry.targetName ?? 'No target user'}</p>
                        <p className="mt-1 text-xs text-[#8fa69b]">{entry.targetEmail ?? '-'}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-on-surface">{toTitleCase(entry.entityType)}</p>
                        <p className="mt-1 text-xs text-[#8fa69b]">{entry.entityId}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-[#9fb1aa]">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-4 py-4 align-top">
                        <details className="rounded-[16px] border border-outline-variant/20 bg-surface-container-low p-3">
                          <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.16em] text-[#9db6aa]">
                            View state diff
                          </summary>
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#8ca79a]">Before</p>
                              <pre className="max-h-56 overflow-auto  border border-outline-variant/20 bg-black/20 p-3 text-xs text-[#b9c8c2]">
                                {JSON.stringify(entry.beforeState, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#8ca79a]">After</p>
                              <pre className="max-h-56 overflow-auto  border border-outline-variant/20 bg-black/20 p-3 text-xs text-[#b9c8c2]">
                                {JSON.stringify(entry.afterState, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Surface>
  );
}

export function AdminConsole({
  role,
  adminEmail,
  initialSection = 'analytics'
}: {
  role: AdminRole;
  adminEmail: string | null;
  initialSection?: AdminSectionId;
}) {
  const router = useRouter();
  const activeSection = initialSection;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  const handleMutation = useCallback((message: string) => {
    setStatusMessage(message);
    setAuditRefreshKey((current) => current + 1);
  }, []);

  return (
    <main className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection={activeSection} />
        </aside>

        <div className="space-y-6">
          <Surface className="px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[0.7rem] uppercase tracking-[0.32em] text-[#83bea9]">Internal admin</p>
                <h1
                  className="mt-3 text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Content ops console
                </h1>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:hidden lg:min-w-[20rem]">
                <div className=" border border-outline-variant/20 bg-white/[0.04] p-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#8ca79a]">Admin role</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">{toTitleCase(role)}</p>
                </div>
                <div className=" border border-outline-variant/20 bg-white/[0.04] p-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#8ca79a]">Signed in as</p>
                  <p className="mt-2 text-lg font-semibold text-on-surface">{adminEmail ?? 'Unknown admin'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:hidden">
              {ADMIN_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;

                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className={`rounded-[16px] border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'border-primary/30 bg-primary/12 text-primary'
                        : 'border-outline-variant/20 bg-surface-container-low text-on-surface hover:border-primary/20 hover:bg-surface-container-high'
                    }`}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </div>
          </Surface>

          {statusMessage ? <InlineMessage tone="success" message={statusMessage} /> : null}

          {activeSection === 'analytics' ? (
            <AdminAnalyticsSection onMutation={handleMutation} />
          ) : null}
          {activeSection === 'lessons' ? (
            <TheoryLessonsSection
              onMutation={handleMutation}
              onOpenTaskEditor={() => void router.push('/admin/assignments')}
            />
          ) : null}
          {activeSection === 'catalog' ? <CatalogSection onMutation={handleMutation} /> : null}
          {activeSection === 'assignments' ? (
            <AssignmentsSection onMutation={handleMutation} />
          ) : null}
          {activeSection === 'audit' ? (
            <AuditSection refreshKey={auditRefreshKey} onMutation={handleMutation} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
