'use client';
import { useState, useMemo } from 'react';
import { useActiveSnapshot } from '@/lib/store';
import { NormalizedRequisition } from '@/lib/types';
import { exportToExcel } from '@/lib/export';
import { formatDate } from '@/lib/businessDays';
import { StatusBadge, VarianceBadge, InferredBadge, PausedBadge, FilterBar, EmptyState, Card } from '@/components/ui';
import { Download, Upload, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SortKey = 'id' | 'status' | 'division' | 'ageingDays' | 'varianceDays' | 'raisedDate';

export default function RequisitionsPage() {
  const router = useRouter();
  const snap = useActiveSnapshot();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterTA, setFilterTA] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('varianceDays');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!snap) {
    return (
      <EmptyState
        icon={<Upload size={36} />}
        title="No data yet"
        message="Upload a CoEfficient export to view requisitions."
        action={<button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}><Upload size={14} /> Upload snapshot</button>}
      />
    );
  }

  const reqs = snap.requisitions;

  const statuses = useMemo(() => Array.from(new Set(reqs.map(r => r.status))).sort(), [reqs]);
  const divisions = useMemo(() => Array.from(new Set(reqs.map(r => r.division).filter(Boolean))).sort(), [reqs]);
  const tas = useMemo(() => {
    const set = new Set<string>();
    reqs.forEach(r => r.taMembers.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [reqs]);

  const filtered = useMemo(() => {
    let rows = [...reqs];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.division.toLowerCase().includes(q) ||
        r.taMembers.join(' ').toLowerCase().includes(q)
      );
    }
    if (filterStatus) rows = rows.filter(r => r.status === filterStatus);
    if (filterDivision) rows = rows.filter(r => r.division === filterDivision);
    if (filterTA) rows = rows.filter(r => r.taMembers.includes(filterTA));

    rows.sort((a, b) => {
      let av: number | string | null = 0, bv: number | string | null = 0;
      if (sortKey === 'id')          { av = a.id; bv = b.id; }
      if (sortKey === 'status')      { av = a.status; bv = b.status; }
      if (sortKey === 'division')    { av = a.division; bv = b.division; }
      if (sortKey === 'ageingDays')  { av = a.ageingDays ?? 9999; bv = b.ageingDays ?? 9999; }
      if (sortKey === 'varianceDays'){ av = a.varianceDays ?? 9999; bv = b.varianceDays ?? 9999; }
      if (sortKey === 'raisedDate')  { av = a.raisedDate ? +a.raisedDate : 0; bv = b.raisedDate ? +b.raisedDate : 0; }
      if (av === null) av = 9999;
      if (bv === null) bv = 9999;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [reqs, search, filterStatus, filterDivision, filterTA, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortTh({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <th onClick={() => toggleSort(k)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  const anyFilter = search || filterStatus || filterDivision || filterTA;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Requisitions</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{filtered.length} of {reqs.length} shown</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => exportToExcel(filtered, `requisitions_${snap.id}.xlsx`)}
        >
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Table with inline filters */}
      <Card style={{ padding: 0 }}>
        <FilterBar>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="input"
              placeholder="Search ID, role, division, TA…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>

          <select className="input" style={{ width: 170 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="input" style={{ width: 160 }} value={filterDivision} onChange={e => setFilterDivision(e.target.value)}>
            <option value="">All divisions</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="input" style={{ width: 180 }} value={filterTA} onChange={e => setFilterTA(e.target.value)}>
            <option value="">All TAs</option>
            {tas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {anyFilter && (
            <button className="btn btn-ghost" style={{ height: 36 }} onClick={() => { setSearch(''); setFilterStatus(''); setFilterDivision(''); setFilterTA(''); }}>
              <X size={14} /> Clear
            </button>
          )}
        </FilterBar>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortTh k="id" label="Req ID" />
                <th>Designation</th>
                <SortTh k="division" label="Division" />
                <SortTh k="status" label="Status" />
                <th>TA</th>
                <SortTh k="raisedDate" label="Raised" />
                <th>Approved</th>
                <SortTh k="ageingDays" label="Age (d)" />
                <th>TAT (d)</th>
                <SortTh k="varianceDays" label="Variance" />
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <>
                  <tr
                    key={r.id}
                    onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                    style={{
                      cursor: 'pointer',
                      background: r.isBreached ? '#FFF5F5' : expandedRow === r.id ? '#F8FAFC' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 600, color: '#0F4C81', fontFamily: 'monospace', fontSize: 12 }}>{r.id}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.designation}</td>
                    <td style={{ fontSize: 12 }}>{r.division}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: 12 }}>{r.taMembers.length > 0 ? r.taMembers.join(', ') : <span style={{ color: '#94A3B8' }}>Unassigned</span>}</td>
                    <td style={{ fontSize: 12, color: '#64748B' }}>{r.raisedDate ? formatDate(r.raisedDate) : '—'}</td>
                    <td style={{ fontSize: 12, color: '#64748B' }}>{r.approvedDate ? formatDate(r.approvedDate) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.ageingDays ?? '—'}</td>
                    <td style={{ textAlign: 'right', color: '#64748B' }}>{r.agreedTatDays ?? '—'}</td>
                    <td><VarianceBadge variance={r.varianceDays} ageingStatus={r.ageingStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {r.isInferredTat && <InferredBadge />}
                        {r.isPaused && <PausedBadge />}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === r.id && (
                    <tr key={`${r.id}-exp`}>
                      <td colSpan={11} style={{ background: '#F8FAFC', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                        <ReqDetail req={r} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>
                    No requisitions match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReqDetail({ req }: { req: NormalizedRequisition }) {
  const fields = [
    { label: 'Location', value: req.location },
    { label: 'Function', value: req.function },
    { label: 'Project', value: req.project },
    { label: 'Requestor', value: req.requestor },
    { label: 'Reporting Manager', value: req.reportingManager },
    { label: 'Nature of Vacancy', value: req.natureOfVacancy },
    { label: 'Position Type', value: req.positionType },
    { label: 'Work Mode', value: req.workmode },
    { label: 'Salary Type', value: req.salaryType },
    { label: 'Positions', value: req.positions },
    { label: 'Deadline Source', value: req.deadlineSource === 'agreed_tat' ? 'Agreed TAT' : req.deadlineSource === 'request_doj' ? 'Request DOJ (inferred)' : '—' },
    { label: 'Time to Approval (biz days)', value: req.timeToApproval ?? '—' },
    { label: 'Paused Days', value: req.pausedDays },
    { label: 'Sourced', value: req.sourcingCnt ?? '—' },
    { label: 'Shortlisted', value: req.shortlistedCnt ?? '—' },
    { label: 'In Interview', value: req.inInterviewCnt ?? '—' },
    { label: 'Selected', value: req.selectedCnt ?? '—' },
    { label: 'Offered', value: req.offeredCnt ?? '—' },
    { label: 'Offer Accepted', value: req.offerAcceptedCnt ?? '—' },
    { label: 'Joined', value: req.joinedCnt ?? '—' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 24px' }}>
      {fields.map(f => f.value && f.value !== '—' ? (
        <div key={f.label}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
          <div style={{ fontSize: 13, color: '#0F172A', marginTop: 2 }}>{String(f.value)}</div>
        </div>
      ) : null)}
    </div>
  );
}
