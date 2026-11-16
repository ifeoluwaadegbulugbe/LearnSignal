import { CircleDashed, CircleDot, CheckCircle2, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillStateName } from '@/lib/scoring/skillState';

// Every status has colour + icon + text (never colour alone). Amber, not red, for "not yet".
export const STATE_UI: Record<SkillStateName, { label: string; short: string; icon: typeof CheckCircle2; text: string; bg: string; fill: string }> = {
  not_yet: { label: 'Not yet demonstrated', short: 'Not yet', icon: CircleDot, text: 'text-[#8A5410]', bg: 'bg-st-notyet-soft', fill: '#C77D1A' },
  developing: { label: 'Developing', short: 'Developing', icon: Sprout, text: 'text-[#1F5C91]', bg: 'bg-st-developing-soft', fill: '#3A86C8' },
  consistent: { label: 'Demonstrated consistently', short: 'Consistent', icon: CheckCircle2, text: 'text-[#1D6B47]', bg: 'bg-st-consistent-soft', fill: '#2E9E6B' },
  insufficient: { label: 'Not enough evidence', short: 'Not enough evidence', icon: CircleDashed, text: 'text-[#4F585C]', bg: 'bg-st-insufficient-soft', fill: '#8A9499' },
};

export function StateBadge({ state, short, className }: { state: SkillStateName; short?: boolean; className?: string }) {
  const s = STATE_UI[state];
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold', s.bg, s.text, className)}>
      <Icon className="size-3.5" aria-hidden /> {short ? s.short : s.label}
    </span>
  );
}

export function ConfidenceBadge({ confidence, provisional }: { confidence: 'low' | 'medium' | 'high'; provisional?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-muted">
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => <span key={i} className={cn('h-2.5 w-1.5 rounded-sm', i < ({ low: 1, medium: 2, high: 3 } as const)[confidence] ? 'bg-ink/70' : 'bg-line')} />)}
      </span>
      {confidence} confidence{provisional ? ' · provisional' : ''}
    </span>
  );
}
