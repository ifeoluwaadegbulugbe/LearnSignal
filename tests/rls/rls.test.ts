// RLS isolation test against the real Supabase project, using two real test teachers.
// Run: npm run test:rls   (needs .env.local + .env.test.local, migration + seed applied, teacher A with the demo class)
// Uses only the public anon key: everything below runs under each teacher's own row-level security.
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const read = (f: string) => Object.fromEntries(readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m![1], m![2].trim()]));
const env = { ...read('.env.local'), ...read('.env.test.local') };
const client = () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function signIn(email: string, password: string, name: string): Promise<SupabaseClient> {
  const c = client();
  const r = await c.auth.signInWithPassword({ email, password });
  if (r.error) {
    const s = await c.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (s.error || !s.data.session) throw new Error(`could not create ${email}: ${s.error?.message ?? 'email confirmation required'}`);
  }
  return c;
}

let A: SupabaseClient, B: SupabaseClient;
let aSchool: string, aClass: string, aLearner: string, aSession: string | undefined, aPendingExercise: string | undefined;

beforeAll(async () => {
  A = await signIn(env.TEST_TEACHER_A_EMAIL, env.TEST_TEACHER_A_PASSWORD, 'Test Teacher A');
  B = await signIn(env.TEST_TEACHER_B_EMAIL, env.TEST_TEACHER_B_PASSWORD, 'Test Teacher B');
  const { data: cls } = await A.from('classrooms').select('id, school_id').limit(1).single();
  if (!cls) throw new Error('Teacher A needs a classroom (load the demo class first)');
  aClass = cls.id; aSchool = cls.school_id;
  const { data: l } = await A.from('learners').select('id').eq('classroom_id', aClass).limit(1).single();
  aLearner = l!.id;
  aSession = (await A.from('assessment_sessions').select('id').eq('learner_id', aLearner).limit(1).maybeSingle()).data?.id;
  aPendingExercise = (await A.from('exercises').select('id').eq('source', 'ai').eq('review_status', 'pending').limit(1).maybeSingle()).data?.id;
  // Teacher B gets their own school + class so they are a real, active teacher too.
  const { data: bClasses } = await B.from('classrooms').select('id');
  if (!bClasses?.length) {
    const { data: sid } = await B.rpc('create_school', { p_name: 'Test School B', p_state: 'Lagos' });
    await B.rpc('create_classroom', { p_school: sid, p_name: 'Class B', p_grade: 'Primary 2', p_language: 'en' });
  }
}, 60000);

describe('teacher B cannot see or change teacher A’s data', () => {
  it('cannot read A’s learners', async () => {
    const { data } = await B.from('learners').select('id').eq('id', aLearner);
    expect(data).toEqual([]);
    const { data: all } = await B.from('learners').select('id, classroom_id').eq('classroom_id', aClass);
    expect(all).toEqual([]);
  });
  it('cannot read A’s classroom, sessions, responses, states or notes', async () => {
    expect((await B.from('classrooms').select('id').eq('id', aClass)).data).toEqual([]);
    expect((await B.from('item_responses').select('id').eq('learner_id', aLearner)).data).toEqual([]);
    expect((await B.from('skill_states').select('skill_id').eq('learner_id', aLearner)).data).toEqual([]);
    expect((await B.from('skill_state_history').select('id').eq('learner_id', aLearner)).data).toEqual([]);
    expect((await B.from('teacher_notes').select('id').eq('learner_id', aLearner)).data).toEqual([]);
    if (aSession) expect((await B.from('assessment_sessions').select('id').eq('id', aSession)).data).toEqual([]);
  });
  it('cannot add a learner to A’s classroom', async () => {
    const { error } = await B.from('learners').insert({ classroom_id: aClass, display_name: 'Intruder', consent_confirmed: true });
    expect(error).not.toBeNull();
  });
  it('cannot rename or archive A’s learner (0 rows affected)', async () => {
    const { data } = await B.from('learners').update({ display_name: 'Changed' }).eq('id', aLearner).select('id');
    expect(data ?? []).toEqual([]);
    const { data: still } = await A.from('learners').select('display_name').eq('id', aLearner).single();
    expect(still!.display_name).not.toBe('Changed');
  });
  it('cannot create a classroom in A’s school', async () => {
    const { error } = await B.rpc('create_classroom', { p_school: aSchool, p_name: 'Sneaky', p_grade: 'P1', p_language: 'en' });
    expect(error?.message).toMatch(/not a member/);
  });
  it('cannot read A’s school insights', async () => {
    const { error } = await B.rpc('school_overview', { sid: aSchool });
    expect(error?.message).toMatch(/forbidden/);
    const { error: e2 } = await B.rpc('school_state_distribution', { sid: aSchool });
    expect(e2?.message).toMatch(/forbidden/);
  });
  it('cannot see A’s AI-drafted exercises, but can see built-in ones', async () => {
    if (aPendingExercise) expect((await B.from('exercises').select('id').eq('id', aPendingExercise)).data).toEqual([]);
    const { data: seed } = await B.from('exercises').select('id').eq('source', 'seed').limit(1);
    expect(seed?.length).toBe(1);
  });
  it('cannot read answer keys: assessment_items has no answer column', async () => {
    const { error } = await B.from('assessment_items').select('answer').limit(1);
    expect(error).not.toBeNull();
  });
});

describe('admin insights are aggregate-only', () => {
  it('returns counts per classroom/skill/state and no learner names or codes', async () => {
    const { data, error } = await A.rpc('school_state_distribution', { sid: aSchool });
    expect(error).toBeNull();
    const keys = new Set((data as Record<string, unknown>[]).flatMap((r) => Object.keys(r)));
    expect([...keys].sort()).toEqual(['classroom_id', 'classroom_name', 'learners', 'skill_id', 'state']);
    const text = JSON.stringify(data);
    expect(text).not.toMatch(/LS-[0-9A-F]{6}/);
    expect(text).not.toMatch(/Learner [A-L]/);
  });
});

describe('database rules', () => {
  it('an unapproved exercise cannot be assigned (trigger)', async () => {
    if (!aPendingExercise) return; // needs a pending AI set (run scripts/ai-smoke.mjs gen)
    const { data: me } = await A.auth.getUser();
    const { error } = await A.from('assignments').insert({ learner_id: aLearner, exercise_id: aPendingExercise, assigned_by: me.user!.id });
    expect(error?.message).toMatch(/must be approved/);
  });
  it('a learner cannot be created without consent', async () => {
    const { error } = await A.from('learners').insert({ classroom_id: aClass, display_name: 'No consent', consent_confirmed: false });
    expect(error).not.toBeNull();
  });
  it('the anonymous (signed-out) role sees no learners and no skills', async () => {
    const anon = client();
    expect((await anon.from('learners').select('id')).data).toEqual([]);
    expect((await anon.from('skills').select('id')).data).toEqual([]);
  });
});
