import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { BugSeverityBadge } from '@/components/admin/bugs/BugSeverityBadge';
import { BugStatusBadge } from '@/components/admin/bugs/BugStatusBadge';
import { ADMIN_DRAWER_SURFACE_CLASS } from '@/components/admin/theme';
import type { BugReport, BugStatus } from '@/components/admin/bugs/types';
import { formatSubmittedAt } from '@/components/admin/bugs/utils';

const ACCENT = '153,247,255';
const STATUS_OPTIONS: BugStatus[] = ['New', 'In Review', 'Resolved'];

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  const provided = value && value.trim().length > 0;
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p
        className={`mt-2 text-[13px] leading-relaxed ${
          provided ? 'text-white/85' : 'text-white/35 italic'
        }`}
      >
        {provided ? value : 'Not provided'}
      </p>
    </div>
  );
};

export function BugDetailDrawer({
  report,
  open,
  onClose,
  onSaveStatus,
  savingStatus,
}: {
  report: BugReport | null;
  open: boolean;
  onClose: () => void;
  onSaveStatus: (status: BugStatus) => Promise<void>;
  savingStatus: boolean;
}) {
  const [statusDraft, setStatusDraft] = useState<BugStatus>('New');

  useEffect(() => {
    if (!report) return;
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
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Bug report
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
              {report.title}
            </h2>
            <p className="mt-1 font-mono text-[12px] text-white/45 tabular-nums">
              #{report.id.slice(0, 8)}
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

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <BugSeverityBadge severity={report.severity} />
          <BugStatusBadge status={report.status} />
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-white/45">
            {formatSubmittedAt(report.submittedAt)}
          </span>
        </div>

        <div className="mt-5 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Description
          </p>
          <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-white/80">
            {report.description}
          </p>
        </div>

        <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Status
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as BugStatus)}
                className="h-9 w-full appearance-none pl-3 pr-8 font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-white/85 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[rgba(153,247,255,0.35)]"
                style={{
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#181c20]">
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40">
                <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                  <path d="M6 8 0 0h12L6 8Z" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={() => void onSaveStatus(statusDraft)}
              disabled={!statusDirty || savingStatus}
              className="inline-flex h-9 items-center px-4 transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(153,247,255,0.35)]"
              style={{
                borderRadius: 10,
                background: `rgba(${ACCENT},0.14)`,
                border: `1px solid rgba(${ACCENT},0.4)`,
                color: `rgb(${ACCENT})`,
              }}
            >
              <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold">
                {savingStatus ? 'Saving…' : 'Save'}
              </span>
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

        <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Attachments
          </p>
          {report.attachmentUrls.length > 0 ? (
            <div className="mt-3 space-y-2">
              {report.attachmentUrls
                .filter((u) => /^https?:\/\//i.test(u))
                .map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:underline"
                    style={{ color: `rgb(${ACCENT})` }}
                  >
                    <span className="truncate">{url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-white/40 italic">No attachments.</p>
          )}
        </div>

        <div className="mt-4 rounded-[18px] border border-dashed border-white/[0.1] bg-white/[0.02] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Internal notes
          </p>
          <p className="mt-3 text-[13px] text-white/45 italic">
            Notes field placeholder for triage and handoff.
          </p>
        </div>
      </aside>
    </>
  );
}
