import { describe, expect, it } from 'vitest';
import { applyDowngradeGuard, computeSkillState, toEvidence, workingSkill, type Evidence } from '@/lib/scoring/skillState';

const session = (id: string, ago: number, results: boolean[], source: Evidence['source'] = 'assessment'): Evidence[] =>
  results.map((correct) => ({ correct, sessionsAgo: ago, source, sessionId: id }));

describe('computeSkillState', () => {
  it('is insufficient with fewer than 3 effective items', () => {
    const s = computeSkillState(session('a', 0, [true, true]));
    expect(s.state).toBe('insufficient');
    expect(s.provisional).toBe(true);
    expect(s.confidence).toBe('low');
  });

  it('is not_yet when mostly wrong', () => {
    const s = computeSkillState(session('a', 0, [false, false, false, true]));
    expect(s.state).toBe('not_yet');
    expect(s.p).toBeLessThan(0.5);
  });

  it('is developing when mixed', () => {
    expect(computeSkillState(session('a', 0, [true, true, false, true])).state).toBe('developing');
  });

  it('never reaches consistent from a single session, however strong', () => {
    const s = computeSkillState(session('a', 0, Array(10).fill(true)));
    expect(s.state).toBe('developing');
    expect(s.provisional).toBe(true);
  });

  it('reaches consistent with two strong sessions', () => {
    const s = computeSkillState([...session('a', 1, [true, true, true, true]), ...session('b', 0, [true, true, true, true])]);
    expect(s.state).toBe('consistent');
    expect(s.sessions).toBe(2);
    expect(s.provisional).toBe(false);
  });

  it('one bad session after good history does not produce not_yet on its own', () => {
    const ev = [
      ...session('s1', 2, [true, true, true, true]),
      ...session('s2', 1, [true, true, true, true]),
      ...session('bad', 0, [false, false, false, false]),
    ];
    const s = computeSkillState(ev);
    expect(s.state).not.toBe('not_yet');
    expect(s.state).toBe('developing');
  });

  it('weights exercise evidence at half', () => {
    const a = computeSkillState(session('x', 0, [true, true, true, true], 'exercise'));
    expect(a.nEff).toBeCloseTo(2);
    expect(a.state).toBe('insufficient');
  });

  it('applies recency decay', () => {
    const s = computeSkillState(session('old', 2, [true, true, true, true]));
    expect(s.nEff).toBeCloseTo(4 * 0.49);
  });
});

describe('applyDowngradeGuard', () => {
  it('turns consistent → not_yet into developing with retest suggested', () => {
    const g = applyDowngradeGuard('consistent', { state: 'not_yet', p: 0.3, nEff: 8, sessions: 3, confidence: 'medium', provisional: false });
    expect(g.state).toBe('developing');
    expect(g.retestSuggested).toBe(true);
  });
  it('leaves other transitions alone', () => {
    const g = applyDowngradeGuard('developing', { state: 'not_yet', p: 0.3, nEff: 8, sessions: 3, confidence: 'medium', provisional: false });
    expect(g.state).toBe('not_yet');
  });
});

describe('toEvidence', () => {
  it('ranks sessions by recency and drops skips', () => {
    const ev = toEvidence([
      { correct: true, sessionId: 'old', source: 'assessment', at: '2026-01-01T00:00:00Z' },
      { correct: null, sessionId: 'new', source: 'assessment', at: '2026-02-01T00:00:00Z' },
      { correct: false, sessionId: 'new', source: 'assessment', at: '2026-02-01T00:00:00Z' },
    ]);
    expect(ev).toHaveLength(2);
    expect(ev.find((e) => e.sessionId === 'new')!.sessionsAgo).toBe(0);
    expect(ev.find((e) => e.sessionId === 'old')!.sessionsAgo).toBe(1);
  });
});

describe('workingSkill', () => {
  it('picks the lowest flagged skill', () => {
    expect(workingSkill([
      { skillId: 'N4', sequence: 4, state: 'not_yet' },
      { skillId: 'N3', sequence: 3, state: 'developing' },
      { skillId: 'N1', sequence: 1, state: 'consistent' },
    ])).toEqual({ skillId: 'N3', recheck: false });
  });
  it('recommends a re-check when only insufficient evidence exists', () => {
    expect(workingSkill([{ skillId: 'N2', sequence: 2, state: 'insufficient' }])).toEqual({ skillId: 'N2', recheck: true });
  });
  it('returns null when everything is consistent', () => {
    expect(workingSkill([{ skillId: 'N1', sequence: 1, state: 'consistent' }])).toBeNull();
  });
});
