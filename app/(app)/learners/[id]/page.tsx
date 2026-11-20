import { ClipboardCheck, BookOpen } from 'lucide-react';
import { getLearner } from '@/lib/server/learner';
import { SKILLS } from '@/lib/content/skills';
import { ButtonLink } from '@/components/ui/button';
import { Breadcrumb, IndexCard, KeyValue, NotADiagnosis } from '@/components/ui/primitives';
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
  const shown = d.states.filter((s) => s.state === 'consistent').length;
  const summary = (['literacy', 'numeracy'] as const).map((k) => {
    const mine = d.states.filter((s) => SKILLS.find((x) => x.id === s.skill_id)?.strand === k);
    if (!mine.length) return `${k[0].toUpperCase()}${k.slice(1)}: not checked yet`;
    const w = workingFor(k);
    return `${k[0].toUpperCase()}${k.slice(1)}: ${w ? `working on ${w} ${SKILLS.find((x) => x.id === w)?.shortName.toLowerCase()}` : 'no gap flagged'}`;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: learner.classroom.name, href: `/classrooms/${learner.classroom_id}` }, { label: 'Learners', href: `/classrooms/${learner.classroom_id}/learners` }, { label: learner.display_name }]} />

      <IndexCard className="mb-8 fade-up">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={learner.display_name} seed={learner.code} size={64} />
            <div className="min-w-0">
              <h1 className="truncate text-[28px] font-bold sm:text-[36px]">{learner.display_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2"><CodeChip code={learner.code} />{learner.archived_at && <span className="text-[12px] font-semibold text-ink-2">Archived</span>}</div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:w-[440px]">
            <KeyValue label="Added">{fmtDate((learner as { created_at: string }).created_at)}</KeyValue>
            <KeyValue label="Age band">{learner.age_band ?? '—'}</KeyValue>
            <KeyValue label="Class">{learner.classroom.name}</KeyValue>
            <KeyValue label="Last checked">{lastChecked ? fmtDate(lastChecked) : 'Not yet'}</KeyValue>
          </dl>
          <div className="flex flex-wrap items-center gap-2 [&>a]:flex-1 sm:[&>a]:flex-none">
            <ButtonLink href={`/learners/${id}/assess`}><ClipboardCheck className="size-4" aria-hidden /> Start check</ButtonLink>
            <ButtonLink href={assignSkill ? `/exercises?skill=${assignSkill}` : '/exercises'} variant="secondary"><BookOpen className="size-4" aria-hidden /> Assign practice</ButtonLink>
            <LearnerMenu learner={{ id, name: learner.display_name, ageBand: learner.age_band, archived: !!learner.archived_at }} />
          </div>
        </div>
        <p className="mt-5 border-t border-line pt-4 text-[15px] text-muted">{summary.join('. ')}. {shown} skill{shown === 1 ? '' : 's'} demonstrated consistently.</p>
      </IndexCard>

      <ProfileTabs
        learner={{ id, name: learner.display_name, code: learner.code }}
        states={d.states} evidence={d.evidence} oral={d.oral}
        sessions={d.sessions} recs={d.recs} notes={d.notes}
        assignments={d.assignments.map((a) => ({ id: a.id, status: a.status, created_at: a.created_at, skill_id: a.exercise.skill_id, source: a.exercise.source }))}
        chart={chart} chartSkills={chartSkills.map((s) => ({ id: s.id, name: s.shortName }))}
      />
      <NotADiagnosis />

    </div>
  );
}
