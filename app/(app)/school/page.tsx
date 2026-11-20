import { getTeacherContext } from '@/lib/server/context';
import { SKILLS, skillsForStrand } from '@/lib/content/skills';
import { IndexCard, PageHeader, SectionHeader, SummaryTiles, Tooltip } from '@/components/ui/primitives';
import { EmptyState, ErrorPanel } from '@/components/ui/states';
import { STATUS } from '@/components/ui/status';
import { pct } from '@/lib/utils';
import { SchoolActions } from './school-actions';

export const metadata = { title: 'School insights' };
const MIN_CELL = 3; // suppress small cells so individuals cannot be identified
const ORDER = ['consistent', 'developing', 'not_yet', 'insufficient'] as const;

function Cell({ n }: { n: number }) {
  if (n > 0 && n < MIN_CELL) return <Tooltip text="Hidden to protect privacy"><span className="cursor-help text-ink-3">—</span></Tooltip>;
  return <span className="tabular">{n}</span>;
}

export default async function SchoolPage({ searchParams }: { searchParams: Promise<{ school?: string }> }) {
  const ctx = await getTeacherContext();
  const adminSchools = ctx.schools.filter((s) => s.role === 'admin');
  if (!adminSchools.length) return <EmptyState illustration="error" title="You don't have access to this page." body="School insights are for school admins." />;
  const { school: sp } = await searchParams;
  const school = adminSchools.find((s) => s.id === sp) ?? adminSchools[0];

  const [{ data: overview, error: e1 }, { data: dist, error: e2 }] = await Promise.all([
    ctx.supabase.rpc('school_overview', { sid: school.id }),
    ctx.supabase.rpc('school_state_distribution', { sid: school.id }),
  ]);
  if (e1 || e2) return <ErrorPanel />;
  const ov = (overview ?? []) as { classroom_id: string; classroom_name: string; learners: number; assessed: number }[];
  const ds = (dist ?? []) as { classroom_id: string; classroom_name: string; skill_id: string; state: string; learners: number }[];
  const totalLearners = ov.reduce((n, c) => n + Number(c.learners), 0);
  const totalAssessed = ov.reduce((n, c) => n + Number(c.assessed), 0);
  const count = (skill: string, state: string, classroom?: string) => ds.filter((d) => d.skill_id === skill && d.state === state && (!classroom || d.classroom_id === classroom)).reduce((n, d) => n + Number(d.learners), 0);
  const gapsFlagged = SKILLS.reduce((n, s) => n + count(s.id, 'not_yet'), 0);
  const gaps = SKILLS.map((s) => ({ s, n: count(s.id, 'not_yet') + count(s.id, 'developing') })).filter((g) => g.n >= MIN_CELL).sort((a, b) => b.n - a.n).slice(0, 6);
  const maxGap = Math.max(1, ...gaps.map((g) => g.n));
  const csv = [['classroom', 'skill', 'state', 'learners'], ...ds.map((d) => [d.classroom_name, d.skill_id, d.state, Number(d.learners) < MIN_CELL ? 'hidden (<3)' : String(d.learners)])];

  return (
    <>
      <PageHeader title="School insights" subtitle={`${school.name} · totals only, never names or codes. Groups smaller than ${MIN_CELL} are hidden.`}
        actions={<SchoolActions csv={csv} schools={adminSchools.map((s) => ({ id: s.id, name: s.name }))} current={school.id} />} />
      {totalLearners === 0 ? <EmptyState illustration="empty-results" title="No data yet" body="Insights appear once teachers add and check learners." /> : (
        <div className="space-y-10">
          <SummaryTiles items={[
            { label: 'Classrooms', value: ov.length, tone: 'violet', glyph: 'star' },
            { label: 'Registered learners', value: totalLearners, tone: 'violet', glyph: 'dots' },
            { label: 'Assessment coverage', value: `${pct(totalAssessed, totalLearners)}%`, tone: 'aqua', glyph: 'check', hint: 'learners with at least one check' },
            { label: 'Not-yet results', value: gapsFlagged, tone: 'tangerine', glyph: 'eye' },
          ]} />
          <p className="-mt-6 text-[13px] text-ink-2">Practice completion is kept within each teacher&apos;s class and is not shared with admins.</p>

          <section aria-labelledby="ladder">
            <SectionHeader id="ladder" title="School ladder" info="For each rung, how many learners are at each state. Aggregate counts only." />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
              {(['literacy', 'numeracy'] as const).map((strand) => (
                <IndexCard key={strand} tab={strand} tabTone="violet" className="print-break">
                  <ol className="space-y-3">
                    {[...skillsForStrand(strand)].reverse().map((sk) => {
                      const c = Object.fromEntries(ORDER.map((k) => [k, count(sk.id, k)])) as Record<(typeof ORDER)[number], number>;
                      const total = ORDER.reduce((n, k) => n + c[k], 0);
                      const visible = ORDER.filter((k) => c[k] >= MIN_CELL);
                      return (
                        <li key={sk.id} className="flex items-center gap-3">
                          <span className="w-28 shrink-0"><span className="block font-mono text-[12px] text-ink-2">{sk.id}</span><span className="block truncate text-[13px] font-semibold">{sk.shortName}</span></span>
                          <span className="flex h-7 flex-1 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${sk.name}: ${ORDER.map((k) => `${c[k] >= MIN_CELL ? c[k] : c[k] ? 'fewer than 3' : 0} ${STATUS[k].short}`).join(', ')}`}>
                            {total > 0 && visible.map((k) => <span key={k} style={{ width: `${(c[k] / total) * 100}%`, background: STATUS[k].fill }} />)}
                          </span>
                          <span className="w-10 text-right text-[12px] text-ink-2"><Cell n={total} /></span>
                        </li>
                      );
                    })}
                  </ol>
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2" aria-hidden>{ORDER.map((k) => <li key={k} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: STATUS[k].fill }} />{STATUS[k].short}</li>)}</ul>
                </IndexCard>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
            <section aria-labelledby="gaps">
              <SectionHeader id="gaps" title="Most common gaps" />
              <IndexCard className="print-break">
                {gaps.length === 0 ? <p className="text-[14px] text-ink-2">No skill has 3 or more learners flagged.</p> : (
                  <ol className="space-y-3">{gaps.map((g) => (
                    <li key={g.s.id}>
                      <div className="mb-1 flex justify-between gap-3 text-[14px]"><span className="min-w-0"><span className="font-mono text-[12px] text-ink-2">{g.s.id}</span> {g.s.name}</span><b className="tabular">{g.n}</b></div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-teal" style={{ width: `${(g.n / maxGap) * 100}%` }} /></div>
                    </li>
                  ))}</ol>
                )}
              </IndexCard>
            </section>
            <section aria-labelledby="cmp">
              <SectionHeader id="cmp" title="Classroom comparison" />
              <div className="overflow-x-auto rounded-[18px] border border-line bg-card shadow-card print-break">
                <table className="w-full min-w-[420px] text-left text-[14px]">
                  <thead className="border-b border-line bg-card-2 text-[12px] text-ink-2"><tr className="h-11"><th className="pl-4 font-medium">Classroom</th><th className="font-medium">Learners</th><th className="font-medium">Checked</th><th className="pr-4 font-medium">Not-yet results</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {ov.map((c) => (
                      <tr key={c.classroom_id} className="h-[52px]">
                        <td className="pl-4 font-semibold">{c.classroom_name}</td>
                        <td><Cell n={Number(c.learners)} /></td>
                        <td className="tabular">{Number(c.learners) >= MIN_CELL ? `${pct(Number(c.assessed), Number(c.learners))}%` : <Cell n={1} />}</td>
                        <td className="pr-4"><Cell n={SKILLS.reduce((n, s) => n + count(s.id, 'not_yet', c.classroom_id), 0)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[13px] text-ink-2">A trend over time appears here once classes have been re-checked across several weeks.</p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
