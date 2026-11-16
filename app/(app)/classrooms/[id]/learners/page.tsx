import { getClassroom } from '@/lib/server/classroom';
import { PageHeader, SampleDataBanner } from '@/components/ui/primitives';
import { LearnersManager } from './learners-manager';

export const metadata = { title: 'Learners' };

export default async function LearnersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ archived?: string; add?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const showArchived = sp.archived === '1';
  const { classroom, learners } = await getClassroom(id, { includeArchived: showArchived });
  return (
    <>
      {classroom.is_demo && <SampleDataBanner className="mb-4" />}
      <PageHeader eyebrow={classroom.name} title="Learners" subtitle="First names or nicknames only. Each child has a random code that AI sees instead of their name." />
      <LearnersManager classroomId={id} learners={learners} showArchived={showArchived} openAdd={sp.add === '1'} />
    </>
  );
}
