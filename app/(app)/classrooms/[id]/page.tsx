import Link from 'next/link';
import { Users, ClipboardCheck, AlertCircle, Boxes, UserPlus, ChevronRight } from 'lucide-react';
import { distribution, getClassroom, getGroups } from '@/lib/server/classroom';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { ButtonLink } from '@/components/ui/button';
import { Card, PageHeader, SampleDataBanner, Stat, NotADiagnosis } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { StateBadge } from '@/components/ui/state-badge';
import { DistributionChart } from '@/components/charts/distribution-chart';
import { pct } from '@/lib/utils';

export const metadata = { title: 'Class dashboard' };

export default async function ClassroomDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ classroom, learners }, groups] = await Promise.all([getClassroom(id), getGroups(id)]);
  const assessed = learners.filter((l) => l.states.length > 0);
  const attention = assessed.filter((l) => l.states.some((s) => s.state === 'not_yet' && SKILL_BY_ID[s.skill_id].sequence <= 3) || l.states.some((s) => s.retest_suggested));
  const dist = distribution(learners);

  return (
    <>
      {classroom.is_demo && <SampleDataBanner className="mb-4" />}
      <PageHeader title={classroom.name} subtitle={`${classroom.grade_label} · English`}
        actions={<>
          <ButtonLink href={`/classrooms/${id}/learners`} variant="secondary"><UserPlus className="size-4" aria-hidden /> Learners</ButtonLink>
          <ButtonLink href={`/classrooms/${id}/groups`}><Boxes className="size-4" aria-hidden /> Plan groups</ButtonLink>
        </>} />

      {learners.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title="Add your first learner" body="Add first names or nicknames, then run a 10-minute check for each child."
          action={<ButtonLink href={`/classrooms/${id}/learners?add=1`}>Add learners</ButtonLink>} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Learners" value={learners.length} icon={<Users className="size-5" />} />
            <Stat label="Assessed" value={`${pct(assessed.length, learners.length)}%`} sub={`${assessed.length} of ${learners.length}`} icon={<ClipboardCheck className="size-5" />} />
            <Stat label="Needs attention" value={attention.length} sub="early-skill gaps or retest suggested" icon={<AlertCircle className="size-5" />} />
          </div>

          {assessed.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="size-6" />} title="No one assessed yet" body="Open a learner and start a literacy or numeracy check. It takes about 8–10 minutes per strand."
              action={<ButtonLink href={`/learners/${learners[0].id}/assess`}>Assess {learners[0].display_name}</ButtonLink>} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card><DistributionChart title="Literacy: learners per state" data={dist.filter((d) => d.strand === 'literacy')} /></Card>
              <Card><DistributionChart title="Numeracy: learners per state" data={dist.filter((d) => d.strand === 'numeracy')} /></Card>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Groups</h2>
                <Link href={`/classrooms/${id}/groups`} className="text-[14px] font-semibold text-primary underline">Open planner</Link>
              </div>
              {groups.length === 0 ? (
                <p className="text-[15px] text-muted">No accepted groups yet. {assessed.length ? 'Open the planner to see suggested groups.' : 'Assess learners to form groups.'}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {groups.slice(0, 5).map((g) => (
                    <li key={g.id} className="flex items-center justify-between py-2.5">
                      <span><b>{g.name}</b> <span className="text-[13px] text-muted">· {g.target_skill_id}</span></span>
                      <span className="text-[14px] text-muted">{g.members.length} learner{g.members.length === 1 ? '' : 's'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 text-lg font-bold">Attention list</h2>
              {attention.length === 0 ? <p className="text-[15px] text-muted">No early-skill gaps flagged right now.</p> : (
                <ul className="divide-y divide-line">
                  {attention.slice(0, 8).map((l) => {
                    const gap = l.states.filter((s) => s.state === 'not_yet').sort((a, b) => SKILL_BY_ID[a.skill_id].sequence - SKILL_BY_ID[b.skill_id].sequence)[0];
                    const retest = l.states.find((s) => s.retest_suggested);
                    return (
                      <li key={l.id}>
                        <Link href={`/learners/${l.id}`} className="flex min-h-12 items-center justify-between gap-2 py-2 hover:text-primary">
                          <span><b>{l.display_name}</b> <span className="text-[13px] text-muted">{l.code}</span></span>
                          <span className="flex items-center gap-2 text-[13px]">
                            {retest ? <span>{SKILL_BY_ID[retest.skill_id].shortName}: retest suggested</span>
                              : gap && <><span className="hidden sm:inline">{SKILL_BY_ID[gap.skill_id].shortName}</span><StateBadge state="not_yet" short /></>}
                            <ChevronRight className="size-4" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
          <NotADiagnosis />
        </div>
      )}
    </>
  );
}
