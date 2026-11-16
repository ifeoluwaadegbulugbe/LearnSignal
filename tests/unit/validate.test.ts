import { describe, expect, it } from 'vitest';
import { evalArithmetic, rationaleIsSafe, validateItem, validateSet } from '@/lib/ai/validate';
import { SEED_EXERCISE_SETS } from '@/lib/content/exercises.seed';
import { runGeneration } from '@/lib/ai/generate';

const base = { hint: 'Count on from the bigger number.', feedbackCorrect: 'Well done!', feedbackTryAgain: 'Nice try. Have another go.' };

describe('evalArithmetic', () => {
  it('computes + and − safely', () => {
    expect(evalArithmetic('8 + 5')).toBe(13);
    expect(evalArithmetic('13 − 6')).toBe(7);
    expect(evalArithmetic('2+3-1')).toBe(4);
    expect(evalArithmetic('process.exit()')).toBeNull();
    expect(evalArithmetic('3 * 4')).toBeNull();
  });
});

describe('validateItem', () => {
  it('rejects wrong arithmetic', () => {
    const r = validateItem({ type: 'numeric', stem: '8 + 5 = ?', answer: 12, ...base }, 'N3', 2);
    expect(r.report.ok).toBe(false);
    expect(r.report.reasons.join()).toMatch(/wrong answer/);
  });
  it('accepts correct arithmetic', () => {
    expect(validateItem({ type: 'numeric', stem: '13 − 6 = ?', answer: 7, ...base }, 'N4', 3).report.ok).toBe(true);
  });
  it('rejects numbers above 20 for N3', () => {
    expect(validateItem({ type: 'numeric', stem: '15 + 9 = ?', answer: 24, ...base }, 'N3', 3).report.ok).toBe(false);
  });
  it('rejects a word that is not in the CVC bank', () => {
    const r = validateItem({ type: 'mcq', stem: 'Blend the sounds: q-u-z. What word?', options: ['quz', 'cat', 'dog'], answer: 'quz', ...base }, 'L2', 1);
    expect(r.report.reasons.join()).toMatch(/word bank/);
  });
  it('rejects banned words', () => {
    const r = validateItem({ type: 'mcq', stem: 'Musa saw a gun. What did he see?', options: ['gun', 'cup'], answer: 'gun', ...base }, 'L5', 1);
    expect(r.report.reasons.join()).toMatch(/banned/);
  });
  it('rejects real brands and diagnosis terms', () => {
    expect(validateItem({ type: 'mcq', stem: 'Ada drinks Pepsi. What does she drink?', options: ['Pepsi', 'water'], answer: 'Pepsi', ...base }, 'L5', 1).report.ok).toBe(false);
    expect(validateItem({ type: 'mcq', stem: 'Tolu has dyslexia. Who?', options: ['Tolu', 'Ada'], answer: 'Tolu', ...base }, 'L5', 1).report.ok).toBe(false);
  });
  it('rejects unexpected personal names', () => {
    const r = validateItem({ type: 'mcq', stem: 'Ada met John at the market. Who did she meet?', options: ['John', 'Musa'], answer: 'John', ...base }, 'L5', 1);
    expect(r.report.reasons.join()).toMatch(/name/);
  });
  it('rejects answers not in options and duplicate options', () => {
    expect(validateItem({ type: 'mcq', stem: 'What is the value of 4 in 47?', options: ['4', '47'], answer: '40', ...base }, 'N5', 2).report.ok).toBe(false);
    expect(validateItem({ type: 'listen_choose', stem: 'Tap the word you hear.', audioText: 'Tap the word: the', options: ['the', 'the'], answer: 'the', ...base }, 'L3', 1).report.ok).toBe(false);
  });
  it('checks counting against the emoji shown', () => {
    expect(validateItem({ type: 'numeric', stem: 'How many? 🥭🥭🥭', answer: 3, ...base }, 'N2', 1).report.ok).toBe(true);
    expect(validateItem({ type: 'numeric', stem: 'How many? 🥭🥭🥭', answer: 4, ...base }, 'N2', 1).report.ok).toBe(false);
  });
  it('verifies one-step word problems', () => {
    expect(validateItem({ type: 'numeric', stem: 'Tolu has 12 sweets and gives 5 away. How many are left?', answer: 7, ...base }, 'N6', 2).report.ok).toBe(true);
    expect(validateItem({ type: 'numeric', stem: 'Tolu has 12 sweets and gives 5 away. How many are left?', answer: 17, ...base }, 'N6', 2).report.ok).toBe(false);
  });
  it('rejects schema violations (stem too long)', () => {
    expect(validateItem({ type: 'numeric', stem: 'x'.repeat(200), answer: 1, ...base }, 'N3', 1).report.ok).toBe(false);
  });
  it('rejects sentences too long for the level', () => {
    const stem = 'Ada and Tolu walked to the busy market with their mother to buy yams and oranges today.';
    expect(validateItem({ type: 'mcq', stem, options: ['yams', 'cars'], answer: 'yams', ...base }, 'L5', 1).report.reasons.join()).toMatch(/too long/);
  });
});

describe('seeded exercise bank', () => {
  it('every seeded set passes the validator', () => {
    for (const set of SEED_EXERCISE_SETS) {
      const { report } = validateSet(set.items.map(({ source: _s, ...i }) => i), set.skillId, set.difficulty);
      const bad = report.items.filter((r) => !r.ok);
      expect(bad, `${set.id}: ${JSON.stringify(bad)}`).toEqual([]);
    }
  });
});

describe('runGeneration', () => {
  const args = { skillId: 'N3', difficulty: 2 as const, count: 5, prompt: 'p' };
  it('falls back fully when AI is disabled', async () => {
    const r = await runGeneration(args, null);
    expect(r.fallback).toBe('full');
    expect(r.items.every((i) => i.source === 'seed')).toBe(true);
    expect(r.notice).toMatch(/AI unavailable/);
  });
  it('falls back fully on malformed JSON', async () => {
    const r = await runGeneration(args, async () => ({ text: '{not json' }));
    expect(r.fallback).toBe('full');
  });
  it('drops invalid AI items and fills from the seed bank', async () => {
    const items = [
      { type: 'numeric', stem: '8 + 5 = ?', answer: 13, ...base },
      { type: 'numeric', stem: '9 + 4 = ?', answer: 12, ...base }, // wrong
      { type: 'numeric', stem: '7 + 6 = ?', answer: 13, ...base },
    ];
    const r = await runGeneration(args, async () => ({ text: JSON.stringify({ items }) }));
    expect(r.aiItems).toBe(2);
    expect(r.seedItems).toBe(3);
    expect(r.fallback).toBe('partial');
    expect(r.report!.rejected).toBe(1);
    expect(r.items).toHaveLength(5);
  });
  it('labels the rate-limit fallback', async () => {
    const r = await runGeneration(args, async () => { throw new Error('The AI service is rate-limited right now.'); });
    expect(r.notice).toMatch(/rate limit/);
  });
});

describe('rationaleIsSafe', () => {
  it('rejects names, diagnosis terms and invented numbers', () => {
    expect(rationaleIsSafe('Tolu struggles with subtraction.', [], ['Tolu']).ok).toBe(false);
    expect(rationaleIsSafe('This may indicate dyscalculia or a disorder.', [], []).ok).toBe(false);
    expect(rationaleIsSafe('Got 7 of 10 right.', [4, 10], []).ok).toBe(false);
    expect(rationaleIsSafe('Got 4 of 10 right on subtraction across 2 sessions.', [4, 10, 2], []).ok).toBe(true);
  });
});
