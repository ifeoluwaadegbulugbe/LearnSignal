'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, Minus, RotateCcw, Download, Printer } from 'lucide-react';
import { SegmentedTabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { IndexCard, Select, SectionHeader, SummaryTiles } from '@/components/ui/primitives';
import { StateBar } from '@/components/ui/viz';
import { Avatar } from '@/components/ui/avatar';
import { CodeChip } from '@/components/ui/code-chip';
import { ClassLadder, type LadderLearner } from '@/components/learner/class-ladder';
import { BeforeAfterChart } from '@/components/charts/before-after-chart';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { cn } from '@/lib/utils';

export type ChangeRow = { id: string; name: string; code: string; up: string[]; retest: string[]; working: { literacy: string | null; numeracy: string | null }; change: 'up' | 'held' | 'retest' };
type Strand = 'literacy' | 'numeracy';

type Counts = { not_yet: number; developing: number; consistent: number; insufficient: number };

export function ProgressView({ ladders, slope, bars, changes, range, classroomName, isDemo, distribution, classroomId }: {
  ladders: { first: LadderLearner[]; latest: LadderLearner[] };
  slope: { id: string; name: string; strand: string; before: number | null; after: number | null; learners: number }[];
  bars: { name: string; skill: string; done: number; total: number }[];
  changes: ChangeRow[]; range: string; classroomName: string; isDemo: boolean;
  distribution: { strand: Strand; counts: Counts }[]; classroomId: string;
}) {
  const [strand, setStrand] = useState<Strand>('numeracy');
  const [which, setWhich] = useState<'first' | 'latest'>('latest');
  const strandSlope = slope.filter((s) => s.strand === strand);
  const [skill, setSkill] = useState<string>('');
  const shown = skill ? strandSlope.filter((s) => s.id === skill) : strandSlope;
  const router = useRouter();
  const path = usePathname();

  const exportCsv = () => {
    const rows = [['learner', 'code', 'change', 'moved up on', 'retest suggested', 'working literacy', 'working numeracy', ...(isDemo ? ['note'] : [])],
      ...changes.map((c) => [c.name, c.code, c.change, c.up.join(' '), c.retest.join(' '), c.working.literacy ?? '', c.working.numeracy ?? '', ...(isDemo ? ['Illustrative sample data'] : [])])];
    const body = rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${classroomName.replace(/\W+/g, '-')}-progress.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <SegmentedTabs label="Strand" value={strand} onChange={(v) => { setStrand(v as Strand); setSkill(''); }} items={[{ id: 'numeracy', label: 'Numeracy' }, { id: 'literacy', label: 'Literacy' }]} />
        <Select aria-label="Date range" className="w-44" value={range} onChange={(e) => router.push(e.target.value === 'all' ? path : `${path}?range=${e.target.value}`)}>
          <option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
        </Select>
        <span className="flex-1" />
        <Button variant="secondary" size="sm" onClick={exportCsv}><Download className="size-4" aria-hidden /> Export CSV</Button>
        <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print</Button>
      </div>

      <SummaryTiles items={[
        { label: 'Moved up on a skill', value: changes.filter((c) => c.change === 'up').length, tone: 'aqua', glyph: 'star', hint: 'demonstrated more than at their first check' },
        { label: 'Held steady', value: changes.filter((c) => c.change === 'held').length, tone: 'violet', glyph: 'dots', hint: 'same state as their first check' },
        { label: 'Re-check suggested', value: changes.filter((c) => c.change === 'retest').length, tone: 'tangerine', glyph: 'eye', hint: 'latest session differs from earlier ones' },
      ]} />

      <section aria-labelledby="dist">
        <SectionHeader id="dist" title="Skill distribution" info="Every skill result now, by state. Click a state to list those learners." />
        <IndexCard>
          <ul className="grid gap-6 md:grid-cols-2">
            {distribution.map((d) => (
              <li key={d.strand}>
                <div className="mb-2 text-[15px] font-semibold capitalize">{d.strand}</div>
                <StateBar counts={d.counts} label={`${d.strand} skill results`} hrefFor={(st) => `/classrooms/${classroomId}/learners?strand=${d.strand}&state=${st}`} />
              </li>
            ))}
          </ul>
        </IndexCard>
      </section>

      <section aria-labelledby="move">
        <SectionHeader id="move" title="How the dots moved" action={
          <SegmentedTabs label="Ladder view" value={which} onChange={(v) => setWhich(v as typeof which)} items={[{ id: 'first', label: 'First check' }, { id: 'latest', label: 'Latest' }]} />
        } />
        <div className="grid gap-6 xl:grid-cols-2">
          <IndexCard tab="First check" tabTone="stone" className={cn('xl:block', which === 'first' ? 'block' : 'hidden')}><ClassLadder learners={ladders.first} strand={strand} interactive={false} /></IndexCard>
          <IndexCard tab="Latest" tabTone="teal" className={cn('xl:block', which === 'latest' ? 'block' : 'hidden')}><ClassLadder learners={ladders.latest} strand={strand} interactive={false} /></IndexCard>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="slope">
          <SectionHeader id="slope" title="Before and after" action={strandSlope.length > 0 && (
            <Select aria-label="Skill" className="w-48" value={skill} onChange={(e) => setSkill(e.target.value)}><option value="">All {strand} skills</option>{strandSlope.map((s) => <option key={s.id} value={s.id}>{s.id} {s.name}</option>)}</Select>
          )} />
          <IndexCard>
            {shown.length ? (
              <>
                <BeforeAfterChart title="Class % correct: first vs latest check" skills={shown.map((s) => ({ id: s.id, name: s.name }))}
                  data={[{ label: 'First check', ...Object.fromEntries(shown.map((s) => [s.id, s.before ?? 0])) }, { label: 'Latest', ...Object.fromEntries(shown.map((s) => [s.id, s.after ?? 0])) }]} />
                <ul className="mt-4 flex flex-wrap gap-2">{shown.map((s) => { const d = (s.after ?? 0) - (s.before ?? 0); return (
                  <li key={s.id} className={cn('rounded-full px-2.5 py-1 text-[12px] font-semibold tabular', d > 0 ? 'bg-leaf-soft text-st-consistent' : 'bg-stone-soft text-ink-2')}>{s.id} {d > 0 ? '+' : ''}{d} pts · {s.learners} learner{s.learners === 1 ? '' : 's'}</li>
                ); })}</ul>
                <p className="mt-3 text-[13px] text-ink-2">Small groups and few items: treat changes as a prompt to look closer, not as proof of impact.</p>
              </>
            ) : <p className="text-[14px] text-ink-2">No {strand} skill has been checked twice yet.</p>}
          </IndexCard>
        </section>
        <section aria-labelledby="practice">
          <SectionHeader id="practice" title="Practice completed" />
          <IndexCard>
            {bars.length === 0 ? <p className="text-[14px] text-ink-2">No groups yet.</p> : (
              <ul className="space-y-4">
                {bars.map((b) => (
                  <li key={b.name}>
                    <div className="mb-1 flex justify-between text-[13px]"><span className="truncate font-semibold">{b.name} <span className="font-mono font-normal text-ink-2">{b.skill}</span></span><span className="tabular text-ink-2">{b.total ? `${b.done}/${b.total}` : '—'}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${b.name}: ${b.done} of ${b.total} practice sets completed`}><div className="h-full rounded-full bg-teal" style={{ width: `${b.total ? (b.done / b.total) * 100 : 0}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </IndexCard>
        </section>
      </div>

      <section aria-labelledby="changes">
        <SectionHeader id="changes" title="Learners" />
        <div className="overflow-x-auto rounded-[18px] border border-line bg-card shadow-card">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="border-b border-line bg-card-2 text-[12px] text-ink-2"><tr className="h-11"><th className="pl-4 font-medium">Learner</th><th className="font-medium">Code</th><th className="font-medium">Change</th><th className="font-medium">Working on</th></tr></thead>
            <tbody className="divide-y divide-line">
              {changes.map((c) => (
                <tr key={c.id} className="h-[52px]">
                  <td className="pl-4"><Link href={`/learners/${c.id}`} className="flex items-center gap-2 font-semibold hover:underline"><Avatar name={c.name} seed={c.code} size={32} />{c.name}</Link></td>
                  <td><CodeChip code={c.code} /></td>
                  <td>{c.change === 'up' ? <span className="inline-flex items-center gap-1 font-semibold text-st-consistent"><ArrowUpRight className="size-4" aria-hidden />Moved up on {c.up.join(', ')}</span>
                    : c.change === 'retest' ? <span className="inline-flex items-center gap-1 font-semibold text-st-notyet"><RotateCcw className="size-4" aria-hidden />Retest suggested ({c.retest.join(', ')})</span>
                    : <span className="inline-flex items-center gap-1 text-ink-2"><Minus className="size-4" aria-hidden />Held</span>}</td>
                  <td className="font-mono text-[12px] text-ink-2">{[c.working.literacy, c.working.numeracy].filter(Boolean).map((s) => `${s} ${SKILL_BY_ID[s!].shortName}`).join(' · ') || 'No gap flagged'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
