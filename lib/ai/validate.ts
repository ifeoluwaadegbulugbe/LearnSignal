// Code-side validation of model-drafted exercises (master prompt §7.2 step 3).
// Every rule here is deterministic. Items failing any rule are dropped.
import { Exercise, type ExerciseT } from './exerciseSchema';
import {
  ALLOWED_CAPITALISED, ALLOWED_NAMES, BANNED_WORDS, CVC_WORDS, LETTERS, MAX_WORDS_PER_SENTENCE, SIGHT_WORDS,
} from '@/lib/content/wordbank';

export interface ItemReport { index: number; ok: boolean; reasons: string[]; stem?: string }
export interface ValidationReport { accepted: number; rejected: number; items: ItemReport[] }

// ---------- safe arithmetic (integers, + and - only; no eval) ----------
export function evalArithmetic(expr: string): number | null {
  const norm = expr.replace(/[−–—]/g, '-').replace(/\s+/g, '');
  if (!/^\d{1,3}([+-]\d{1,3})+$/.test(norm)) return null;
  const tokens = norm.match(/\d+|[+-]/g)!;
  let total = Number(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) total = tokens[i] === '+' ? total + Number(tokens[i + 1]) : total - Number(tokens[i + 1]);
  return total;
}

const ARITH_RE = /\d{1,3}\s*[+\-−–]\s*\d{1,3}(?:\s*[+\-−–]\s*\d{1,3})*/;
const numbersIn = (s: string) => (s.match(/\d+/g) ?? []).map(Number);
const words = (s: string) => s.toLowerCase().match(/[a-z']+/g) ?? [];

function graphemeCount(s: string): number {
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  let n = 0;
  for (const { segment } of seg.segment(s)) if (/\p{Extended_Pictographic}/u.test(segment)) n++;
  return n;
}

function checkContent(item: ExerciseT, difficulty: number, reasons: string[]) {
  const text = [item.stem, item.audioText ?? '', item.hint, item.feedbackCorrect, item.feedbackTryAgain, ...(item.options ?? [])].join(' ');
  const lower = ` ${text.toLowerCase()} `;
  for (const b of BANNED_WORDS) {
    const re = new RegExp(`[^a-z]${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z]`);
    if (re.test(lower)) reasons.push(`banned word "${b}"`);
  }
  // Personal names: capitalised words not at sentence start must be allowed names or allowed capitalised words.
  for (const sentence of item.stem.split(/(?<=[.!?…])\s+/)) {
    const toks = sentence.match(/[A-Za-z']+/g) ?? [];
    toks.slice(1).forEach((t) => {
      if (/^[A-Z]/.test(t) && !ALLOWED_NAMES.has(t) && !ALLOWED_CAPITALISED.has(t)) reasons.push(`unexpected name or proper noun "${t}"`);
    });
    if (toks[0] && /^[A-Z][a-z]+$/.test(toks[0]) && !ALLOWED_NAMES.has(toks[0]) && /^[A-Z][a-z]+$/.test(toks[1] ?? '') && !ALLOWED_CAPITALISED.has(toks[1] ?? '')) {
      reasons.push(`possible full name "${toks[0]} ${toks[1]}"`);
    }
    const max = MAX_WORDS_PER_SENTENCE[difficulty] ?? 14;
    if (toks.length > max) reasons.push(`sentence too long for level (${toks.length} > ${max} words)`);
  }
}

function checkStructure(item: ExerciseT, reasons: string[]) {
  if (item.type === 'numeric') {
    if (item.options) reasons.push('numeric item must not have options');
    const n = typeof item.answer === 'number' ? item.answer : Number(item.answer);
    if (!Number.isInteger(n) || n < 0) reasons.push('numeric answer must be a non-negative integer');
  } else {
    if (!item.options || item.options.length < 2) reasons.push('choice item needs 2–4 options');
    else {
      const norm = item.options.map((o) => o.trim().toLowerCase());
      if (new Set(norm).size !== norm.length) reasons.push('options are not distinct');
      if (!norm.includes(String(item.answer).trim().toLowerCase())) reasons.push('answer is not one of the options');
    }
  }
}

function checkSkill(item: ExerciseT, skillId: string, reasons: string[]) {
  const ans = String(item.answer).trim();
  const ansLower = ans.toLowerCase();
  switch (skillId) {
    case 'L1':
      if (!LETTERS.has(ansLower)) reasons.push('L1 answer must be a single letter');
      for (const o of item.options ?? []) if (!LETTERS.has(o.trim().toLowerCase())) reasons.push(`L1 option "${o}" is not a single letter`);
      break;
    case 'L2':
      if (!CVC_WORDS.has(ansLower)) reasons.push(`"${ans}" is not in the curated CVC word bank`);
      for (const o of item.options ?? []) if (!/^[a-z]{2,5}$/i.test(o.trim())) reasons.push(`L2 option "${o}" is not a short word`);
      break;
    case 'L3':
      if (!SIGHT_WORDS.has(ansLower)) reasons.push(`"${ans}" is not in the curated sight-word bank`);
      break;
    case 'N1': {
      const n = Number(ans);
      if (!Number.isInteger(n) || n < 0 || n > 20) reasons.push('N1 answer must be a number 0–20');
      const spoken = numbersIn(`${item.audioText ?? ''} ${item.stem}`);
      if (!spoken.includes(n)) reasons.push('N1 answer does not match the number in the prompt');
      break;
    }
    case 'N2': {
      const count = graphemeCount(item.stem);
      if (count === 0) reasons.push('N2 stem must contain objects (emoji) to count');
      else if (count !== Number(ans)) reasons.push(`N2 answer ${ans} ≠ ${count} objects shown`);
      if (count > 20) reasons.push('N2 count above 20');
      break;
    }
    case 'N3':
    case 'N4': {
      const m = item.stem.match(ARITH_RE);
      if (!m) { reasons.push(`${skillId} stem must contain an arithmetic expression`); break; }
      const value = evalArithmetic(m[0]);
      const hasMinus = /[-−–]/.test(m[0]);
      if (skillId === 'N3' && hasMinus) reasons.push('N3 item uses subtraction');
      if (skillId === 'N4' && !hasMinus) reasons.push('N4 item does not use subtraction');
      if (value === null) reasons.push('could not parse the arithmetic');
      else if (value !== Number(ans)) reasons.push(`wrong answer: ${m[0].trim()} = ${value}, model said ${ans}`);
      if ([...numbersIn(m[0]), Number(ans)].some((n) => n > 20)) reasons.push('numbers above 20 are out of range');
      if (value !== null && value < 0) reasons.push('negative result');
      break;
    }
    case 'N5': {
      const s = item.stem.toLowerCase();
      let expected: number | null = null;
      let mm: RegExpMatchArray | null;
      if ((mm = s.match(/value of (\d) in (\d{2})/))) {
        const [, d, n] = mm; const i = n.indexOf(d);
        expected = i === 0 ? Number(d) * 10 : i === 1 ? Number(d) : null;
      } else if ((mm = s.match(/how many tens .*?(\d{2})/))) expected = Math.floor(Number(mm[1]) / 10);
      else if ((mm = s.match(/how many ones .*?(\d{2})/))) expected = Number(mm[1]) % 10;
      else if ((mm = s.match(/(\d) tens? and (\d) ones?/))) expected = Number(mm[1]) * 10 + Number(mm[2]);
      if (expected === null) reasons.push('N5 stem pattern not recognised (cannot verify answer)');
      else if (expected !== Number(ans)) reasons.push(`wrong answer: expected ${expected}, model said ${ans}`);
      break;
    }
    case 'N6': {
      const nums = numbersIn(item.stem);
      if (nums.length !== 2) { reasons.push('N6 must contain exactly two numbers'); break; }
      const [a, b] = nums;
      const w = words(item.stem).join(' ');
      const add = /\b(more|gets|buys|come|comes|altogether|total|join|joins|finds|got)\b/.test(w);
      const sub = /\b(left|gives|gave|eats|ate|away|fewer|off|lost|loses|sold|empty|fly away)\b/.test(w);
      if (add === sub) { reasons.push('N6 operation is ambiguous (cannot verify)'); break; }
      const expected = add ? a + b : Math.abs(a - b);
      if (expected !== Number(ans)) reasons.push(`wrong answer: expected ${expected}, model said ${ans}`);
      if (a > 20 || b > 20 || expected > 20) reasons.push('numbers above 20 are out of range');
      break;
    }
    default:
      break; // L4–L6: structure, content and reading-level checks only
  }
}

export function validateItem(raw: unknown, skillId: string, difficulty: number, index = 0): { item?: ExerciseT; report: ItemReport } {
  const parsed = Exercise.safeParse(raw);
  if (!parsed.success) {
    return { report: { index, ok: false, reasons: parsed.error.issues.map((i) => `schema: ${i.path.join('.')} ${i.message}`) } };
  }
  const item: ExerciseT = { ...parsed.data, source: 'ai' };
  const reasons: string[] = [];
  checkStructure(item, reasons);
  checkSkill(item, skillId, reasons);
  checkContent(item, difficulty, reasons);
  return { item: reasons.length ? undefined : item, report: { index, ok: reasons.length === 0, reasons, stem: item.stem } };
}

/** Identity of an item for duplicate detection (listen_choose items share a stem but differ in audio/answer). */
export const itemKey = (i: { stem: string; audioText?: string; answer: string | number }) =>
  `${i.stem}|${i.audioText ?? ''}|${i.answer}`.toLowerCase();

export function validateSet(rawItems: unknown[], skillId: string, difficulty: number): { items: ExerciseT[]; report: ValidationReport } {
  const items: ExerciseT[] = [];
  const reports: ItemReport[] = [];
  const seen = new Set<string>();
  rawItems.forEach((raw, i) => {
    const { item, report } = validateItem(raw, skillId, difficulty, i);
    if (item && seen.has(itemKey(item))) { report.ok = false; report.reasons.push('duplicate item'); }
    else if (item) { seen.add(itemKey(item)); items.push(item); }
    reports.push(report);
  });
  return { items, report: { accepted: items.length, rejected: reports.length - items.length, items: reports } };
}

/** Check a free-text rationale (recommendation engine §7.1). */
export function rationaleIsSafe(text: string, allowedNumbers: number[], learnerNames: string[]): { ok: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const b of ['dyslexia', 'dyslexic', 'disorder', 'disability', 'disabled', 'adhd', 'autism', 'diagnos', 'deficit', 'lazy', 'slow learner', 'unintelligent'])
    if (lower.includes(b)) return { ok: false, reason: `diagnosis or labelling term "${b}"` };
  for (const n of learnerNames) if (n && lower.includes(n.toLowerCase())) return { ok: false, reason: 'mentions a learner name' };
  const allowed = new Set(allowedNumbers.map((n) => String(Math.round(n * 100) / 100)));
  for (const n of text.match(/\d+(?:\.\d+)?/g) ?? []) if (!allowed.has(String(Number(n)))) return { ok: false, reason: `number ${n} not in input` };
  return { ok: true };
}
