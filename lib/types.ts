// ─── Core domain types ────────────────────────────────────────────────────────

export type NormalizedStatus =
  | 'Draft/Unapproved'
  | 'Open'
  | 'In Progress'
  | 'Closed-Filled'
  | 'Cancelled'
  | 'Rejected@Approval'
  | 'Unknown';

export type AgeingStatus = 'green' | 'amber' | 'red' | 'na';

export interface NormalizedRequisition {
  id: string;
  raisedDate: Date | null;
  approvedDate: Date | null;
  agreedDeadline: Date | null;   // agreed_tat (date) or request_doj fallback
  requestDoj: Date | null;
  deadlineSource: 'agreed_tat' | 'request_doj' | null;

  positions: number;
  status: NormalizedStatus;
  rawStatus: string;

  division: string;
  function: string;
  designation: string;
  location: string;
  project: string;
  requestor: string;
  reportingManager: string;
  salaryType: string;
  workmode: string;
  positionType: string;
  natureOfVacancy: string;

  taMembers: string[];   // parsed from TA_Members / TAMember_list

  // Coarse funnel counts (from dump)
  sourcingCnt: number | null;
  shortlistedCnt: number | null;
  inInterviewCnt: number | null;
  selectedCnt: number | null;
  offeredCnt: number | null;
  offerAcceptedCnt: number | null;
  joinedCnt: number | null;

  // ─── Computed metrics ────────────────────────────────────────────────
  timeToApproval: number | null;   // biz days: raisedDate → approvedDate
  agreedTatDays: number | null;    // biz days: approvedDate → agreedDeadline
  ageingDays: number | null;       // biz days (pause-adjusted)
  pausedDays: number;              // total biz days spent paused (Cut 1: always 0 unless snapshot diff detects)
  varianceDays: number | null;     // agreedTatDays − ageingDays  (+= buffer, -= overdue)
  isBreached: boolean;
  ageingStatus: AgeingStatus;
  isInferredTat: boolean;          // true when using request_doj fallback
  isPaused: boolean;

  snapshotId: string;
  asOfDate: Date;
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────
export interface Snapshot {
  id: string;
  uploadedAt: string;   // ISO string (serialized for Zustand persist)
  asOfDate: string;     // ISO string
  label: string;
  requisitions: NormalizedRequisition[];
  rowCount: number;
  errorRows: number;
}

// ─── Derived TA performance ───────────────────────────────────────────────────
export interface TAPerformance {
  taName: string;
  creditedReqs: number;
  openReqs: number;
  inProgressReqs: number;
  closedReqs: number;
  cancelledReqs: number;
  breachedReqs: number;
  sourcedProfiles: number;
  joinedCount: number;
  avgTatOfClosed: number | null;   // avg ageing of closed reqs
  avgAgeingOfOpen: number | null;
  funnelYield: number | null;      // joined / sourced %
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface AppSettings {
  amberThresholdPct: number;   // default 20 — show amber when ≤ this % of TAT remains
  ageBuckets: number[];        // e.g. [15,30,45] → 0-15, 16-30, 31-45, 45+
  stalledDays: number;         // reqs with no funnel movement for this many days
  holidayCalendar: string[];   // ISO date strings (YYYY-MM-DD)
}

export const DEFAULT_SETTINGS: AppSettings = {
  amberThresholdPct: 20,
  ageBuckets: [15, 30, 45],
  stalledDays: 7,
  holidayCalendar: [],
};

// ─── Comment / Exception ──────────────────────────────────────────────────────
export interface ReqComment {
  id: string;
  requisitionId: string;
  authorName: string;
  text: string;
  createdAt: string;   // ISO string
  isHrRequest: boolean;
  eventType?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
export interface ParseResult {
  requisitions: NormalizedRequisition[];
  warnings: string[];
  errors: string[];
  skippedRows: number;
  inferredTatCount: number;
  unassignedCount: number;
  columnsMapped: string[];
  columnsUnrecognized: string[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface SessionUser {
  email: string;
  name: string;
  role: 'hr_head' | 'ta_member' | 'management' | 'admin';
}
