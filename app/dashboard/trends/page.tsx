'use client';
import { useAppStore } from '@/lib/store';
import { buildTrend } from '@/lib/metrics';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import TrendChart from '@/components/charts/TrendChart';
import { Upload, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TrendsPage() {
  const router = useRouter();
  const { snapshots } = useAppStore();

  if (snapshots.length === 0) {
    return (
      <EmptyState
        icon={<Upload size={36} />}
        title="No data yet"
        message="Upload your first snapshot to start tracking trends."
        action={<button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}><Upload size={14} /> Upload snapshot</button>}
      />
    );
  }

  if (snapshots.length < 2) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Trends</h1>
        </div>
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '28px 32px', textAlign: 'center' }}>
          <TrendingUp size={32} style={{ color: '#D97706', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>
            Need at least 2 snapshots to show trends
          </div>
          <p style={{ fontSize: 13, color: '#B45309', marginBottom: 16 }}>
            You have {snapshots.length} snapshot so far. Upload another data export for a different date to compare.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}>
            <Upload size={14} /> Upload another snapshot
          </button>
        </div>
      </div>
    );
  }

  const trendData = buildTrend(snapshots);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Trends</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Based on {snapshots.length} snapshots
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <Card>
          <CardHeader title="Profiles Sourced & Closures" />
          <TrendChart data={trendData} metric="sourced" />
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <CardHeader title="Active Requisitions" subtitle="Open + In Progress over time" />
            <TrendChart data={trendData} metric="active" />
          </Card>
          <Card>
            <CardHeader title="Joins" subtitle="Candidates joined per snapshot" />
            <TrendChart data={trendData} metric="joined" />
          </Card>
        </div>

        <Card>
          <CardHeader title="All Metrics Combined" />
          <TrendChart data={trendData} />
        </Card>
      </div>

      {/* Snapshot comparison table */}
      <Card style={{ marginTop: 20 }}>
        <CardHeader title="Snapshot Comparison" />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Snapshot</th>
                <th style={{ textAlign: 'right' }}>Active Reqs</th>
                <th style={{ textAlign: 'right' }}>Closures</th>
                <th style={{ textAlign: 'right' }}>Profiles Sourced</th>
                <th style={{ textAlign: 'right' }}>Joins</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((pt, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{pt.label}</div>
                    <div style={{ color: '#94A3B8', fontSize: 11 }}>{snapshots.find(s => s.asOfDate === pt.asOfDate)?.label}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#D97706' }}>{pt.active}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>{pt.closed}</td>
                  <td style={{ textAlign: 'right' }}>{pt.sourced}</td>
                  <td style={{ textAlign: 'right', color: '#7C3AED' }}>{pt.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
