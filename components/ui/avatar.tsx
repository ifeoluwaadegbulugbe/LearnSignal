import { cn } from '@/lib/utils';

const HUES = ['bg-g-lime text-[#2E3D00]', 'bg-g-lilac text-[#2A1A7A]', 'bg-g-sky text-[#0E3B66]', 'bg-g-peach text-[#6B2A0A]', 'bg-g-mint text-[#0B4D2C]'];
const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/** Initials-only avatar (never photos). Hue derived from the learner code. */
export function Avatar({ name, seed, size = 40, className, label }: { name: string; seed?: string; size?: 24 | 32 | 40 | 56; className?: string; label?: string }) {
  const s = { 24: 'size-6 text-[10px]', 32: 'size-8 text-[12px]', 40: 'size-10 text-[14px]', 56: 'size-14 text-[18px]' }[size];
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', s, HUES[hash(seed ?? name) % HUES.length], className)}
      role="img" aria-label={label ?? name}>
      <span aria-hidden>{initials(name)}</span>
    </span>
  );
}

export function AvatarStack({ people, max = 4, size = 32 }: { people: { name: string; seed?: string }[]; max?: number; size?: 24 | 32 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="flex items-center" aria-label={`${people.length} learner${people.length === 1 ? '' : 's'}`}>
      {shown.map((p, i) => <Avatar key={i} name={p.name} seed={p.seed} size={size} className={cn('ring-2 ring-surface', i > 0 && '-ml-2.5')} />)}
      {extra > 0 && <span className={cn('-ml-2.5 inline-flex items-center justify-center rounded-full bg-ink text-[11px] font-bold text-surface ring-2 ring-surface', size === 24 ? 'size-6' : 'size-8')}>+{extra}</span>}
    </span>
  );
}
