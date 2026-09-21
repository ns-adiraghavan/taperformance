'use client';
import { useRouter } from 'next/navigation';
import { useActiveSnapshot } from '@/lib/store';
import { buildDivisionSummary, buildFunnelMetrics, buildBreachSummary } from '@/lib/metrics';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import FunnelChart, { FunnelRates } from '@/components/charts/FunnelChart';
import BreachPie from '@/components/charts/BreachPie';
import { Upload, TrendingUp, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function OverviewPage() {
  const router = useRouter();
  const snap = useActiveSnapshot();

  if (!snap) {
    return (
      <EmptyState
        icon={<Upload size={36} />}
        title="No data yet"
        message="Upload your first CoEfficient export to get started."
        action={<button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}><Upload size={14} /> Upload snapshot</button>}
      />
    );
  }

  const reqs = snap.requisitions;
  const divSummary = buildDivisionSummary(reqs);
  const funnel = buildFunnelMetrics(reqs);
  const breach = buildBreachSummary(reqs);

  const active = reqs.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  const closedFilled = reqs.filter(r => r.status === 'Closed-Filled').length;
  const breachedCount = reqs.filter(r => r.isBreached).length;
  const avgAgeActive = (() => {
    const activeReqs = reqs.filter(r => (r.status === 'Open' || r.status === 'In Progress') && r.ageingDays != null);
    if (!activeReqs.length) return null;
    return Math.round(activeReqs.reduce((s, r) => s + (r.ageingDays ?? 0), 0) / activeReqs.length);
  })();

  const kpis = [
    { label: 'Total Requisitions', value: reqs.length, icon: <Users size={18} />, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Active', value: active, icon: <TrendingUp size={18} />, color: '#0891B2', bg: '#E0F7FA' },
    { label: 'Closed / Filled', value: closedFilled, icon: <CheckCircle size={18} />, color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Breached', value: breachedCount, icon: <AlertTriangle size={18} />, color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Avg Age (active, biz days)', value: avgAgeActive != null ? `${avgAgeActive}d` : '—', icon: <Clock size={18} />, color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Overview</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          {snap.label} · {reqs.length} requisitions
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 10 }}>{k.label}</div>
              <div style={{ background: k.bg, color: k.color, borderRadius: 6, padding: '4px 6px', display: 'flex' }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 28 }}>
        <Card>
          <CardHeader title="Recruitment Funnel" subtitle="Aggregated pipeline across all active requisitions" />
          <FunnelChart {...funnel} />
          <FunnelRates {...funnel} />
        </Card>
        <Card>
          <CardHeader title="TAT Status" subtitle="Active requisitions only" />
          <BreachPie green={breach.green} amber={breach.amber} red={breach.red} na={breach.na} />
        </Card>
      </div>

      {/* Division summary */}
      <Card>
        <CardHeader title="Division Summary" />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Division</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Active</th>
                <th style={{ textAlign: 'right' }}>Filled</th>
                <th style={{ textAlign: 'right' }}>Breached</th>
                <th style={{ textAlign: 'right' }}>Avg Age (d)</th>
              </tr>
            </thead>
            <tbody>
              {divSummary.map(d => (
                <tr key={d.division}>
                  <td style={{ fontWeight: 600 }}>{d.division}</td>
                  <td style={{ textAlign: 'right' }}>{d.total}</td>
                  <td style={{ textAlign: 'right' }}>{d.active}</td>
                  <td style={{ textAlign: 'right' }}>{d.filled}</td>
                  <td style={{ textAlign: 'right' }}>
                    {d.breached > 0
                      ? <span style={{ color: '#DC2626', fontWeight: 600 }}>{d.breached}</span>
                      : <span style={{ color: '#94A3B8' }}>0</span>}
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748B' }}>{d.avgAge != null ? d.avgAge : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
