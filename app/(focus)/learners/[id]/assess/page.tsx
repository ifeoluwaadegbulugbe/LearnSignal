import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AssessmentRunner } from './runner';

export const metadata = { title: 'Check' };

export default async function AssessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: l } = await supabase.from('learners').select('id, code, display_name, classroom_id, classrooms(is_demo)').eq('id', id).maybeSingle();
  if (!l) notFound();
  const { data: sessions } = await supabase.from('assessment_sessions').select('strand, completed_at').eq('learner_id', id).not('completed_at', 'is', null).order('completed_at', { ascending: false });
  const last = (strand: string) => sessions?.find((s) => s.strand === strand)?.completed_at ?? null;
  return (
    <AssessmentRunner
      learner={{ id: l.id, code: l.code, name: l.display_name, classroomId: l.classroom_id }}
      isDemo={(l.classrooms as unknown as { is_demo: boolean }).is_demo}
      lastChecked={{ literacy: last('literacy'), numeracy: last('numeracy') }}
    />
  );
}
