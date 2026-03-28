import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { BugSeverityBadge } from '@/components/admin/bugs/BugSeverityBadge';
import { BugStatusBadge } from '@/components/admin/bugs/BugStatusBadge';
import type { BugReport, BugStatus } from '@/components/admin/bugs/types';
import { formatSubmittedAt } from '@/components/admin/bugs/utils';

const STATUS_OPTIONS: BugStatus[] = ['New', 'In Review', 'Resolved'];

const DetailField = ({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
    <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">{label}</p>
    <p className="mt-2 text-[13px] text-on-surface">{value && value.trim().length > 0 ? value : 'Not provided'}</p>
  </div>
);

export function BugDetailDrawer({
  report,
  open,
  onClose,
  onSaveStatus,
  savingStatus
}: {
  report: BugReport | null;
  open: boolean;
  onClose: () => void;
  onSaveStatus: (status: BugStatus) => Promise<void>;
  savingStatus: boolean;
}) {
  const [statusDraft, setStatusDraft] = useState<BugStatus>('New');

  useEffect(() => {
    if (!report) {
      return;
    }

    setStatusDraft(report.status);
  }, [report]);

  if (!open || !report) {
    return null;
  }

  const statusDirty = statusDraft !== report.status;

  return (
    <>
      <button
        type="button"
        aria-label="Close bug detail"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bug detail"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-white/[0.06] bg-[#0c0e10]/95 p-6 backdrop-blur-2xl shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
              Bug report
            </p>
            <h2 className="mt-2.5 text-xl font-semibold tracking-tight text-on-surface">{report.title}</h2>
            <p className="mt-1 text-[13px] text-on-surface-variant/35">#{report.id.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-on-surface-variant/50 transition-colors hover:bg-white/[0.08] hover:text-on-surface-variant"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <BugSeverityBadge severity={report.severity} />
          <BugStatusBadge status={report.status} />
          <span className="text-[12px] text-on-surface-variant/35">{formatSubmittedAt(report.submittedAt)}</span>
        </div>

        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">Description</p>
          <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-on-surface-variant/60">{report.description}</p>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">Status</p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="relative flex-1">
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as BugStatus)}
                className="h-9 w-full appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 pr-8 text-[13px] font-medium text-on-surface outline-none transition-colors cursor-pointer focus:border-white/[0.15]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-on-surface-variant/40">
                <svg aria-hidden="true" viewBox="0 0 12 8" className="h-2 w-2 fill-current">
                  <path d="M6 8 0 0h12L6 8Z" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={() => void onSaveStatus(statusDraft)}
              disabled={!statusDirty || savingStatus}
              className="inline-flex h-9 items-center rounded-lg border border-primary/30 bg-primary/12 px-4 text-[13px] font-medium text-on-surface transition-colors hover:border-primary/50 hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingStatus ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailField label="Reporter" value={report.reporterName} />
          <DetailField label="Email" value={report.reporterEmail} />
          <DetailField label="Module" value={report.module} />
          <DetailField label="Browser" value={report.browser} />
          <DetailField label="Device" value={report.device} />
          <DetailField label="Page" value={report.pageUrl} />
        </div>

        <div className="mt-4 grid gap-3">
          <DetailField label="Steps to reproduce" value={report.stepsToReproduce} />
          <DetailField label="Expected result" value={report.expectedResult} />
          <DetailField label="Actual result" value={report.actualResult} />
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">Attachments</p>
          {report.attachmentUrls.length > 0 ? (
            <div className="mt-3 space-y-2">
              {report.attachmentUrls.filter((u) => /^https?:\/\//i.test(u)).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] text-primary/70 transition-colors hover:text-primary"
                >
                  {url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-on-surface-variant/30">No attachments.</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">Internal notes</p>
          <p className="mt-3 text-[13px] text-on-surface-variant/30">Notes field placeholder for triage and handoff.</p>
        </div>
      </aside>
    </>
  );
}
