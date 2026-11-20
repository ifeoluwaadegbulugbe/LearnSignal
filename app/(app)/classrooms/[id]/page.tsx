import Link from 'next/link';
import { Plus, ArrowUp } from 'lucide-react';
import { getClassroom, getGroups } from '@/lib/server/classroom';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { ButtonLink } from '@/components/ui/button';
import { NotADiagnosis, StatStrip } from '@/components/ui/primitives';
import { NextStepCard } from '@/components/ui/cards';
import { EmptyState } from '@/components/ui/states';
import { LogoMark } from '@/components/layout/logo';
import { ClassLadderBoard, type LadderLearner } from '@/components/learner/class-ladder';
import { pct } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Greeting } from './home-client';

export const metadata = { title: 'Today' };

type Strand = 'literacy' | 'numeracy';
type Ex = { id: string; skill_id: string; difficulty: number; source: string; content: { items: unknown[] } };

export default async function Today({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ classroom, learners, ctx }, groups] = await Promise.all([getClassroom(id), getGroups(id)]);
  const ids = learners.map((l) => l.id);
  const [{ data: assignments }, { count: pendingSets }] = await Promise.all([
    ids.length
      ? ctx.supabase.from('assignments').select('learner_id, status, created_at, exercises(id, skill_id, difficulty, source, content)').in('learner_id', ids)
      : Promise.resolve({ data: [] as unknown[] }),
    ctx.supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('created_by', ctx.user.id).eq('review_status', 'pending'),
  ]);

  const firstName = ctx.fullName.split(' ')[0];

  if (learners.length === 0) {
    return (
      <div className="space-y-8">
        <Greeting firstName={firstName} className={classroom.name} />
        <EmptyState illustration="empty-learners" title="Add your first learners" body="Add first names or nicknames, then run a short check for each child."
          action={<ButtonLink href={`/classrooms/${id}/learners?add=1`}><Plus className="size-4" aria-hidden /> Add learners</ButtonLink>}
          secondary={<ButtonLink href="/onboarding" variant="secondary">Load the sample class</ButtonLink>} />
      </div>
    );
  }

  const assessed = learners.filter((l) => l.states.length > 0);
  const notAssessed = learners.filter((l) => l.states.length === 0);
  const grouped = new Set(groups.flatMap((g) => g.members.map((m) => m.id)));
  const ungrouped = assessed.filter((l) => (l.working.literacy || l.working.numeracy) && !grouped.has(l.id));

  // Re-checks, grouped by the skill they are suggested on (the most common first).
  const recheckBySkill = new Map<string, typeof learners>();
  for (const l of assessed) for (const s of l.states) if (s.retest_suggested) recheckBySkill.set(s.skill_id, [...(recheckBySkill.get(s.skill_id) ?? []), l]);
  const recheckTop = [...recheckBySkill.entries()].sort((a, b) => b[1].length - a[1].length)[0];

  // Summary strip: share of each strand's skill results demonstrated consistently.
  const strandShare = (k: Strand) => {
    const mine = assessed.flatMap((l) => l.states).filter((s) => SKILL_BY_ID[s.skill_id].strand === k);
    const shown = mine.filter((s) => s.state === 'consistent').length;
    return { shown, total: mine.length, pct: pct(shown, mine.length) };
  };
  const num = strandShare('numeracy'), lit = strandShare('literacy');

  // Practice: one row per practice set assigned in this class.
  const bySet = new Map<string, { ex: Ex; total: number; done: number; last: string }>();
  for (const a of (assignments ?? []) as unknown as { status: string; created_at: string; exercises: Ex | null }[]) {
    if (!a.exercises) continue;
    const row = bySet.get(a.exercises.id) ?? { ex: a.exercises, total: 0, done: 0, last: a.created_at };
    row.total++; if (a.status === 'completed') row.done++;
    if (a.created_at > row.last) row.last = a.created_at;
    bySet.set(a.exercises.id, row);
  }
  const sets = [...bySet.values()];
  const practiceTotal = sets.reduce((n, r) => n + r.total, 0);
  const practiceDone = sets.reduce((n, r) => n + r.done, 0);
  const activeSets = sets.filter((r) => r.done < r.total).length;
  const practiceRows = [...sets].sort((x, y) => (x.done === x.total ? 1 : 0) - (y.done === y.total ? 1 : 0) || y.last.localeCompare(x.last)).slice(0, 4);

  const ladder: LadderLearner[] = learners.map((l) => ({
    id: l.id, name: l.display_name, code: l.code, working: l.working, assessed: l.states.length > 0,
    states: l.states.map((s) => ({ skill_id: s.skill_id, state: s.state, confidence: s.confidence, provisional: s.provisional })),
    recheck: {
      literacy: l.states.some((s) => s.retest_suggested && SKILL_BY_ID[s.skill_id].strand === 'literacy'),
      numeracy: l.states.some((s) => s.retest_suggested && SKILL_BY_ID[s.skill_id].strand === 'numeracy'),
    },
  }));

  // One rules-based next step, re-checks first.
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const next = recheckTop
    ? { id: `recheck-${id}-${recheckTop[0]}`, sentence: `${recheckTop[1].length} ${plural(recheckTop[1].length, 'learner is', 'learners are')} ready for a ${SKILL_BY_ID[recheckTop[0]].shortName.toLowerCase()} re-check`,
      detail: 'Their latest session differs from earlier evidence. A 10 minute check will settle where they stand.',
      href: `/classrooms/${id}/learners?tab=review`, cta: recheckTop[1].length === 1 ? `Review ${recheckTop[1][0].display_name}` : `Review the ${recheckTop[1].length} learners` }
    : notAssessed.length
      ? { id: `assess-${id}`, sentence: `${notAssessed.length} ${plural(notAssessed.length, 'learner has', 'learners have')} not been checked yet`,
        detail: 'A first check takes about 10 minutes per strand and places each child on the ladder.', href: `/learners/${notAssessed[0].id}/assess`, cta: `Check ${notAssessed[0].display_name}` }
      : ungrouped.length
        ? { id: `groups-${id}`, sentence: `${ungrouped.length} ${plural(ungrouped.length, 'learner is', 'learners are')} ready to be grouped`,
          detail: 'Groups are suggested by the step each child is working on. You decide.', href: `/classrooms/${id}/groups`, cta: 'Open groups' }
        : null;

  // Today's plan: real next actions in priority order (no clock times; the app stores no schedule).
  const biggestGroup = [...groups].sort((a, b) => b.members.length - a.members.length)[0];
  const plan: { title: string; meta: string; tag: string; tone: 'recheck' | 'violet'; href: string }[] = [
    ...(recheckTop ? [{ title: `Re-check ${recheckTop[0]}`, meta: recheckTop[1].map((l) => l.display_name).slice(0, 4).join(', '), tag: 'Re-check', tone: 'recheck' as const, href: `/classrooms/${id}/learners?tab=review` }] : []),
    ...(notAssessed.length ? [{ title: 'First checks', meta: `${notAssessed.length} ${plural(notAssessed.length, 'learner', 'learners')} not checked yet`, tag: 'Check', tone: 'violet' as const, href: `/learners/${notAssessed[0].id}/assess` }] : []),
    ...(biggestGroup ? [{ title: biggestGroup.name, meta: `${biggestGroup.members.length} ${plural(biggestGroup.members.length, 'learner', 'learners')}, 15 minutes`, tag: 'Group', tone: 'violet' as const, href: `/classrooms/${id}/groups` }]
      : ungrouped.length ? [{ title: 'Plan groups', meta: `${ungrouped.length} learners ready to group`, tag: 'Group', tone: 'violet' as const, href: `/classrooms/${id}/groups` }] : []),
    ...((pendingSets ?? 0) > 0 ? [{ title: 'Review AI practice', meta: 'Approve before children see it', tag: 'Practice', tone: 'violet' as const, href: '/exercises' }] : []),
  ].slice(0, 4);

  return (
    <div className="space-y-6 @tab:space-y-8">
      <Greeting firstName={firstName} className={classroom.name} />

      {next && <NextStepCard id={next.id} sentence={next.sentence} detail={next.detail} action={<ButtonLink href={next.href}>{next.cta}</ButtonLink>} />}

      <StatStrip items={[
        { label: 'Learners', value: learners.length, sub: `${assessed.length} assessed`, pct: pct(assessed.length, learners.length) },
        { label: 'Numeracy', value: num.total ? `${num.pct}%` : '—', sub: num.total ? `${num.shown} of ${num.total} skills shown` : 'Not checked yet', pct: num.pct },
        { label: 'Literacy', value: lit.total ? `${lit.pct}%` : '—', sub: lit.total ? `${lit.shown} of ${lit.total} skills shown` : 'Not checked yet', pct: lit.pct },
        { label: 'Practice done', value: practiceTotal ? `${pct(practiceDone, practiceTotal)}%` : '—', sub: practiceTotal ? `${activeSets} ${plural(activeSets, 'set', 'sets')} active` : 'Nothing assigned yet', pct: pct(practiceDone, practiceTotal) },
      ]} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 @desk:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-[16px] border border-line bg-surface p-6 shadow-card">
            <ClassLadderBoard learners={ladder} />
          </section>

          <section aria-labelledby="inprog" className="rounded-[16px] border border-line bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <h2 id="inprog" className="text-[20px] font-bold">Practice in progress</h2>
              <Link href="/exercises" className="text-[15px] font-medium text-violet-700 underline underline-offset-4 hover:no-underline">View all</Link>
            </div>
            {practiceRows.length === 0 ? (
              <p className="pt-4 text-[15px] text-muted">Nothing assigned yet. <Link href="/exercises" className="font-medium text-violet-700 underline underline-offset-4">Choose a practice set</Link>.</p>
            ) : (
              <ul className="divide-y divide-line">
                {practiceRows.map(({ ex, total, done }) => {
                  const sk = SKILL_BY_ID[ex.skill_id];
                  const complete = done === total;
                  const p = pct(done, total);
                  return (
                    <li key={ex.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 last:pb-0">
                      <PracticeThumb strand={sk?.strand ?? 'numeracy'} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[16px] font-semibold">{sk?.name ?? ex.skill_id}</div>
                        <div className="text-[14px] text-muted">{ex.skill_id} {sk?.shortName}, {ex.content.items.length} materials, {p}% complete</div>
                      </div>
                      <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-violet-100 sm:block" aria-hidden><span className="block h-full rounded-full bg-violet-500" style={{ width: `${p}%` }} /></span>
                      {ex.source === 'ai' && <span className="hidden rounded-full bg-violet-100 px-2.5 py-0.5 text-[13px] font-medium text-violet-700 sm:inline">AI drafted</span>}
                      <ButtonLink href={`/exercises?skill=${ex.skill_id}`} variant="secondary" className="w-full sm:w-auto">{complete ? 'Review' : 'Continue'}</ButtonLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6 @tab:grid-cols-2 @desk:grid-cols-1">
          <section aria-labelledby="plan" className="rounded-[16px] border border-line bg-surface p-6 shadow-card">
            <h2 id="plan" className="border-b border-line pb-4 text-[20px] font-bold">Today&apos;s plan</h2>
            {plan.length === 0 ? <p className="pt-4 text-[15px] text-muted">Nothing waiting. Every learner is checked and grouped.</p> : (
              <ol className="divide-y divide-line">
                {plan.map((it, i) => (
                  <li key={it.title} className="py-4 last:pb-0">
                    <Link href={it.href} className="flex gap-4 rounded-[8px] hover:opacity-90">
                      <span className="w-6 shrink-0 pt-0.5 text-[15px] font-semibold text-muted tabular" aria-hidden>{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold">{it.title}</span>
                        <span className="block text-[14px] text-muted">{it.meta}</span>
                        <span className={cn('mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-medium', it.tone === 'recheck' ? 'border border-tangerine-line bg-tangerine-tint text-tangerine-ink' : 'bg-violet-100 text-violet-700')}>{it.tag}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="ai" className="rounded-[16px] border border-violet-100 bg-violet-100 p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-surface px-3 py-1 text-[13px] font-bold uppercase tracking-[.06em] text-violet-700">AI assistant</span>
              <LogoMark size={28} />
            </div>
            <h2 id="ai" className="mt-4 text-[20px] font-bold">Which group should I start with this week?</h2>
            <form action="/assistant" method="get" className="mt-4 flex items-center gap-2 rounded-[12px] bg-surface p-1.5 pl-4">
              <input type="hidden" name="class" value={id} />
              <label htmlFor="ai-q" className="sr-only">Ask about your class</label>
              <input id="ai-q" name="q" maxLength={300} required placeholder="Ask about your class" className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none" />
              <button type="submit" aria-label="Ask" className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-violet-500 text-on-primary hover:bg-violet-700"><ArrowUp className="size-5" aria-hidden /></button>
            </form>
            <p className="mt-3 text-[13px] text-muted">Answers use your class data only.</p>
          </section>
        </div>
      </div>
      <NotADiagnosis />
    </div>
  );
}

/** Small violet thumbnail: counters for numeracy, letter tiles for literacy. */
function PracticeThumb({ strand }: { strand: Strand }) {
  return (
    <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-[12px] bg-violet-50" aria-hidden>
      {strand === 'numeracy' ? (
        <svg viewBox="0 0 48 30" className="w-10"><g fill="var(--violet-500)"><circle cx="8" cy="8" r="5" /><circle cx="22" cy="8" r="5" /><circle cx="36" cy="8" r="5" /><circle cx="8" cy="22" r="5" /></g><g fill="none" stroke="var(--violet-500)" strokeDasharray="2 2" strokeWidth="1.5"><circle cx="22" cy="22" r="4.5" /><circle cx="36" cy="22" r="4.5" /></g></svg>
      ) : (
        <svg viewBox="0 0 48 30" className="w-10"><g fill="var(--violet-500)"><rect x="2" y="6" width="13" height="18" rx="3" /><rect x="18" y="6" width="13" height="18" rx="3" opacity=".7" /><rect x="34" y="6" width="13" height="18" rx="3" opacity=".45" /></g></svg>
      )}
    </span>
  );
}
