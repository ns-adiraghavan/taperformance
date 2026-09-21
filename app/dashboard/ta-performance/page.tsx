'use client';
import { useActiveSnapshot } from '@/lib/store';
import { buildTAPerformance } from '@/lib/metrics';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TAPerformancePage() {
  const router = useRouter();
  const snap = useActiveSnapshot();

  if (!snap) {
    return (
      <EmptyState
        icon={<Upload size={36} />}
        title="No data yet"
        message="Upload a snapshot to see TA performance."
        action={<button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}><Upload size={14} /> Upload snapshot</button>}
      />
    );
  }

  const rows = buildTAPerformance(snap.requisitions);
  const totalReqs = snap.requisitions.length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>TA Performance</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Credited counts: each TA in a requisition's team gets full credit. Totals may exceed {totalReqs} (deduped at requisition level).
        </p>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>TA Name</th>
                <th style={{ textAlign: 'right' }}>Credited Reqs</th>
                <th style={{ textAlign: 'right' }}>Open</th>
                <th style={{ textAlign: 'right' }}>In Progress</th>
                <th style={{ textAlign: 'right' }}>Filled</th>
                <th style={{ textAlign: 'right' }}>Cancelled</th>
                <th style={{ textAlign: 'right' }}>Breached</th>
                <th style={{ textAlign: 'right' }}>Sourced</th>
                <th style={{ textAlign: 'right' }}>Joined</th>
                <th style={{ textAlign: 'right' }}>Yield %</th>
                <th style={{ textAlign: 'right' }}>Avg TAT Closed (d)</th>
                <th style={{ textAlign: 'right' }}>Avg Age Open (d)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(ta => (
                <tr key={ta.taName} style={{ background: ta.taName === 'Unassigned' ? '#FAFAFA' : undefined }}>
                  <td style={{ fontWeight: 600, color: ta.taName === 'Unassigned' ? '#94A3B8' : '#0F172A' }}>
                    {ta.taName}
                    {ta.taName === 'Unassigned' && (
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400, marginLeft: 6 }}>(no TA assigned)</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{ta.creditedReqs}</td>
                  <td style={{ textAlign: 'right', color: '#0891B2' }}>{ta.openReqs}</td>
                  <td style={{ textAlign: 'right', color: '#2563EB' }}>{ta.inProgressReqs}</td>
                  <td style={{ textAlign: 'right', color: '#16A34A' }}>{ta.closedReqs}</td>
                  <td style={{ textAlign: 'right', color: '#94A3B8' }}>{ta.cancelledReqs}</td>
                  <td style={{ textAlign: 'right' }}>
                    {ta.breachedReqs > 0
                      ? <span style={{ color: '#DC2626', fontWeight: 700 }}>{ta.breachedReqs}</span>
                      : <span style={{ color: '#94A3B8' }}>0</span>
                    }
                  </td>
                  <td style={{ textAlign: 'right' }}>{ta.sourcedProfiles || '—'}</td>
                  <td style={{ textAlign: 'right', color: '#7C3AED' }}>{ta.joinedCount || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {ta.funnelYield !== null ? <span style={{ fontWeight: 600 }}>{ta.funnelYield}%</span> : '—'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748B' }}>{ta.avgTatOfClosed ?? '—'}</td>
                  <td style={{ textAlign: 'right', color: '#64748B' }}>{ta.avgAgeingOfOpen ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
        * Credited Reqs: each TA in a shared requisition receives full credit. Avg TAT / Age expressed in business days.
      </div>
    </div>
  );
}
