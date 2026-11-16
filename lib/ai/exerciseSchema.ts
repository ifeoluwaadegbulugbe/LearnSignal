import { z } from 'zod';

export const Exercise = z.object({
  type: z.enum(['mcq', 'numeric', 'listen_choose']),
  stem: z.string().max(160),
  audioText: z.string().max(160).optional(),
  options: z.array(z.string().max(30)).min(2).max(4).optional(),
  answer: z.union([z.string(), z.number()]),
  hint: z.string().max(100),
  feedbackCorrect: z.string().max(80),
  feedbackTryAgain: z.string().max(80),
});
export const ExerciseSet = z.object({
  skillId: z.string(),
  difficulty: z.number().int().min(1).max(3),
  items: z.array(Exercise).min(3).max(5),
});
export type ExerciseT = z.infer<typeof Exercise> & { source?: 'seed' | 'ai' };
export type ExerciseSetT = z.infer<typeof ExerciseSet>;

// Lenient schema for the model's raw output: we validate items one by one so a single bad
// item is dropped instead of discarding the whole set.
export const RawModelSet = z.object({ items: z.array(z.unknown()).min(1).max(8) });

/** JSON schema sent to Gemini as responseJsonSchema (derived from the Zod schema). */
export const modelResponseJsonSchema = z.toJSONSchema(
  z.object({ items: z.array(Exercise).min(3).max(5) }),
  { target: 'draft-7' },
);

export const GenerateRequest = z.object({
  skillId: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6']),
  difficulty: z.number().int().min(1).max(3),
  language: z.literal('en').default('en'),
  count: z.number().int().min(3).max(5).default(5),
  missedTypes: z.array(z.string().max(30)).max(5).optional(),
});
