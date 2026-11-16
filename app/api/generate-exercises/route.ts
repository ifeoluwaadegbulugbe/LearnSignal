import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GenerateRequest, modelResponseJsonSchema } from '@/lib/ai/exerciseSchema';
import { exercisePrompt } from '@/lib/ai/prompts';
import { runGeneration, parseModelJson, type ModelCaller } from '@/lib/ai/generate';
import { AIUnavailableError, aiConfig, getClient, withRetry } from '@/lib/ai/gemini';
import { aiRateLimited, logAI } from '@/lib/server/engine';
import { logServerError } from '@/lib/result';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });

  const parsed = GenerateRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: 'invalid', message: 'Choose a skill, difficulty and count (3–5).' } }, { status: 400 });
  if (await aiRateLimited(supabase, user.id)) {
    return NextResponse.json({ ok: false, error: { code: 'rate_limited', message: 'You have generated a lot in the last minute. Please wait a moment.' } }, { status: 429 });
  }
  const { skillId, count, missedTypes } = parsed.data;
  const difficulty = parsed.data.difficulty as 1 | 2 | 3;

  let caller: ModelCaller | null = null;
  let notice: string | undefined;
  if (aiConfig().ready) {
    caller = async (prompt) => withRetry(async () => {
      const { ai, model } = getClient();
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseJsonSchema: modelResponseJsonSchema, temperature: 0.6 },
      });
      const text = res.text ?? '';
      try { parseModelJson(text); } catch { throw new AIUnavailableError('Model returned malformed JSON', 'bad_output'); }
      return { text, tokensIn: res.usageMetadata?.promptTokenCount, tokensOut: res.usageMetadata?.candidatesTokenCount };
    });
  } else {
    notice = aiConfig().enabled ? 'AI is not configured — showing built-in practice.' : 'AI is turned off — showing built-in practice.';
  }

  const result = await runGeneration({ skillId, difficulty, count, prompt: exercisePrompt(skillId, difficulty, count, missedTypes) }, caller, notice);
  if (caller) await logAI(supabase, user.id, 'generate_exercises', result.aiItems > 0, result.tokensIn, result.tokensOut);

  // Full fallback: hand back the existing approved seed set (no new row needed).
  if (result.aiItems === 0) {
    const { data: seedRow } = await supabase.from('exercises').select('id').eq('source', 'seed').eq('skill_id', skillId)
      .order('difficulty', { ascending: true }).limit(5);
    const { data: exact } = await supabase.from('exercises').select('id').eq('source', 'seed').eq('skill_id', skillId).eq('difficulty', difficulty).limit(1);
    const id = exact?.[0]?.id ?? seedRow?.[0]?.id ?? null;
    return NextResponse.json({ ok: true, data: { exerciseId: id, fallback: 'full', notice: result.notice, report: result.report, items: result.items } });
  }

  const { data, error } = await supabase.from('exercises').insert({
    skill_id: skillId, difficulty, language: 'en', source: 'ai', review_status: 'pending', created_by: user.id,
    content: { items: result.items },
    validation: { ...result.report, aiItems: result.aiItems, seedItems: result.seedItems, model: process.env.GEMINI_MODEL },
  }).select('id').single();
  if (error) {
    logServerError('generate.insert', error);
    return NextResponse.json({ ok: false, error: { code: 'db', message: 'Generated, but could not save the set.' } }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: { exerciseId: data.id, fallback: result.fallback, notice: result.notice, report: result.report, items: result.items } });
}
