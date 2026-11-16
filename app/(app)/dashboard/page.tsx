import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GraduationCap, Plus, ChevronRight } from 'lucide-react';
import { getTeacherContext } from '@/lib/server/context';
import { ButtonLink } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const ctx = await getTeacherContext();
  if (ctx.schools.length === 0) redirect('/onboarding');
  const { data: counts } = await ctx.supabase.from('learners').select('classroom_id, skill_states(learner_id)').is('archived_at', null);
  const stats = new Map<string, { learners: number; assessed: number }>();
  for (const r of counts ?? []) {
    const s = stats.get(r.classroom_id) ?? { learners: 0, assessed: 0 };
    s.learners++; if ((r.skill_states as unknown[]).length) s.assessed++;
    stats.set(r.classroom_id, s);
  }

  return (
    <>
      <PageHeader title="Your classes" subtitle={`Hello, ${ctx.fullName.split(' ')[0]}. Pick a class to see who needs help with what.`}
        actions={<ButtonLink href="/onboarding" variant="secondary"><Plus className="size-4" aria-hidden /> New class</ButtonLink>} />
      {ctx.classrooms.length === 0 ? (
        <EmptyState icon={<GraduationCap className="size-6" />} title="No classes yet" body="Create a classroom, or load the demo class with illustrative sample data." action={<ButtonLink href="/onboarding">Set up a class</ButtonLink>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ctx.classrooms.map((c) => {
            const s = stats.get(c.id) ?? { learners: 0, assessed: 0 };
            return (
              <li key={c.id}>
                <Link href={`/classrooms/${c.id}`} className="block h-full">
                  <Card className="h-full transition-colors hover:border-primary">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold">{c.name}</h2>
                        <p className="text-[14px] text-muted">{c.grade_label} · {ctx.schools.find((x) => x.id === c.school_id)?.name}</p>
                      </div>
                      <ChevronRight className="size-5 text-muted" aria-hidden />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{s.learners} learners</Badge>
                      <Badge tone="primary">{s.assessed} assessed</Badge>
                      {c.is_demo && <Badge tone="accent">sample data</Badge>}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
