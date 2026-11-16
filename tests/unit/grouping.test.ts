import { describe, expect, it } from 'vitest';
import { suggestGroups, type LearnerStates } from '@/lib/scoring/grouping';
import { SKILLS } from '@/lib/content/skills';

const meta = Object.fromEntries(SKILLS.map((s) => [s.id, { name: s.name, sequence: s.sequence, strand: s.strand }]));
const learner = (id: string, states: Record<string, 'not_yet' | 'developing' | 'consistent' | 'insufficient'>): LearnerStates => ({
  learnerId: id, code: `LS-${id}`, displayName: id,
  states: Object.entries(states).map(([skillId, state]) => ({ skillId, state, sequence: meta[skillId].sequence, strand: meta[skillId].strand })),
});

describe('suggestGroups', () => {
  it('groups by working skill and proposes merging singletons into adjacent groups', () => {
    const groups = suggestGroups([
      learner('a', { N3: 'consistent', N4: 'not_yet' }),
      learner('b', { N3: 'consistent', N4: 'developing' }),
      learner('c', { N3: 'not_yet', N4: 'not_yet' }),
      learner('d', { N3: 'consistent', N4: 'consistent' }),
      learner('e', { L1: 'not_yet' }),
    ], 'numeracy', meta);
    expect(groups.map((g) => g.targetSkillId)).toEqual(['N3', 'N4']);
    expect(groups[1].learners.map((l) => l.learnerId)).toEqual(['a', 'b']);
    expect(groups[0].mergeSuggestion?.intoKey).toBe('numeracy:N4');
  });
});
