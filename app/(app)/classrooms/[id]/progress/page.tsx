import { getClassroom, getGroups } from '@/lib/server/classroom';
import { SKILLS, SKILL_BY_ID } from '@/lib/content/skills';
import { workingSkill, type SkillStateName } from '@/lib/scoring/skillState';
import { Breadcrumb, PageHeader, SampleDataBadge } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import type { LadderLearner } from '@/components/learner/class-ladder';
import { pct } from '@/lib/utils';
import { ProgressView, type ChangeRow } from './progress-view';

export const metadata = { title: 'Insights' };
const RANK: Record<SkillStateName, number> = { insufficient: 0, not_yet: 1, developing: 2, consistent: 3 };

export default async function ProgressPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> }) {
  const { id } = await params;
  const { range = 'all' } = await searchParams;
  const [{ classroom, learners, ctx }, groups] = await Promise.all([getClassroom(id), getGroups(id)]);
  const ids = learners.map((l) => l.id);
  const since = range === '30' ? new Date(Date.now() - 30 * 86_400_000).toISOString() : null;
  const [{ data: history }, { data: responses }, { data: sessions }, { data: assignments }] = ids.length ? await Promise.all([
    ctx.supabase.from('skill_state_history').select('learner_id, skill_id, state, p, created_at').in('learner_id', ids).order('created_at'),
    ctx.supabase.from('item_responses').select('session_id, learner_id, skill_id, correct').in('learner_id', ids).not('correct', 'is', null),
    ctx.supabase.from('assessment_sessions').select('id, completed_at').in('learner_id', ids).not('completed_at', 'is', null),
    ctx.supabase.from('assignments').select('learner_id, status, exercises(skill_id)').in('learner_id', ids),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  // First recorded state per learner+skill (within range) vs current state.
  const first = new Map<string, { state: SkillStateName; p: number }>();
  for (const h of history ?? []) {
    if (since && h.created_at < since) continue;
    const k = `${h.learner_id}|${h.skill_id}`;
    if (!first.has(k)) first.set(k, { state: h.state as SkillStateName, p: Number(h.p) });
  }
  const mk = (l: (typeof learners)[number], which: 'first' | 'latest'): LadderLearner => {
    const st = which === 'latest' ? l.states : l.states.map((s) => ({ ...s, ...(first.get(`${l.id}|${s.skill_id}`) ?? {}) }));
    const ws = (strand: 'literacy' | 'numeracy') => workingSkill(st.filter((s) => SKILL_BY_ID[s.skill_id].strand === strand).map((s) => ({ skillId: s.skill_id, sequence: SKILL_BY_ID[s.skill_id].sequence, state: s.state, p: Number(s.p), provisional: which === 'first' ? true : s.provisional })))?.skillId ?? null;
    return { id: l.id, name: l.display_name, code: l.code, assessed: st.length > 0, working: { literacy: ws('literacy'), numeracy: ws('numeracy') }, recheck: { literacy: false, numeracy: false }, states: st.map((s) => ({ skill_id: s.skill_id, state: s.state, confidence: s.confidence, provisional: s.provisional })) };
  };
  const ladders = { first: learners.map((l) => mk(l, 'first')), latest: learners.map((l) => mk(l, 'latest')) };

  // Class % correct: first vs latest assessment session per learner+skill.
  const sessionTime = new Map((sessions ?? []).map((s) => [s.id, s.completed_at as string]));
  const perLS = new Map<string, Map<string, { c: number; n: number; at: string }>>();
  for (const r of responses ?? []) {
    const at = sessionTime.get(r.session_id); if (!at || (since && at < since)) continue;
    const k = `${r.learner_id}|${r.skill_id}`;
    const m = perLS.get(k) ?? new Map(); const s = m.get(r.session_id) ?? { c: 0, n: 0, at };
    s.n++; if (r.correct) s.c++; m.set(r.session_id, s); perLS.set(k, m);
  }
  const slope = SKILLS.map((sk) => {
    let bC = 0, bN = 0, aC = 0, aN = 0, n = 0;
    for (const l of learners) {
      const m = perLS.get(`${l.id}|${sk.id}`); if (!m || m.size < 2) continue;
      const list = [...m.values()].sort((x, y) => (x.at < y.at ? -1 : 1));
      bC += list[0].c; bN += list[0].n; aC += list.at(-1)!.c; aN += list.at(-1)!.n; n++;
    }
    return { id: sk.id, name: sk.shortName, strand: sk.strand, before: bN ? pct(bC, bN) : null, after: aN ? pct(aC, aN) : null, learners: n };
  }).filter((r) => r.learners > 0);

  // Practice completion per group.
  const bars = groups.map((g) => {
    const rows = (assignments ?? []).filter((a) => g.members.some((m) => m.id === a.learner_id) && (a.exercises as unknown as { skill_id: string })?.skill_id === g.target_skill_id);
    return { name: g.name, skill: g.target_skill_id, done: rows.filter((r) => r.status === 'completed').length, total: rows.length };
  });

  const changes: ChangeRow[] = learners.filter((l) => l.states.length).map((l) => {
    const moves = l.states.map((s) => ({ s, f: first.get(`${l.id}|${s.skill_id}`) }));
    const up = moves.filter(({ s, f }) => f && RANK[s.state] > RANK[f.state] && f.state !== 'insufficient').map(({ s }) => s.skill_id);
    const retest = l.states.filter((s) => s.retest_suggested).map((s) => s.skill_id);
    return { id: l.id, name: l.display_name, code: l.code, up, retest, working: l.working, change: retest.length ? 'retest' : up.length ? 'up' : 'held' };
  });

  return (
    <>
      <Breadcrumb items={[{ label: classroom.name, href: `/classrooms/${id}` }, { label: 'Insights' }]} />
      {classroom.is_demo && <div className="mb-3"><SampleDataBadge /></div>}
      <PageHeader title="Insights" subtitle="How learners moved between their first and latest checks." />
      {changes.length === 0 ? (
        <EmptyState illustration="empty-results" title="Re-check learners to see change" body="When a learner has been checked twice, you'll see how they moved on the ladder." />
      ) : (
        <ProgressView ladders={ladders} slope={slope} bars={bars} changes={changes} range={range} classroomName={classroom.name} isDemo={classroom.is_demo} />
      )}
    </>
  );
}
