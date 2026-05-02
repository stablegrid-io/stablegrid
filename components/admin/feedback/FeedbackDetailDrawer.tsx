import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ADMIN_DRAWER_SURFACE_CLASS } from '@/components/admin/theme';
import type { FeedbackRecord, FeedbackStatus } from '@/components/admin/feedback/types';
import {
  formatFeedbackDate,
  getSentimentBadgeClass,
  getStatusBadgeClass,
  getTypeBadgeClass,
} from '@/components/admin/feedback/utils';

const ACCENT = '153,247,255';

const FIELD_CLASS = 'rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4';
const LABEL_CLASS = 'font-mono text-[10px] uppercase tracking-[0.18em] text-white/45';
const PILL_CLASS =
  'inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase';

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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Feedback detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Feedback detail
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
              {record.preview}
            </h2>
            <p className="mt-1.5 text-[13px] text-white/60 truncate">
              {record.userName} · {record.userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center transition-all"
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
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
            className="inline-flex h-6 items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-white/60 tabular-nums"
          >
            {record.rating}/5 rating
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Submitted</p>
            <p className="mt-2 text-[13px] text-white/85 font-mono tabular-nums">
              {formatFeedbackDate(record.submittedAt)}
            </p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Category</p>
            <p className="mt-2 text-[13px] text-white/85">{record.category}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Product area</p>
            <p className="mt-2 text-[13px] text-white/85">{record.module}</p>
          </div>
          <div className={FIELD_CLASS}>
            <p className={LABEL_CLASS}>Linked page</p>
            <p className="mt-2 break-all text-[13px] text-white/85 font-mono">
              {record.linkedPage}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className={LABEL_CLASS}>Full feedback</p>
          <p className="mt-3 text-[13px] leading-7 text-white/80 whitespace-pre-wrap">
            {record.message}
          </p>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={LABEL_CLASS}>Classification</p>
              <p className="mt-2 text-[12px] text-white/45 leading-relaxed">
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
                  className="h-9 w-full appearance-none pl-3 pr-8 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/85 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[rgba(153,247,255,0.35)]"
                  style={{
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {['Submitted', 'Reviewed', 'Resolved', 'Ignored'].map((status) => (
                    <option key={status} value={status} className="bg-[#181c20]">
                      {status}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40">
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
                  className="inline-flex items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-white/60"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className={LABEL_CLASS}>Internal admin notes</p>
          <textarea
            aria-label="Internal admin notes"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            rows={6}
            className="mt-3 w-full rounded-[12px] px-3 py-3 text-[13px] leading-relaxed text-white outline-none transition-all placeholder:text-white/30 focus:ring-2 focus:ring-[rgba(153,247,255,0.15)]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            placeholder="Capture internal follow-up, qualitative context, or release notes impact."
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center px-4 transition-all hover:bg-white/[0.07]"
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
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
            className="inline-flex h-9 items-center px-4 transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
            style={{
              borderRadius: 10,
              background: `rgba(${ACCENT},0.14)`,
              border: `1px solid rgba(${ACCENT},0.4)`,
              color: `rgb(${ACCENT})`,
            }}
          >
            <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
              {saving ? 'Saving…' : 'Save changes'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
