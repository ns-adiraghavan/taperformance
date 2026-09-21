'use client';
import { NormalizedRequisition, ParseResult, AppSettings, DEFAULT_SETTINGS } from './types';
import { parseDate } from './businessDays';
import { normalizeStatus, computeMetrics } from './metrics';

// ─── Column aliases ───────────────────────────────────────────────────────────
// Map every known variant → canonical key
const COL_ALIASES: Record<string, string> = {
  // ID
  id:'id', req_id:'id', 'req id':'id', requisition_id:'id', 'requisition id':'id',
  // Raised
  req_raised:'raisedDate', 'req raised':'raisedDate', created_at:'raisedDate',
  raised_date:'raisedDate', 'raised date':'raisedDate', raised:'raisedDate',
  // Approval
  hr_approval_date:'approvedDate', 'hr approval date':'approvedDate',
  hrhead_approvaldate:'approvedDate', approval_date:'approvedDate', approved:'approvedDate',
  hr_approved:'approvedDate',
  // Agreed TAT (date)
  agreed_tat:'agreedDeadline', agreed_date:'agreedDeadline', 'agreed tat':'agreedDeadline',
  agreed_deadline:'agreedDeadline', 'agreed deadline':'agreedDeadline', agreed_closure:'agreedDeadline',
  // Request DOJ
  request_doj:'requestDoj', 'request doj':'requestDoj', req_doj:'requestDoj',
  doj:'requestDoj', 'date of joining':'requestDoj',
  // Vacancies
  vacancies:'positions', number_of_vacancies:'positions', 'no of vacancies':'positions',
  positions:'positions', openings:'positions', 'no. of positions':'positions',
  // Status
  status:'status', hiring_status:'status', 'hiring status':'status', req_status:'status',
  // Division
  division:'division', division_id:'division', bu:'division', 'business unit':'division',
  // Function
  function:'function', function_id:'function', dept:'function', department:'function',
  // Designation
  designation:'designation', designation_id:'designation', role:'designation', position:'designation',
  // Location
  location:'location', location_id:'location', city:'location',
  // Requestor
  requestor:'requestor', requestor_name:'requestor', 'requestor name':'requestor',
  requestor_name_id:'requestor', 'raised by':'requestor', hiring_manager:'requestor',
  // Reporting manager
  reporting_manager:'reportingManager', 'reporting manager':'reportingManager',
  // Project
  project:'project', project_name:'project', 'project name':'project', project_name_id:'project',
  // TA members
  ta_members:'taMembers', 'ta members':'taMembers', tamember_list:'taMembers',
  tamember:'taMembers', recruiter:'taMembers', recruiters:'taMembers', assigned_ta:'taMembers',
  'assigned ta':'taMembers',
  // Salary / misc
  salary_type:'salaryType', 'salary type':'salaryType', workmode:'workmode',
  work_mode:'workmode', position_type:'positionType', 'position type':'positionType',
  nature_of_vacancy:'natureOfVacancy', 'nature of vacancy':'natureOfVacancy',
  // Funnel
  sourced:'sourcingCnt', sourcing_cnt:'sourcingCnt', sourcing_count:'sourcingCnt',
  profiles_sourced:'sourcingCnt', 'profiles sourced':'sourcingCnt',
  shortlisted:'shortlistedCnt', shortlisted_cnt:'shortlistedCnt', shortlist:'shortlistedCnt',
  in_interview:'inInterviewCnt', 'in interview':'inInterviewCnt', in_interview_cnt:'inInterviewCnt',
  interview_stage:'inInterviewCnt',
  selected:'selectedCnt', selected_cnt:'selectedCnt', final_selected:'selectedCnt',
  final_selected_cnt:'selectedCnt',
  offered:'offeredCnt', offered_cnt:'offeredCnt',
  offer_accepted:'offerAcceptedCnt', offer_accepted_cnt:'offerAcceptedCnt',
  'offer accepted':'offerAcceptedCnt',
  joined:'joinedCnt', joined_cnt:'joinedCnt', joins:'joinedCnt',
};

function canonicalize(col: string): string {
  return col.toLowerCase().replace(/[\s_\-\.]+/g, '_').trim();
}

function resolveCol(header: string): string | null {
  const key = canonicalize(header);
  return COL_ALIASES[key] ?? COL_ALIASES[header.toLowerCase().trim()] ?? null;
}

// ─── Row parser ───────────────────────────────────────────────────────────────
function parseRow(
  row: Record<string, unknown>,
  colMap: Record<string, string>,
  snapshotId: string,
  asOfDate: Date,
  settings: AppSettings,
  rowIndex: number
): { req: NormalizedRequisition; warnings: string[] } | { error: string } {

  function get(canonical: string): string {
    const header = colMap[canonical];
    if (!header) return '';
    const val = row[header];
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    return s === '-' || s === 'N/A' || s === 'n/a' ? '' : s;
  }

  function getNum(canonical: string): number | null {
    const v = get(canonical);
    if (!v) return null;
    const n = parseFloat(v.replace(/,/g, ''));
    return isNaN(n) ? null : Math.round(n);
  }

  const id = get('id') || `ROW-${rowIndex}`;
  const raisedDate = parseDate(get('raisedDate'));
  const approvedDate = parseDate(get('approvedDate'));

  // Deadline resolution with fallback
  const agreedDeadlineRaw = parseDate(get('agreedDeadline'));
  const requestDoj = parseDate(get('requestDoj'));
  const agreedDeadline = agreedDeadlineRaw ?? requestDoj;
  const deadlineSource: NormalizedRequisition['deadlineSource'] =
    agreedDeadlineRaw ? 'agreed_tat' : requestDoj ? 'request_doj' : null;

  const rawStatus = get('status') || 'Unknown';
  const status = normalizeStatus(rawStatus);

  // TA members
  const taMembersRaw = get('taMembers');
  const taMembers = taMembersRaw
    ? taMembersRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
    : [];

  const partial: Omit<NormalizedRequisition,
    'timeToApproval'|'agreedTatDays'|'ageingDays'|'pausedDays'|
    'varianceDays'|'isBreached'|'ageingStatus'|'isInferredTat'|'isPaused'> = {
    id,
    raisedDate,
    approvedDate,
    agreedDeadline,
    requestDoj,
    deadlineSource,
    positions: getNum('positions') ?? 1,
    status,
    rawStatus,
    division: get('division') || 'Unknown',
    function: get('function') || '',
    designation: get('designation') || '',
    location: get('location') || '',
    project: get('project') || '',
    requestor: get('requestor') || '',
    reportingManager: get('reportingManager') || '',
    salaryType: get('salaryType') || '',
    workmode: get('workmode') || '',
    positionType: get('positionType') || '',
    natureOfVacancy: get('natureOfVacancy') || '',
    taMembers,
    sourcingCnt: getNum('sourcingCnt'),
    shortlistedCnt: getNum('shortlistedCnt'),
    inInterviewCnt: getNum('inInterviewCnt'),
    selectedCnt: getNum('selectedCnt'),
    offeredCnt: getNum('offeredCnt'),
    offerAcceptedCnt: getNum('offerAcceptedCnt'),
    joinedCnt: getNum('joinedCnt'),
    snapshotId,
    asOfDate,
  };

  const computed = computeMetrics(partial, settings);
  const req: NormalizedRequisition = { ...partial, ...computed };
  const warnings: string[] = [];

  return { req, warnings };
}

// ─── Column map builder ───────────────────────────────────────────────────────
function buildColumnMap(headers: string[]): {
  colMap: Record<string, string>;
  mapped: string[];
  unmapped: string[];
} {
  const colMap: Record<string, string> = {}; // canonical → original header
  const mapped: string[] = [];
  const unmapped: string[] = [];

  for (const h of headers) {
    const canon = resolveCol(h);
    if (canon && !colMap[canon]) {
      colMap[canon] = h;
      mapped.push(h);
    } else {
      unmapped.push(h);
    }
  }

  return { colMap, mapped, unmapped };
}

// ─── Main parse entry ─────────────────────────────────────────────────────────
export function parseRows(
  rows: Record<string, unknown>[],
  headers: string[],
  snapshotId: string,
  asOfDate: Date,
  settings: AppSettings = DEFAULT_SETTINGS
): ParseResult {

  const { colMap, mapped, unmapped } = buildColumnMap(headers);

  const requiredCols = ['id', 'raisedDate'];
  const missingRequired = requiredCols.filter(c => !colMap[c]);

  const requisitions: NormalizedRequisition[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let skippedRows = 0;
  let inferredTatCount = 0;
  let unassignedCount = 0;

  if (missingRequired.length > 0) {
    errors.push(`Missing required columns: ${missingRequired.join(', ')} — check column names`);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Skip completely empty rows
    if (Object.values(row).every(v => !v || String(v).trim() === '')) {
      skippedRows++;
      continue;
    }

    const result = parseRow(row, colMap, snapshotId, asOfDate, settings, i + 2);

    if ('error' in result) {
      errors.push(`Row ${i + 2}: ${result.error}`);
      skippedRows++;
    } else {
      requisitions.push(result.req);
      if (result.warnings.length) warnings.push(...result.warnings.map(w => `Row ${i+2}: ${w}`));
      if (result.req.isInferredTat) inferredTatCount++;
      if (result.req.taMembers.length === 0) unassignedCount++;
    }
  }

  return {
    requisitions,
    warnings,
    errors,
    skippedRows,
    inferredTatCount,
    unassignedCount,
    columnsMapped: mapped,
    columnsUnrecognized: unmapped,
  };
}

// ─── CSV → rows (PapaParse wrapper) ──────────────────────────────────────────
export async function parseCSV(
  file: File,
  snapshotId: string,
  asOfDate: Date,
  settings?: AppSettings
): Promise<ParseResult> {
  const Papa = (await import('papaparse')).default;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        resolve(parseRows(results.data as Record<string, unknown>[], headers, snapshotId, asOfDate, settings));
      },
      error: (err: Error) => reject(err),
    });
  });
}

// ─── XLSX → rows ───────────────────────────────────────────────────────────────
export async function parseXLSX(
  file: File,
  snapshotId: string,
  asOfDate: Date,
  settings?: AppSettings
): Promise<ParseResult> {
  const XLSX = await import('xlsx');

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  if (raw.length === 0) {
    return {
      requisitions: [], warnings: ['Spreadsheet appears empty'], errors: [],
      skippedRows: 0, inferredTatCount: 0, unassignedCount: 0,
      columnsMapped: [], columnsUnrecognized: [],
    };
  }

  // Convert Date objects from cellDates to ISO strings so parseDate handles them
  const rows = raw.map(row => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
    }
    return out;
  });

  const headers = Object.keys(raw[0]);
  return parseRows(rows, headers, snapshotId, asOfDate, settings);
}

export async function parseFile(
  file: File,
  snapshotId: string,
  asOfDate: Date,
  settings?: AppSettings
): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSV(file, snapshotId, asOfDate, settings);
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file, snapshotId, asOfDate, settings);
  throw new Error(`Unsupported file type: .${ext} — upload CSV or XLSX`);
}
