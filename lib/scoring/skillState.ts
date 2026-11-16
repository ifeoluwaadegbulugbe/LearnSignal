// Deterministic skill-state engine (master prompt §6.4). Implemented exactly as specified.
export type SkillStateName = 'insufficient' | 'not_yet' | 'developing' | 'consistent';
export interface Evidence { correct: boolean; sessionsAgo: number; source: 'assessment' | 'exercise'; sessionId: string }
export interface SkillState { state: SkillStateName; p: number; nEff: number; sessions: number; confidence: 'low' | 'medium' | 'high'; provisional: boolean }

export function computeSkillState(ev: Evidence[]): SkillState {
  const DECAY = 0.7, EXERCISE_WEIGHT = 0.5;
  let nEff = 0, cEff = 0; const sessions = new Set<string>();
  for (const e of ev) {
    const w = Math.pow(DECAY, e.sessionsAgo) * (e.source === 'exercise' ? EXERCISE_WEIGHT : 1);
    nEff += w; if (e.correct) cEff += w; sessions.add(e.sessionId);
  }
  const p = (cEff + 1) / (nEff + 2);              // Laplace-smoothed
  const s = sessions.size;
  let state: SkillStateName;
  if (nEff < 3) state = 'insufficient';
  else if (p >= 0.8 && s >= 2 && nEff >= 6) state = 'consistent';
  else if (p < 0.5) state = 'not_yet';
  else state = 'developing';
  const confidence = nEff >= 10 && s >= 2 ? 'high' : nEff >= 5 ? 'medium' : 'low';
  return { state, p, nEff, sessions: s, confidence, provisional: s < 2 };
}

export interface GuardedSkillState extends SkillState { retestSuggested: boolean }

/**
 * Single-bad-day safeguard: a previously `consistent` skill is never downgraded to `not_yet`
 * from one new session. It becomes `developing` and the UI shows "retest suggested".
 */
export function applyDowngradeGuard(prev: SkillStateName | null | undefined, next: SkillState): GuardedSkillState {
  if (prev === 'consistent' && next.state === 'not_yet') return { ...next, state: 'developing', retestSuggested: true };
  const conflicts = prev === 'consistent' && next.state === 'developing';
  return { ...next, retestSuggested: conflicts };
}

export interface RawResponse { correct: boolean | null; sessionId: string; source: 'assessment' | 'exercise'; at: string }

/** Turn raw responses (skips = null are ignored) into Evidence with sessionsAgo ranked by recency (most recent = 0). */
export function toEvidence(responses: RawResponse[]): Evidence[] {
  const sessionTime = new Map<string, string>();
  for (const r of responses) {
    const t = sessionTime.get(r.sessionId);
    if (!t || r.at > t) sessionTime.set(r.sessionId, r.at);
  }
  const order = [...sessionTime.entries()].sort((a, b) => (a[1] < b[1] ? 1 : -1)).map(([id]) => id);
  const rank = new Map(order.map((id, i) => [id, i]));
  return responses
    .filter((r) => r.correct !== null)
    .map((r) => ({ correct: r.correct as boolean, sessionsAgo: rank.get(r.sessionId) ?? 0, source: r.source, sessionId: r.sessionId }));
}

export interface StateBySkill { skillId: string; sequence: number; state: SkillStateName; p?: number; provisional?: boolean }

/** Strong first-session result: "developing" only because a second session is still needed. */
export const isProvisionallySecure = (s: { state: SkillStateName; p?: number; provisional?: boolean }) =>
  s.state === 'developing' && !!s.provisional && (s.p ?? 0) >= 0.8;

/**
 * Working skill per strand = lowest-sequence skill that is not_yet or developing.
 * Exception (see docs/ASSUMPTIONS.md): a skill that is "developing" only because it has a single strong
 * session (p ≥ 0.8, provisional) is not treated as a gap — otherwise after one baseline every passed skill
 * would be "developing" and every child would be grouped at the bottom of the ladder.
 * If nothing is flagged but some skills are `insufficient`, returns the lowest insufficient one with recheck=true.
 */
export function workingSkill(states: StateBySkill[]): { skillId: string; recheck: boolean } | null {
  const sorted = [...states].sort((a, b) => a.sequence - b.sequence);
  const flagged = sorted.find((s) => s.state === 'not_yet' || (s.state === 'developing' && !isProvisionallySecure(s)));
  if (flagged) return { skillId: flagged.skillId, recheck: false };
  const insufficient = sorted.find((s) => s.state === 'insufficient');
  if (insufficient) return { skillId: insufficient.skillId, recheck: true };
  return null;
}

export const STATE_LABEL: Record<SkillStateName, string> = {
  insufficient: 'Not enough evidence',
  not_yet: 'Not yet demonstrated',
  developing: 'Developing',
  consistent: 'Demonstrated consistently',
};
