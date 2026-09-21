'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface Bucket { label: string; count: number; breachedCount: number; }

interface Props { buckets: Bucket[]; }

export default function AgeingBar({ buckets }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={buckets} margin={{ top:4, right:12, bottom:0, left:0 }} barSize={40}>
        <CartesianGrid vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="label" tick={{ fontSize:11, fill:'#64748B', fontFamily:"'Noto Sans',sans-serif" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:11, fill:'#94A3B8', fontFamily:"'Noto Sans',sans-serif" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontFamily:"'Noto Sans',sans-serif", fontSize:13, borderRadius:8 }}
          formatter={(v: number, name: string) => [v, name === 'count' ? 'Total' : 'Breached']}
        />
        <Legend wrapperStyle={{ fontSize:12, fontFamily:"'Noto Sans',sans-serif" }}
          formatter={(v) => v === 'count' ? 'Total Active' : 'Breached'} />
        <Bar dataKey="count" fill="#2563EB" radius={[4,4,0,0]} name="count" />
        <Bar dataKey="breachedCount" fill="#DC2626" radius={[4,4,0,0]} name="breachedCount" />
      </BarChart>
    </ResponsiveContainer>
  );
}
