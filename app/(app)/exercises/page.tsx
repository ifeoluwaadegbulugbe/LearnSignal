import { getTeacherContext } from '@/lib/server/context';
import { PageHeader } from '@/components/ui/primitives';
import { aiConfig } from '@/lib/ai/gemini';
import { ExerciseLibrary, type ExerciseRow } from './exercise-library';

export const metadata = { title: 'Exercises' };

export default async function ExercisesPage({ searchParams }: { searchParams: Promise<{ skill?: string; generate?: string }> }) {
  const sp = await searchParams;
  const ctx = await getTeacherContext();
  const [{ data: exercises, error }, { data: learners }] = await Promise.all([
    ctx.supabase.from('exercises').select('id, skill_id, difficulty, source, review_status, content, validation, created_by, created_at').order('created_at', { ascending: false }),
    ctx.supabase.from('learners').select('id, display_name, code, classroom_id').is('archived_at', null).order('display_name'),
  ]);
  return (
    <>
      <PageHeader title="Exercises" subtitle="Built-in practice sets and AI-drafted sets. Code checks every AI item; you approve before any child sees it." />
      <ExerciseLibrary
        exercises={(exercises ?? []) as ExerciseRow[]}
        loadError={error ? 'Could not load exercises.' : null}
        userId={ctx.user.id}
        aiReady={aiConfig().ready}
        learners={learners ?? []}
        classrooms={ctx.classrooms.map((c) => ({ id: c.id, name: c.name }))}
        initialSkill={sp.skill && /^[LN][1-6]$/.test(sp.skill) ? sp.skill : ''}
        openGenerator={sp.generate === '1'}
      />
    </>
  );
}
