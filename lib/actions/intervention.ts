'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, logServerError, ok, zodFields, type Result } from '@/lib/result';
import { suggestGroups, type SuggestedGroup } from '@/lib/scoring/grouping';
import { SKILLS } from '@/lib/content/skills';
import type { ExerciseT } from '@/lib/ai/exerciseSchema';
import { recomputeSkillStates } from '@/lib/server/engine';
import type { SkillStateName } from '@/lib/scoring/skillState';

const META = Object.fromEntries(SKILLS.map((s) => [s.id, { name: s.name, sequence: s.sequence, strand: s.strand }]));

export async function formGroups(classroomId: string, strand: 'literacy' | 'numeracy'): Promise<Result<SuggestedGroup[]>> {
  const supabase = await createClient();
  const { data: learners, error } = await supabase.from('learners')
    .select('id, code, display_name, skill_states(skill_id, state, p, provisional)').eq('classroom_id', classroomId).is('archived_at', null);
  if (error) { logServerError('formGroups', error); return fail('db', 'Could not load learners.'); }
  return ok(suggestGroups((learners ?? []).map((l) => ({
    learnerId: l.id, code: l.code, displayName: l.display_name,
    states: (l.skill_states as { skill_id: string; state: SkillStateName; p: number; provisional: boolean }[]).map((s) => ({ skillId: s.skill_id, state: s.state, p: Number(s.p), provisional: s.provisional, sequence: META[s.skill_id].sequence, strand: META[s.skill_id].strand })),
  })), strand, META));
}

const AcceptInput = z.object({
  classroomId: z.string().uuid(),
  strand: z.enum(['literacy', 'numeracy']),
  targetSkillId: z.string().regex(/^[LN][1-6]$/),
  name: z.string().trim().min(1, 'Name the group').max(80),
  learnerIds: z.array(z.string().uuid()).min(1, 'A group needs at least one learner').max(80),
});

export async function acceptGroup(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = AcceptInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the group.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data, error } = await supabase.from('intervention_groups').insert({
    classroom_id: parsed.data.classroomId, strand: parsed.data.strand, target_skill_id: parsed.data.targetSkillId, name: parsed.data.name,
  }).select('id').single();
  if (error || !data) { logServerError('acceptGroup', error); return fail('db', 'Could not save the group.'); }
  const { error: mErr } = await supabase.from('group_members').insert(parsed.data.learnerIds.map((id) => ({ group_id: data.id, learner_id: id })));
  if (mErr) { await supabase.from('intervention_groups').delete().eq('id', data.id); return fail('db', 'Could not add learners to the group.'); }
  revalidatePath(`/classrooms/${parsed.data.classroomId}`, 'layout');
  return ok({ id: data.id });
}

export async function deleteGroup(groupId: string): Promise<Result<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from('intervention_groups').delete().eq('id', groupId);
  if (error) return fail('db', 'Could not remove the group.');
  revalidatePath('/', 'layout');
  return ok(null);
}

export async function reviewExercise(input: unknown): Promise<Result<null>> {
  const parsed = z.object({ exerciseId: z.string().uuid(), status: z.enum(['approved', 'rejected']) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Bad request.');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  const { data, error } = await supabase.from('exercises').update({ review_status: parsed.data.status })
    .eq('id', parsed.data.exerciseId).eq('created_by', user.id).select('id');
  if (error || !data?.length) return fail('forbidden', 'Only the teacher who generated this set can review it.');
  revalidatePath('/exercises');
  return ok(null);
}

const EditItemInput = z.object({
  exerciseId: z.string().uuid(),
  index: z.number().int().min(0).max(4),
  stem: z.string().trim().min(1).max(160),
  hint: z.string().trim().min(1).max(100),
});

/** Teachers may edit wording of a pending set. Answers are not editable (they were verified by code). */
export async function editExerciseItem(input: unknown): Promise<Result<null>> {
  const parsed = EditItemInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the text.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data: ex } = await supabase.from('exercises').select('content, review_status, skill_id').eq('id', parsed.data.exerciseId).single();
  if (!ex) return fail('not_found', 'Exercise not found.');
  if (ex.review_status !== 'pending') return fail('invalid', 'Only pending sets can be edited.');
  const content = ex.content as { items: ExerciseT[] };
  const item = content.items[parsed.data.index];
  if (!item) return fail('not_found', 'Item not found.');
  // For arithmetic skills the stem carries the question; editing it could break the verified answer.
  if (['N2', 'N3', 'N4', 'N5', 'N6', 'N1'].includes(ex.skill_id) && item.stem !== parsed.data.stem) {
    return fail('invalid', 'Number questions cannot be reworded here, because the answer was verified from the wording. Reject and regenerate instead.');
  }
  content.items[parsed.data.index] = { ...item, stem: parsed.data.stem, hint: parsed.data.hint };
  const { error } = await supabase.from('exercises').update({ content }).eq('id', parsed.data.exerciseId);
  if (error) return fail('forbidden', 'Could not save.');
  revalidatePath('/exercises');
  return ok(null);
}

export async function assignExercise(input: unknown): Promise<Result<{ count: number }>> {
  const parsed = z.object({ exerciseId: z.string().uuid(), learnerIds: z.array(z.string().uuid()).min(1, 'Choose at least one learner').max(80) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Choose at least one learner.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  const { data: ex } = await supabase.from('exercises').select('review_status').eq('id', parsed.data.exerciseId).single();
  if (!ex) return fail('not_found', 'Exercise not found.');
  if (ex.review_status !== 'approved') return fail('invalid', 'Approve this exercise set before assigning it.');
  const { error } = await supabase.from('assignments').insert(parsed.data.learnerIds.map((id) => ({ learner_id: id, exercise_id: parsed.data.exerciseId, assigned_by: user.id })));
  if (error) { logServerError('assignExercise', error); return fail('db', 'Could not assign.'); }
  revalidatePath('/', 'layout');
  return ok({ count: parsed.data.learnerIds.length });
}

// ---------- Child mode ----------
export interface ChildItem { index: number; type: ExerciseT['type']; stem: string; audioText?: string; options?: string[]; hint: string }

export async function getAssignmentForChild(assignmentId: string): Promise<Result<{ skillId: string; items: ChildItem[]; status: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('assignments').select('id, status, exercises(skill_id, content)').eq('id', assignmentId).single();
  if (error || !data) return fail('not_found', 'Practice not found.');
  const ex = data.exercises as unknown as { skill_id: string; content: { items: ExerciseT[] } };
  return ok({
    skillId: ex.skill_id, status: data.status,
    items: ex.content.items.map((it, index) => ({ index, type: it.type, stem: it.stem, audioText: it.audioText, options: it.options, hint: it.hint })),
  });
}

/** Check one practice answer server-side (answers never reach the child's screen). */
export async function checkPracticeAnswer(input: unknown): Promise<Result<{ correct: boolean; feedback: string }>> {
  const parsed = z.object({ assignmentId: z.string().uuid(), index: z.number().int().min(0).max(4), value: z.union([z.string().max(60), z.number().int()]) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Try again.');
  const supabase = await createClient();
  const { data } = await supabase.from('assignments').select('exercises(content)').eq('id', parsed.data.assignmentId).single();
  const item = (data?.exercises as unknown as { content: { items: ExerciseT[] } } | undefined)?.content.items[parsed.data.index];
  if (!item) return fail('not_found', 'Question not found.');
  const correct = String(parsed.data.value).trim().toLowerCase() === String(item.answer).trim().toLowerCase();
  return ok({ correct, feedback: correct ? item.feedbackCorrect : item.feedbackTryAgain });
}

export async function submitAttempt(input: unknown): Promise<Result<{ correct: number; total: number; tried: number }>> {
  const parsed = z.object({
    assignmentId: z.string().uuid(),
    // first-try answer per item + number of tries (effort). Correctness is recomputed here, never trusted from the client.
    responses: z.array(z.object({ index: z.number().int().min(0).max(4), firstValue: z.union([z.string().max(60), z.number().int()]), tries: z.number().int().min(1).max(10) })).min(1).max(5),
  }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Could not save the practice.');
  const supabase = await createClient();
  const { data: a } = await supabase.from('assignments').select('id, learner_id, status, exercises(skill_id, content)').eq('id', parsed.data.assignmentId).single();
  if (!a) return fail('not_found', 'Practice not found.');
  if (a.status === 'completed') return fail('invalid', 'This practice is already finished.');
  const ex = a.exercises as unknown as { skill_id: string; content: { items: ExerciseT[] } };
  // Evidence uses first-try correctness, recomputed against the stored answer key.
  const responses = parsed.data.responses.filter((r) => r.index < ex.content.items.length).map((r) => ({
    ...r, correct: String(r.firstValue).trim().toLowerCase() === String(ex.content.items[r.index].answer).trim().toLowerCase(),
  }));
  const correct = responses.filter((r) => r.correct).length;
  const { error } = await supabase.from('exercise_attempts').insert({
    assignment_id: a.id, learner_id: a.learner_id, skill_id: ex.skill_id, correct_count: correct, total: responses.length,
    responses: responses.map((r) => ({ index: r.index, correct: r.correct, tries: r.tries })),
  });
  if (error) { logServerError('submitAttempt', error); return fail('db', 'Could not save the practice.'); }
  await supabase.from('assignments').update({ status: 'completed' }).eq('id', a.id);
  try { await recomputeSkillStates(supabase, a.learner_id, [ex.skill_id], null); } catch (e) { logServerError('submitAttempt.recompute', e); }
  revalidatePath(`/learn/${a.learner_id}`);
  return ok({ correct, total: responses.length, tried: responses.reduce((n, r) => n + r.tries, 0) });
}

/** Exit learner mode: the teacher re-enters their password (skipped for the shared demo account). */
export async function verifyTeacherExit(password: string): Promise<Result<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return fail('unauthenticated', 'Please sign in.');
  const { data: demo } = await supabase.rpc('is_demo_account');
  if (demo === true) return ok(null);
  if (!password) return fail('invalid', 'Enter your password.');
  const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (error) return fail('invalid', 'That password is not right.');
  return ok(null);
}
