import { cn } from '@/lib/utils';

/** One quiet style for every learner dot: white circle, violet hairline, ink initials. No colour coding. */
const HUES = ['bg-surface text-ink border border-line-strong'];
const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const hueFor = (seed: string) => HUES[hash(seed) % HUES.length];
export const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/** Initials-only disc ("learner dot"). Hue from the learner code. Never photos. */
export function Avatar({ name, seed, size = 40, className, label }: { name: string; seed?: string; size?: 24 | 28 | 32 | 40 | 48 | 64; className?: string; label?: string }) {
  const s = { 24: 'size-6 text-[10px]', 28: 'size-7 text-[11px]', 32: 'size-8 text-[12px]', 40: 'size-10 text-[14px]', 48: 'size-12 text-[16px]', 64: 'size-16 text-[20px]' }[size];
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', s, hueFor(seed ?? name), className)} {...(label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label ?? (seed ? `${name}, learner code ${seed}` : name) })}>
      <span aria-hidden>{initials(name)}</span>
    </span>
  );
}
export const LearnerDot = Avatar;

export function AvatarStack({ people, max = 5, size = 24 }: { people: { name: string; seed?: string }[]; max?: number; size?: 24 | 32 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="flex items-center" aria-label={`${people.length} learner${people.length === 1 ? '' : 's'}`}>
      {shown.map((p, i) => <Avatar key={i} name={p.name} seed={p.seed} size={size} className={cn('ring-2 ring-surface', i > 0 && '-ml-1.5')} />)}
      {extra > 0 && <span className={cn('-ml-1.5 inline-flex items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-ink-2 ring-2 ring-surface', size === 24 ? 'size-6' : 'size-8')}>+{extra}</span>}
    </span>
  );
}
