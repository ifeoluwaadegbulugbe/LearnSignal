import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Hue = 'indigo' | 'lime' | 'sky' | 'peach' | 'lilac' | 'mint' | 'amber' | 'grey';
export const HUE: Record<Hue, { bg: string; fg: string; grad: string }> = {
  indigo: { bg: 'bg-[#4F46E5]/12', fg: 'text-[#4F46E5] dark:text-[#A5A0FF]', grad: 'bg-g-lilac' },
  lime: { bg: 'bg-[#8DB21C]/15', fg: 'text-[#4F6B00] dark:text-[#C8F135]', grad: 'bg-g-lime' },
  sky: { bg: 'bg-[#2B6FB3]/12', fg: 'text-[#2B6FB3] dark:text-[#7DB8F2]', grad: 'bg-g-sky' },
  peach: { bg: 'bg-[#E0703A]/14', fg: 'text-[#B4521F] dark:text-[#FFB996]', grad: 'bg-g-peach' },
  lilac: { bg: 'bg-[#7B61FF]/12', fg: 'text-[#5B3FE0] dark:text-[#B9A8FF]', grad: 'bg-g-lilac' },
  mint: { bg: 'bg-[#1F8A5B]/12', fg: 'text-[#1F8A5B] dark:text-[#6FD3A3]', grad: 'bg-g-mint' },
  amber: { bg: 'bg-[#B4690E]/12', fg: 'text-[#B4690E] dark:text-[#F2B15C]', grad: 'bg-g-peach' },
  grey: { bg: 'bg-ink/6', fg: 'text-ink-2', grad: 'bg-surface-2' },
};

export function IconTile({ icon: Icon, hue = 'indigo', size = 40, className }: { icon: LucideIcon; hue?: Hue; size?: 32 | 40 | 56; className?: string }) {
  const s = { 32: 'size-8 rounded-[10px]', 40: 'size-10 rounded-[12px]', 56: 'size-14 rounded-[14px]' }[size];
  const i = { 32: 'size-4', 40: 'size-5', 56: 'size-6' }[size];
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', s, HUE[hue].bg, HUE[hue].fg, className)} aria-hidden>
      <Icon className={i} strokeWidth={1.75} />
    </span>
  );
}
