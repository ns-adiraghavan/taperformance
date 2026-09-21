import { NormalizedRequisition, NormalizedStatus, AgeingStatus, TAPerformance, AppSettings, DEFAULT_SETTINGS } from './types';
import { businessDaysBetween } from './businessDays';

// ─── Status normalisation ────────────────────────────────────────────────────
const STATUS_MAP: Record<string, NormalizedStatus> = {
  // Open / unapproved
  draft: 'Draft/Unapproved', unapproved: 'Draft/Unapproved', 'not approved': 'Draft/Unapproved',
  pending: 'Open', open: 'Open', 'open - new': 'Open', new: 'Open',
  // In-progress
  'in progress': 'In Progress', 'in-progress': 'In Progress', inprogress: 'In Progress',
  active: 'In Progress', ongoing: 'In Progress',
  // Closed
  closed: 'Closed-Filled', filled: 'Closed-Filled', 'closed-filled': 'Closed-Filled',
  completed: 'Closed-Filled', 'closed filled': 'Closed-Filled', joined: 'Closed-Filled',
  selected: 'Closed-Filled',
  // Cancelled
  cancelled: 'Cancelled', canceled: 'Cancelled', withdrawn: 'Cancelled', dropped: 'Cancelled',
  // Rejected
  rejected: 'Rejected@Approval', 'rejected@approval': 'Rejected@Approval',
  'not approved - lob': 'Rejected@Approval', 'not approved - hr': 'Rejected@Approval',
};

export function normalizeStatus(raw: string): NormalizedStatus {
  const key = (raw ?? '').toLowerCase().trim();
  return STATUS_MAP[key] ?? 'Unknown';
}

// ─── Per-req metric computation ──────────────────────────────────────────────
export function computeMetrics(
  req: Omit<NormalizedRequisition,
    'timeToApproval'|'agreedTatDays'|'ageingDays'|'pausedDays'|
    'varianceDays'|'isBreached'|'ageingStatus'|'isInferredTat'|'isPaused'>,
  settings: AppSettings = DEFAULT_SETTINGS
): Pick<NormalizedRequisition,
    'timeToApproval'|'agreedTatDays'|'ageingDays'|'pausedDays'|
    'varianceDays'|'isBreached'|'ageingStatus'|'isInferredTat'|'isPaused'> {

  const holidays = settings.holidayCalendar;
  const asOf = req.asOfDate instanceof Date ? req.asOfDate : new Date(req.asOfDate);

  // Time-to-approval: raisedDate → approvedDate
  const timeToApproval =
    req.raisedDate && req.approvedDate
      ? businessDaysBetween(req.raisedDate, req.approvedDate, holidays)
      : null;

  // Agreed deadline + inferred flag
  const isInferredTat = !req.agreedDeadline && !!req.requestDoj;
  const deadline = req.agreedDeadline ?? req.requestDoj;

  // Agreed TAT days: approvedDate → deadline
  const agreedTatDays =
    req.approvedDate && deadline
      ? businessDaysBetween(req.approvedDate, deadline, holidays)
      : null;

  // Paused days: Cut 1 = 0 (no snapshot-diff yet); Phase 2 = derived from diffs
  const pausedDays = 0;
  const isPaused = false;

  // Ageing: approvedDate → (closed: use asOf as proxy | open: asOf)
  // For closed reqs we use asOfDate as we don't have a closure date column in dump
  const ageingDays =
    req.approvedDate
      ? Math.max(0, businessDaysBetween(req.approvedDate, asOf, holidays) - pausedDays)
      : null;

  // Variance
  const varianceDays =
    agreedTatDays !== null && ageingDays !== null
      ? agreedTatDays - ageingDays
      : null;

  // Breach: only for non-cancelled, non-rejected, non-draft reqs
  const breachable = !['Cancelled','Rejected@Approval','Draft/Unapproved'].includes(req.status);
  const isBreached = breachable && varianceDays !== null ? varianceDays < 0 : false;

  // Ageing colour
  let ageingStatus: AgeingStatus = 'na';
  if (varianceDays !== null && agreedTatDays !== null && agreedTatDays > 0 && breachable) {
    if (isBreached) {
      ageingStatus = 'red';
    } else {
      const pctRemaining = (varianceDays / agreedTatDays) * 100;
      ageingStatus = pctRemaining <= settings.amberThresholdPct ? 'amber' : 'green';
    }
  }

  return {
    timeToApproval,
    agreedTatDays,
    ageingDays,
    pausedDays,
    varianceDays,
    isBreached,
    ageingStatus,
    isInferredTat,
    isPaused,
  };
}

// ─── TA performance rollup ───────────────────────────────────────────────────
export function buildTAPerformance(
  reqs: NormalizedRequisition[]
): TAPerformance[] {
  const map = new Map<string, NormalizedRequisition[]>();

  for (const req of reqs) {
    const tas = req.taMembers.length > 0 ? req.taMembers : ['Unassigned'];
    for (const ta of tas) {
      const name = ta.trim() || 'Unassigned';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(req);
    }
  }

  const result: TAPerformance[] = [];

  map.forEach((credited, taName) => {
    const closed = credited.filter(r =>
      ['Closed-Filled'].includes(r.status)
    );
    const open = credited.filter(r =>
      ['Open','In Progress'].includes(r.status)
    );
    const cancelled = credited.filter(r => r.status === 'Cancelled');
    const breached = credited.filter(r => r.isBreached);
    const sourced = credited.reduce((s, r) => s + (r.sourcingCnt ?? 0), 0);
    const joined = credited.reduce((s, r) => s + (r.joinedCnt ?? 0), 0);

    const closedWithAgeing = closed.filter(r => r.ageingDays !== null);
    const avgTat = closedWithAgeing.length
      ? closedWithAgeing.reduce((s, r) => s + r.ageingDays!, 0) / closedWithAgeing.length
      : null;

    const openWithAgeing = open.filter(r => r.ageingDays !== null);
    const avgAgeingOpen = openWithAgeing.length
      ? openWithAgeing.reduce((s, r) => s + r.ageingDays!, 0) / openWithAgeing.length
      : null;

    result.push({
      taName,
      creditedReqs: credited.length,
      openReqs: open.filter(r => r.status === 'Open').length,
      inProgressReqs: open.filter(r => r.status === 'In Progress').length,
      closedReqs: closed.length,
      cancelledReqs: cancelled.length,
      breachedReqs: breached.length,
      sourcedProfiles: sourced,
      joinedCount: joined,
      avgTatOfClosed: avgTat !== null ? Math.round(avgTat) : null,
      avgAgeingOfOpen: avgAgeingOpen !== null ? Math.round(avgAgeingOpen) : null,
      funnelYield: sourced > 0 ? Math.round((joined / sourced) * 100) : null,
    });
  });

  return result.sort((a, b) => {
    if (a.taName === 'Unassigned') return 1;
    if (b.taName === 'Unassigned') return -1;
    return b.creditedReqs - a.creditedReqs;
  });
}

// ─── Ageing bucket distribution ──────────────────────────────────────────────
export function buildAgeingBuckets(
  reqs: NormalizedRequisition[],
  bucketBreaks: number[] = [15, 30, 45]
): { label: string; count: number; breachedCount: number }[] {
  const active = reqs.filter(r =>
    ['Open','In Progress'].includes(r.status) && r.ageingDays !== null
  );

  const breaks = [...bucketBreaks].sort((a, b) => a - b);

  const buckets = [
    ...breaks.map((b, i) => ({
      label: i === 0 ? `0–${b}d` : `${breaks[i-1]+1}–${b}d`,
      min: i === 0 ? 0 : breaks[i-1]+1,
      max: b,
    })),
    { label: `${breaks[breaks.length-1]+1}d+`, min: breaks[breaks.length-1]+1, max: Infinity },
  ];

  return buckets.map(({ label, min, max }) => {
    const bucket = active.filter(r => r.ageingDays! >= min && r.ageingDays! <= max);
    return {
      label,
      count: bucket.length,
      breachedCount: bucket.filter(r => r.isBreached).length,
    };
  });
}

// ─── Division summary ────────────────────────────────────────────────────────
export function buildDivisionSummary(reqs: NormalizedRequisition[]) {
  const map = new Map<string, NormalizedRequisition[]>();

  for (const req of reqs) {
    const div = req.division || 'Unknown';
    if (!map.has(div)) map.set(div, []);
    map.get(div)!.push(req);
  }

  return Array.from(map.entries())
    .map(([division, rows]) => {
      const active = rows.filter(r => ['Open','In Progress'].includes(r.status));
      const filled = rows.filter(r => r.status === 'Closed-Filled').length;
      const breached = rows.filter(r => r.isBreached).length;
      const activeWithAge = active.filter(r => r.ageingDays !== null);
      const avgAge = activeWithAge.length
        ? Math.round(activeWithAge.reduce((s, r) => s + r.ageingDays!, 0) / activeWithAge.length)
        : null;
      return {
        division,
        total: rows.length,
        active: active.length,
        filled,
        breached,
        avgAge,
      };
    })
    .sort((a, b) => b.total - a.total);
}

// ─── Funnel aggregation ───────────────────────────────────────────────────────
export function buildFunnelMetrics(reqs: NormalizedRequisition[]) {
  return {
    sourced:       reqs.reduce((s, r) => s + (r.sourcingCnt ?? 0), 0),
    shortlisted:   reqs.reduce((s, r) => s + (r.shortlistedCnt ?? 0), 0),
    inInterview:   reqs.reduce((s, r) => s + (r.inInterviewCnt ?? 0), 0),
    selected:      reqs.reduce((s, r) => s + (r.selectedCnt ?? 0), 0),
    offered:       reqs.reduce((s, r) => s + (r.offeredCnt ?? 0), 0),
    offerAccepted: reqs.reduce((s, r) => s + (r.offerAcceptedCnt ?? 0), 0),
    joined:        reqs.reduce((s, r) => s + (r.joinedCnt ?? 0), 0),
  };
}

// ─── Breach / TAT status summary ─────────────────────────────────────────────
export function buildBreachSummary(reqs: NormalizedRequisition[]) {
  const active = reqs.filter(r => ['Open','In Progress'].includes(r.status));
  let green = 0, amber = 0, red = 0, na = 0;
  for (const r of active) {
    if (r.ageingStatus === 'green') green++;
    else if (r.ageingStatus === 'amber') amber++;
    else if (r.ageingStatus === 'red') red++;
    else na++;
  }
  return { green, amber, red, na };
}

// ─── Snapshot trend diff ──────────────────────────────────────────────────────
export interface TrendPoint {
  label: string;
  asOfDate: string;
  sourced: number;
  joined: number;
  closed: number;
  active: number;
}

export function buildTrend(snapshots: { asOfDate: string; requisitions: NormalizedRequisition[] }[]): TrendPoint[] {
  if (snapshots.length < 1) return [];

  const sorted = [...snapshots].sort((a, b) =>
    new Date(a.asOfDate).getTime() - new Date(b.asOfDate).getTime()
  );

  return sorted.map(snap => {
    const reqs = snap.requisitions;
    return {
      label: new Date(snap.asOfDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      asOfDate: snap.asOfDate,
      sourced: reqs.reduce((s, r) => s + (r.sourcingCnt ?? 0), 0),
      joined: reqs.reduce((s, r) => s + (r.joinedCnt ?? 0), 0),
      closed: reqs.filter(r => r.status === 'Closed-Filled').length,
      active: reqs.filter(r => ['Open','In Progress'].includes(r.status)).length,
    };
  });
}
