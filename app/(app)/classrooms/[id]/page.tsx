import Link from 'next/link';
import { Plus, ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import { getClassroom, getGroups } from '@/lib/server/classroom';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { STATUS } from '@/components/ui/status';
import { ButtonLink } from '@/components/ui/button';
import { AuroraBackdrop, IndexCard, NotADiagnosis, SampleDataBadge, SectionHeader, SummaryTiles } from '@/components/ui/primitives';
import { SkillArt } from '@/components/ui/skill-art';
import { NextStepCard, Timeline } from '@/components/ui/cards';
import { EmptyState } from '@/components/ui/states';
import { AvatarStack } from '@/components/ui/avatar';
import { MeterRing, StateBar } from '@/components/ui/viz';
import { ClassLadderBoard, type LadderLearner } from '@/components/learner/class-ladder';
import { fmtDate, pct } from '@/lib/utils';
import { Greeting } from './home-client';
import type { SkillStateName } from '@/lib/scoring/skillState';

export const metadata = { title: 'Today' };
const RANK: Record<SkillStateName, number> = { insufficient: 0, not_yet: 1, developing: 2, consistent: 3 };

export default async function Today({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ classroom, learners, ctx }, groups] = await Promise.all([getClassroom(id), getGroups(id)]);
  const ids = learners.map((l) => l.id);
  const [{ data: assignments }, { data: history }] = ids.length ? await Promise.all([
    ctx.supabase.from('assignments').select('learner_id, status, created_at, exercises(id, skill_id, difficulty, source, content)').in('learner_id', ids),
    ctx.supabase.from('skill_state_history').select('learner_id, skill_id, state, p, created_at').in('learner_id', ids).order('created_at'),
  ]) : [{ data: [] }, { data: [] }];
  const { data: recentSets } = await ctx.supabase.from('exercises').select('id, skill_id, difficulty, source, content, created_at')
    .eq('review_status', 'approved').order('created_at', { ascending: false }).limit(3);

  const firstName = ctx.fullName.split(' ')[0];
  const assessed = learners.filter((l) => l.states.length > 0);
  const notAssessed = learners.filter((l) => l.states.length === 0);
  const grouped = new Set(groups.flatMap((g) => g.members.map((m) => m.id)));
  const ungrouped = assessed.filter((l) => (l.working.literacy || l.working.numeracy) && !grouped.has(l.id));
  const recheck = assessed.filter((l) => l.states.some((s) => s.retest_suggested));
  const allStates = assessed.flatMap((l) => l.states);
  const demonstrated = allStates.filter((s) => s.state === 'consistent').length;
  const attention = allStates.filter((s) => s.state === 'not_yet' || s.retest_suggested).length;
  const strandCounts = (strand: 'literacy' | 'numeracy') => {
    const c = { not_yet: 0, developing: 0, consistent: 0, insufficient: 0 };
    for (const st of allStates) if (SKILL_BY_ID[st.skill_id].strand === strand) c[st.state]++;
    return { counts: c, learners: assessed.filter((l) => l.states.some((st) => SKILL_BY_ID[st.skill_id].strand === strand)).length };
  };

  // Practice in progress: one row per practice set assigned in this class.
  type Ex = { id: string; skill_id: string; difficulty: number; source: string; content: { items: unknown[] } };
  const bySet = new Map<string, { ex: Ex; total: number; done: number; last: string }>();
  for (const a of (assignments ?? []) as unknown as { status: string; created_at: string; exercises: Ex | null }[]) {
    if (!a.exercises) continue;
    const row = bySet.get(a.exercises.id) ?? { ex: a.exercises, total: 0, done: 0, last: a.created_at };
    row.total++; if (a.status === 'completed') row.done++;
    if (a.created_at > row.last) row.last = a.created_at;
    bySet.set(a.exercises.id, row);
  }
  const practiceRows = [...bySet.values()].sort((x, y) => (x.done === x.total ? 1 : 0) - (y.done === y.total ? 1 : 0) || y.last.localeCompare(x.last)).slice(0, 5);
  const setTitle = (e: { skill_id: string; difficulty: number }) => `${SKILL_BY_ID[e.skill_id]?.name} · level ${e.difficulty}`;

  const ladder: LadderLearner[] = learners.map((l) => ({
    id: l.id, name: l.display_name, code: l.code, working: l.working, assessed: l.states.length > 0,
    states: l.states.map((s) => ({ skill_id: s.skill_id, state: s.state, confidence: s.confidence, provisional: s.provisional })),
    recheck: {
      literacy: l.states.some((s) => s.retest_suggested && SKILL_BY_ID[s.skill_id].strand === 'literacy'),
      numeracy: l.states.some((s) => s.retest_suggested && SKILL_BY_ID[s.skill_id].strand === 'numeracy'),
    },
  }));

  // One rules-based next step.
  const next = notAssessed.length
    ? { id: `assess-${id}`, sentence: `Check ${notAssessed.length} learner${notAssessed.length === 1 ? ' who hasn’t' : 's who haven’t'} been assessed yet`, detail: 'A baseline takes about 8–10 minutes per strand.', href: `/learners/${notAssessed[0].id}/assess`, cta: `Start with ${notAssessed[0].display_name}` }
    : ungrouped.length
      ? { id: `groups-${id}`, sentence: `Review suggested groups for ${ungrouped.length} learner${ungrouped.length === 1 ? '' : 's'}`, detail: 'Grouped by the skill each child is working on. You decide.', href: `/classrooms/${id}/groups`, cta: 'Open groups' }
      : recheck.length
        ? { id: `recheck-${id}`, sentence: `Re-check ${recheck.length} learner${recheck.length === 1 ? '' : 's'} whose latest session differs`, detail: 'A short re-check gives a clearer picture than one session.', href: `/learners/${recheck[0].id}/assess`, cta: `Re-check ${recheck[0].display_name}` }
        : null;

  // Recent changes: real state moves from history (newest first), plus re-checks due.
  const prev = new Map<string, { state: SkillStateName; p: number }>();
  const moves: { id: string; title: string; meta: string; href: string; tone: 'leaf' | 'sky' | 'sun' }[] = [];
  for (const h of (history ?? []) as { learner_id: string; skill_id: string; state: string; p: number; created_at: string }[]) {
    const k = `${h.learner_id}|${h.skill_id}`;
    const b = prev.get(k);
    const before = b?.state;
    const now = h.state as SkillStateName;
    // Skip "confirmations" (a strong first session becoming consistent): not a real move.
    const confirmation = before === 'developing' && now === 'consistent' && (b?.p ?? 0) >= 0.8;
    if (before && before !== now && now !== 'insufficient' && !confirmation) {
      const l = learners.find((x) => x.id === h.learner_id);
      if (l) moves.push({
        id: `${k}|${h.created_at}`, href: `/learners/${l.id}`,
        title: `${l.display_name} ${RANK[now] > RANK[before] ? 'moved to' : 'is now'} ${STATUS[now].label.toLowerCase()} on ${h.skill_id}`,
        meta: `${SKILL_BY_ID[h.skill_id].shortName} · ${fmtDate(h.created_at)}`, tone: RANK[now] > RANK[before] ? 'leaf' : 'sky',
      });
    }
    prev.set(k, { state: now, p: Number(h.p) });
  }
  const timeline = [
    ...(recheck.length ? [{ id: 'recheck', title: `${recheck.length} re-check${recheck.length === 1 ? '' : 's'} suggested`, meta: recheck.map((l) => l.display_name).slice(0, 4).join(', '), href: `/learners/${recheck[0].id}`, tone: 'sun' as const }] : []),
    ...moves.reverse().slice(0, 6),
  ];

  if (learners.length === 0) {
    return (
      <>
        <div className="mb-7 space-y-2">{classroom.is_demo && <SampleDataBadge />}<Greeting firstName={firstName} className={classroom.name} learners={0} /></div>
        <EmptyState illustration="empty-learners" title="Add your first learners" body="Add first names or nicknames, then run a short check for each child to see which skills they have demonstrated."
          action={<ButtonLink href={`/classrooms/${id}/learners?add=1`}><Plus className="size-4" aria-hidden /> Add learners</ButtonLink>}
          secondary={<ButtonLink href="/onboarding" variant="secondary">Load demo class</ButtonLink>} />
      </>
    );
  }

  const strands = (['literacy', 'numeracy'] as const).map((k) => ({ k, ...strandCounts(k) }));

  return (
    <div className="relative isolate space-y-8">
      <AuroraBackdrop className="-top-8" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between fade-up">
        <div className="space-y-3">{classroom.is_demo && <SampleDataBadge />}<Greeting firstName={firstName} className={classroom.name} learners={learners.length} /></div>
        <div className="flex gap-2">
          <ButtonLink href={`/classrooms/${id}/learners?add=1`} variant="secondary"><Plus className="size-4" aria-hidden /> Add learners</ButtonLink>
        </div>
      </div>

      <SummaryTiles items={[
        { label: 'Learners', value: learners.length, tone: 'violet', glyph: 'dots', hint: `${notAssessed.length} not checked yet` },
        { label: 'Learners checked', value: assessed.length, tone: 'violet', glyph: 'check', hint: `${pct(assessed.length, learners.length)}% of the class` },
        { label: 'Skills demonstrated', value: demonstrated, tone: 'aqua', glyph: 'star', hint: 'consistently, across both strands' },
        { label: 'Need attention', value: attention, tone: 'tangerine', glyph: 'eye', hint: 'not yet shown or re-check suggested' },
      ]} />

      {next && <NextStepCard id={next.id} sentence={next.sentence} detail={next.detail} action={<ButtonLink href={next.href} variant="tangerine">{next.cta}<ArrowRight className="size-4" aria-hidden /></ButtonLink>} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section aria-labelledby="ladder">
          <SectionHeader id="ladder" title="Class ladder" info="Each dot is a learner, placed on the rung they are working on now. Click a rung or a dot for details." href={`/classrooms/${id}/progress`} linkLabel="View details" />
          <IndexCard className="fade-up"><ClassLadderBoard learners={ladder} /></IndexCard>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="progress-h">
            <SectionHeader id="progress-h" title="Learning progress" info="Every skill result in each strand, by state. Click a bar for the full Insights view." />
            <IndexCard>
              <ul className="space-y-5">
                {strands.map(({ k, counts, learners: n }) => (
                  <li key={k}>
                    <Link href={`/classrooms/${id}/progress`} className="group block rounded-[12px] p-1 -m-1 hover:bg-surface-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold capitalize">{k}</span>
                        <span className="flex items-center gap-1 text-[12px] text-ink-2">{n} of {learners.length} learners checked<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                      </div>
                      <StateBar counts={counts} label={`${k} skill results`} />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-2">Counts are skill results, one per learner per skill checked.</p>
            </IndexCard>
          </section>

          <section aria-labelledby="changes">
            <SectionHeader id="changes" title="Recent activity" href={`/classrooms/${id}/progress`} linkLabel="Insights" />
            <IndexCard>
              <Timeline items={timeline} empty="Changes appear here after learners are re-checked or finish practice." />
            </IndexCard>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="inprog">
          <SectionHeader id="inprog" title="Practice in progress" href="/exercises" linkLabel="All practice" />
          {practiceRows.length === 0 ? (
            <EmptyState illustration="empty-practice" title="No practice assigned yet" body="Assign a practice set to a group and its progress shows here." action={<ButtonLink href="/exercises" variant="secondary">Open practice</ButtonLink>} />
          ) : (
            <ul className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-card">
              {practiceRows.map(({ ex, total, done }) => {
                const sk = SKILL_BY_ID[ex.skill_id];
                const complete = done === total;
                return (
                  <li key={ex.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-aqua-soft text-aqua-ink"><BookOpen className="size-[18px]" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold">{setTitle(ex)}</div>
                      <div className="text-[12px] text-ink-2"><span className="capitalize">{sk?.strand}</span> · {ex.content.items.length} items{ex.source === 'ai' ? ' · AI-drafted' : ''}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-aqua" style={{ width: `${pct(done, total)}%` }} /></span>
                        <span className="shrink-0 text-[12px] font-semibold tabular text-ink-2">{done}/{total} done</span>
                      </div>
                    </div>
                    <ButtonLink href={`/exercises?skill=${ex.skill_id}`} variant={complete ? 'ghost' : 'secondary'} size="sm">{complete ? 'Review' : 'Continue'}</ButtonLink>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="newsets">
          <SectionHeader id="newsets" title="New practice sets" href="/exercises" linkLabel="Library" />
          {(recentSets ?? []).length === 0 ? (
            <EmptyState illustration="empty-practice" title="No approved sets yet" body="Generate or approve a set to see it here." action={<ButtonLink href="/exercises?generate=1" variant="secondary">Generate practice</ButtonLink>} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {(recentSets ?? []).map((e) => (
                <Link key={e.id} href={`/exercises?skill=${e.skill_id}`} className="lift group overflow-hidden rounded-[16px] border border-line bg-surface shadow-card">
                  <SkillArt skill={e.skill_id} className="h-16" />
                  <div className="p-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-violet-soft px-2 py-0.5 font-mono text-[11px] font-medium text-violet-deep dark:text-violet">{e.skill_id}</span>
                      {e.source === 'ai' && <span className="rounded-full bg-sky-soft px-2 py-0.5 text-[11px] font-semibold text-sky-ink">AI-drafted</span>}
                    </div>
                    <div className="mt-2 line-clamp-2 text-[14px] font-semibold leading-5">{setTitle(e)}</div>
                    <div className="mt-1 text-[12px] text-ink-2"><span className="capitalize">{SKILL_BY_ID[e.skill_id]?.strand}</span> · {(e.content as { items: unknown[] }).items.length} items</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="groups-h" id="groups">
        <SectionHeader id="groups-h" title="Groups" href={`/classrooms/${id}/groups`} linkLabel="Plan groups" />
        {groups.length === 0 ? (
          <EmptyState illustration="empty-groups" title="No groups yet" body={assessed.length ? 'Suggested groups are ready in the planner.' : 'Check learners to form groups.'}
            action={<ButtonLink href={`/classrooms/${id}/groups`} variant="secondary">Open groups</ButtonLink>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
            {groups.slice(0, 4).map((g) => {
              const rows = (assignments ?? []).filter((a) => g.members.some((m) => m.id === a.learner_id) && (a.exercises as unknown as { skill_id: string })?.skill_id === g.target_skill_id);
              const done = rows.filter((r) => r.status === 'completed').length;
              const counts = { not_yet: 0, developing: 0, consistent: 0, insufficient: 0 };
              for (const m of g.members) {
                const st = learners.find((l) => l.id === m.id)?.states.find((s) => s.skill_id === g.target_skill_id)?.state;
                if (st) counts[st]++;
              }
              return (
                <IndexCard key={g.id} interactive tab="Group" tabTone="violet">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[16px] font-semibold [font-family:var(--font-sans)]">{g.name}</h3>
                      <p className="text-[12px] text-ink-2"><span className="font-mono">{g.target_skill_id}</span> · {SKILL_BY_ID[g.target_skill_id]?.shortName} · {g.members.length} learners</p>
                    </div>
                    <MeterRing value={rows.length ? pct(done, rows.length) : 0} size={44} label={`${g.name} practice completed`}>
                      <span className="text-[11px] font-bold tabular">{rows.length ? `${done}/${rows.length}` : '—'}</span>
                    </MeterRing>
                  </div>
                  <div className="mt-3"><AvatarStack people={g.members.map((m) => ({ name: m.name, seed: m.code }))} max={6} /></div>
                  <div className="mt-4"><StateBar counts={counts} label={`${g.name} states on ${g.target_skill_id}`} legend={false} /></div>
                  <div className="mt-4"><ButtonLink href={`/classrooms/${id}/groups`} variant="secondary" size="sm">Open group</ButtonLink></div>
                </IndexCard>
              );
            })}
          </div>
        )}
      </section>
      <NotADiagnosis />
    </div>
  );
}
