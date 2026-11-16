// Pure helpers shared by the server engine and the demo loader.
import { applyDowngradeGuard, computeSkillState, toEvidence, workingSkill, type RawResponse, type SkillStateName } from './skillState';
import { SKILL_BY_ID, skillsForStrand, type Strand } from '@/lib/content/skills';
import { INTERVENTIONS } from '@/lib/content/interventions';

export interface StateRow {
  skill_id: string; state: SkillStateName; p: number; n_eff: number; sessions: number;
  confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean;
}

/**
 * Compute guarded states for the given skills. Recency ("sessionsAgo") is ranked per skill, over the
 * sessions that contain evidence for that skill — so a literacy session never ages numeracy evidence.
 */
export function computeStates(bySkill: Map<string, RawResponse[]>, skillIds: string[], prev: Map<string, SkillStateName>): StateRow[] {
  return skillIds.map((skillId) => {
    const s = applyDowngradeGuard(prev.get(skillId), computeSkillState(toEvidence(bySkill.get(skillId) ?? [])));
    return {
      skill_id: skillId, state: s.state, p: Math.round(s.p * 1000) / 1000, n_eff: Math.round(s.nEff * 100) / 100,
      sessions: s.sessions, confidence: s.confidence, provisional: s.provisional, retest_suggested: s.retestSuggested,
    };
  });
}

/** Rule-based recommendation for a strand's working skill (no AI). */
export function ruleRecommendation(states: { skill_id: string; state: SkillStateName; p: number; provisional: boolean }[], strand: Strand) {
  const ids = new Set<string>(skillsForStrand(strand).map((s) => s.id));
  const ws = workingSkill(states.filter((s) => ids.has(s.skill_id)).map((s) => ({ skillId: s.skill_id, sequence: SKILL_BY_ID[s.skill_id].sequence, state: s.state, p: Number(s.p), provisional: s.provisional })));
  if (!ws) return null;
  const t = INTERVENTIONS[ws.skillId];
  const skill = SKILL_BY_ID[ws.skillId];
  return {
    skillId: ws.skillId,
    rationale: ws.recheck
      ? `Not enough evidence yet on ${skill.name}. Re-check this skill before grouping.`
      : `${skill.name} is the first skill on the ladder not yet demonstrated. Suggested 15-minute activity: ${t.activity} Success check: ${t.successCheck}.`,
  };
}
