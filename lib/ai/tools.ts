// Grounded assistant tools. They run over a ClassSnapshot that was loaded with the caller's own
// Supabase session (so RLS already applied). The snapshot holds learner CODES only — never names.
import { SKILL_BY_ID } from '@/lib/content/skills';
import type { SkillStateName } from '@/lib/scoring/skillState';

export interface SnapshotLearner {
  code: string;
  assessed: boolean;
  states: { skillId: string; state: SkillStateName; p: number; confidence: string; provisional: boolean }[];
  history: { skillId: string; state: SkillStateName; at: string }[];
}
export interface ClassSnapshot { classroomName: string; asOf: string; learners: SnapshotLearner[] }

const STATES = ['insufficient', 'not_yet', 'developing', 'consistent'] as const;

export const TOOL_DECLARATIONS = [
  { name: 'class_summary', description: 'Counts for the class: learners, how many assessed, and learners per state for each skill.', parametersJsonSchema: { type: 'object', properties: {} } },
  {
    name: 'learners_by_skill_state',
    description: 'List learner codes whose state for a skill matches. Use state "needs_support" for not_yet OR developing.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        skillId: { type: 'string', enum: Object.keys(SKILL_BY_ID) },
        state: { type: 'string', enum: [...STATES, 'needs_support'] },
      },
      required: ['skillId', 'state'],
    },
  },
  {
    name: 'learner_progress', description: 'Current state of every assessed skill for one learner code, plus earlier states.',
    parametersJsonSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
  },
  { name: 'skill_gap_counts', description: 'For each skill, how many learners are not_yet or developing.', parametersJsonSchema: { type: 'object', properties: {} } },
  { name: 'changes_since_last_assessment', description: 'Learners whose state for a skill changed between their two most recent recorded states.', parametersJsonSchema: { type: 'object', properties: {} } },
];

export type ToolName = 'class_summary' | 'learners_by_skill_state' | 'learner_progress' | 'skill_gap_counts' | 'changes_since_last_assessment';

export function runTool(name: string, args: Record<string, unknown>, snap: ClassSnapshot): unknown {
  switch (name as ToolName) {
    case 'class_summary': {
      const perSkill: Record<string, Record<string, number>> = {};
      for (const l of snap.learners) for (const s of l.states) {
        perSkill[s.skillId] ??= { insufficient: 0, not_yet: 0, developing: 0, consistent: 0 };
        perSkill[s.skillId][s.state]++;
      }
      return { classroom: snap.classroomName, learners: snap.learners.length, assessed: snap.learners.filter((l) => l.assessed).length, perSkill, asOf: snap.asOf };
    }
    case 'learners_by_skill_state': {
      const skillId = String(args.skillId ?? '').toUpperCase();
      const state = String(args.state ?? '');
      if (!SKILL_BY_ID[skillId]) return { error: `unknown skill ${skillId}` };
      const match = (s: SkillStateName) => (state === 'needs_support' ? s === 'not_yet' || s === 'developing' : s === state);
      const learners = snap.learners.flatMap((l) => {
        const s = l.states.find((x) => x.skillId === skillId);
        return s && match(s.state) ? [{ code: l.code, state: s.state, confidence: s.confidence, provisional: s.provisional }] : [];
      });
      return { skill: `${skillId} ${SKILL_BY_ID[skillId].name}`, state, learners, count: learners.length };
    }
    case 'learner_progress': {
      const code = String(args.code ?? '').trim().toUpperCase();
      const l = snap.learners.find((x) => x.code === code);
      if (!l) return { error: 'no learner with that code in this class' };
      if (!l.assessed || l.states.length === 0) return { code, states: [], note: 'not assessed yet' };
      return {
        code,
        states: l.states.map((s) => ({ skill: `${s.skillId} ${SKILL_BY_ID[s.skillId]?.name}`, state: s.state, confidence: s.confidence, provisional: s.provisional })),
        history: l.history.slice(-20).map((h) => ({ skill: h.skillId, state: h.state, at: h.at.slice(0, 10) })),
      };
    }
    case 'skill_gap_counts': {
      const counts: Record<string, number> = {};
      for (const l of snap.learners) for (const s of l.states) if (s.state === 'not_yet' || s.state === 'developing') counts[s.skillId] = (counts[s.skillId] ?? 0) + 1;
      return { gaps: Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([skillId, learners]) => ({ skill: `${skillId} ${SKILL_BY_ID[skillId].name}`, learners })) };
    }
    case 'changes_since_last_assessment': {
      const changes: { code: string; skill: string; from: string; to: string }[] = [];
      for (const l of snap.learners) {
        const bySkill = new Map<string, SnapshotLearner['history']>();
        for (const h of l.history) { if (!bySkill.has(h.skillId)) bySkill.set(h.skillId, []); bySkill.get(h.skillId)!.push(h); }
        for (const [skillId, hs] of bySkill) {
          const sorted = [...hs].sort((a, b) => (a.at < b.at ? -1 : 1));
          if (sorted.length < 2) continue;
          const [prev, last] = sorted.slice(-2);
          if (prev.state !== last.state) changes.push({ code: l.code, skill: `${skillId} ${SKILL_BY_ID[skillId].name}`, from: prev.state, to: last.state });
        }
      }
      return { changes };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

/** Every learner code that appears anywhere in a tool result. */
export function codesIn(value: unknown): Set<string> {
  const out = new Set<string>();
  // Match anything code-shaped (not just hex) so an invented code like LS-ZZZZZ9 is still caught.
  JSON.stringify(value ?? null).replace(/LS-[A-Z0-9]{4,8}/gi, (m) => { out.add(m.toUpperCase()); return m; });
  return out;
}
