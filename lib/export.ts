'use client';
import { NormalizedRequisition } from './types';
import { formatDate } from './businessDays';

export async function exportToExcel(
  reqs: NormalizedRequisition[],
  filename = 'TA_Report.xlsx'
): Promise<void> {
  const XLSX = await import('xlsx');

  const data = reqs.map((r) => ({
    'Req ID': r.id,
    'Division': r.division,
    'Function': r.function,
    'Designation': r.designation,
    'Location': r.location,
    'Project': r.project,
    'Requestor': r.requestor,
    'Raised': formatDate(r.raisedDate),
    'Approved': formatDate(r.approvedDate),
    'Time-to-Approval (biz days)': r.timeToApproval ?? '—',
    'Agreed Deadline': formatDate(r.agreedDeadline),
    'Inferred TAT?': r.isInferredTat ? 'Yes' : 'No',
    'Agreed TAT (biz days)': r.agreedTatDays ?? '—',
    'Ageing (biz days)': r.ageingDays ?? '—',
    'Variance (biz days)': r.varianceDays ?? '—',
    'Breach?': r.isBreached ? 'Yes' : 'No',
    'Status': r.status,
    'Positions': r.positions,
    'TA Members': r.taMembers.join(', ') || 'Unassigned',
    'Sourced': r.sourcingCnt ?? '',
    'Shortlisted': r.shortlistedCnt ?? '',
    'In Interview': r.inInterviewCnt ?? '',
    'Selected': r.selectedCnt ?? '',
    'Offered': r.offeredCnt ?? '',
    'Offer Accepted': r.offerAcceptedCnt ?? '',
    'Joined': r.joinedCnt ?? '',
    'As-of Date': formatDate(typeof r.asOfDate === 'string' ? new Date(r.asOfDate) : r.asOfDate),
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  const wscols = [
    { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 28 }, { wch: 14 },
    { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
    { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 26 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 10 },
    { wch: 16 },
  ];
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TAT Report');
  XLSX.writeFile(wb, filename);
}

// ─── Sample CSV download ───────────────────────────────────────────────────────
export function downloadSampleTemplate(): void {
  const header = 'ID,Req_Raised,HR_Approval_Date,Agreed_TAT,Request_DOJ,Vacancies,Status,Division,Function,Designation,Location,Requestor,Project,TA_Members,Sourced,Shortlisted,In_Interview,Selected,Offered,Offer_Accepted,Joined\n';
  const row = 'REQ-001,2026-01-10,2026-01-16,2026-03-31,,2,In Progress,Data Analytics,Analytics,Research Analyst,Mumbai,Abhijit Gupta,Client Intel,Priya Nair,28,8,4,1,1,1,0\n';
  const blob = new Blob([header + row], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'requisitions_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
