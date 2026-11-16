import { cn } from '@/lib/utils';

const HUES = [
  'bg-teal-soft text-teal-ink dark:text-teal',
  'bg-sun-soft text-sun-ink dark:text-sun',
  'bg-sky-soft text-[#1C4F80] dark:text-sky',
  'bg-clay-soft text-[#7A3417] dark:text-clay',
  'bg-leaf-soft text-[#145C38] dark:text-[#6FD3A3]',
];
const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const hueFor = (seed: string) => HUES[hash(seed) % HUES.length];
export const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/** Initials-only disc ("learner dot"). Hue from the learner code. Never photos. */
export function Avatar({ name, seed, size = 40, className, label }: { name: string; seed?: string; size?: 24 | 32 | 40 | 48 | 64; className?: string; label?: string }) {
  const s = { 24: 'size-6 text-[10px]', 32: 'size-8 text-[12px]', 40: 'size-10 text-[14px]', 48: 'size-12 text-[16px]', 64: 'size-16 text-[20px]' }[size];
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', s, hueFor(seed ?? name), className)} role="img"
      aria-label={label ?? (seed ? `${name}, learner code ${seed}` : name)}>
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
      {shown.map((p, i) => <Avatar key={i} name={p.name} seed={p.seed} size={size} className={cn('ring-2 ring-card', i > 0 && '-ml-1.5')} />)}
      {extra > 0 && <span className={cn('-ml-1.5 inline-flex items-center justify-center rounded-full bg-paper-2 text-[10px] font-bold text-ink-2 ring-2 ring-card', size === 24 ? 'size-6' : 'size-8')}>+{extra}</span>}
    </span>
  );
}
