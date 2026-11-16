import { AppShell, type ShellData } from '@/components/layout/app-shell';
import { getTeacherContext } from '@/lib/server/context';
import { aiConfig } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getTeacherContext();
  const [{ data: learners }, { data: retest }, { count: pending }, { data: profile }] = await Promise.all([
    ctx.supabase.from('learners').select('id, code, display_name, classroom_id').is('archived_at', null).order('display_name').limit(500),
    ctx.supabase.from('skill_states').select('learner_id, skill_id, learners!inner(display_name, archived_at)').eq('retest_suggested', true).is('learners.archived_at', null).limit(20),
    ctx.supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('created_by', ctx.user.id).eq('review_status', 'pending'),
    ctx.supabase.from('profiles').select('ai_enabled').eq('id', ctx.user.id).single(),
  ]);

  const notifications: ShellData['notifications'] = [
    ...(pending ? [{ id: 'approve', kind: 'approve' as const, title: `${pending} practice set${pending === 1 ? '' : 's'} to review`, body: 'AI-drafted sets wait for your approval before any child sees them.', href: '/exercises' }] : []),
    ...(retest ?? []).slice(0, 5).map((r) => ({
      id: `retest-${r.learner_id}-${r.skill_id}`, kind: 'retest' as const,
      title: `Re-check due: ${(r.learners as unknown as { display_name: string }).display_name}`,
      body: `${r.skill_id}: the latest session differs from earlier evidence.`, href: `/learners/${r.learner_id}`,
    })),
  ];

  const data: ShellData = {
    fullName: ctx.fullName, email: ctx.user.email ?? '', isAdmin: ctx.schools.some((s) => s.role === 'admin'), isDemo: ctx.isDemo,
    aiReady: aiConfig().ready && profile?.ai_enabled !== false,
    classrooms: ctx.classrooms.map((c) => ({ id: c.id, name: c.name, school_id: c.school_id, is_demo: c.is_demo })),
    schools: ctx.schools.map((s) => ({ id: s.id, name: s.name })),
    learners: learners ?? [],
    notifications,
  };
  return <AppShell data={data}>{children}</AppShell>;
}
