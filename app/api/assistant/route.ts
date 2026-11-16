import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AIUnavailableError, aiConfig, getClient, withRetry } from '@/lib/ai/gemini';
import { runAssistant, type Content } from '@/lib/ai/assistant';
import { TOOL_DECLARATIONS } from '@/lib/ai/tools';
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { loadClassSnapshot } from '@/lib/server/snapshot';
import { aiRateLimited, logAI } from '@/lib/server/engine';
import { logServerError } from '@/lib/result';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Body = z.object({ classroomId: z.string().uuid(), question: z.string().trim().min(2, 'Ask a question').max(300, 'Keep questions under 300 characters') });
const err = (code: string, message: string, status: number) => NextResponse.json({ ok: false, error: { code, message } }, { status });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('unauthenticated', 'Please sign in.', 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err('invalid', parsed.error.issues[0]?.message ?? 'Invalid question.', 400);
  if (!aiConfig().ready) return err('ai_unavailable', 'The assistant is unavailable (AI is off or not configured). Dashboards still work.', 503);
  if (await aiRateLimited(supabase, user.id)) return err('rate_limited', 'Please wait a minute before asking again.', 429);

  const snap = await loadClassSnapshot(supabase, parsed.data.classroomId).catch((e) => { logServerError('assistant.snapshot', e); return null; });
  if (!snap) return err('forbidden', 'You do not have access to that classroom.', 403);

  try {
    const { ai, model } = getClient();
    const result = await runAssistant(parsed.data.question, snap, async (contents: Content[]) =>
      withRetry(async () => {
        const res = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction: ASSISTANT_SYSTEM_PROMPT, temperature: 0.1, tools: [{ functionDeclarations: TOOL_DECLARATIONS }] },
        });
        const content = (res.candidates?.[0]?.content ?? { role: 'model', parts: [{ text: '' }] }) as Content;
        return { content: { role: 'model', parts: content.parts ?? [] }, tokensIn: res.usageMetadata?.promptTokenCount, tokensOut: res.usageMetadata?.candidatesTokenCount };
      }),
    );
    await logAI(supabase, user.id, 'assistant', !result.blocked, result.tokensIn, result.tokensOut);
    return NextResponse.json({ ok: true, data: { answer: result.answer, citedCodes: result.citedCodes, toolCalls: result.toolCalls, asOf: result.asOf, blocked: !!result.blocked } });
  } catch (e) {
    await logAI(supabase, user.id, 'assistant', false);
    const message = e instanceof AIUnavailableError && e.code === 'rate_limited'
      ? 'The AI service is busy (rate limit). Try again in a minute.'
      : 'The assistant could not answer right now. Try again shortly.';
    logServerError('assistant', e);
    return err('ai_unavailable', message, 503);
  }
}
