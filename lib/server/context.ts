import 'server-only';
import { cache } from 'react';
import { requireUser } from '@/lib/supabase/server';

export interface ClassroomLite { id: string; name: string; grade_label: string; school_id: string; is_demo: boolean }

/** Per-request teacher context (cached). Everything is read under the user's RLS. */
export const getTeacherContext = cache(async () => {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: memberships }, { data: classrooms }, { data: demo }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('school_members').select('role, schools(id, name, state)').eq('user_id', user.id),
    supabase.from('classrooms').select('id, name, grade_label, school_id, is_demo').order('created_at'),
    supabase.rpc('is_demo_account'),
  ]);
  const schools = (memberships ?? []).map((m) => ({ ...(m.schools as unknown as { id: string; name: string; state: string | null }), role: m.role as 'admin' | 'teacher' }));
  return {
    supabase, user,
    fullName: profile?.full_name ?? 'Teacher',
    schools,
    classrooms: (classrooms ?? []) as ClassroomLite[],
    isDemo: demo === true,
  };
});
