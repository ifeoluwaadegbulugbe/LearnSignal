import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawResponse, SkillStateName } from '@/lib/scoring/skillState';
import { skillsForStrand, type Strand } from '@/lib/content/skills';
import { computeStates, ruleRecommendation } from '@/lib/scoring/compute';

export interface StoredState {
  skill_id: string; state: SkillStateName; p: number; n_eff: number; sessions: number;
  confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean; updated_at?: string;
}

/** Load every piece of evidence for a learner (assessment responses + exercise attempts), grouped by skill. */
export async function loadEvidence(supabase: SupabaseClient, learnerId: string) {
  const [{ data: resp, error: e1 }, { data: attempts, error: e2 }] = await Promise.all([
    supabase.from('item_responses').select('skill_id, correct, session_id, created_at').eq('learner_id', learnerId),
    supabase.from('exercise_attempts').select('id, skill_id, responses, completed_at').eq('learner_id', learnerId),
  ]);
  if (e1 || e2) throw e1 ?? e2;
  const bySkill = new Map<string, RawResponse[]>();
  const push = (skill: string, r: RawResponse) => { if (!bySkill.has(skill)) bySkill.set(skill, []); bySkill.get(skill)!.push(r); };
  // Session recency must be ranked across BOTH sources, so we tag all evidence with times.
  for (const r of resp ?? []) push(r.skill_id, { correct: r.correct, sessionId: r.session_id, source: 'assessment', at: r.created_at });
  for (const a of attempts ?? []) {
    for (const x of (a.responses as { correct: boolean }[]) ?? []) push(a.skill_id, { correct: x.correct, sessionId: `ex-${a.id}`, source: 'exercise', at: a.completed_at });
  }
  return bySkill;
}

/**
 * Recompute skill states for the given skills, apply the single-bad-day guard against the previous state,
 * upsert skill_states, and append skill_state_history.
 */
export async function recomputeSkillStates(supabase: SupabaseClient, learnerId: string, skillIds: string[], sessionId: string | null) {
  if (skillIds.length === 0) return [];
  const evidence = await loadEvidence(supabase, learnerId);
  const { data: prevRows } = await supabase.from('skill_states').select('skill_id, state').eq('learner_id', learnerId).in('skill_id', skillIds);
  const prev = new Map((prevRows ?? []).map((r) => [r.skill_id, r.state as SkillStateName]));
  const rows: StoredState[] = computeStates(evidence, skillIds, prev);
  const now = new Date().toISOString();
  const { error } = await supabase.from('skill_states').upsert(rows.map((r) => ({ ...r, learner_id: learnerId, updated_at: now })));
  if (error) throw error;
  const { error: hErr } = await supabase.from('skill_state_history').insert(
    rows.map((r) => ({ learner_id: learnerId, skill_id: r.skill_id, session_id: sessionId, state: r.state, p: r.p })),
  );
  if (hErr) throw hErr;
  return rows;
}

/** Create a rule-based recommendation for the learner's working skill in a strand (replacing older suggested ones). */
export async function createRuleRecommendation(supabase: SupabaseClient, learnerId: string, strand: Strand) {
  const { data: states } = await supabase.from('skill_states').select('skill_id, state, p, provisional').eq('learner_id', learnerId);
  const strandSkills = skillsForStrand(strand);
  await supabase.from('recommendations').delete().eq('learner_id', learnerId).eq('status', 'suggested').in('skill_id', strandSkills.map((s) => s.id));
  const rec = ruleRecommendation((states ?? []) as { skill_id: string; state: SkillStateName; p: number; provisional: boolean }[], strand);
  if (!rec) return null;
  const { data } = await supabase.from('recommendations').insert({ learner_id: learnerId, skill_id: rec.skillId, source: 'rules', rationale: rec.rationale }).select('id').single();
  return data?.id ?? null;
}

/** Per-teacher AI switch from Settings (defaults to on). */
export async function userAiEnabled(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('profiles').select('ai_enabled').eq('id', userId).single();
  return data?.ai_enabled !== false;
}

/** Simple per-user rate limit backed by ai_logs (no extra service). */
export async function aiRateLimited(supabase: SupabaseClient, userId: string, perMinute = 10) {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase.from('ai_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since);
  return (count ?? 0) >= perMinute;
}

export async function logAI(supabase: SupabaseClient, userId: string, kind: string, ok: boolean, tokensIn?: number, tokensOut?: number) {
  await supabase.from('ai_logs').insert({ user_id: userId, kind, ok, tokens_in: tokensIn ?? null, tokens_out: tokensOut ?? null });
}
