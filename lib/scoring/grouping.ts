// TaRL-style grouping by (strand, working skill). Pure function; groups are suggestions until accepted.
import { workingSkill, type StateBySkill } from './skillState';

export interface LearnerStates { learnerId: string; code: string; displayName: string; states: (StateBySkill & { strand: string })[] }
export interface SuggestedGroup {
  key: string;
  strand: string;
  targetSkillId: string;
  name: string;
  learners: { learnerId: string; code: string; displayName: string; recheck: boolean }[];
  mergeSuggestion?: { intoKey: string; reason: string };
}

export function suggestGroups(
  learners: LearnerStates[],
  strand: string,
  skillMeta: Record<string, { name: string; sequence: number; strand: string }>,
): SuggestedGroup[] {
  const groups = new Map<string, SuggestedGroup>();
  for (const l of learners) {
    const ws = workingSkill(l.states.filter((s) => s.strand === strand));
    if (!ws) continue;
    const key = `${strand}:${ws.skillId}`;
    if (!groups.has(key)) {
      groups.set(key, { key, strand, targetSkillId: ws.skillId, name: skillMeta[ws.skillId]?.name ?? ws.skillId, learners: [] });
    }
    groups.get(key)!.learners.push({ learnerId: l.learnerId, code: l.code, displayName: l.displayName, recheck: ws.recheck });
  }
  const list = [...groups.values()].sort((a, b) => skillMeta[a.targetSkillId].sequence - skillMeta[b.targetSkillId].sequence);
  // Single-learner groups: propose merging into an adjacent-skill group (teacher decides).
  for (const g of list) {
    if (g.learners.length !== 1) continue;
    const seq = skillMeta[g.targetSkillId].sequence;
    const neighbour = list.find((o) => o !== g && o.learners.length > 1 && Math.abs(skillMeta[o.targetSkillId].sequence - seq) === 1)
      ?? list.find((o) => o !== g && Math.abs(skillMeta[o.targetSkillId].sequence - seq) === 1);
    if (neighbour) g.mergeSuggestion = { intoKey: neighbour.key, reason: `Only one learner; could join "${neighbour.name}" (adjacent skill).` };
  }
  return list;
}
