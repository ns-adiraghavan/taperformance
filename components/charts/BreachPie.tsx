'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  green: number;
  amber: number;
  red: number;
  na: number;
}

const SLICES = [
  { key: 'green', label: 'On Track',   color: '#16A34A' },
  { key: 'amber', label: 'At Risk',    color: '#D97706' },
  { key: 'red',   label: 'Breached',   color: '#DC2626' },
  { key: 'na',    label: 'No TAT',     color: '#E2E8F0' },
];

export default function BreachPie(props: Props) {
  const data = SLICES.map(s => ({ ...s, value: props[s.key as keyof Props] }))
    .filter(s => s.value > 0);

  if (data.length === 0) return (
    <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>No data</div>
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%" cy="50%"
          innerRadius={50} outerRadius={80}
          paddingAngle={2}
        >
          {data.map((s, i) => <Cell key={i} fill={s.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ fontFamily:"'Noto Sans',sans-serif", fontSize:13, borderRadius:8 }}
          formatter={(v: number, name: string) => [v, name]}
        />
        <Legend
          iconType="circle" iconSize={8}
          wrapperStyle={{ fontSize:12, fontFamily:"'Noto Sans',sans-serif" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
