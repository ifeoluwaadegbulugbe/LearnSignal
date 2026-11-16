import 'server-only';
import { ITEM_BY_ID, ITEMS, type AssessmentItem } from '@/lib/content/items.seed';

export type OralMark = 'correct' | 'omitted' | 'substituted' | 'self_corrected';
export type ItemResponseInput =
  | { kind: 'choice'; value: string }
  | { kind: 'numeric'; value: number }
  | { kind: 'oral'; marks: OralMark[]; seconds: number }
  | { kind: 'skip' };

/** Item as sent to the client: never includes the answer key. */
export function publicItem(item: AssessmentItem) {
  return { id: item.id, skillId: item.skillId, difficulty: item.difficulty, type: item.type, content: item.content };
}
export type PublicItem = ReturnType<typeof publicItem>;

export function scoreResponse(itemId: string, r: ItemResponseInput): { correct: boolean | null; detail: Record<string, unknown> } {
  const item = ITEM_BY_ID[itemId];
  if (!item) throw new Error('unknown item');
  if (r.kind === 'skip') return { correct: null, detail: { skipped: true } };
  if (item.type === 'tap_word_sequence') {
    if (r.kind !== 'oral') throw new Error('expected oral reading marks');
    const total = item.content.words!.length;
    const marks = r.marks.slice(0, total);
    const read = marks.filter((m) => m === 'correct' || m === 'self_corrected').length;
    const accuracy = total ? read / total : 0;
    const minutes = Math.max(r.seconds, 1) / 60;
    const wcpm = Math.round(read / minutes);
    const min = (item.answer as { minAccuracy: number }).minAccuracy;
    return { correct: accuracy >= min, detail: { marks, seconds: r.seconds, accuracy: Math.round(accuracy * 100) / 100, wcpm } };
  }
  if (item.type === 'numeric') {
    if (r.kind !== 'numeric') throw new Error('expected a number');
    return { correct: r.value === Number(item.answer), detail: { value: r.value } };
  }
  if (r.kind !== 'choice') throw new Error('expected a choice');
  return { correct: r.value.trim().toLowerCase() === String(item.answer).trim().toLowerCase(), detail: { value: r.value } };
}

export const bankFor = (prefix: 'L' | 'N') => ITEMS.filter((i) => i.skillId.startsWith(prefix)).map((i) => ({ id: i.id, skillId: i.skillId, difficulty: i.difficulty }));
export const getItem = (id: string) => ITEM_BY_ID[id];
