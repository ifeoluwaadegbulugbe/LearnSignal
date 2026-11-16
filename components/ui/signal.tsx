import { cn } from '@/lib/utils';
import { Tooltip } from './primitives';

/** Three concentric arcs (the LearnSignal motif). `level` 0–3 arcs lit. */
export function SignalMark({ level = 3, size = 24, animate, className, color = 'var(--teal)', title }: { level?: 0 | 1 | 2 | 3; size?: number; animate?: boolean; className?: string; color?: string; title?: string }) {
  const arcs = ['M9 17a4 4 0 0 1 6 0', 'M6 14a8.5 8.5 0 0 1 12 0', 'M3 11a13 13 0 0 1 18 0'];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx="12" cy="20" r="1.8" fill={color} />
      {arcs.map((d, i) => (
        <path key={i} d={d} stroke={i < level ? color : 'var(--line-strong)'} strokeWidth="2.2" strokeLinecap="round"
          className={animate && i < level ? 'arc-light' : undefined} style={animate ? { animationDelay: `${i * 120}ms` } : undefined} />
      ))}
    </svg>
  );
}

/** Confidence as 1–3 lit arcs. Provisional adds a dashed outline + tooltip. */
export function ConfidenceSignal({ confidence, provisional, showLabel = true }: { confidence: 'low' | 'medium' | 'high'; provisional?: boolean; showLabel?: boolean }) {
  const level = ({ low: 1, medium: 2, high: 3 } as const)[confidence];
  const mark = (
    <span className={cn('inline-flex items-center gap-1 rounded-full text-[12px] text-ink-2', provisional && 'border border-dashed border-line-strong py-0.5 pl-1 pr-2')}>
      <SignalMark level={level} size={20} />
      {showLabel && <span className="capitalize">{confidence}</span>}
      <span className="sr-only">Confidence: {confidence}{provisional ? ', provisional' : ''}</span>
    </span>
  );
  return provisional ? <Tooltip text="Based on one session. A second check makes this more reliable.">{mark}</Tooltip> : mark;
}
