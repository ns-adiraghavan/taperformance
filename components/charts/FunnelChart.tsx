'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Props {
  sourced: number;
  shortlisted: number;
  inInterview: number;
  selected: number;
  offered: number;
  offerAccepted: number;
  joined: number;
}

const COLORS = ['#2563EB','#0891B2','#059669','#16A34A','#65A30D','#CA8A04','#B45309'];

export default function FunnelChart(props: Props) {
  const data = [
    { stage: 'Sourced',        count: props.sourced },
    { stage: 'Shortlisted',   count: props.shortlisted },
    { stage: 'In Interview',  count: props.inInterview },
    { stage: 'Selected',      count: props.selected },
    { stage: 'Offered',       count: props.offered },
    { stage: 'Offer Accept.', count: props.offerAccepted },
    { stage: 'Joined',        count: props.joined },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top:4, right:12, bottom:0, left:0 }}
        barSize={36}
      >
        <CartesianGrid vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="stage" tick={{ fontSize:11, fill:'#64748B', fontFamily:"'Noto Sans',sans-serif" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:11, fill:'#94A3B8', fontFamily:"'Noto Sans',sans-serif" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontFamily:"'Noto Sans',sans-serif", fontSize:13, borderRadius:8, border:'1px solid #E2E8F0' }}
          formatter={(v: number) => [v.toLocaleString(), 'Profiles']}
          cursor={{ fill:'#F8FAFC' }}
        />
        <Bar dataKey="count" radius={[4,4,0,0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Conversion rates row ────────────────────────────────────────────────────
export function FunnelRates(props: Props) {
  function rate(a: number, b: number) {
    if (!a || !b) return '—';
    return Math.round((b / a) * 100) + '%';
  }
  const stages = [
    { label: 'Shortlist rate', val: rate(props.sourced, props.shortlisted) },
    { label: 'Interview rate', val: rate(props.shortlisted, props.inInterview) },
    { label: 'Select rate',    val: rate(props.inInterview, props.selected) },
    { label: 'Offer rate',     val: rate(props.selected, props.offered) },
    { label: 'Acceptance',     val: rate(props.offered, props.offerAccepted) },
    { label: 'Yield (S→J)',    val: rate(props.sourced, props.joined) },
  ];
  return (
    <div style={{ display:'flex', gap:16, flexWrap:'wrap', padding:'12px 0 0' }}>
      {stages.map(s => (
        <div key={s.label} style={{ fontSize:12 }}>
          <span style={{ color:'#94A3B8' }}>{s.label}: </span>
          <span style={{ fontWeight:700, color:'#0F172A' }}>{s.val}</span>
        </div>
      ))}
    </div>
  );
}
