'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, logServerError, ok, type Result } from '@/lib/result';
import { nextPlacementStep, type PlacementStep } from '@/lib/scoring/placement';
import { skillsForStrand, type Strand } from '@/lib/content/skills';
import { bankFor, getItem, publicItem, scoreResponse, type PublicItem } from '@/lib/server/items';
import { createRuleRecommendation, recomputeSkillStates, type StoredState } from '@/lib/server/engine';

type Next = { done: false; item: PublicItem; progress: number } | { done: true; reason: string };

async function computeNext(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string, strand: Strand): Promise<Next> {
  const { data: rows, error } = await supabase.from('item_responses').select('item_id, skill_id, correct').eq('session_id', sessionId).order('created_at');
  if (error) throw error;
  const skills = skillsForStrand(strand).map((s) => ({ id: s.id, sequence: s.sequence }));
  const step: PlacementStep = nextPlacementStep(skills, bankFor(strand === 'literacy' ? 'L' : 'N'), (rows ?? []).map((r) => ({ itemId: r.item_id, skillId: r.skill_id, correct: r.correct })));
  if (step.done) return { done: true, reason: step.reason };
  return { done: false, item: publicItem(getItem(step.itemId)), progress: rows?.length ?? 0 };
}

export async function startSession(input: unknown): Promise<Result<{ sessionId: string; next: Next }>> {
  const parsed = z.object({ learnerId: z.string().uuid(), strand: z.enum(['literacy', 'numeracy']) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Choose a learner and strand.');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  const { count } = await supabase.from('assessment_sessions').select('id', { count: 'exact', head: true })
    .eq('learner_id', parsed.data.learnerId).eq('strand', parsed.data.strand).not('completed_at', 'is', null);
  const { data, error } = await supabase.from('assessment_sessions').insert({
    learner_id: parsed.data.learnerId, strand: parsed.data.strand, kind: (count ?? 0) > 0 ? 'reassessment' : 'baseline', administered_by: user.id,
  }).select('id').single();
  if (error || !data) { logServerError('startSession', error); return fail('forbidden', 'Could not start the assessment for this learner.'); }
  return ok({ sessionId: data.id, next: await computeNext(supabase, data.id, parsed.data.strand) });
}

/** Resume an unfinished session (e.g. after a refresh). */
export async function resumeSession(sessionId: string): Promise<Result<{ next: Next; strand: Strand }>> {
  const supabase = await createClient();
  const { data: s } = await supabase.from('assessment_sessions').select('id, strand, completed_at').eq('id', sessionId).single();
  if (!s) return fail('not_found', 'Session not found.');
  if (s.completed_at) return ok({ next: { done: true, reason: 'completed' }, strand: s.strand as Strand });
  return ok({ next: await computeNext(supabase, sessionId, s.strand as Strand), strand: s.strand as Strand });
}

const ResponseInput = z.object({
  sessionId: z.string().uuid(),
  itemId: z.string().max(20),
  timeMs: z.number().int().min(0).max(3_600_000).optional(),
  response: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('choice'), value: z.string().max(60) }),
    z.object({ kind: z.literal('numeric'), value: z.number().int().min(0).max(999) }),
    z.object({ kind: z.literal('oral'), marks: z.array(z.enum(['correct', 'omitted', 'substituted', 'self_corrected'])).max(40), seconds: z.number().min(1).max(600) }),
    z.object({ kind: z.literal('skip') }),
  ]),
});

/** Scores server-side and returns only {correct} plus the next item. The answer key never leaves the server. */
export async function submitResponse(input: unknown): Promise<Result<{ correct: boolean | null; detail?: { accuracy?: number; wcpm?: number }; next: Next }>> {
  const parsed = ResponseInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'That answer could not be read. Try again.');
  const { sessionId, itemId, response, timeMs } = parsed.data;
  const supabase = await createClient();
  const { data: s } = await supabase.from('assessment_sessions').select('id, learner_id, strand, completed_at').eq('id', sessionId).single();
  if (!s) return fail('not_found', 'Session not found.');
  if (s.completed_at) return fail('invalid', 'This session is already finished.');
  const item = getItem(itemId);
  if (!item || item.skillId[0] !== (s.strand === 'literacy' ? 'L' : 'N')) return fail('invalid', 'Unknown item.');
  // Only accept an answer for the item the placement flow actually asked for.
  const expected = await computeNext(supabase, sessionId, s.strand as Strand);
  if (expected.done || expected.item.id !== itemId) return fail('invalid', 'This question is no longer active. Reloading…');

  let scored;
  try { scored = scoreResponse(itemId, response); } catch { return fail('invalid', 'That answer type does not fit this question.'); }
  const { error } = await supabase.from('item_responses').insert({
    session_id: sessionId, learner_id: s.learner_id, item_id: itemId, skill_id: item.skillId,
    correct: scored.correct, response: scored.detail, time_ms: timeMs ?? null,
  });
  if (error) { logServerError('submitResponse', error); return fail('db', 'Could not save that answer.'); }
  const d = scored.detail as { accuracy?: number; wcpm?: number };
  return ok({ correct: scored.correct, detail: d.accuracy !== undefined ? { accuracy: d.accuracy, wcpm: d.wcpm } : undefined, next: await computeNext(supabase, sessionId, s.strand as Strand) });
}

export async function completeSession(input: unknown): Promise<Result<{ states: StoredState[]; learnerId: string }>> {
  const parsed = z.object({ sessionId: z.string().uuid(), endedEarly: z.boolean().default(false) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Bad session.');
  const supabase = await createClient();
  const { data: s } = await supabase.from('assessment_sessions').select('id, learner_id, strand, completed_at').eq('id', parsed.data.sessionId).single();
  if (!s) return fail('not_found', 'Session not found.');
  try {
    if (!s.completed_at) {
      await supabase.from('assessment_sessions').update({ completed_at: new Date().toISOString(), ended_early: parsed.data.endedEarly }).eq('id', s.id);
    }
    const { data: touched } = await supabase.from('item_responses').select('skill_id').eq('session_id', s.id);
    const skillIds = [...new Set((touched ?? []).map((t) => t.skill_id))];
    const states = await recomputeSkillStates(supabase, s.learner_id, skillIds, s.id);
    await createRuleRecommendation(supabase, s.learner_id, s.strand as Strand);
    revalidatePath(`/learners/${s.learner_id}`);
    return ok({ states, learnerId: s.learner_id });
  } catch (e) {
    logServerError('completeSession', e);
    return fail('db', 'Saved your answers, but could not update skill states. Try again.');
  }
}
