import { CheckCircle2, CircleDashed, HelpCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillStateName } from '@/lib/scoring/skillState';
import { Tooltip } from './primitives';
import { ConfidenceSignal } from './signal';

// One status vocabulary everywhere: colour + icon + label + plain-language tooltip. Never red.
export const STATUS: Record<SkillStateName, { label: string; short: string; tip: string; icon: typeof CheckCircle2; cls: string; fill: string; ring: string }> = {
  not_yet: { label: 'Not yet demonstrated', short: 'Not yet', tip: "Hasn't shown this skill in recent practice or checks.", icon: CircleDashed, cls: 'bg-st-notyet-soft text-st-notyet', fill: 'var(--st-not-yet)', ring: 'border-st-notyet' },
  developing: { label: 'Developing', short: 'Developing', tip: 'Getting there. Some correct, some not yet.', icon: TrendingUp, cls: 'bg-st-developing-soft text-st-developing', fill: 'var(--st-dev)', ring: 'border-st-developing' },
  consistent: { label: 'Demonstrated consistently', short: 'Consistent', tip: 'Showed this skill across more than one session.', icon: CheckCircle2, cls: 'bg-st-consistent-soft text-st-consistent', fill: 'var(--st-consistent)', ring: 'border-st-consistent' },
  insufficient: { label: 'Not enough evidence yet', short: 'Not enough evidence', tip: 'A few more questions are needed.', icon: HelpCircle, cls: 'bg-st-insufficient-soft text-st-insufficient', fill: 'var(--st-insufficient)', ring: 'border-st-insufficient' },
};

export function StatusPill({ state, size = 'md', short, className, noTip }: { state: SkillStateName; size?: 'sm' | 'md'; short?: boolean; className?: string; noTip?: boolean }) {
  const s = STATUS[state];
  const Icon = s.icon;
  const pill = (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full font-semibold', size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-[12px]', s.cls, className)}>
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden strokeWidth={2} /> {short ? s.short : s.label}
    </span>
  );
  return noTip ? pill : <Tooltip text={s.tip}>{pill}</Tooltip>;
}

export const StateBadge = StatusPill;
/** Confidence is shown with the signal motif. */
export const ConfidenceDots = ConfidenceSignal;
