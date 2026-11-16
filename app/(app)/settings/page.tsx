import { getTeacherContext } from '@/lib/server/context';
import { aiConfig } from '@/lib/ai/gemini';
import { PageHeader } from '@/components/ui/primitives';
import { SettingsForms } from './settings-forms';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const ctx = await getTeacherContext();
  const { data: profile } = await ctx.supabase.from('profiles').select('ai_enabled').eq('id', ctx.user.id).single();
  const { data: learners } = await ctx.supabase.from('learners').select('id, code, display_name, classroom_id, archived_at, skill_states(skill_id, state)').order('display_name');
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForms
        fullName={ctx.fullName}
        email={ctx.user.email ?? ''}
        aiEnabled={profile?.ai_enabled !== false}
        aiServer={{ enabled: aiConfig().enabled, ready: aiConfig().ready, model: process.env.GEMINI_MODEL ?? null }}
        schools={ctx.schools.map((s) => ({ id: s.id, name: s.name, role: s.role }))}
        classrooms={ctx.classrooms}
        learners={(learners ?? []).map((l) => ({ id: l.id, code: l.code, name: l.display_name, classroomId: l.classroom_id, archived: !!l.archived_at, states: (l.skill_states as { skill_id: string; state: string }[]) ?? [] }))}
        isDemo={ctx.isDemo}
      />
    </>
  );
}
