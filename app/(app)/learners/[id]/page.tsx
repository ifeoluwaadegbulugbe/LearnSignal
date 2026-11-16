import Link from 'next/link';
import { ClipboardCheck, PlayCircle, ArrowLeft } from 'lucide-react';
import { getLearner } from '@/lib/server/learner';
import { SKILLS, SKILL_BY_ID } from '@/lib/content/skills';
import { INTERVENTIONS } from '@/lib/content/interventions';
import { ButtonLink } from '@/components/ui/button';
import { Badge, Card, NotADiagnosis, PageHeader, SampleDataBanner } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { fmtDate } from '@/lib/utils';
import { SkillLadder } from './skill-ladder';
import { NotesPanel, RecommendationActions } from './learner-panels';
import { BeforeAfterChart, type BeforeAfterPoint } from '@/components/charts/before-after-chart';

export const metadata = { title: 'Learner' };

export default async function LearnerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getLearner(id);
  const { learner } = d;
  const assessed = d.states.length > 0;
  const suggested = d.recs.filter((r) => r.status === 'suggested');
  const openAssignments = d.assignments.filter((a) => a.status === 'assigned');

  // Before/after: % correct per skill for each completed assessment session (oldest → newest).
  const completed = [...d.sessions].filter((s) => s.completed_at).reverse();
  const touchedSkills = SKILLS.filter((s) => d.evidence[s.id]?.sessions.some((x) => x.source === 'assessment'));
  const chartSkills = touchedSkills.filter((s) => (d.evidence[s.id]?.sessions.filter((x) => x.source === 'assessment').length ?? 0) >= 2);
  const sessionDates = [...new Set(completed.map((s) => (s.completed_at ?? s.started_at).slice(0, 10)))];
  const chart: BeforeAfterPoint[] = sessionDates.map((date) => {
    const p: BeforeAfterPoint = { label: fmtDate(date) };
    for (const s of chartSkills) {
      const ev = d.evidence[s.id].sessions.find((x) => x.source === 'assessment' && x.at.slice(0, 10) === date);
      if (ev && ev.total) p[s.id] = Math.round((ev.correct / ev.total) * 100);
    }
    return p;
  });

  return (
    <>
      {learner.classroom.is_demo && <SampleDataBanner className="mb-4" />}
      <Link href={`/classrooms/${learner.classroom_id}/learners`} className="mb-3 inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> {learner.classroom.name}</Link>
      <PageHeader title={learner.display_name} subtitle={<><span className="font-mono">{learner.code}</span>{learner.age_band && ` · age ${learner.age_band}`}{learner.archived_at && ' · archived'}</>}
        actions={<>
          <ButtonLink href={`/learners/${id}/assess`}><ClipboardCheck className="size-4" aria-hidden /> {assessed ? 'Reassess' : 'Assess'}</ButtonLink>
          <ButtonLink href={`/learn/${id}`} variant="secondary"><PlayCircle className="size-4" aria-hidden /> Learner mode</ButtonLink>
        </>} />

      {!assessed ? (
        <EmptyState icon={<ClipboardCheck className="size-6" />} title="Not assessed yet" body="Run a literacy or numeracy check (about 8–10 minutes each) to see which skills this child has demonstrated."
          action={<ButtonLink href={`/learners/${id}/assess`}>Start a check</ButtonLink>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {(['literacy', 'numeracy'] as const).map((strand) => (
                <Card key={strand}><SkillLadder strand={strand} states={d.states} evidence={d.evidence} oral={d.oral} /></Card>
              ))}
            </div>

            <Card>
              <h2 className="mb-1 text-lg font-bold">Gap analysis</h2>
              <p className="mb-3 text-[14px] text-muted">Skills not yet demonstrated consistently, in foundational order. Rule-based suggestions; you decide.</p>
              {(() => {
                const gaps = d.states.filter((s) => s.state === 'not_yet' || s.state === 'developing')
                  .sort((a, b) => SKILL_BY_ID[a.skill_id].sequence - SKILL_BY_ID[b.skill_id].sequence || a.skill_id.localeCompare(b.skill_id));
                if (!gaps.length) return <p className="text-[15px] text-muted">No gaps flagged. Keep practising and reassess later.</p>;
                return (
                  <ul className="divide-y divide-line">
                    {gaps.map((g) => {
                      const ev = d.evidence[g.skill_id]?.sessions ?? [];
                      const rec = suggested.find((r) => r.skill_id === g.skill_id);
                      return (
                        <li key={g.skill_id} className="py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-semibold">{g.skill_id} {SKILL_BY_ID[g.skill_id].name}</div>
                            <span className="text-[13px] text-muted">{ev.reduce((n, e) => n + e.correct, 0)}/{ev.reduce((n, e) => n + e.total, 0)} correct · {g.sessions} session{g.sessions === 1 ? '' : 's'}</span>
                          </div>
                          <p className="mt-1 text-[14px] text-muted">{INTERVENTIONS[g.skill_id].activity}</p>
                          {rec && <RecommendationActions id={rec.id} />}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </Card>

            <Card>
              {chartSkills.length ? (
                <BeforeAfterChart title="Before and after: % correct per skill" data={chart} skills={chartSkills.map((s) => ({ id: s.id, name: s.shortName }))} />
              ) : (
                <><h2 className="text-lg font-bold">Before and after</h2><p className="mt-1 text-[15px] text-muted">Reassess to see change over time.</p></>
              )}
            </Card>
            <NotADiagnosis />
          </div>

          <aside className="space-y-6">
            <Card>
              <h2 className="mb-2 text-lg font-bold">Practice</h2>
              {openAssignments.length ? (
                <ul className="space-y-1 text-[15px]">{openAssignments.map((a) => <li key={a.id} className="flex justify-between"><span>{SKILL_BY_ID[a.exercise.skill_id].shortName}</span><Badge tone="sky">to do</Badge></li>)}</ul>
              ) : <p className="text-[14px] text-muted">No practice assigned. Assign from the Groups planner or Exercises.</p>}
              {d.assignments.some((a) => a.status === 'completed') && <p className="mt-2 text-[13px] text-muted">{d.assignments.filter((a) => a.status === 'completed').length} completed</p>}
            </Card>
            <Card>
              <h2 className="mb-2 text-lg font-bold">History</h2>
              <ol className="space-y-2 text-[14px]">
                {d.sessions.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span className="capitalize">{s.strand} {s.kind}{s.ended_early ? ' (ended early)' : ''}{!s.completed_at ? ' (unfinished)' : ''}</span>
                    <span className="text-muted">{fmtDate(s.completed_at ?? s.started_at)}</span>
                  </li>
                ))}
              </ol>
            </Card>
            <NotesPanel learnerId={id} notes={d.notes} />
          </aside>
        </div>
      )}
    </>
  );
}
