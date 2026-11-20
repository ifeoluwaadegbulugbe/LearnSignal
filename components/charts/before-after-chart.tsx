'use client';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BeforeAfterPoint { label: string; [skill: string]: number | string }
const COLORS = ['#5B3FE0', '#12B3A8', '#3D9BFF', '#FF7A2F', '#F06A9B', '#6A7391'];

/** BeforeAfterLine: soft area under each line, tooltip, text summary and table toggle. */
export function BeforeAfterChart({ data, skills, title }: { data: BeforeAfterPoint[]; skills: { id: string; name: string }[]; title: string }) {
  const [table, setTable] = useState(false);
  const summary = skills.map((s) => `${s.name}: ${data.map((d) => `${d.label} ${d[s.id] ?? '—'}%`).join(' → ')}`).join('; ');
  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-[16px] font-semibold">{title}</figcaption>
        <button onClick={() => setTable((t) => !t)} className="text-[12px] font-semibold text-primary underline-offset-4 hover:underline">{table ? 'View as chart' : 'View as table'}</button>
      </div>
      {table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] text-ink-3"><tr><th className="py-2 font-medium">Session</th>{skills.map((s) => <th key={s.id} className="font-medium">{s.name}</th>)}</tr></thead>
            <tbody className="divide-y divide-line tabular">{data.map((d) => <tr key={d.label} className="h-10"><td>{d.label}</td>{skills.map((s) => <td key={s.id}>{d[s.id] ?? '—'}{d[s.id] !== undefined ? '%' : ''}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <>
          <p className="sr-only">{summary}</p>
          <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1" aria-hidden>
            {skills.map((s, i) => <li key={s.id} className="flex items-center gap-1.5 text-[12px] text-ink-2"><span className="h-0.5 w-4 rounded" style={{ background: COLORS[i % COLORS.length] }} />{s.name}</li>)}
          </ul>
          <div className="h-60" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart accessibilityLayer={false} data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <defs>{skills.map((s, i) => (
                  <linearGradient key={s.id} id={`ba-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.18} /><stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}</defs>
                <XAxis dataKey="label" axisLine={{ stroke: 'var(--line)' }} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} />
                <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} width={44} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: 'var(--shadow-pop)', fontSize: 12 }} />
                {skills.map((s, i) => <Area key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} fill={`url(#ba-${s.id})`} dot={{ r: 4, strokeWidth: 0, fill: COLORS[i % COLORS.length] }} connectNulls />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </figure>
  );
}
