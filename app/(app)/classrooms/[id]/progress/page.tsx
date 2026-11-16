import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { getClassroom } from '@/lib/server/classroom';
import { SKILLS, SKILL_BY_ID } from '@/lib/content/skills';
import { Card, PageHeader, SampleDataBanner, Stat, NotADiagnosis } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { BeforeAfterChart, type BeforeAfterPoint } from '@/components/charts/before-after-chart';
import { ProgressFilter } from './progress-filter';
import { pct } from '@/lib/utils';

export const metadata = { title: 'Progress' };

export default async function ProgressPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ skill?: string }> }) {
  const { id } = await params;
  const { skill } = await searchParams;
  const { classroom, learners, ctx } = await getClassroom(id);
  const ids = learners.map((l) => l.id);
  const [{ data: sessions }, { data: responses }, { data: assignments }] = ids.length ? await Promise.all([
    ctx.supabase.from('assessment_sessions').select('id, learner_id, completed_at').in('learner_id', ids).not('completed_at', 'is', null).order('completed_at'),
    ctx.supabase.from('item_responses').select('session_id, learner_id, skill_id, correct').in('learner_id', ids).not('correct', 'is', null),
    ctx.supabase.from('assignments').select('status').in('learner_id', ids),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];

  // Per learner + skill: first assessment session vs latest one.
  const sessionTime = new Map((sessions ?? []).map((s) => [s.id, s.completed_at as string]));
  const perLS = new Map<string, Map<string, { c: number; n: number; at: string }>>();
  for (const r of responses ?? []) {
    const at = sessionTime.get(r.session_id); if (!at) continue;
    const key = `${r.learner_id}|${r.skill_id}`;
    const m = perLS.get(key) ?? new Map(); const s = m.get(r.session_id) ?? { c: 0, n: 0, at };
    s.n++; if (r.correct) s.c++; m.set(r.session_id, s); perLS.set(key, m);
  }
  const rows = SKILLS.map((sk) => {
    let bC = 0, bN = 0, aC = 0, aN = 0, learnersWithTwo = 0;
    for (const l of learners) {
      const m = perLS.get(`${l.id}|${sk.id}`); if (!m || m.size < 2) continue;
      const list = [...m.values()].sort((x, y) => (x.at < y.at ? -1 : 1));
      bC += list[0].c; bN += list[0].n; aC += list.at(-1)!.c; aN += list.at(-1)!.n; learnersWithTwo++;
    }
    return { skill: sk, before: bN ? pct(bC, bN) : null, after: aN ? pct(aC, aN) : null, learners: learnersWithTwo };
  }).filter((r) => r.learners > 0);
  const shown = skill ? rows.filter((r) => r.skill.id === skill) : rows;
  const chart: BeforeAfterPoint[] = [{ label: 'First check' }, { label: 'Latest check' }];
  for (const r of shown) { chart[0][r.skill.id] = r.before!; chart[1][r.skill.id] = r.after!; }
  const done = (assignments ?? []).filter((a) => a.status === 'completed').length;

  return (
    <>
      {classroom.is_demo && <SampleDataBanner className="mb-4" />}
      <PageHeader eyebrow={classroom.name} title="Progress" subtitle="Change between each learner's first and latest check, for learners assessed at least twice." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Reassessed learners" value={new Set([...perLS.entries()].filter(([, m]) => m.size >= 2).map(([k]) => k.split('|')[0])).size} icon={<TrendingUp className="size-5" />} />
        <Stat label="Practice completed" value={`${done}/${assignments?.length ?? 0}`} sub={`${pct(done, assignments?.length ?? 0)}% of assigned sets`} icon={<CheckCircle2 className="size-5" />} />
        <Stat label="Skills with change data" value={rows.length} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<TrendingUp className="size-6" />} title="Reassess to see change" body="When a learner has been checked twice on a strand, before-and-after results appear here." />
      ) : (
        <div className="space-y-6">
          <ProgressFilter skills={rows.map((r) => ({ id: r.skill.id, name: r.skill.shortName }))} value={skill ?? ''} />
          <Card><BeforeAfterChart title="Class % correct: first vs latest check" data={chart} skills={shown.map((r) => ({ id: r.skill.id, name: r.skill.shortName }))} /></Card>
          <Card>
            <table className="w-full text-left text-[15px]">
              <thead className="text-[13px] text-muted"><tr><th className="py-2">Skill</th><th>First</th><th>Latest</th><th>Change</th><th>Learners</th></tr></thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => (
                  <tr key={r.skill.id} className="h-12">
                    <td>{r.skill.id} {SKILL_BY_ID[r.skill.id].shortName}</td><td>{r.before}%</td><td>{r.after}%</td>
                    <td className="font-semibold">{r.after! - r.before! > 0 ? '+' : ''}{r.after! - r.before!} pts</td><td>{r.learners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[13px] text-muted">Small numbers of learners and items: treat changes as a prompt to look closer, not proof of impact.</p>
          </Card>
          <NotADiagnosis />
        </div>
      )}
    </>
  );
}
