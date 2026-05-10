import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { BugSeverityBadge } from '@/components/admin/bugs/BugSeverityBadge';
import { BugStatusBadge } from '@/components/admin/bugs/BugStatusBadge';
import {
  ADMIN_DRAWER_SURFACE_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
} from '@/components/admin/theme';
import type { BugReport, BugStatus } from '@/components/admin/bugs/types';
import { formatSubmittedAt } from '@/components/admin/bugs/utils';

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
    <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} p-4`}>
      <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
        {label}
      </p>
      <p
        className={`mt-2 font-body text-[13px] leading-relaxed ${
          provided ? 'text-on-surface' : 'text-on-surface-variant italic'
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
        className="fixed inset-0 z-40 bg-on-surface/40 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bug detail"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto p-6 ${ADMIN_DRAWER_SURFACE_CLASS}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
              Bug report
            </p>
            <h2 className="mt-3 font-h2 text-2xl font-bold tracking-tight text-on-surface">
              {report.title}
            </h2>
            <p className="mt-1 font-data-mono text-[12px] text-on-surface-variant tabular-nums">
              #{report.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-surface-dim bg-surface text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <BugSeverityBadge severity={report.severity} />
          <BugStatusBadge status={report.status} />
          <span className="font-data-mono text-[11px] tracking-[0.12em] uppercase text-on-surface-variant">
            {formatSubmittedAt(report.submittedAt)}
          </span>
        </div>

        <div className={`mt-5 ${ADMIN_SECONDARY_SURFACE_CLASS} p-5`}>
          <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
            Description
          </p>
          <p className="mt-3 whitespace-pre-wrap font-body text-[13px] leading-relaxed text-on-surface">
            {report.description}
          </p>
        </div>

        <div className={`mt-4 ${ADMIN_SECONDARY_SURFACE_CLASS} p-5`}>
          <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
            Status
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as BugStatus)}
                className="h-9 w-full appearance-none border border-surface-dim bg-surface pl-3 pr-8 font-data-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase text-on-surface outline-none cursor-pointer transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-surface text-on-surface">
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant">
                <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                  <path d="M6 8 0 0h12L6 8Z" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={() => void onSaveStatus(statusDraft)}
              disabled={!statusDirty || savingStatus}
              className={`${ADMIN_PRIMARY_BUTTON_CLASS} h-9 px-4 font-data-mono text-[10.5px] tracking-[0.12em] uppercase font-semibold`}
            >
              {savingStatus ? 'Saving…' : 'Save'}
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

        <div className={`mt-4 ${ADMIN_SECONDARY_SURFACE_CLASS} p-5`}>
          <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
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
                    className="inline-flex items-center gap-1.5 font-body text-[13px] text-primary transition-colors hover:underline"
                  >
                    <span className="truncate">{url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
            </div>
          ) : (
            <p className="mt-3 font-body text-[13px] text-on-surface-variant italic">No attachments.</p>
          )}
        </div>

        <div className="mt-4 border border-dashed border-surface-dim bg-surface-container-low p-5">
          <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
            Internal notes
          </p>
          <p className="mt-3 font-body text-[13px] text-on-surface-variant italic">
            Notes field placeholder for triage and handoff.
          </p>
        </div>
      </aside>
    </>
  );
}
