// @ts-nocheck
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
  <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
    <div className="max-w-3xl">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/50">{body}</p>
    </div>
    {action}
  </div>
);

const InlineMessage = AdminInlineMessage;

const SmallBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-6 items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
    {children}
  </span>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
    {children}
  </label>
);

const InputClassName =
  'mt-2 w-full rounded-[12px] border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[13px] text-white outline-none transition placeholder:text-white/40 focus:border-[rgba(153,247,255,0.4)] focus:bg-white/[0.06] focus:ring-2 focus:ring-[rgba(153,247,255,0.15)]';

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
    <div
      className="rounded-[20px] p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-white font-mono">{track.slug}</p>
          <p className="mt-1 text-[12px] text-white/50">
            Track metadata and assignment visibility
          </p>
        </div>
        <span
          className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={
            isActive
              ? {
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  color: 'rgb(110,231,160)',
                }
              : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                }
          }
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
          className="h-11 rounded-[12px] px-4 transition-all hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
            {isActive ? 'Deactivate' : 'Activate'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-11 rounded-[12px] px-4 transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
          style={{
            background: 'rgba(153,247,255,0.14)',
            border: '1px solid rgba(153,247,255,0.4)',
            color: 'rgb(153,247,255)',
          }}
        >
          <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
            {saving ? 'Saving…' : 'Save'}
          </span>
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-[12px] text-rose-300/80 font-mono">{error}</p>
      ) : null}
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
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 transition-all hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
                New item
              </span>
            </button>
          }
        />
        <div className="px-5 py-5 sm:px-6">
          {error ? <InlineMessage tone="error" message={error} /> : null}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Total content items', value: totalItems },
              { label: 'Active in rotation', value: activeItems },
              { label: 'Hidden from future picks', value: inactiveItems },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] p-5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
                }}
              >
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
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

          <div className="mt-6 overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#181c20] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Item', 'Type', 'Track', 'Order', 'State', 'Actions'].map(
                      (label, index) => (
                        <th
                          key={label}
                          className={`px-5 py-3.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55 ${
                            index === 5 ? 'text-right' : ''
                          }`}
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="border-t border-white/[0.04]">
                      <td
                        className="px-5 py-6 font-mono text-[12px] tracking-[0.14em] uppercase text-white/40"
                        colSpan={6}
                      >
                        Loading catalog…
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr className="border-t border-white/[0.04]">
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mb-1">
                          No matches
                        </p>
                        <p className="text-[13px] text-white/55">
                          No content items match the current filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-t border-white/[0.04]">
                        <td className="px-5 py-4 align-top">
                          <p className="text-[14px] font-semibold text-white">{item.title}</p>
                          <p className="mt-0.5 text-[12px] text-white/50 font-mono">
                            {item.sourceRef}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top text-[13px] text-white/70">
                          {CONTENT_TYPE_LABELS[item.contentType]}
                        </td>
                        <td className="px-5 py-4 align-top text-[13px] text-white/70">
                          {item.trackTitle ?? 'Unassigned'}
                        </td>
                        <td className="px-5 py-4 align-top text-[13px] text-white/70 font-mono tabular-nums">
                          #{item.sequenceOrder}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className="inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
                            style={
                              item.isActive
                                ? {
                                    background: 'rgba(34,197,94,0.12)',
                                    border: '1px solid rgba(34,197,94,0.35)',
                                    color: 'rgb(110,231,160)',
                                  }
                                : {
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'rgba(255,255,255,0.6)',
                                  }
                            }
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end gap-1.5">
                            {[
                              { label: 'Up', onClick: () => handleReorder(item, 'up') },
                              { label: 'Down', onClick: () => handleReorder(item, 'down') },
                              { label: 'Edit', onClick: () => handleEdit(item) },
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={btn.onClick}
                                className="inline-flex h-8 items-center px-3 transition-all hover:bg-white/[0.07]"
                                style={{
                                  borderRadius: 10,
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.85)',
                                }}
                              >
                                <span className="font-mono text-[10px] tracking-[0.12em] uppercase font-semibold">
                                  {btn.label}
                                </span>
                              </button>
                            ))}
                            {pendingDeleteToggleId === item.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleQuickToggle(item)}
                                  className="inline-flex h-8 items-center px-3 transition-all"
                                  style={{
                                    borderRadius: 10,
                                    background: 'rgba(239,68,68,0.14)',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    color: 'rgb(252,165,165)',
                                  }}
                                >
                                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase font-semibold">
                                    Confirm
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteToggleId(null)}
                                  className="inline-flex h-8 items-center px-3 transition-all hover:bg-white/[0.07]"
                                  style={{
                                    borderRadius: 10,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.85)',
                                  }}
                                >
                                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase font-semibold">
                                    Cancel
                                  </span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteToggleId(item.id)}
                                className="inline-flex h-8 items-center px-3 transition-all hover:bg-white/[0.07]"
                                style={{
                                  borderRadius: 10,
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.85)',
                                }}
                              >
                                <span className="font-mono text-[10px] tracking-[0.12em] uppercase font-semibold">
                                  {item.isActive ? 'Deactivate' : 'Activate'}
                                </span>
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
                className="h-11 rounded-[12px] px-4 transition-all hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
                  {formState.isActive ? 'Visible in picker' : 'Hidden from picker'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={formSaving}
                className="h-11 rounded-[12px] px-5 transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
                style={{
                  background: 'rgba(153,247,255,0.14)',
                  border: '1px solid rgba(153,247,255,0.4)',
                  color: 'rgb(153,247,255)',
                }}
              >
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
                  {formSaving ? 'Saving…' : formState.id ? 'Save changes' : 'Create item'}
                </span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="h-11 rounded-[12px] px-5 transition-all hover:bg-white/[0.07]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
                  Reset
                </span>
              </button>
            </div>
          </form>
        </Surface>
      </div>
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
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 transition-all hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold text-white/78">
              Refresh audit
            </span>
          </button>
        }
      />
      <div className="px-6 py-5 sm:px-7">
        {error ? <InlineMessage tone="error" message={error} /> : null}
        <div className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#181c20] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Action', 'Actor', 'Target', 'Entity', 'When', 'Details'].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-3.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/55"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="border-t border-white/[0.04]">
                    <td
                      className="px-5 py-8 font-mono text-[12px] tracking-[0.14em] uppercase text-white/40"
                      colSpan={6}
                    >
                      Loading audit history…
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr className="border-t border-white/[0.04]">
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/40 mb-1">
                        No events
                      </p>
                      <p className="text-[13px] text-white/55">
                        No audit events have been recorded yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="text-[14px] font-semibold text-white">
                          {toTitleCase(entry.action)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-white/45 font-mono">
                          {entry.entityType}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-[13px] text-white/80">
                          {entry.actorName ?? 'Unknown admin'}
                        </p>
                        <p className="mt-0.5 text-[12px] text-white/45 font-mono">
                          {entry.actorEmail ?? 'No email'}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-[13px] text-white/80">
                          {entry.targetName ?? 'No target user'}
                        </p>
                        <p className="mt-0.5 text-[12px] text-white/45 font-mono">
                          {entry.targetEmail ?? '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-[14px] font-semibold text-white">
                          {toTitleCase(entry.entityType)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-white/45 font-mono tabular-nums">
                          {entry.entityId}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-[13px] text-white/55 font-mono tabular-nums">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <details className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-3">
                          <summary className="cursor-pointer font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-white/55 transition-colors hover:text-white/85">
                            View state diff
                          </summary>
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-white/45">
                                Before
                              </p>
                              <pre className="max-h-56 overflow-auto rounded-[12px] border border-white/[0.08] bg-black/40 p-3 text-[11px] text-white/65 font-mono">
                                {JSON.stringify(entry.beforeState, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-2 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase text-white/45">
                                After
                              </p>
                              <pre className="max-h-56 overflow-auto rounded-[12px] border border-white/[0.08] bg-black/40 p-3 text-[11px] text-white/65 font-mono">
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
          <Surface className="px-6 py-7 sm:px-7 sm:py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Internal admin
                </p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Analytics
                </h1>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:hidden lg:min-w-[20rem]">
                {[
                  { label: 'Admin role', value: toTitleCase(role) },
                  { label: 'Signed in as', value: adminEmail ?? 'Unknown admin' },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-[18px] p-4"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
                    }}
                  >
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {entry.label}
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-white truncate">
                      {entry.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:hidden">
              {ADMIN_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    className="rounded-[12px] px-4 py-3 transition-all"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'
                      }`,
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    <span className="font-mono text-[11px] tracking-[0.12em] uppercase font-semibold">
                      {section.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Surface>

          {statusMessage ? <InlineMessage tone="success" message={statusMessage} /> : null}

          {activeSection === 'analytics' ? (
            <AdminAnalyticsSection onMutation={handleMutation} />
          ) : null}
          {activeSection === 'audit' ? (
            <AuditSection refreshKey={auditRefreshKey} onMutation={handleMutation} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
