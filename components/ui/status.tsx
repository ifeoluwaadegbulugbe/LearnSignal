import { CheckCircle2, CircleDashed, HelpCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillStateName } from '@/lib/scoring/skillState';
import { Tooltip } from './primitives';

// One status vocabulary everywhere: colour + icon + label + plain-language tooltip. Never red.
export const STATUS: Record<SkillStateName, { label: string; short: string; tip: string; icon: typeof CheckCircle2; cls: string; fill: string; ring: string }> = {
  not_yet: { label: 'Not yet demonstrated', short: 'Not yet', tip: 'Has not shown this skill in recent practice or checks.', icon: CircleDashed, cls: 'bg-st-notyet-soft text-st-notyet', fill: 'var(--st-not-yet)', ring: 'border-st-notyet' },
  developing: { label: 'Developing', short: 'Developing', tip: 'Getting there. Some correct, some not yet.', icon: TrendingUp, cls: 'bg-st-developing-soft text-st-developing', fill: 'var(--st-dev)', ring: 'border-st-developing' },
  consistent: { label: 'Demonstrated consistently', short: 'Consistent', tip: 'Showed this skill across more than one session.', icon: CheckCircle2, cls: 'bg-st-consistent-soft text-st-consistent', fill: 'var(--st-consistent)', ring: 'border-st-consistent' },
  insufficient: { label: 'Not enough evidence yet', short: 'Not enough evidence', tip: 'Needs a few more questions before we can say.', icon: HelpCircle, cls: 'bg-st-insufficient-soft text-st-insufficient', fill: 'var(--st-insufficient)', ring: 'border-st-insufficient' },
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

/** Back-compat name used by older markup. */
export const StateBadge = StatusPill;

export function ConfidenceDots({ confidence, provisional }: { confidence: 'low' | 'medium' | 'high'; provisional?: boolean }) {
  const n = { low: 1, medium: 2, high: 3 }[confidence];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => <span key={i} className={cn('size-2 rounded-full', i < n ? 'bg-ink-2' : 'bg-line-strong')} />)}
      </span>
      <span className="capitalize">{confidence}</span><span className="sr-only"> confidence</span>
      {provisional && (
        <Tooltip text="Based on one session. A second check makes this more reliable.">
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-1.5 text-[11px] text-ink-2">
            <span className="size-2 rounded-full border border-ink-3" aria-hidden /> provisional
          </span>
        </Tooltip>
      )}
    </span>
  );
}
