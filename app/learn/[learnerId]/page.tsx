import { notFound } from 'next/navigation';
import { getTeacherContext } from '@/lib/server/context';
import { ChildMode } from './child-mode';

export const metadata = { title: 'Learner mode' };
export const dynamic = 'force-dynamic';

// Child mode runs on the teacher's authenticated session (no child accounts).
export default async function LearnPage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const ctx = await getTeacherContext();
  const { data: l } = await ctx.supabase.from('learners').select('id, display_name').eq('id', learnerId).is('archived_at', null).maybeSingle();
  if (!l) notFound();
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const [{ data: open }, { count: doneThisWeek }] = await Promise.all([
    ctx.supabase.from('assignments').select('id, created_at, exercises(skill_id, content)').eq('learner_id', learnerId).eq('status', 'assigned').order('created_at').limit(3),
    ctx.supabase.from('exercise_attempts').select('id', { count: 'exact', head: true }).eq('learner_id', learnerId).gte('completed_at', weekStart.toISOString()),
  ]);
  const cards = (open ?? []).map((a) => {
    const ex = a.exercises as unknown as { skill_id: string; content: { items: unknown[] } };
    return { id: a.id, skillId: ex.skill_id, count: ex.content.items.length };
  });
  return <ChildMode learner={{ id: l.id, name: l.display_name }} cards={cards} doneThisWeek={doneThisWeek ?? 0} isDemo={ctx.isDemo} />;
}
