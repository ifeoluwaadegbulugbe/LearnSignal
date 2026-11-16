import { Boxes } from 'lucide-react';
import { getClassroom, getGroups } from '@/lib/server/classroom';
import { formGroups } from '@/lib/actions/intervention';
import { PageHeader, SampleDataBanner } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { ButtonLink } from '@/components/ui/button';
import { GroupPlanner } from './group-planner';

export const metadata = { title: 'Groups' };

export default async function GroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ classroom, learners, ctx }, accepted, lit, num] = await Promise.all([getClassroom(id), getGroups(id), formGroups(id, 'literacy'), formGroups(id, 'numeracy')]);
  const assessed = learners.some((l) => l.states.length > 0);
  const { data: approved } = await ctx.supabase.from('exercises').select('id, skill_id, difficulty, source, created_at').eq('review_status', 'approved').order('created_at', { ascending: false });

  return (
    <>
      {classroom.is_demo && <SampleDataBanner className="mb-4" />}
      <PageHeader eyebrow={classroom.name} title="Intervention planner" subtitle="Groups are formed by each child's working skill (Teaching at the Right Level). They are suggestions: rename, move children, then accept." />
      {!assessed ? (
        <EmptyState icon={<Boxes className="size-6" />} title="Assess learners to form groups" body="Once a few children have been assessed, suggested groups appear here." action={<ButtonLink href={`/classrooms/${id}/learners`}>Go to learners</ButtonLink>} />
      ) : (
        <GroupPlanner
          classroomId={id}
          suggested={{ literacy: lit.ok ? lit.data : [], numeracy: num.ok ? num.data : [] }}
          loadError={!lit.ok || !num.ok ? 'Could not compute suggestions. Try refreshing.' : null}
          accepted={accepted}
          approvedExercises={approved ?? []}
        />
      )}
    </>
  );
}
