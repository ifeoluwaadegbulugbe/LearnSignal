import { ClipboardCheck, BookOpen } from 'lucide-react';
import { getLearner } from '@/lib/server/learner';
import { SKILLS } from '@/lib/content/skills';
import { ButtonLink } from '@/components/ui/button';
import { Breadcrumb, IndexCard, KeyValue, NotADiagnosis, SampleDataBadge } from '@/components/ui/primitives';
import { Avatar } from '@/components/ui/avatar';
import { CodeChip } from '@/components/ui/code-chip';
import { fmtDate } from '@/lib/utils';
import { ProfileTabs } from './profile-tabs';
import { LearnerMenu } from './learner-menu';
import type { BeforeAfterPoint } from '@/components/charts/before-after-chart';

export const metadata = { title: 'Learner' };

export default async function LearnerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getLearner(id);
  const { learner } = d;
  const completed = [...d.sessions].filter((s) => s.completed_at);
  const lastChecked = completed[0]?.completed_at ?? null;

  // Before/after per skill: % correct in each completed assessment session (oldest → newest).
  const chartSkills = SKILLS.filter((s) => (d.evidence[s.id]?.sessions.filter((x) => x.source === 'assessment').length ?? 0) >= 2);
  const dates = [...new Set([...completed].reverse().map((s) => (s.completed_at ?? s.started_at).slice(0, 10)))];
  const chart: BeforeAfterPoint[] = dates.map((date) => {
    const p: BeforeAfterPoint = { label: fmtDate(date) };
    for (const s of chartSkills) {
      const ev = d.evidence[s.id].sessions.find((x) => x.source === 'assessment' && x.at.slice(0, 10) === date);
      if (ev?.total) p[s.id] = Math.round((ev.correct / ev.total) * 100);
    }
    return p;
  });
  const workingFor = (strand: 'literacy' | 'numeracy') => d.recs.find((r) => r.status === 'suggested' && SKILLS.find((s) => s.id === r.skill_id)?.strand === strand)?.skill_id;
  const assignSkill = workingFor('numeracy') ?? workingFor('literacy');

  return (
    <div className="pb-24 md:pb-0">
      <Breadcrumb items={[{ label: learner.classroom.name, href: `/classrooms/${learner.classroom_id}` }, { label: 'Learners', href: `/classrooms/${learner.classroom_id}/learners` }, { label: learner.display_name }]} />
      {learner.classroom.is_demo && <div className="mb-3"><SampleDataBadge /></div>}

      <IndexCard tab="Learner" className="mb-8 fade-up">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={learner.display_name} seed={learner.code} size={64} />
            <div className="min-w-0">
              <h1 className="truncate font-heading text-[30px] font-bold leading-9 tracking-[-0.02em]">{learner.display_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2"><CodeChip code={learner.code} />{learner.archived_at && <span className="text-[12px] font-semibold text-ink-2">Archived</span>}</div>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-4 md:w-[360px]">
            <KeyValue label="Age band">{learner.age_band ?? '—'}</KeyValue>
            <KeyValue label="Class">{learner.classroom.name}</KeyValue>
            <KeyValue label="Last checked">{lastChecked ? fmtDate(lastChecked) : 'Not yet'}</KeyValue>
          </dl>
          <div className="hidden items-center gap-2 md:flex">
            <ButtonLink href={`/learners/${id}/assess`}><ClipboardCheck className="size-4" aria-hidden /> Start check</ButtonLink>
            <ButtonLink href={assignSkill ? `/exercises?skill=${assignSkill}` : '/exercises'} variant="secondary"><BookOpen className="size-4" aria-hidden /> Assign practice</ButtonLink>
            <LearnerMenu learner={{ id, name: learner.display_name, ageBand: learner.age_band, archived: !!learner.archived_at }} />
          </div>
        </div>
      </IndexCard>

      <ProfileTabs
        learner={{ id, name: learner.display_name, code: learner.code }}
        states={d.states} evidence={d.evidence} oral={d.oral}
        sessions={d.sessions} recs={d.recs} notes={d.notes}
        assignments={d.assignments.map((a) => ({ id: a.id, status: a.status, created_at: a.created_at, skill_id: a.exercise.skill_id, source: a.exercise.source }))}
        chart={chart} chartSkills={chartSkills.map((s) => ({ id: s.id, name: s.shortName }))}
      />
      <NotADiagnosis />

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-[68px] z-30 flex gap-2 border-t border-line bg-paper/95 p-3 backdrop-blur md:hidden no-print">
        <ButtonLink href={`/learners/${id}/assess`} className="flex-1"><ClipboardCheck className="size-4" aria-hidden /> Start check</ButtonLink>
        <ButtonLink href={assignSkill ? `/exercises?skill=${assignSkill}` : '/exercises'} variant="secondary" className="flex-1">Assign practice</ButtonLink>
        <LearnerMenu learner={{ id, name: learner.display_name, ageBand: learner.age_band, archived: !!learner.archived_at }} />
      </div>
    </div>
  );
}
