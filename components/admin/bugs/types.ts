import type {
  AdminBugReportRecord,
  AdminBugSeverity,
  AdminBugStatus
} from '@/lib/admin/types';

export type BugReport = AdminBugReportRecord;
export type BugSeverity = AdminBugSeverity;
export type BugStatus = AdminBugStatus;

export type BugStatusFilter = 'All' | BugStatus;
export type BugSeverityFilter = 'All' | BugSeverity;

export type BugSortKey = 'submittedAt' | 'severity' | 'status' | 'module';
export type BugSortDirection = 'asc' | 'desc';

export interface BugSortState {
  key: BugSortKey;
  direction: BugSortDirection;
}
