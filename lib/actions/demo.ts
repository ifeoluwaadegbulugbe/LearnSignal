'use server';
// Loads a synthetic demo class. Every learner is ILLUSTRATIVE SAMPLE DATA, never a real child.
// Runs entirely under the signed-in teacher's RLS (no service role).
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, logServerError, ok, type Result } from '@/lib/result';
import { ITEMS } from '@/lib/content/items.seed';
import { SKILLS, type Strand } from '@/lib/content/skills';
import { computeStates, ruleRecommendation, type StateRow } from '@/lib/scoring/compute';
import type { RawResponse, SkillStateName } from '@/lib/scoring/skillState';

type Profile = Record<string, number>; // skillId -> probability of a correct answer (deterministic pattern below)
interface DemoLearner { name: string; ageBand: string; sessions: { daysAgo: number; profile: Profile }[] }

const ALL = (p: number): Profile => Object.fromEntries(SKILLS.map((s) => [s.id, p]));
const P = (base: number, over: Profile): Profile => ({ ...ALL(base), ...over });

// A–E follow master prompt §12. F–L fill out a realistic class of 12.
const LEARNERS: DemoLearner[] = [
  { name: 'Learner A', ageBand: '7-8', sessions: [
    { daysAgo: 21, profile: P(0.9, { L1: 0.25, L2: 0.0, L3: 0, L4: 0, L5: 0, L6: 0 }) },
    { daysAgo: 4, profile: P(0.9, { L1: 1.0, L2: 0.5, L3: 0.25, L4: 0, L5: 0, L6: 0 }) }] },
  { name: 'Learner B', ageBand: '9-10', sessions: [{ daysAgo: 20, profile: P(0.9, { L5: 0.25, L6: 0 }) }] },
  { name: 'Learner C', ageBand: '7-8', sessions: [
    { daysAgo: 21, profile: P(1, { N4: 0.0, N5: 0, N6: 0 }) },
    { daysAgo: 4, profile: P(1, { N4: 1, N5: 0.25, N6: 0 }) }] },
  { name: 'Learner D', ageBand: '9-10', sessions: [{ daysAgo: 21, profile: ALL(1) }, { daysAgo: 6, profile: ALL(1) }] },
  { name: 'Learner E', ageBand: '7-8', sessions: [
    { daysAgo: 30, profile: P(1, { N3: 1, N4: 1 }) }, { daysAgo: 18, profile: P(1, { N3: 1, N4: 1 }) },
    { daysAgo: 3, profile: P(1, { N3: 1, N4: 0 }) }] }, // one bad day after good history
  { name: 'Learner F', ageBand: '7-8', sessions: [{ daysAgo: 19, profile: P(1, { N4: 0.25, N5: 0, N6: 0, L4: 0.5, L5: 0, L6: 0 }) }] },
  { name: 'Learner G', ageBand: '5-6', sessions: [{ daysAgo: 19, profile: P(0.25, { L1: 0.5, N1: 1, N2: 0.5 }) }] },
  { name: 'Learner H', ageBand: '7-8', sessions: [{ daysAgo: 18, profile: P(1, { N4: 0.25, N5: 0, N6: 0, L5: 0.5, L6: 0 }) }] },
  { name: 'Learner I', ageBand: '9-10', sessions: [{ daysAgo: 18, profile: P(1, { N5: 0.25, N6: 0, L6: 0.25 }) }] },
  { name: 'Learner J', ageBand: '7-8', sessions: [{ daysAgo: 17, profile: P(1, { L2: 0.25, L3: 0, L4: 0, L5: 0, L6: 0, N3: 0.5, N4: 0, N5: 0, N6: 0 }) }] },
  { name: 'Learner K', ageBand: '9-10', sessions: [{ daysAgo: 17, profile: P(1, { N4: 0.25, N5: 0, N6: 0 }) }] },
  { name: 'Learner L', ageBand: '7-8', sessions: [] }, // not assessed yet
];

/** Deterministic answer pattern: with p = k/4, the first k of every 4 items are correct. */
const correctAt = (p: number, i: number) => (i % 4) < Math.round(p * 4);

export async function loadDemoClass(schoolId: string): Promise<Result<{ classroomId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in.');
  let cid: string | null = null;
  try {
    // Fail fast with a clear message if the content seed has not been run.
    const { count: items } = await supabase.from('assessment_items').select('id', { count: 'exact', head: true });
    if (!items) return fail('not_seeded', 'The question bank is empty. Run supabase/seed.sql in the Supabase SQL editor, then try again.');
    const { data: newId, error: cErr } = await supabase.rpc('create_classroom', { p_school: schoolId, p_name: 'Class 3A (sample data)', p_grade: 'Primary 3', p_language: 'en' });
    if (cErr) throw cErr;
    cid = newId as string;
    await supabase.from('classrooms').update({ is_demo: true }).eq('id', cid);
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Batched: ~6 round trips total instead of hundreds (keeps this well inside serverless time limits).
    const { data: inserted, error: lErr } = await supabase.from('learners').insert(LEARNERS.map((dl) => ({
      classroom_id: cid, display_name: dl.name, age_band: dl.ageBand, consent_confirmed: true, consent_confirmed_at: nowIso,
    }))).select('id, display_name');
    if (lErr || !inserted) throw lErr;
    const idByName = new Map(inserted.map((l) => [l.display_name, l.id]));

    const sessions: Record<string, unknown>[] = [];
    const responses: { session_id: string; learner_id: string; item_id: string; skill_id: string; correct: boolean; response: object; created_at: string }[] = [];
    const states: Record<string, unknown>[] = [];
    const history: Record<string, unknown>[] = [];
    const recs: Record<string, unknown>[] = [];

    for (const dl of LEARNERS) {
      const learnerId = idByName.get(dl.name)!;
      const raw = new Map<string, RawResponse[]>();
      const prev = new Map<string, SkillStateName>();
      let latest: StateRow[] = [];
      for (const [si, sess] of [...dl.sessions].sort((a, b) => b.daysAgo - a.daysAgo).entries()) {
        const at = new Date(now - sess.daysAgo * 86_400_000).toISOString();
        for (const strand of ['literacy', 'numeracy'] as Strand[]) {
          const sid = crypto.randomUUID();
          sessions.push({ id: sid, learner_id: learnerId, strand, kind: si === 0 ? 'baseline' : 'reassessment', administered_by: user.id, started_at: at, completed_at: at });
          const skills = SKILLS.filter((sk) => sk.strand === strand);
          for (const sk of skills) {
            ITEMS.filter((it) => it.skillId === sk.id && it.difficulty <= 2).slice(0, 4).forEach((it, i) => {
              const correct = correctAt(sess.profile[sk.id] ?? 0, i);
              responses.push({ session_id: sid, learner_id: learnerId, item_id: it.id, skill_id: sk.id, correct, response: { sample: true }, created_at: at });
              if (!raw.has(sk.id)) raw.set(sk.id, []);
              raw.get(sk.id)!.push({ correct, sessionId: sid, source: 'assessment', at });
            });
          }
          const rows = computeStates(raw, skills.map((s) => s.id), prev);
          for (const r of rows) {
            prev.set(r.skill_id, r.state);
            history.push({ learner_id: learnerId, skill_id: r.skill_id, session_id: sid, state: r.state, p: r.p, created_at: at });
          }
          latest = [...latest.filter((x) => !rows.some((r) => r.skill_id === x.skill_id)), ...rows];
        }
      }
      for (const r of latest) states.push({ ...r, learner_id: learnerId, updated_at: nowIso });
      for (const strand of ['literacy', 'numeracy'] as Strand[]) {
        const rec = latest.length ? ruleRecommendation(latest, strand) : null;
        if (rec) recs.push({ learner_id: learnerId, skill_id: rec.skillId, source: 'rules', rationale: rec.rationale });
      }
    }

    for (const [table, rows] of [['assessment_sessions', sessions], ['item_responses', responses], ['skill_states', states], ['skill_state_history', history], ['recommendations', recs]] as const) {
      if (!rows.length) continue;
      const { error } = await supabase.from(table).insert(rows);
      if (error) throw error;
    }
    revalidatePath('/', 'layout');
    return ok({ classroomId: cid as string });
  } catch (e) {
    logServerError('loadDemoClass', e);
    if (cid) await supabase.from('classrooms').delete().eq('id', cid); // don't leave a half-built class behind
    return fail('db', 'Could not load the demo class. Make sure the database migration and seed have been run.');
  }
}

/** Reset: delete this teacher's sample-data classrooms and load a fresh one. */
export async function resetDemoClass(schoolId: string): Promise<Result<{ classroomId: string }>> {
  const supabase = await createClient();
  const { error } = await supabase.from('classrooms').delete().eq('school_id', schoolId).eq('is_demo', true);
  if (error) return fail('db', 'Could not reset the demo class.');
  return loadDemoClass(schoolId);
}
