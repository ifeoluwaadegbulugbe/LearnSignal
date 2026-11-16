import { getClassroom, getGroups } from '@/lib/server/classroom';
import { formGroups } from '@/lib/actions/intervention';
import { Breadcrumb, PageHeader, SampleDataBadge } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { GroupPlanner } from './group-planner';

export const metadata = { title: 'Groups' };

export default async function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ classroom, learners, ctx }, accepted, lit, num] = await Promise.all([getClassroom(id), getGroups(id), formGroups(id, 'literacy'), formGroups(id, 'numeracy')]);
  const assessed = learners.some((l) => l.states.length > 0);
  const { data: approved } = await ctx.supabase.from('exercises').select('id, skill_id, difficulty, source, created_at').eq('review_status', 'approved').order('created_at', { ascending: false });
  const states = Object.fromEntries(learners.map((l) => [l.id, Object.fromEntries(l.states.map((s) => [s.skill_id, s.state]))]));

  return (
    <>
      <Breadcrumb items={[{ label: classroom.name, href: `/classrooms/${id}` }, { label: 'Groups' }]} />
      {classroom.is_demo && <div className="mb-3"><SampleDataBadge /></div>}
      <PageHeader title="Groups" subtitle="Suggested by skill level. You decide." actions={assessed ? <ButtonLink href={`/classrooms/${id}/groups`} variant="secondary">Regroup from latest results</ButtonLink> : undefined} />
      {!assessed ? (
        <EmptyState illustration="empty-groups" title="Check learners to form groups" body="Once a few children have been checked, suggested groups appear here." action={<ButtonLink href={`/classrooms/${id}/learners?tab=na`}>Go to learners</ButtonLink>} />
      ) : (
        <GroupPlanner classroomId={id} suggested={{ literacy: lit.ok ? lit.data : [], numeracy: num.ok ? num.data : [] }}
          loadError={!lit.ok || !num.ok ? 'Could not compute suggestions. Try again.' : null} accepted={accepted} approvedExercises={approved ?? []} states={states} />
      )}
    </>
  );
}
