import { getClassroom } from '@/lib/server/classroom';
import { Breadcrumb, PageHeader } from '@/components/ui/primitives';
import { LearnersManager } from './learners-manager';

export const metadata = { title: 'Learners' };

export default async function LearnersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; add?: string; archived?: string; strand?: string; state?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.archived === '1' ? 'archived' : (sp.tab ?? 'all');
  const { classroom, learners } = await getClassroom(id, { includeArchived: true });
  const active = learners.filter((l) => !l.archived_at);
  return (
    <>
      <Breadcrumb items={[{ label: classroom.name, href: `/classrooms/${id}` }, { label: 'Learners' }]} />
      <PageHeader title="Learners" subtitle={`${active.length} learner${active.length === 1 ? '' : 's'}. First names only. AI sees each child's code, never their name.`} />
      <LearnersManager classroomId={id} learners={learners} initialTab={tab} openAdd={sp.add === '1'}
        stateFilter={(sp.strand === 'literacy' || sp.strand === 'numeracy') && ['not_yet', 'developing', 'consistent', 'insufficient'].includes(sp.state ?? '') ? { strand: sp.strand, state: sp.state as 'not_yet' } : undefined} />
    </>
  );
}
