// Exercise-generation pipeline. The model call is injected so tests can mock it.
import { RawModelSet, type ExerciseT } from './exerciseSchema';
import { itemKey, validateSet, type ValidationReport } from './validate';
import { seedSetFor } from '@/lib/content/exercises.seed';

export type ModelCaller = (prompt: string) => Promise<{ text: string; tokensIn?: number; tokensOut?: number }>;

export interface GenerateResult {
  items: ExerciseT[];
  report: ValidationReport | null;
  aiItems: number;
  seedItems: number;
  fallback: 'none' | 'partial' | 'full';
  notice?: string;
  tokensIn?: number;
  tokensOut?: number;
}

export function parseModelJson(text: string): unknown[] {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  const parsed = RawModelSet.parse(JSON.parse(cleaned));
  return parsed.items;
}

export async function runGeneration(
  args: { skillId: string; difficulty: 1 | 2 | 3; count: number; prompt: string },
  call: ModelCaller | null,
  unavailableNotice = 'AI unavailable — showing built-in practice.',
): Promise<GenerateResult> {
  const seed = seedSetFor(args.skillId, args.difficulty);
  const seedFill = (n: number, skip: Set<string>) =>
    seed.items.filter((i) => !skip.has(itemKey(i))).slice(0, n).map((i) => ({ ...i, source: 'seed' as const }));

  if (!call) {
    return { items: seedFill(args.count, new Set()), report: null, aiItems: 0, seedItems: Math.min(args.count, seed.items.length), fallback: 'full', notice: unavailableNotice };
  }

  let raw: unknown[];
  let tokensIn: number | undefined, tokensOut: number | undefined;
  try {
    const res = await call(args.prompt);
    tokensIn = res.tokensIn; tokensOut = res.tokensOut;
    raw = parseModelJson(res.text);
  } catch (err) {
    const notice = err instanceof Error && /rate/i.test(err.message) ? 'AI is busy (rate limit) — showing built-in practice.' : unavailableNotice;
    return { items: seedFill(args.count, new Set()), report: null, aiItems: 0, seedItems: Math.min(args.count, seed.items.length), fallback: 'full', notice, tokensIn, tokensOut };
  }

  const { items, report } = validateSet(raw, args.skillId, args.difficulty);
  const ai = items.slice(0, args.count);
  const fill = seedFill(args.count - ai.length, new Set(ai.map(itemKey)));
  const fallback = fill.length === 0 ? 'none' : ai.length === 0 ? 'full' : 'partial';
  return {
    items: [...ai, ...fill], report, aiItems: ai.length, seedItems: fill.length, fallback, tokensIn, tokensOut,
    notice: fallback === 'none' ? undefined : `${report.rejected} AI item(s) failed validation — filled with ${fill.length} built-in item(s).`,
  };
}
