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
  <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
    <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">{label}</p>
    <p className="mt-2 text-sm text-white">{value && value.trim().length > 0 ? value : 'Not provided'}</p>
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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bug detail"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-white/12 bg-[linear-gradient(180deg,#0b1110_0%,#070b0b_100%)] p-5 shadow-[-20px_0_46px_-30px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#7f948b]">Bug report</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{report.title}</h2>
            <p className="mt-1 text-sm text-[#8fa49b]">#{report.id.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/12 bg-white/[0.04] text-[#cbdad3] transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <BugSeverityBadge severity={report.severity} />
          <BugStatusBadge status={report.status} />
          <span className="text-xs text-[#8ea39a]">{formatSubmittedAt(report.submittedAt)}</span>
        </div>

        <div className="mt-5 rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#d8e5df]">{report.description}</p>
        </div>

        <div className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Status</p>
          <div className="mt-2 flex items-center gap-2">
            <select
              value={statusDraft}
              onChange={(event) => setStatusDraft(event.target.value as BugStatus)}
              className="h-10 flex-1 rounded-[12px] border border-white/12 bg-[#0a1110] px-3 text-sm text-white outline-none transition focus:border-brand-400/35 focus:ring-2 focus:ring-brand-400/15"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void onSaveStatus(statusDraft)}
              disabled={!statusDirty || savingStatus}
              className="inline-flex h-10 items-center justify-center rounded-[12px] border border-brand-300/45 bg-brand-500/85 px-4 text-sm font-semibold text-[#06110d] transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-55"
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

        <div className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Attachments</p>
          {report.attachmentUrls.length > 0 ? (
            <div className="mt-2 space-y-2">
              {report.attachmentUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#bfe7da] transition hover:text-white"
                >
                  {url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#8ea39a]">No attachments.</p>
          )}
        </div>

        <div className="mt-4 rounded-[14px] border border-dashed border-white/14 bg-white/[0.02] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7f948b]">Internal notes</p>
          <p className="mt-2 text-sm text-[#8ea39a]">Notes field placeholder for triage and handoff.</p>
        </div>
      </aside>
    </>
  );
}
