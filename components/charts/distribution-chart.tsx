'use client';
import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STATUS } from '@/components/ui/status';

export interface DistRow { skill: string; name: string; not_yet: number; developing: number; consistent: number; insufficient: number }
const ORDER = ['not_yet', 'developing', 'consistent', 'insufficient'] as const;

/** StateDistributionBar: stacked horizontal bars per skill, legend with counts, text summary and table toggle. */
export function DistributionChart({ data, title, hideTitle }: { data: DistRow[]; title: string; hideTitle?: boolean }) {
  const [table, setTable] = useState(false);
  const totals = ORDER.map((k) => ({ k, n: data.reduce((s, r) => s + r[k], 0) }));
  const height = Math.max(160, data.length * 38 + 16);
  const summary = data.map((r) => `${r.name}: ${r.consistent} consistent, ${r.developing} developing, ${r.not_yet} not yet`).join('; ');
  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {!hideTitle ? <figcaption className="text-[16px] font-semibold">{title}</figcaption> : <figcaption className="sr-only">{title}</figcaption>}
        <button onClick={() => setTable((t) => !t)} className="text-[12px] font-semibold text-primary underline-offset-4 hover:underline">{table ? 'View as chart' : 'View as table'}</button>
      </div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
        {totals.map(({ k, n }) => (
          <li key={k} className="flex items-center gap-1.5 text-[12px] text-ink-2"><span className="size-2.5 rounded-full" style={{ background: STATUS[k].fill }} aria-hidden />{STATUS[k].short} <b className="tabular text-ink">{n}</b></li>
        ))}
      </ul>
      {table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] text-ink-3"><tr><th className="py-2 font-medium">Skill</th>{ORDER.map((k) => <th key={k} className="font-medium">{STATUS[k].short}</th>)}</tr></thead>
            <tbody className="divide-y divide-line tabular">{data.map((r) => <tr key={r.skill} className="h-10"><td>{r.name}</td>{ORDER.map((k) => <td key={k}>{r[k]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <>
          <p className="sr-only">{summary}</p>
          <div style={{ height }} aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }} barCategoryGap={10}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={104} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-2)' }} />
                <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: 'var(--shadow-pop)', fontSize: 12 }} />
                {ORDER.map((k, i) => <Bar key={k} dataKey={k} name={STATUS[k].short} stackId="a" fill={STATUS[k].fill} radius={i === 0 ? [8, 0, 0, 8] : i === ORDER.length - 1 ? [0, 8, 8, 0] : 0} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </figure>
  );
}
