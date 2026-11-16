import 'server-only';
import { notFound } from 'next/navigation';
import { getTeacherContext } from './context';
import { SKILL_BY_ID, SKILLS } from '@/lib/content/skills';
import { workingSkill, type SkillStateName } from '@/lib/scoring/skillState';

export interface LearnerRow {
  id: string; code: string; display_name: string; age_band: string | null; archived_at: string | null; created_at: string;
  lastAssessed: string | null;
  states: { skill_id: string; state: SkillStateName; confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean }[];
  working: { literacy: string | null; numeracy: string | null };
}

export async function getClassroom(id: string, opts: { includeArchived?: boolean } = {}) {
  const ctx = await getTeacherContext();
  const { supabase } = ctx;
  const { data: classroom } = await supabase.from('classrooms').select('id, name, grade_label, language, school_id, is_demo').eq('id', id).maybeSingle();
  if (!classroom) notFound();

  let q = supabase.from('learners')
    .select('id, code, display_name, age_band, archived_at, created_at, skill_states(skill_id, state, confidence, provisional, retest_suggested), assessment_sessions(completed_at)')
    .eq('classroom_id', id).order('display_name');
  if (!opts.includeArchived) q = q.is('archived_at', null);
  const { data: rows, error } = await q;
  if (error) throw error;

  const learners: LearnerRow[] = (rows ?? []).map((r) => {
    const states = (r.skill_states ?? []) as LearnerRow['states'];
    const done = ((r.assessment_sessions ?? []) as { completed_at: string | null }[]).map((s) => s.completed_at).filter(Boolean) as string[];
    const ws = (strand: 'literacy' | 'numeracy') => workingSkill(states.filter((s) => SKILL_BY_ID[s.skill_id].strand === strand)
      .map((s) => ({ skillId: s.skill_id, sequence: SKILL_BY_ID[s.skill_id].sequence, state: s.state })))?.skillId ?? null;
    return {
      id: r.id, code: r.code, display_name: r.display_name, age_band: r.age_band, archived_at: r.archived_at, created_at: r.created_at,
      lastAssessed: done.sort().at(-1) ?? null, states, working: { literacy: ws('literacy'), numeracy: ws('numeracy') },
    };
  });
  return { ctx, classroom, learners };
}

/** Per-skill counts by state, for the stacked distribution chart. */
export function distribution(learners: LearnerRow[]) {
  return SKILLS.map((s) => {
    const row = { skill: s.id, name: s.shortName, strand: s.strand, not_yet: 0, developing: 0, consistent: 0, insufficient: 0 };
    for (const l of learners) {
      const st = l.states.find((x) => x.skill_id === s.id);
      if (st) row[st.state]++;
    }
    return row;
  });
}

export async function getGroups(classroomId: string) {
  const { supabase } = await getTeacherContext();
  const { data, error } = await supabase.from('intervention_groups')
    .select('id, name, strand, target_skill_id, created_at, group_members(learner_id, learners(code, display_name))')
    .eq('classroom_id', classroomId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((g) => ({
    id: g.id, name: g.name, strand: g.strand, target_skill_id: g.target_skill_id, created_at: g.created_at,
    members: ((g.group_members ?? []) as unknown as { learner_id: string; learners: { code: string; display_name: string } }[])
      .map((m) => ({ id: m.learner_id, code: m.learners.code, name: m.learners.display_name })),
  }));
}
