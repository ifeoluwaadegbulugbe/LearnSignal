export type ActionError = { code: string; message: string; fields?: Record<string, string> };
export type Result<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (code: string, message: string, fields?: Record<string, string>): Result<never> => ({ ok: false, error: { code, message, fields } });

export const FRIENDLY: Record<string, string> = {
  unauthenticated: 'Please sign in again.',
  forbidden: 'You do not have access to that.',
  invalid: 'Please check the highlighted fields.',
  not_found: 'We could not find that.',
  db: 'Something went wrong saving your changes. Please try again.',
  rate_limited: 'Too many requests. Please wait a minute and try again.',
};

/** Turn a Zod error into field messages. */
export function zodFields(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? 'form');
    out[k] ??= i.message;
  }
  return out;
}

/** Log server errors without learner content. */
export function logServerError(where: string, err: unknown) {
  const e = err as { code?: string; message?: string };
  console.error(`[learnsignal] ${where}: ${e?.code ?? ''} ${(e?.message ?? String(err)).slice(0, 200)}`);
}
