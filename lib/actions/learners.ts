'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, logServerError, ok, zodFields, type Result } from '@/lib/result';

const DisplayName = z.string().trim()
  .min(1, 'Enter a first name or nickname')
  .max(30, 'Use 30 characters or fewer')
  .refine((v) => v.replace(/\s/g, '').length > 0, 'Enter a first name or nickname');

const LearnerInput = z.object({
  classroomId: z.string().uuid(),
  displayName: DisplayName,
  ageBand: z.enum(['5-6', '7-8', '9-10', '11+']).optional(),
  consent: z.literal(true, { message: 'Confirm that consent has been obtained' }),
});

/** Heuristic hint only (never blocks): two capitalised words looks like first name + surname. */
export async function looksLikeFullName(name: string) {
  return /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(name.trim());
}

export async function addLearner(input: unknown): Promise<Result<{ id: string; code: string }>> {
  const parsed = LearnerInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the form.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data, error } = await supabase.from('learners').insert({
    classroom_id: parsed.data.classroomId, display_name: parsed.data.displayName, age_band: parsed.data.ageBand ?? null,
    consent_confirmed: true, consent_confirmed_at: new Date().toISOString(),
  }).select('id, code').single();
  if (error) { logServerError('addLearner', error); return fail('db', 'Could not add the learner.'); }
  revalidatePath(`/classrooms/${parsed.data.classroomId}`, 'layout');
  return ok(data);
}

const BulkInput = z.object({
  classroomId: z.string().uuid(),
  names: z.string().max(3000),
  ageBand: z.enum(['5-6', '7-8', '9-10', '11+']).optional(),
  consent: z.literal(true, { message: 'Confirm that consent has been obtained' }),
});

export async function addLearnersBulk(input: unknown): Promise<Result<{ added: number; skipped: string[] }>> {
  const parsed = BulkInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the form.', zodFields(parsed.error.issues));
  const names = parsed.data.names.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
  const valid = names.filter((n) => DisplayName.safeParse(n).success);
  const skipped = names.filter((n) => !DisplayName.safeParse(n).success);
  if (valid.length === 0) return fail('invalid', 'Add at least one name (one per line).', { names: 'Add at least one name' });
  if (valid.length > 60) return fail('invalid', 'Add up to 60 learners at a time.', { names: 'Up to 60 at a time' });
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('learners').insert(valid.map((n) => ({
    classroom_id: parsed.data.classroomId, display_name: n, age_band: parsed.data.ageBand ?? null, consent_confirmed: true, consent_confirmed_at: now,
  })));
  if (error) { logServerError('addLearnersBulk', error); return fail('db', 'Could not add learners.'); }
  revalidatePath(`/classrooms/${parsed.data.classroomId}`, 'layout');
  return ok({ added: valid.length, skipped });
}

export async function updateLearner(input: unknown): Promise<Result<null>> {
  const parsed = z.object({ learnerId: z.string().uuid(), displayName: DisplayName, ageBand: z.enum(['5-6', '7-8', '9-10', '11+']).nullable().optional() }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the form.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { error } = await supabase.from('learners').update({ display_name: parsed.data.displayName, age_band: parsed.data.ageBand ?? null }).eq('id', parsed.data.learnerId);
  if (error) return fail('db', 'Could not save.');
  revalidatePath('/', 'layout');
  return ok(null);
}

export async function archiveLearner(learnerId: string, archived = true): Promise<Result<null>> {
  if (!z.string().uuid().safeParse(learnerId).success) return fail('invalid', 'Bad learner id.');
  const supabase = await createClient();
  const { error } = await supabase.from('learners').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', learnerId);
  if (error) return fail('db', 'Could not update the learner.');
  revalidatePath('/', 'layout');
  return ok(null);
}

/** Hard delete (cascade removes all of this learner's evidence). Requires typing the learner code. */
export async function deleteLearner(learnerId: string, confirmCode: string): Promise<Result<null>> {
  const supabase = await createClient();
  const { data } = await supabase.from('learners').select('code').eq('id', learnerId).single();
  if (!data) return fail('not_found', 'Learner not found.');
  if (data.code !== confirmCode.trim().toUpperCase()) return fail('invalid', 'Type the learner code exactly to confirm.');
  const { error } = await supabase.from('learners').delete().eq('id', learnerId);
  if (error) return fail('db', 'Could not delete.');
  revalidatePath('/', 'layout');
  return ok(null);
}

export async function addNote(input: unknown): Promise<Result<null>> {
  const parsed = z.object({ learnerId: z.string().uuid(), body: z.string().trim().min(1, 'Write a note').max(1000) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the note.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  const { error } = await supabase.from('teacher_notes').insert({ learner_id: parsed.data.learnerId, author_id: user.id, body: parsed.data.body });
  if (error) return fail('db', 'Could not save the note.');
  revalidatePath(`/learners/${parsed.data.learnerId}`);
  return ok(null);
}

export async function setRecommendationStatus(id: string, status: 'accepted' | 'dismissed'): Promise<Result<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from('recommendations').update({ status }).eq('id', id);
  if (error) return fail('db', 'Could not update.');
  revalidatePath('/', 'layout');
  return ok(null);
}
