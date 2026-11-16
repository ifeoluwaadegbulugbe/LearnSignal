import { getTeacherContext } from '@/lib/server/context';
import { PageHeader } from '@/components/ui/primitives';
import { aiConfig } from '@/lib/ai/gemini';
import { ExerciseLibrary, type ExerciseRow } from './exercise-library';

export const metadata = { title: 'Practice' };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ skill?: string; generate?: string }> }) {
  const sp = await searchParams;
  const ctx = await getTeacherContext();
  const [{ data: exercises, error }, { data: learners }, { data: groups }, { data: profile }] = await Promise.all([
    ctx.supabase.from('exercises').select('id, skill_id, difficulty, source, review_status, content, validation, created_by, created_at').order('created_at', { ascending: false }),
    ctx.supabase.from('learners').select('id, display_name, code, classroom_id').is('archived_at', null).order('display_name'),
    ctx.supabase.from('intervention_groups').select('id, name, target_skill_id, classroom_id, group_members(learner_id)'),
    ctx.supabase.from('profiles').select('ai_enabled').eq('id', ctx.user.id).single(),
  ]);
  return (
    <>
      <PageHeader title="Practice" subtitle="Built-in sets and AI-drafted sets. Code checks every AI item; you approve before any child sees it." />
      <ExerciseLibrary
        exercises={(exercises ?? []) as ExerciseRow[]}
        loadError={error ? 'Something went wrong on our side. Your work is safe. Try again.' : null}
        userId={ctx.user.id}
        aiReady={aiConfig().ready && profile?.ai_enabled !== false}
        learners={learners ?? []}
        groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name, skill: g.target_skill_id, classroomId: g.classroom_id, members: (g.group_members as { learner_id: string }[]).map((m) => m.learner_id) }))}
        classrooms={ctx.classrooms.map((c) => ({ id: c.id, name: c.name }))}
        initialSkill={sp.skill && /^[LN][1-6]$/.test(sp.skill) ? sp.skill : 'all'}
        openGenerator={sp.generate === '1'}
      />
    </>
  );
}
