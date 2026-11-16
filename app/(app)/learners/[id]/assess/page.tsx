import { getTeacherContext } from '@/lib/server/context';
import { notFound } from 'next/navigation';
import { AssessmentRunner } from './runner';

export const metadata = { title: 'Assessment' };

export default async function AssessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getTeacherContext();
  const { data: l } = await supabase.from('learners').select('id, code, display_name, classrooms(is_demo)').eq('id', id).maybeSingle();
  if (!l) notFound();
  return <AssessmentRunner learner={{ id: l.id, code: l.code, name: l.display_name }} isDemo={(l.classrooms as unknown as { is_demo: boolean }).is_demo} />;
}
