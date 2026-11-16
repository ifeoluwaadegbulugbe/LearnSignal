// Adaptive placement flow (master prompt §6.3). Stateless: the next step is recomputed
// from the responses recorded so far, so a session can resume after a refresh.

export interface PlacementSkill { id: string; sequence: number }
export interface PlacementItem { id: string; skillId: string; difficulty: number }
export interface PlacementResponse { itemId: string; skillId: string; correct: boolean | null } // null = skipped

export type SkillResult = 'pass' | 'fail';
export type PlacementStep =
  | { done: false; skillId: string; difficulty: number; itemId: string }
  | { done: true; reason: 'boundary_found' | 'top_passed' | 'bottom_failed' | 'items_exhausted'; results: Record<string, SkillResult> };

const START_INDEX = 1; // skill with sequence 2 (L2 / N2)

/** Decide a skill from its scored responses. Returns null when more items are needed, plus the difficulty to ask next. */
export function decideSkill(scored: boolean[]): { result: SkillResult } | { need: number } {
  if (scored.length < 4) return { need: scored.length < 2 ? 1 : 2 };
  const c4 = scored.slice(0, 4).filter(Boolean).length;
  if (c4 >= 3) return { result: 'pass' };
  if (c4 <= 1) return { result: 'fail' };
  if (scored.length < 6) return { need: 2 };
  const c6 = scored.slice(0, 6).filter(Boolean).length;
  return { result: c6 >= 4 ? 'pass' : 'fail' };
}

function decideWithWhatWeHave(scored: boolean[]): SkillResult {
  if (scored.length === 0) return 'fail';
  return scored.filter(Boolean).length / scored.length >= 0.75 ? 'pass' : 'fail';
}

export function nextPlacementStep(
  skills: PlacementSkill[],
  bank: PlacementItem[],
  responses: PlacementResponse[],
): PlacementStep {
  const ladder = [...skills].sort((a, b) => a.sequence - b.sequence);
  const used = new Set(responses.map((r) => r.itemId));
  const results: Record<string, SkillResult> = {};
  let idx = Math.min(START_INDEX, ladder.length - 1);
  let lastMove: 'start' | 'up' | 'down' = 'start';
  let upFails = 0;

  for (let guard = 0; guard < ladder.length * 2; guard++) {
    const skill = ladder[idx];
    const scored = responses.filter((r) => r.skillId === skill.id && r.correct !== null).map((r) => r.correct as boolean);
    const decision = decideSkill(scored);
    let result: SkillResult;

    if ('need' in decision) {
      const pool = bank.filter((i) => i.skillId === skill.id && !used.has(i.id));
      const pick = pool.find((i) => i.difficulty === decision.need) ?? pool.find((i) => i.difficulty === decision.need + 1) ?? pool[0];
      if (pick) return { done: false, skillId: skill.id, difficulty: pick.difficulty, itemId: pick.id };
      result = decideWithWhatWeHave(scored); // ran out of items for this skill
      if (scored.length === 0) return { done: true, reason: 'items_exhausted', results };
    } else {
      result = decision.result;
    }

    results[skill.id] = result;
    if (result === 'pass') {
      upFails = 0;
      if (idx === ladder.length - 1) return { done: true, reason: 'top_passed', results };
      if (results[ladder[idx + 1].id]) return { done: true, reason: 'boundary_found', results };
      idx += 1; lastMove = 'up';
    } else if (lastMove === 'up') {
      upFails += 1;
      if (upFails >= 2 || idx === ladder.length - 1) return { done: true, reason: 'boundary_found', results };
      idx += 1;
    } else {
      if (idx === 0) return { done: true, reason: 'bottom_failed', results };
      if (results[ladder[idx - 1].id]) return { done: true, reason: 'boundary_found', results };
      idx -= 1; lastMove = 'down';
    }
  }
  return { done: true, reason: 'boundary_found', results };
}
