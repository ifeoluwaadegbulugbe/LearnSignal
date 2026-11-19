import { Plus, ArrowRight } from 'lucide-react';
import { getClassroom, getGroups } from '@/lib/server/classroom';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { STATUS } from '@/components/ui/status';
import { ButtonLink } from '@/components/ui/button';
import { AuroraBackdrop, IndexCard, MetaRow, NotADiagnosis, SampleDataBadge, SectionHeader, SummaryTiles } from '@/components/ui/primitives';
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
    ctx.supabase.from('assignments').select('learner_id, status, exercises(skill_id)').in('learner_id', ids),
    ctx.supabase.from('skill_state_history').select('learner_id, skill_id, state, p, created_at').in('learner_id', ids).order('created_at'),
  ]) : [{ data: [] }, { data: [] }];

  const firstName = ctx.fullName.split(' ')[0];
  const assessed = learners.filter((l) => l.states.length > 0);
  const notAssessed = learners.filter((l) => l.states.length === 0);
  const closer = assessed.filter((l) => l.states.some((s) => s.retest_suggested) || l.states.some((s) => s.state === 'not_yet' && SKILL_BY_ID[s.skill_id].sequence <= 3));
  const grouped = new Set(groups.flatMap((g) => g.members.map((m) => m.id)));
  const ungrouped = assessed.filter((l) => (l.working.literacy || l.working.numeracy) && !grouped.has(l.id));
  const recheck = assessed.filter((l) => l.states.some((s) => s.retest_suggested));

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

  return (
    <div className="relative isolate space-y-10">
      <AuroraBackdrop className="-top-8" />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between fade-up">
        <div className="space-y-3">{classroom.is_demo && <SampleDataBadge />}<Greeting firstName={firstName} className={classroom.name} learners={learners.length} /></div>
        <div className="xl:w-[480px]"><SummaryTiles items={[
          { label: 'Learners', value: learners.length, tone: 'violet', glyph: 'dots' },
          { label: 'Checked', value: `${pct(assessed.length, learners.length)}%`, tone: 'aqua', glyph: 'check' },
          { label: 'Need a closer look', value: closer.length, tone: 'tangerine', glyph: 'eye' },
        ]} /></div>
      </div>

      {next && <NextStepCard id={next.id} sentence={next.sentence} detail={next.detail} action={<ButtonLink href={next.href} variant="primary">{next.cta}<ArrowRight className="size-4" aria-hidden /></ButtonLink>} />}

      <section aria-labelledby="ladder">
        <SectionHeader id="ladder" title="Class ladder" info="Each dot is a learner, placed on the rung they are working on now. Click a rung or a dot for details." />
        <IndexCard className="fade-up"><ClassLadderBoard learners={ladder} /></IndexCard>
      </section>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="groups" id="groups">
          <SectionHeader id="groups-h" title="Groups" href={`/classrooms/${id}/groups`} linkLabel="Plan groups" />
          {groups.length === 0 ? (
            <EmptyState illustration="empty-groups" title="No groups yet" body={assessed.length ? 'Suggested groups are ready in the planner.' : 'Check learners to form groups.'}
              action={<ButtonLink href={`/classrooms/${id}/groups`} variant="secondary">Open groups</ButtonLink>} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 stagger">
              {groups.slice(0, 4).map((g) => {
                const rows = (assignments ?? []).filter((a) => g.members.some((m) => m.id === a.learner_id) && (a.exercises as unknown as { skill_id: string })?.skill_id === g.target_skill_id);
                const done = rows.filter((r) => r.status === 'completed').length;
                const counts = { not_yet: 0, developing: 0, consistent: 0, insufficient: 0 };
                for (const m of g.members) {
                  const st = learners.find((l) => l.id === m.id)?.states.find((s) => s.skill_id === g.target_skill_id)?.state;
                  if (st) counts[st]++;
                }
                return (
                  <IndexCard key={g.id} interactive art={<SkillArt skill={g.target_skill_id} />}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-semibold [font-family:var(--font-sans)]">{g.name}</h3>
                        <MetaRow className="mt-2" items={[{ label: 'Learners', value: g.members.length }, { label: 'Skill', value: g.target_skill_id }, { label: 'Practice', value: rows.length ? `${pct(done, rows.length)}%` : '—' }]} />
                      </div>
                      <MeterRing value={rows.length ? pct(done, rows.length) : 0} size={44} label={`${g.name} practice completed`}>
                        <span className="text-[11px] font-bold tabular">{rows.length ? `${done}/${rows.length}` : '—'}</span>
                      </MeterRing>
                    </div>
                    <div className="mt-3"><AvatarStack people={g.members.map((m) => ({ name: m.name, seed: m.code }))} max={6} /></div>
                    <div className="mt-4"><StateBar counts={counts} label={`${g.name} states on ${g.target_skill_id}`} /></div>
                    <div className="mt-4"><ButtonLink href={`/classrooms/${id}/groups`} variant="secondary" size="sm">Open</ButtonLink></div>
                  </IndexCard>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="changes">
          <SectionHeader id="changes" title="Recent changes" href={`/classrooms/${id}/progress`} linkLabel="Insights" />
          <IndexCard>
            <Timeline items={timeline} empty="Changes appear here after learners are re-checked or finish practice." />
          </IndexCard>
        </section>
      </div>
      <NotADiagnosis />
    </div>
  );
}
