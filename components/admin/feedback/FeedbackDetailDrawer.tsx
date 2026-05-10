import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  ADMIN_DRAWER_SURFACE_CLASS,
  ADMIN_FIELD_LABEL_CLASS,
  ADMIN_GHOST_BUTTON_CLASS,
  ADMIN_MONO_BUTTON_TEXT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/components/admin/theme';
import type { FeedbackRecord, FeedbackStatus } from '@/components/admin/feedback/types';
import {
  formatFeedbackDate,
  getSentimentBadgeClass,
  getStatusBadgeClass,
  getTypeBadgeClass,
} from '@/components/admin/feedback/utils';

const FIELD_CLASS = 'border border-surface-dim bg-surface-container-low p-4';
const LABEL_CLASS = ADMIN_FIELD_LABEL_CLASS;
const PILL_CLASS =
  'inline-flex h-6 items-center border px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase';

const slicerClass =
  'h-9 w-full appearance-none pl-3 pr-8 border border-surface-dim bg-surface font-data-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-on-surface outline-none cursor-pointer transition-colors hover:bg-surface-container focus:ring-2 focus:ring-primary/30 focus:border-primary';

export function FeedbackDetailDrawer({
  record,
  open,
  saving,
  onClose,
  onSave,
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
    if (!record) return;
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
        className="fixed inset-0 z-40 bg-on-surface/40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Feedback detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
              Feedback detail
            </p>
            <h2 className="mt-3 font-h2 text-2xl font-bold tracking-tight text-on-surface">
              {record.preview}
            </h2>
            <p className="mt-1.5 font-body text-[13px] text-on-surface-variant truncate">
              {record.userName} · {record.userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 w-9 justify-center px-0`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`${PILL_CLASS} ${getTypeBadgeClass(record.type)}`}>
            {record.type}
          </span>
          <span className={`${PILL_CLASS} ${getSentimentBadgeClass(record.sentiment)}`}>
            {record.sentiment}
          </span>
          <span className={`${PILL_CLASS} ${getStatusBadgeClass(statusDraft)}`}>
            {statusDraft}
          </span>
          <span
            className="inline-flex h-6 items-center border border-surface-dim bg-surface-container px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-on-surface-variant tabular-nums"
          >
            {record.rating}/5 rating
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Submitted</p>
            <p className="mt-2 font-data-mono text-[13px] text-on-surface tabular-nums">
              {formatFeedbackDate(record.submittedAt)}
            </p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Category</p>
            <p className="mt-2 font-body text-[13px] text-on-surface">{record.category}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Product area</p>
            <p className="mt-2 font-body text-[13px] text-on-surface">{record.module}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Linked page</p>
            <p className="mt-2 break-all font-data-mono text-[13px] text-on-surface">
              {record.linkedPage}
            </p>
          </div>
        </div>

        <div className="mt-4 border border-surface-dim bg-surface-container-low p-5">
          <p className={LABEL_CLASS}>Full feedback</p>
          <p className="mt-3 font-body text-[13px] leading-7 text-on-surface whitespace-pre-wrap">
            {record.message}
          </p>
        </div>

        <div className="mt-4 border border-surface-dim bg-surface-container-low p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={LABEL_CLASS}>Classification</p>
              <p className="mt-2 font-body text-[12px] text-on-surface-variant leading-relaxed">
                Sentiment, category, and workflow status stay editable for triage.
              </p>
            </div>
            <label className="min-w-[11rem]">
              <span className={`${LABEL_CLASS} mb-1.5 block`}>Status</span>
              <div className="relative">
                <select
                  aria-label="Feedback status"
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as FeedbackStatus)}
                  className={slicerClass}
                >
                  {['Submitted', 'Reviewed', 'Resolved', 'Ignored'].map((status) => (
                    <option key={status} value={status} className="bg-surface">
                      {status}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 8"
                    className="h-[7px] w-[7px] fill-current"
                  >
                    <path d="M6 8 0 0h12L6 8Z" />
                  </svg>
                </span>
              </div>
            </label>
          </div>

          {record.keywords.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {record.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center border border-surface-dim bg-surface-container px-2.5 py-1 font-data-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-on-surface-variant"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 border border-surface-dim bg-surface-container-low p-5">
          <p className={LABEL_CLASS}>Internal admin notes</p>
          <textarea
            aria-label="Internal admin notes"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={6}
            className="mt-3 w-full px-3 py-3 border border-surface-dim bg-surface font-body text-[13px] leading-relaxed text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Capture internal follow-up, qualitative context, or release notes impact."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`${ADMIN_GHOST_BUTTON_CLASS} h-9 px-4`}
          >
            <span className={ADMIN_MONO_BUTTON_TEXT_CLASS}>
              Close
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              void onSave({
                record,
                status: statusDraft,
                internalNotes: notesDraft,
              })
            }
            disabled={!isDirty || saving}
            className={`${ADMIN_PRIMARY_BUTTON_CLASS} h-9 px-4`}
          >
            <span className={ADMIN_MONO_BUTTON_TEXT_CLASS}>
              {saving ? 'Saving…' : 'Save changes'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
