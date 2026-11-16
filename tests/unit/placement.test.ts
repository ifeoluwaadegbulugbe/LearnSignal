import { describe, expect, it } from 'vitest';
import { decideSkill, nextPlacementStep, type PlacementResponse } from '@/lib/scoring/placement';
import { ITEMS } from '@/lib/content/items.seed';
import { skillsForStrand } from '@/lib/content/skills';

const skills = skillsForStrand('numeracy');
const bank = ITEMS.filter((i) => i.skillId.startsWith('N'));

/** Simulate a learner who passes skills listed in `knows` and fails the rest. */
function simulate(knows: Set<string>, skipFirst = false) {
  const responses: PlacementResponse[] = [];
  for (let i = 0; i < 80; i++) {
    const step = nextPlacementStep(skills, bank, responses);
    if (step.done) return { step, responses };
    const correct = skipFirst && i === 0 ? null : knows.has(step.skillId);
    responses.push({ itemId: step.itemId, skillId: step.skillId, correct });
  }
  throw new Error('placement did not terminate');
}

describe('decideSkill', () => {
  it('passes on 3/4, fails on 1/4, extends on 2/4', () => {
    expect(decideSkill([true, true, true, false])).toEqual({ result: 'pass' });
    expect(decideSkill([true, false, false, false])).toEqual({ result: 'fail' });
    expect(decideSkill([true, true, false, false])).toEqual({ need: 2 });
    expect(decideSkill([true, true, false, false, true, true])).toEqual({ result: 'pass' });
    expect(decideSkill([true, true, false, false, false, true])).toEqual({ result: 'fail' });
  });
  it('asks difficulty 1 first, then 2', () => {
    expect(decideSkill([])).toEqual({ need: 1 });
    expect(decideSkill([true, true])).toEqual({ need: 2 });
  });
});

describe('nextPlacementStep', () => {
  it('starts at sequence 2 with an easy item', () => {
    const s = nextPlacementStep(skills, bank, []);
    expect(s.done).toBe(false);
    if (!s.done) { expect(s.skillId).toBe('N2'); expect(s.difficulty).toBe(1); }
  });

  it('finds the subtraction gap: N1–N3 pass, N4 and N5 fail → stops after two failures going up', () => {
    const { step } = simulate(new Set(['N1', 'N2', 'N3']));
    expect(step.done).toBe(true);
    if (step.done) {
      expect(step.results).toMatchObject({ N2: 'pass', N3: 'pass', N4: 'fail', N5: 'fail' });
      expect(step.results.N6).toBeUndefined();
    }
  });

  it('moves down when the start skill is failed', () => {
    const { step } = simulate(new Set(['N1']));
    if (step.done) expect(step.results).toEqual({ N2: 'fail', N1: 'pass' });
  });

  it('stops at the bottom when nothing is known', () => {
    const { step } = simulate(new Set());
    if (step.done) { expect(step.reason).toBe('bottom_failed'); expect(step.results).toEqual({ N2: 'fail', N1: 'fail' }); }
  });

  it('stops when the top skill is passed', () => {
    const { step } = simulate(new Set(skills.map((s) => s.id)));
    if (step.done) { expect(step.reason).toBe('top_passed'); expect(step.results.N6).toBe('pass'); }
  });

  it('does not count skips as wrong and never repeats an item', () => {
    const { responses } = simulate(new Set(['N1', 'N2', 'N3']), true);
    expect(responses[0].correct).toBeNull();
    expect(new Set(responses.map((r) => r.itemId)).size).toBe(responses.length);
  });
});
