import 'server-only';
import { notFound } from 'next/navigation';
import { getTeacherContext } from './context';
import type { SkillStateName } from '@/lib/scoring/skillState';

export interface SkillEvidence {
  sessions: { id: string; kind: string; at: string; correct: number; total: number; skipped: number; source: 'assessment' | 'exercise' }[];
}

export async function getLearner(id: string) {
  const { supabase } = await getTeacherContext();
  const { data: learner } = await supabase.from('learners')
    .select('id, code, display_name, age_band, archived_at, created_at, classroom_id, classrooms(name, is_demo)').eq('id', id).maybeSingle();
  if (!learner) notFound();

  const [states, history, sessions, responses, attempts, notes, assignments, recs] = await Promise.all([
    supabase.from('skill_states').select('skill_id, state, p, n_eff, sessions, confidence, provisional, retest_suggested, updated_at').eq('learner_id', id),
    supabase.from('skill_state_history').select('skill_id, state, p, created_at, session_id').eq('learner_id', id).order('created_at'),
    supabase.from('assessment_sessions').select('id, strand, kind, started_at, completed_at, ended_early').eq('learner_id', id).order('started_at', { ascending: false }),
    supabase.from('item_responses').select('session_id, skill_id, correct, response').eq('learner_id', id),
    supabase.from('exercise_attempts').select('id, skill_id, correct_count, total, completed_at').eq('learner_id', id).order('completed_at', { ascending: false }),
    supabase.from('teacher_notes').select('id, body, created_at').eq('learner_id', id).order('created_at', { ascending: false }),
    supabase.from('assignments').select('id, status, created_at, exercises(skill_id, source)').eq('learner_id', id).order('created_at', { ascending: false }),
    supabase.from('recommendations').select('id, skill_id, source, rationale, status, created_at').eq('learner_id', id).order('created_at', { ascending: false }),
  ]);

  // Evidence per skill: per-session correct/total, for the "Why?" drawer and before/after.
  const sessionMap = new Map((sessions.data ?? []).map((s) => [s.id, s]));
  const evidence: Record<string, SkillEvidence> = {};
  const agg = new Map<string, { correct: number; total: number; skipped: number }>();
  for (const r of responses.data ?? []) {
    const k = `${r.skill_id}|${r.session_id}`;
    const a = agg.get(k) ?? { correct: 0, total: 0, skipped: 0 };
    if (r.correct === null) a.skipped++; else { a.total++; if (r.correct) a.correct++; }
    agg.set(k, a);
  }
  for (const [k, a] of agg) {
    const [skill, sid] = k.split('|');
    const s = sessionMap.get(sid);
    if (!s) continue;
    (evidence[skill] ??= { sessions: [] }).sessions.push({ id: sid, kind: s.kind, at: s.completed_at ?? s.started_at, ...a, source: 'assessment' });
  }
  for (const a of attempts.data ?? []) {
    (evidence[a.skill_id] ??= { sessions: [] }).sessions.push({ id: a.id, kind: 'practice', at: a.completed_at, correct: a.correct_count, total: a.total, skipped: 0, source: 'exercise' });
  }
  for (const e of Object.values(evidence)) e.sessions.sort((x, y) => (x.at < y.at ? 1 : -1));

  // Oral-reading detail (WCPM / accuracy) from tap_word_sequence items.
  const oral = (responses.data ?? []).filter((r) => r.skill_id === 'L4' && (r.response as { wcpm?: number })?.wcpm !== undefined)
    .map((r) => ({ session: r.session_id, ...(r.response as { wcpm: number; accuracy: number }) }));

  return {
    learner: { ...learner, classroom: learner.classrooms as unknown as { name: string; is_demo: boolean } },
    states: (states.data ?? []) as { skill_id: string; state: SkillStateName; p: number; n_eff: number; sessions: number; confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean; updated_at: string }[],
    history: history.data ?? [],
    sessions: sessions.data ?? [],
    evidence, oral,
    notes: notes.data ?? [],
    assignments: (assignments.data ?? []).map((a) => ({ ...a, exercise: a.exercises as unknown as { skill_id: string; source: string } })),
    recs: recs.data ?? [],
  };
}
