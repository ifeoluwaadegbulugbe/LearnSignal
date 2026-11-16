import { describe, expect, it } from 'vitest';
import { computeStates, ruleRecommendation } from '@/lib/scoring/compute';
import { workingSkill, type RawResponse } from '@/lib/scoring/skillState';

const resp = (sessionId: string, at: string, results: boolean[]): RawResponse[] =>
  results.map((correct) => ({ correct, sessionId, source: 'assessment', at }));

describe('computeStates', () => {
  it('ranks recency per skill, so sessions in another strand do not age this skill', () => {
    // N2 evidence only in session "num" (older than a literacy session that has no N2 items).
    const raw = new Map([['N2', resp('num', '2026-11-01T00:00:00Z', [true, true, true, true])]]);
    const [row] = computeStates(raw, ['N2'], new Map());
    expect(row.n_eff).toBe(4); // weight 1, not 0.7
    expect(row.state).not.toBe('insufficient');
  });
});

describe('working skill with a strong first session', () => {
  it('does not treat a provisional, strong "developing" skill as a gap', () => {
    expect(workingSkill([
      { skillId: 'N1', sequence: 1, state: 'developing', p: 0.83, provisional: true },
      { skillId: 'N2', sequence: 2, state: 'developing', p: 0.83, provisional: true },
      { skillId: 'N3', sequence: 3, state: 'not_yet', p: 0.17, provisional: true },
    ])).toEqual({ skillId: 'N3', recheck: false });
  });
  it('still flags a genuinely mixed developing skill', () => {
    expect(workingSkill([{ skillId: 'N1', sequence: 1, state: 'developing', p: 0.6, provisional: true }])).toEqual({ skillId: 'N1', recheck: false });
  });
  it('ruleRecommendation picks the first real gap', () => {
    const rec = ruleRecommendation([
      { skill_id: 'N3', state: 'developing', p: 0.83, provisional: true },
      { skill_id: 'N4', state: 'not_yet', p: 0.17, provisional: true },
    ], 'numeracy');
    expect(rec?.skillId).toBe('N4');
  });
});
