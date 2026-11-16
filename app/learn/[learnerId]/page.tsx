import { notFound } from 'next/navigation';
import { getTeacherContext } from '@/lib/server/context';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { ChildMode } from './child-mode';

export const metadata = { title: 'Learner mode' };
export const dynamic = 'force-dynamic';

// Child mode still runs on the teacher's authenticated session (no child accounts).
export default async function LearnPage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const ctx = await getTeacherContext();
  const { data: l } = await ctx.supabase.from('learners').select('id, display_name').eq('id', learnerId).is('archived_at', null).maybeSingle();
  if (!l) notFound();
  const [{ data: open }, { count: completed }] = await Promise.all([
    ctx.supabase.from('assignments').select('id, created_at, exercises(skill_id, content)').eq('learner_id', learnerId).eq('status', 'assigned').order('created_at').limit(3),
    ctx.supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('learner_id', learnerId).eq('status', 'completed'),
  ]);
  const cards = (open ?? []).map((a) => {
    const ex = a.exercises as unknown as { skill_id: string; content: { items: unknown[] } };
    return { id: a.id, title: SKILL_BY_ID[ex.skill_id].shortName, count: ex.content.items.length };
  });
  return <ChildMode learner={{ id: l.id, name: l.display_name }} cards={cards} completed={completed ?? 0} isDemo={ctx.isDemo} />;
}
