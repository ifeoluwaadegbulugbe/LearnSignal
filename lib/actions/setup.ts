'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, logServerError, ok, zodFields, type Result } from '@/lib/result';

const SchoolInput = z.object({
  name: z.string().trim().min(2, 'School name needs at least 2 characters').max(120),
  state: z.string().trim().max(40).optional().default(''),
});
const ClassroomInput = z.object({
  schoolId: z.string().uuid(),
  name: z.string().trim().min(1, 'Give the class a name').max(60),
  grade: z.string().trim().min(1, 'Choose a grade').max(30),
  language: z.literal('en').default('en'),
});

export async function createSchool(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = SchoolInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the form.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_school', { p_name: parsed.data.name, p_state: parsed.data.state });
  if (error) { logServerError('createSchool', error); return fail('db', 'Could not create the school.'); }
  revalidatePath('/', 'layout');
  return ok({ id: data as string });
}

export async function createClassroom(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = ClassroomInput.safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please check the form.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_classroom', {
    p_school: parsed.data.schoolId, p_name: parsed.data.name, p_grade: parsed.data.grade, p_language: parsed.data.language,
  });
  if (error) { logServerError('createClassroom', error); return fail('db', 'Could not create the classroom.'); }
  revalidatePath('/', 'layout');
  return ok({ id: data as string });
}

export async function deleteClassroom(classroomId: string, confirmName: string): Promise<Result<null>> {
  const supabase = await createClient();
  const { data: c } = await supabase.from('classrooms').select('name').eq('id', classroomId).single();
  if (!c) return fail('not_found', 'Classroom not found.');
  if (c.name.trim() !== confirmName.trim()) return fail('invalid', 'Type the class name exactly to confirm.');
  const { error } = await supabase.from('classrooms').delete().eq('id', classroomId);
  if (error) { logServerError('deleteClassroom', error); return fail('db', 'Could not delete the classroom.'); }
  revalidatePath('/', 'layout');
  return ok(null);
}

export async function setAiEnabled(enabled: boolean): Promise<Result<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  const { error } = await supabase.from('profiles').update({ ai_enabled: !!enabled }).eq('id', user.id);
  if (error) return fail('db', 'Could not save.');
  revalidatePath('/', 'layout');
  return ok(null);
}

export async function updateProfile(input: unknown): Promise<Result<null>> {
  const parsed = z.object({ fullName: z.string().trim().min(1).max(80) }).safeParse(input);
  if (!parsed.success) return fail('invalid', 'Please enter your name.', zodFields(parsed.error.issues));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  const { error } = await supabase.from('profiles').update({ full_name: parsed.data.fullName }).eq('id', user.id);
  if (error) return fail('db', 'Could not save.');
  revalidatePath('/settings');
  return ok(null);
}
