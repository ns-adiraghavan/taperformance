'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendPoint } from '@/lib/metrics';

interface Props {
  data: TrendPoint[];
  metric?: 'sourced' | 'closed' | 'active' | 'joined';
}

const COLORS = {
  sourced: '#2563EB',
  closed:  '#16A34A',
  active:  '#D97706',
  joined:  '#7C3AED',
};

const LABELS = {
  sourced: 'Profiles Sourced',
  closed:  'Closures',
  active:  'Active Reqs',
  joined:  'Joins',
};

export default function TrendChart({ data, metric }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top:4, right:20, bottom:0, left:0 }}>
        <CartesianGrid stroke="#F1F5F9" />
        <XAxis dataKey="label" tick={{ fontSize:11, fill:'#64748B', fontFamily:"'Noto Sans',sans-serif" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:11, fill:'#94A3B8', fontFamily:"'Noto Sans',sans-serif" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontFamily:"'Noto Sans',sans-serif", fontSize:13, borderRadius:8, border:'1px solid #E2E8F0' }} />
        <Legend wrapperStyle={{ fontSize:12, fontFamily:"'Noto Sans',sans-serif" }} />

        {(!metric || metric === 'sourced') && (
          <Line type="monotone" dataKey="sourced" name={LABELS.sourced}
            stroke={COLORS.sourced} strokeWidth={2} dot={{ r:4 }} activeDot={{ r:6 }} />
        )}
        {(!metric || metric === 'closed') && (
          <Line type="monotone" dataKey="closed" name={LABELS.closed}
            stroke={COLORS.closed} strokeWidth={2} dot={{ r:4 }} activeDot={{ r:6 }} />
        )}
        {(!metric || metric === 'active') && (
          <Line type="monotone" dataKey="active" name={LABELS.active}
            stroke={COLORS.active} strokeWidth={2} strokeDasharray="4 4" dot={{ r:4 }} activeDot={{ r:6 }} />
        )}
        {(!metric || metric === 'joined') && (
          <Line type="monotone" dataKey="joined" name={LABELS.joined}
            stroke={COLORS.joined} strokeWidth={2} dot={{ r:4 }} activeDot={{ r:6 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
