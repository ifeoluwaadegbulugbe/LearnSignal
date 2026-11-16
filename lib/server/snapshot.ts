import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassSnapshot } from '@/lib/ai/tools';
import type { SkillStateName } from '@/lib/scoring/skillState';

/** Load a classroom snapshot under the caller's RLS. Codes only — display names are never included. */
export async function loadClassSnapshot(supabase: SupabaseClient, classroomId: string): Promise<ClassSnapshot | null> {
  const { data: c } = await supabase.from('classrooms').select('name').eq('id', classroomId).single();
  if (!c) return null;
  const { data: learners, error } = await supabase.from('learners')
    .select('id, code, skill_states(skill_id, state, p, confidence, provisional), skill_state_history(skill_id, state, created_at)')
    .eq('classroom_id', classroomId).is('archived_at', null);
  if (error) throw error;
  return {
    classroomName: c.name,
    asOf: new Date().toISOString(),
    learners: (learners ?? []).map((l) => {
      const states = (l.skill_states as { skill_id: string; state: SkillStateName; p: number; confidence: string; provisional: boolean }[]) ?? [];
      return {
        code: l.code,
        assessed: states.length > 0,
        states: states.map((s) => ({ skillId: s.skill_id, state: s.state, p: Number(s.p), confidence: s.confidence, provisional: s.provisional })),
        history: ((l.skill_state_history as { skill_id: string; state: SkillStateName; created_at: string }[]) ?? [])
          .map((h) => ({ skillId: h.skill_id, state: h.state, at: h.created_at })),
      };
    }),
  };
}
