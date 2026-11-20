import { cn } from '@/lib/utils';
import { Tooltip } from './primitives';

/**
 * Three small stepped tiles (from the logo). `level` 0–3 tiles filled, lowest first.
 * Replaces the retired three-arc glyph everywhere it was used.
 */
export function StepTiles({ level = 3, size = 20, animate, className, color = 'var(--violet-500)', title }: { level?: 0 | 1 | 2 | 3; size?: number; animate?: boolean; className?: string; color?: string; title?: string }) {
  // three tiles rising left to right, like the logo's steps
  const tiles = [{ x: 1, y: 13, h: 6 }, { x: 8, y: 9, h: 10 }, { x: 15, y: 5, h: 14 }];
  return (
    <svg viewBox="0 0 22 20" width={size} height={(size * 20) / 22} className={cn(animate && 'tile-seq', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {tiles.map((t, i) => (
        <rect key={i} x={t.x} y={t.y} width="6" height={t.h} rx="2" fill={i < level ? color : 'var(--violet-100)'} />
      ))}
    </svg>
  );
}
/** Older name kept for call sites; renders the stepped tiles. */
export const SignalMark = StepTiles;

/** Confidence as 1–3 filled stepped tiles. Provisional adds a dashed outline and a tooltip. */
export function ConfidenceTiles({ confidence, provisional, showLabel = true }: { confidence: 'low' | 'medium' | 'high'; provisional?: boolean; showLabel?: boolean }) {
  const level = ({ low: 1, medium: 2, high: 3 } as const)[confidence];
  const mark = (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full text-[13px] text-muted', provisional && 'border border-dashed border-line-strong py-0.5 pl-1.5 pr-2')}>
      <StepTiles level={level} size={18} />
      {showLabel && <span className="capitalize">{confidence}</span>}
      <span className="sr-only">Confidence: {confidence}{provisional ? ', provisional' : ''}</span>
    </span>
  );
  return provisional ? <Tooltip text="Based on one session. A second check makes this more reliable.">{mark}</Tooltip> : mark;
}
/** Older name kept for call sites. */
export const ConfidenceSignal = ConfidenceTiles;
