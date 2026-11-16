'use client';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BeforeAfterPoint { label: string; [skill: string]: number | string }
const COLORS = ['#0F6B5C', '#F2A93B', '#3A86C8', '#8A5410', '#2E9E6B', '#55646A'];

/** % correct per skill across sessions (before → after). Text table included for screen readers. */
export function BeforeAfterChart({ data, skills, title }: { data: BeforeAfterPoint[]; skills: { id: string; name: string }[]; title: string }) {
  return (
    <figure>
      <figcaption className="mb-2 font-semibold">{title}</figcaption>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid stroke="#E4DFD6" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#55646A' }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#55646A' }} width={44} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #E4DFD6', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {skills.map((s, i) => <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th>Session</th>{skills.map((s) => <th key={s.id}>{s.name}</th>)}</tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td>{skills.map((s) => <td key={s.id}>{d[s.id] ?? '—'}%</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}
