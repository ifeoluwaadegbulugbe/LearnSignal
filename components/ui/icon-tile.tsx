import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Hue = 'teal' | 'sun' | 'sky' | 'clay' | 'leaf' | 'stone' | 'amber'
  // legacy names map onto the v3 palette
  | 'indigo' | 'lime' | 'peach' | 'lilac' | 'mint' | 'grey';

const BASE = {
  teal: 'bg-teal-soft text-teal',
  sun: 'bg-sun-soft text-sun-ink',
  sky: 'bg-sky-soft text-sky',
  clay: 'bg-clay-soft text-clay',
  leaf: 'bg-leaf-soft text-st-consistent',
  stone: 'bg-stone-soft text-ink-2',
  amber: 'bg-st-notyet-soft text-st-notyet',
};
export const HUE: Record<Hue, string> = { ...BASE, indigo: BASE.teal, lime: BASE.sun, peach: BASE.clay, lilac: BASE.sky, mint: BASE.leaf, grey: BASE.stone };

export function IconTile({ icon: Icon, hue = 'teal', size = 36, className }: { icon: LucideIcon; hue?: Hue; size?: 32 | 36 | 40 | 48 | 56; className?: string }) {
  const s = { 32: 'size-8', 36: 'size-9', 40: 'size-10', 48: 'size-12', 56: 'size-14' }[size];
  const i = size >= 48 ? 'size-6' : size <= 32 ? 'size-4' : 'size-5';
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-[12px]', s, HUE[hue], className)} aria-hidden>
      <Icon className={i} strokeWidth={1.75} />
    </span>
  );
}
