import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { FeedbackRecord, FeedbackStatus } from '@/components/admin/feedback/types';
import {
  formatFeedbackDate,
  getSentimentBadgeClass,
  getStatusBadgeClass,
  getTypeBadgeClass
} from '@/components/admin/feedback/utils';

const FIELD_CLASS = 'rounded-xl border border-white/[0.06] bg-white/[0.03] p-4';
const LABEL_CLASS = 'text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40';

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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Feedback detail"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-white/[0.06] bg-[#0c0e10]/95 p-6 backdrop-blur-2xl shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
              Feedback detail
            </p>
            <h2 className="mt-2.5 text-xl font-semibold tracking-tight text-on-surface">
              {record.preview}
            </h2>
            <p className="mt-2 text-[13px] text-on-surface-variant/40">
              {record.userName} · {record.userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-on-surface-variant/50 transition-colors hover:bg-white/[0.08] hover:text-on-surface-variant"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-md border px-3 py-1 text-[11px] font-medium ${getTypeBadgeClass(record.type)}`}
          >
            {record.type}
          </span>
          <span
            className={`inline-flex items-center rounded-md border px-3 py-1 text-[11px] font-medium ${getSentimentBadgeClass(record.sentiment)}`}
          >
            {record.sentiment}
          </span>
          <span
            className={`inline-flex items-center rounded-md border px-3 py-1 text-[11px] font-medium ${getStatusBadgeClass(statusDraft)}`}
          >
            {statusDraft}
          </span>
          <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-on-surface-variant/60">
            {record.rating}/5 rating
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Submitted</p>
            <p className="mt-2 text-[13px] text-on-surface">
              {formatFeedbackDate(record.submittedAt)}
            </p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Category</p>
            <p className="mt-2 text-[13px] text-on-surface">{record.category}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Product area</p>
            <p className="mt-2 text-[13px] text-on-surface">{record.module}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Linked page</p>
            <p className="mt-2 break-all text-[13px] text-on-surface">{record.linkedPage}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className={LABEL_CLASS}>Full feedback</p>
          <p className="mt-3 text-[13px] leading-7 text-on-surface-variant/60">{record.message}</p>
        </div>

        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={LABEL_CLASS}>Classification</p>
              <p className="mt-2 text-[12px] text-on-surface-variant/35">
                Sentiment, category, and workflow status stay editable for triage.
              </p>
            </div>
            <label className="min-w-[11rem]">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
                Status
              </span>
              <div className="relative">
                <select
                  aria-label="Feedback status"
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as FeedbackStatus)}
                  className="h-9 w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 pr-8 text-[13px] font-medium text-on-surface outline-none transition-colors cursor-pointer focus:border-white/[0.15]"
                >
                  {['Submitted', 'Reviewed', 'Resolved', 'Ignored'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-on-surface-variant/40">
                  <svg aria-hidden="true" viewBox="0 0 12 8" className="h-2 w-2 fill-current">
                    <path d="M6 8 0 0h12L6 8Z" />
                  </svg>
                </span>
              </div>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {record.keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-on-surface-variant/60"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className={LABEL_CLASS}>Internal admin notes</p>
          <textarea
            aria-label="Internal admin notes"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={6}
            className="mt-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-[13px] leading-relaxed text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/25 focus:border-white/[0.15]"
            placeholder="Capture internal follow-up, qualitative context, or release notes impact."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-[13px] font-medium text-on-surface transition-colors hover:bg-white/[0.08]"
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
            className="inline-flex h-9 items-center rounded-lg border border-primary/30 bg-primary/12 px-4 text-[13px] font-medium text-on-surface transition-colors hover:border-primary/50 hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </aside>
    </>
  );
}
