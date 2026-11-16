import { School } from 'lucide-react';
import { getTeacherContext } from '@/lib/server/context';
import { SKILLS, SKILL_BY_ID } from '@/lib/content/skills';
import { Card, PageHeader, Stat } from '@/components/ui/primitives';
import { EmptyState, ErrorPanel } from '@/components/ui/states';
import { STATE_UI } from '@/components/ui/state-badge';
import { pct } from '@/lib/utils';
import { SchoolActions } from './school-actions';

export const metadata = { title: 'School insights' };
const MIN_CELL = 3; // suppress small cells so individuals cannot be identified

export default async function SchoolPage({ searchParams }: { searchParams: Promise<{ school?: string }> }) {
  const ctx = await getTeacherContext();
  const adminSchools = ctx.schools.filter((s) => s.role === 'admin');
  if (!adminSchools.length) return <EmptyState icon={<School className="size-6" />} title="Admins only" body="School insights are available to school admins." />;
  const { school: sp } = await searchParams;
  const school = adminSchools.find((s) => s.id === sp) ?? adminSchools[0];

  const [{ data: overview, error: e1 }, { data: dist, error: e2 }] = await Promise.all([
    ctx.supabase.rpc('school_overview', { sid: school.id }),
    ctx.supabase.rpc('school_state_distribution', { sid: school.id }),
  ]);
  if (e1 || e2) return <ErrorPanel message="Could not load school insights." />;
  const ov = (overview ?? []) as { classroom_id: string; classroom_name: string; learners: number; assessed: number }[];
  const ds = (dist ?? []) as { classroom_id: string; classroom_name: string; skill_id: string; state: string; learners: number }[];
  const totalLearners = ov.reduce((n, c) => n + Number(c.learners), 0);
  const totalAssessed = ov.reduce((n, c) => n + Number(c.assessed), 0);

  const bySkill = SKILLS.map((s) => {
    const cells = ds.filter((d) => d.skill_id === s.id);
    const count = (st: string) => cells.filter((c) => c.state === st).reduce((n, c) => n + Number(c.learners), 0);
    return { skill: s, not_yet: count('not_yet'), developing: count('developing'), consistent: count('consistent'), insufficient: count('insufficient') };
  });
  const gaps = [...bySkill].map((r) => ({ ...r, gap: r.not_yet + r.developing })).filter((r) => r.gap >= MIN_CELL).sort((a, b) => b.gap - a.gap).slice(0, 5);
  const show = (n: number) => (n === 0 ? '0' : n < MIN_CELL ? '<3' : String(n));
  const csv = [['classroom', 'skill', 'state', 'learners'], ...ds.map((d) => [d.classroom_name, d.skill_id, d.state, Number(d.learners) < MIN_CELL ? '<3' : String(d.learners)])];

  return (
    <>
      <PageHeader title="School insights" subtitle={`${school.name} · totals only. No names or learner codes. Cells under ${MIN_CELL} learners are hidden.`}
        actions={<SchoolActions csv={csv} schools={adminSchools.map((s) => ({ id: s.id, name: s.name }))} current={school.id} />} />
      {totalLearners === 0 ? <EmptyState title="No data yet" body="Insights appear once teachers add and assess learners." /> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Classrooms" value={ov.length} />
            <Stat label="Learners" value={totalLearners} />
            <Stat label="Assessment completion" value={`${pct(totalAssessed, totalLearners)}%`} sub={`${totalAssessed} assessed`} />
          </div>
          <Card className="print-break">
            <h2 className="mb-3 text-lg font-bold">Most common gaps</h2>
            {gaps.length === 0 ? <p className="text-[15px] text-muted">No skill has 3 or more learners flagged.</p> : (
              <ol className="space-y-2">{gaps.map((g) => <li key={g.skill.id} className="flex justify-between text-[15px]"><span>{g.skill.id} {g.skill.name}</span><b>{g.gap} learners</b></li>)}</ol>
            )}
          </Card>
          <Card className="overflow-x-auto print-break">
            <h2 className="mb-3 text-lg font-bold">State distribution (whole school)</h2>
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead className="text-[12px] text-muted"><tr><th className="py-2">Skill</th>{(['not_yet', 'developing', 'consistent', 'insufficient'] as const).map((k) => <th key={k}>{STATE_UI[k].label}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{bySkill.map((r) => <tr key={r.skill.id} className="h-11"><td>{r.skill.id} {r.skill.shortName}</td><td>{show(r.not_yet)}</td><td>{show(r.developing)}</td><td>{show(r.consistent)}</td><td>{show(r.insufficient)}</td></tr>)}</tbody>
            </table>
          </Card>
          <Card className="overflow-x-auto print-break">
            <h2 className="mb-3 text-lg font-bold">Classroom comparison</h2>
            <table className="w-full min-w-[480px] text-left text-[14px]">
              <thead className="text-[12px] text-muted"><tr><th className="py-2">Classroom</th><th>Learners</th><th>Assessed</th><th>Top gap</th></tr></thead>
              <tbody className="divide-y divide-line">
                {ov.map((c) => {
                  const top = SKILLS.map((s) => ({ s, n: ds.filter((d) => d.classroom_id === c.classroom_id && d.skill_id === s.id && (d.state === 'not_yet' || d.state === 'developing')).reduce((n, d) => n + Number(d.learners), 0) }))
                    .filter((x) => x.n >= MIN_CELL).sort((a, b) => b.n - a.n)[0];
                  return <tr key={c.classroom_id} className="h-11"><td>{c.classroom_name}</td><td>{show(Number(c.learners))}</td><td>{pct(Number(c.assessed), Number(c.learners))}%</td><td>{top ? `${SKILL_BY_ID[top.s.id].shortName} (${top.n})` : '—'}</td></tr>;
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </>
  );
}
