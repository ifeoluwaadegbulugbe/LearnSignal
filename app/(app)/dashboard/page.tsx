import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getTeacherContext } from '@/lib/server/context';
import { ButtonLink } from '@/components/ui/button';
import { Badge, IndexCard, PageHeader } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { StateBar } from '@/components/ui/viz';
import type { SkillStateName } from '@/lib/scoring/skillState';

export const metadata = { title: 'All classes' };

export default async function Dashboard() {
  const ctx = await getTeacherContext();
  if (ctx.schools.length === 0) redirect('/onboarding');
  const { data: rows } = await ctx.supabase.from('learners').select('classroom_id, skill_states(state)').is('archived_at', null);
  const stats = new Map<string, { learners: number; checked: number; counts: Record<SkillStateName, number> }>();
  for (const r of rows ?? []) {
    const s = stats.get(r.classroom_id) ?? { learners: 0, checked: 0, counts: { not_yet: 0, developing: 0, consistent: 0, insufficient: 0 } };
    const st = (r.skill_states ?? []) as { state: SkillStateName }[];
    s.learners++; if (st.length) s.checked++;
    for (const x of st) s.counts[x.state]++;
    stats.set(r.classroom_id, s);
  }

  return (
    <>
      <PageHeader title="Your classes" subtitle={`Hello, ${ctx.fullName.split(' ')[0]}. Pick a class to see who needs help with what.`}
        actions={<ButtonLink href="/onboarding" variant="secondary"><Plus className="size-4" aria-hidden /> New class</ButtonLink>} />
      {ctx.classrooms.length === 0 ? (
        <EmptyState illustration="empty-learners" title="No classes yet" body="Create a class, or load the demo class with illustrative sample data." action={<ButtonLink href="/onboarding">Set up a class</ButtonLink>} />
      ) : (
        <ul className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {ctx.classrooms.map((c) => {
            const s = stats.get(c.id) ?? { learners: 0, checked: 0, counts: { not_yet: 0, developing: 0, consistent: 0, insufficient: 0 } };
            return (
              <li key={c.id}>
                <Link href={`/classrooms/${c.id}`} className="block h-full rounded-[18px]">
                  <IndexCard tab={c.grade_label} interactive className="h-full">
                    <h2 className="font-heading text-[20px] font-semibold">{c.name}</h2>
                    <p className="text-[14px] text-ink-2">{ctx.schools.find((x) => x.id === c.school_id)?.name}</p>
                    <div className="mt-4 flex flex-wrap gap-2"><Badge>{s.learners} learners</Badge><Badge tone="teal">{s.checked} checked</Badge>{c.is_demo && <Badge tone="sun">sample data</Badge>}</div>
                    <div className="mt-4"><StateBar counts={s.counts} label={`${c.name} skill states`} legend={false} /></div>
                  </IndexCard>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
