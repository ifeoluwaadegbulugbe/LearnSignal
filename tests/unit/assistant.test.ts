// Golden tests for the grounded assistant (master prompt §7.4). The model is a scripted fake;
// what is under test is the tool layer and the post-checks that stop ungrounded answers.
import { describe, expect, it } from 'vitest';
import { runAssistant, NO_DATA, type Content, type ModelStep } from '@/lib/ai/assistant';
import { runTool, type ClassSnapshot } from '@/lib/ai/tools';

const snap: ClassSnapshot = {
  classroomName: 'Class 3A', asOf: '2026-11-16T09:00:00Z',
  learners: [
    { code: 'LS-AAAAA1', assessed: true, states: [{ skillId: 'N4', state: 'not_yet', p: 0.3, confidence: 'medium', provisional: true }, { skillId: 'N3', state: 'consistent', p: 0.9, confidence: 'high', provisional: false }], history: [] },
    { code: 'LS-BBBBB2', assessed: true, states: [{ skillId: 'N4', state: 'developing', p: 0.6, confidence: 'low', provisional: true }], history: [] },
    { code: 'LS-CCCCC3', assessed: true, states: [{ skillId: 'N4', state: 'consistent', p: 0.9, confidence: 'high', provisional: false }], history: [
      { skillId: 'N4', state: 'not_yet', at: '2026-11-01T00:00:00Z' }, { skillId: 'N4', state: 'consistent', at: '2026-11-10T00:00:00Z' }] },
    { code: 'LS-DDDDD4', assessed: false, states: [], history: [] },
  ],
};

/** Fake model: first turn calls the given tool, second turn writes an answer from what the tool returned. */
function scripted(call: { name: string; args: Record<string, unknown> } | null, write: (toolResult: unknown) => string): ModelStep {
  return async (contents: Content[]) => {
    const last = contents[contents.length - 1];
    const fr = last.parts.find((p) => p.functionResponse);
    if (!fr && call) return { content: { role: 'model', parts: [{ functionCall: call }] } };
    return { content: { role: 'model', parts: [{ text: write(fr?.functionResponse?.response.result) }] } };
  };
}

describe('assistant golden tests', () => {
  it('returns the right learners for "who needs subtraction support?"', async () => {
    const step = scripted({ name: 'learners_by_skill_state', args: { skillId: 'N4', state: 'needs_support' } },
      (r) => `These learners need subtraction support: ${(r as { learners: { code: string }[] }).learners.map((l) => l.code).join(', ')}.`);
    const res = await runAssistant('Who needs subtraction support?', snap, step);
    expect(res.citedCodes.sort()).toEqual(['LS-AAAAA1', 'LS-BBBBB2']);
    expect(res.answer).not.toContain('LS-CCCCC3');
    expect(res.toolCalls).toEqual(['learners_by_skill_state']);
  });

  it('declines for a learner with no data', async () => {
    const step = scripted({ name: 'learner_progress', args: { code: 'LS-DDDDD4' } }, () => NO_DATA);
    const res = await runAssistant('How is LS-DDDDD4 doing?', snap, step);
    expect(res.answer).toBe(NO_DATA);
    expect((runTool('learner_progress', { code: 'LS-DDDDD4' }, snap) as { note: string }).note).toBe('not assessed yet');
  });

  it('declines for a skill with no data', () => {
    const r = runTool('learners_by_skill_state', { skillId: 'L5', state: 'needs_support' }, snap) as { count: number };
    expect(r.count).toBe(0);
  });

  it('never outputs a code that was not in a tool result', async () => {
    const step = scripted({ name: 'class_summary', args: {} }, () => 'LS-ZZZZZ9 needs help with subtraction.');
    const res = await runAssistant('Who is struggling?', snap, step);
    expect(res.answer).toBe(NO_DATA);
    expect(res.blocked).toMatch(/not returned by tools/);
  });

  it('blocks answers given without any tool call (unless general guidance)', async () => {
    const res = await runAssistant('Who is behind?', snap, scripted(null, () => 'Most of the class is behind in reading.'));
    expect(res.answer).toBe(NO_DATA);
    const ok = await runAssistant('Give me a 15-minute subtraction activity', snap, scripted(null, () => 'General guidance (not from your class data): use bottle tops.'));
    expect(ok.answer).toMatch(/^General guidance/);
  });

  it('blocks diagnosis language', async () => {
    const step = scripted({ name: 'learner_progress', args: { code: 'LS-AAAAA1' } }, () => 'LS-AAAAA1 may have dyscalculia.');
    const res = await runAssistant('Why is LS-AAAAA1 behind?', snap, step);
    expect(res.answer).not.toMatch(/dyscalculia/);
    expect(res.blocked).toBe('diagnosis language');
  });

  it('reports changes since the last assessment', () => {
    const r = runTool('changes_since_last_assessment', {}, snap) as { changes: { code: string; from: string; to: string }[] };
    expect(r.changes).toEqual([{ code: 'LS-CCCCC3', skill: 'N4 Subtraction within 20', from: 'not_yet', to: 'consistent' }]);
  });

  it('caps tool calls at 4', async () => {
    const loop: ModelStep = async () => ({ content: { role: 'model', parts: [{ functionCall: { name: 'class_summary', args: {} } }] } });
    const res = await runAssistant('loop', snap, loop);
    expect(res.toolCalls.length).toBeLessThanOrEqual(4);
  });
});
