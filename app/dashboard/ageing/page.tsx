'use client';
import { useActiveSnapshot, useAppStore } from '@/lib/store';
import { buildAgeingBuckets } from '@/lib/metrics';
import { formatDate } from '@/lib/businessDays';
import { Card, CardHeader, StatusBadge, VarianceBadge, InferredBadge, EmptyState } from '@/components/ui';
import AgeingBar from '@/components/charts/AgeingBar';
import { Upload, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgeingPage() {
  const router = useRouter();
  const snap = useActiveSnapshot();
  const { settings } = useAppStore();

  if (!snap) {
    return (
      <EmptyState
        icon={<Upload size={36} />}
        title="No data yet"
        message="Upload a snapshot to view ageing analysis."
        action={<button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}><Upload size={14} /> Upload snapshot</button>}
      />
    );
  }

  const reqs = snap.requisitions;
  const buckets = buildAgeingBuckets(reqs, settings.ageBuckets);

  const activeReqs = reqs.filter(r => ['Open','In Progress'].includes(r.status));
  const sortedByAge = [...activeReqs]
    .filter(r => r.ageingDays !== null)
    .sort((a, b) => (b.ageingDays ?? 0) - (a.ageingDays ?? 0));

  const breachedReqs = sortedByAge.filter(r => r.isBreached);
  const atRiskReqs = sortedByAge.filter(r => r.ageingStatus === 'amber');

  // Approval lag: time from raised to approved
  const withApprovalLag = reqs
    .filter(r => r.timeToApproval !== null && r.timeToApproval > 0)
    .sort((a, b) => (b.timeToApproval ?? 0) - (a.timeToApproval ?? 0));

  const avgApprovalLag = withApprovalLag.length
    ? Math.round(withApprovalLag.reduce((s, r) => s + (r.timeToApproval ?? 0), 0) / withApprovalLag.length)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Ageing & TAT Analysis</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Active requisitions · business days only</p>
      </div>

      {/* Ageing bar chart */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Age Distribution" subtitle={`${activeReqs.length} active requisitions`} />
        <AgeingBar buckets={buckets} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Breached */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#DC2626' }}>
              🔴 Breached ({breachedReqs.length})
            </div>
          </div>
          {breachedReqs.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No breached requisitions</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Division</th>
                  <th style={{ textAlign: 'right' }}>Age (d)</th>
                  <th style={{ textAlign: 'right' }}>Over by (d)</th>
                </tr>
              </thead>
              <tbody>
                {breachedReqs.slice(0, 10).map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{r.id}</td>
                    <td style={{ fontSize: 12 }}>{r.division}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.ageingDays}</td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontWeight: 700 }}>
                      +{Math.abs(r.varianceDays ?? 0)}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* At risk */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#D97706' }}>
              🟡 At Risk ({atRiskReqs.length})
            </div>
          </div>
          {atRiskReqs.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No at-risk requisitions</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Division</th>
                  <th style={{ textAlign: 'right' }}>Age (d)</th>
                  <th style={{ textAlign: 'right' }}>Remaining (d)</th>
                </tr>
              </thead>
              <tbody>
                {atRiskReqs.slice(0, 10).map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#D97706' }}>{r.id}</td>
                    <td style={{ fontSize: 12 }}>{r.division}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.ageingDays}</td>
                    <td style={{ textAlign: 'right', color: '#D97706', fontWeight: 600 }}>{r.varianceDays ?? '—'}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Most aged active */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Most Aged Active Requisitions" subtitle="Top 15 by business-day age, active only" />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Designation</th>
                <th>Division</th>
                <th>Status</th>
                <th>TA</th>
                <th style={{ textAlign: 'right' }}>Age (d)</th>
                <th style={{ textAlign: 'right' }}>TAT (d)</th>
                <th>Variance</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {sortedByAge.slice(0, 15).map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#0F4C81' }}>{r.id}</td>
                  <td style={{ fontSize: 12 }}>{r.designation}</td>
                  <td style={{ fontSize: 12 }}>{r.division}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: 12 }}>{r.taMembers.join(', ') || <span style={{ color: '#94A3B8' }}>Unassigned</span>}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.ageingDays}</td>
                  <td style={{ textAlign: 'right', color: '#64748B' }}>{r.agreedTatDays ?? '—'}</td>
                  <td><VarianceBadge variance={r.varianceDays} ageingStatus={r.ageingStatus} /></td>
                  <td>{r.isInferredTat && <InferredBadge />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval lag */}
      <Card>
        <CardHeader
          title="Approval Lag"
          subtitle={`Time from req raised → HR approved · avg: ${avgApprovalLag !== null ? avgApprovalLag + 'd' : '—'}`}
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Division</th>
                <th>Raised</th>
                <th>Approved</th>
                <th style={{ textAlign: 'right' }}>Lag (biz days)</th>
              </tr>
            </thead>
            <tbody>
              {withApprovalLag.slice(0, 10).map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#0F4C81' }}>{r.id}</td>
                  <td style={{ fontSize: 12 }}>{r.division}</td>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{r.raisedDate ? formatDate(r.raisedDate) : '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{r.approvedDate ? formatDate(r.approvedDate) : '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: r.timeToApproval! > 5 ? '#D97706' : '#0F172A' }}>
                    {r.timeToApproval}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
