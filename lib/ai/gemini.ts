import 'server-only';
import { GoogleGenAI } from '@google/genai';

export class AIUnavailableError extends Error {
  constructor(message: string, public code: 'disabled' | 'no_key' | 'rate_limited' | 'timeout' | 'upstream' | 'bad_output') {
    super(message);
  }
}

export function aiConfig() {
  const enabled = (process.env.AI_ENABLED ?? 'true').toLowerCase() === 'true';
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  return { enabled, apiKey, model, ready: enabled && !!apiKey && !!model };
}

let client: GoogleGenAI | null = null;
export function getClient(): { ai: GoogleGenAI; model: string } {
  const cfg = aiConfig();
  if (!cfg.enabled) throw new AIUnavailableError('AI is turned off (AI_ENABLED=false).', 'disabled');
  if (!cfg.apiKey || !cfg.model) throw new AIUnavailableError('GEMINI_API_KEY or GEMINI_MODEL is not set.', 'no_key');
  client ??= new GoogleGenAI({ apiKey: cfg.apiKey });
  return { ai: client, model: cfg.model };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function statusOf(err: unknown): number | undefined {
  const e = err as { status?: number; code?: number; message?: string };
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.code === 'number') return e.code;
  const m = e?.message?.match(/\b(429|500|502|503|504)\b/);
  return m ? Number(m[1]) : undefined;
}

/**
 * Run a model call with ≤3 retries, exponential backoff on 429/5xx/timeouts, and a per-attempt timeout.
 * `fn` receives an AbortSignal-free attempt index; we race it against a timer.
 */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, opts: { retries?: number; timeoutMs?: number; baseDelayMs?: number } = {}): Promise<T> {
  const retries = opts.retries ?? 3, timeoutMs = opts.timeoutMs ?? 20000, base = opts.baseDelayMs ?? 800;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(attempt),
        new Promise<never>((_, rej) => setTimeout(() => rej(new AIUnavailableError('Model call timed out', 'timeout')), timeoutMs)),
      ]);
    } catch (err) {
      lastErr = err;
      const status = statusOf(err);
      const retryable = err instanceof AIUnavailableError ? err.code === 'timeout' || err.code === 'bad_output' : status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(base * 2 ** attempt + Math.floor(Math.random() * 200));
    }
  }
  if (lastErr instanceof AIUnavailableError) throw lastErr;
  const status = statusOf(lastErr);
  console.error(`[learnsignal] model call failed (status ${status ?? 'n/a'}): ${(lastErr as Error)?.message?.slice(0, 300)}`);
  throw new AIUnavailableError(
    status === 429 ? 'The AI service is rate-limited right now.' : 'The AI service did not respond.',
    status === 429 ? 'rate_limited' : 'upstream',
  );
}
