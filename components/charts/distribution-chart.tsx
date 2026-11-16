'use client';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STATE_UI } from '@/components/ui/state-badge';

export interface DistRow { skill: string; name: string; not_yet: number; developing: number; consistent: number; insufficient: number }

const ORDER = ['not_yet', 'developing', 'consistent', 'insufficient'] as const;

/** Stacked horizontal bars: learners per state for each skill. Includes a text table for screen readers. */
export function DistributionChart({ data, title }: { data: DistRow[]; title: string }) {
  const height = Math.max(180, data.length * 40 + 60);
  return (
    <figure>
      <figcaption className="mb-2 font-semibold">{title}</figcaption>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke="#E4DFD6" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#55646A' }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 13, fill: '#1B2A2F' }} />
            <Tooltip cursor={{ fill: '#F2EEE6' }} contentStyle={{ borderRadius: 12, border: '1px solid #E4DFD6', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {ORDER.map((k) => <Bar key={k} dataKey={k} name={STATE_UI[k].short} stackId="a" fill={STATE_UI[k].fill} radius={0} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th>Skill</th>{ORDER.map((k) => <th key={k}>{STATE_UI[k].label}</th>)}</tr></thead>
        <tbody>{data.map((r) => <tr key={r.skill}><td>{r.name}</td>{ORDER.map((k) => <td key={k}>{r[k]}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}
