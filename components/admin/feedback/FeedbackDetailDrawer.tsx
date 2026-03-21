import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ADMIN_DRAWER_SURFACE_CLASS } from '@/components/admin/theme';
import type { FeedbackRecord, FeedbackStatus } from '@/components/admin/feedback/types';
import {
  formatFeedbackDate,
  getSentimentBadgeClass,
  getStatusBadgeClass,
  getTypeBadgeClass
} from '@/components/admin/feedback/utils';

const FIELD_CLASS = ' border border-outline-variant/20 bg-surface-container-low p-3';
const LABEL_CLASS = 'text-[0.68rem] uppercase tracking-[0.16em] text-[#7f948b]';

export function FeedbackDetailDrawer({
  record,
  open,
  saving,
  onClose,
  onSave
}: {
  record: FeedbackRecord | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    record: FeedbackRecord;
    status: FeedbackStatus;
    internalNotes: string;
  }) => Promise<void>;
}) {
  const [statusDraft, setStatusDraft] = useState<FeedbackStatus>('Submitted');
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    if (!record) {
      return;
    }

    setStatusDraft(record.status);
    setNotesDraft(record.internalNotes);
  }, [record]);

  if (!open || !record) {
    return null;
  }

  const isDirty =
    statusDraft !== record.status || notesDraft.trim() !== record.internalNotes.trim();

  return (
    <>
      <button
        type="button"
        aria-label="Close feedback detail"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Feedback detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto p-5 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#7f948b]">
              Feedback detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface">
              {record.preview}
            </h2>
            <p className="mt-2 text-sm text-[#8ea39a]">
              {record.userName} · {record.userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center  border border-outline-variant/20 bg-surface-container-low text-[#cbdad3] transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center  border px-3 py-1 text-xs font-medium ${getTypeBadgeClass(record.type)}`}
          >
            {record.type}
          </span>
          <span
            className={`inline-flex items-center  border px-3 py-1 text-xs font-medium ${getSentimentBadgeClass(record.sentiment)}`}
          >
            {record.sentiment}
          </span>
          <span
            className={`inline-flex items-center  border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(statusDraft)}`}
          >
            {statusDraft}
          </span>
          <span className="inline-flex items-center  border border-outline-variant/20 bg-surface-container-low px-3 py-1 text-xs font-medium text-[#d8e3de]">
            {record.rating}/5 rating
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Submitted</p>
            <p className="mt-2 text-sm text-on-surface">
              {formatFeedbackDate(record.submittedAt)}
            </p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Category</p>
            <p className="mt-2 text-sm text-on-surface">{record.category}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Product area</p>
            <p className="mt-2 text-sm text-on-surface">{record.module}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Linked page</p>
            <p className="mt-2 break-all text-sm text-on-surface">{record.linkedPage}</p>
          </div>
        </div>

        <div className="mt-6  border border-outline-variant/20 bg-white/[0.035] p-4">
          <p className={LABEL_CLASS}>Full feedback</p>
          <p className="mt-3 text-sm leading-7 text-[#d7e2dd]">{record.message}</p>
        </div>

        <div className="mt-6  border border-outline-variant/20 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={LABEL_CLASS}>Classification</p>
              <p className="mt-2 text-sm text-[#8ea39a]">
                Sentiment, category, and workflow status stay editable for triage.
              </p>
            </div>
            <label className="min-w-[11rem]">
              <span className="mb-1.5 block text-[0.64rem] uppercase tracking-[0.16em] text-[#7f948b]">
                Status
              </span>
              <select
                aria-label="Feedback status"
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as FeedbackStatus)}
                className="h-10 w-full  border border-outline-variant/20 bg-surface-container-low px-3 text-sm text-on-surface outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-brand-400/15"
              >
                {['Submitted', 'Reviewed', 'Resolved', 'Ignored'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {record.keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center  border border-outline-variant/20 bg-surface-container-low px-3 py-1.5 text-xs font-medium text-[#d7e2dd]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6  border border-outline-variant/20 bg-white/[0.035] p-4">
          <p className={LABEL_CLASS}>Internal admin notes</p>
          <textarea
            aria-label="Internal admin notes"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={6}
            className="mt-3 w-full  border border-outline-variant/20 bg-[#081111] px-3 py-3 text-sm leading-6 text-on-surface outline-none transition placeholder:text-[#6e8279] focus:border-primary/35 focus:ring-2 focus:ring-brand-400/15"
            placeholder="Capture internal follow-up, qualitative context, or release notes impact."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center  border border-outline-variant/20 bg-surface-container-low px-4 text-sm font-medium text-on-surface transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() =>
              void onSave({
                record,
                status: statusDraft,
                internalNotes: notesDraft
              })
            }
            disabled={!isDirty || saving}
            className="inline-flex h-10 items-center  border border-primary/30 bg-primary/12 px-4 text-sm font-medium text-[#d7f6ec] transition hover:border-brand-400/45 hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </aside>
    </>
  );
}
