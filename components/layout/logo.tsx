import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * "Steps with a learner at the top": five rounded tiles form a staircase, the tangerine
 * dot is the child. Full colour on light surfaces; `mono` (currentColor) on dark/violet.
 * See docs/BRAND.md for clear space, minimum sizes and don'ts.
 */
const TILES = [
  { x: 6, y: 66, c: '#B9A8FF', o: 0.4 },
  { x: 36, y: 66, c: '#8B73F5', o: 0.7 },
  { x: 66, y: 66, c: '#5B3FE0', o: 1 },
  { x: 36, y: 36, c: '#8B73F5', o: 0.7 },
  { x: 66, y: 36, c: '#5B3FE0', o: 1 },
];

export function LogoMark({ size = 28, mono, dot = true, className }: { size?: number; mono?: boolean; dot?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('shrink-0', className)} aria-hidden>
      {TILES.map((t, i) => <rect key={i} x={t.x} y={t.y} width="28" height="28" rx="9" fill={mono ? 'currentColor' : t.c} opacity={mono ? t.o : 1} />)}
      <circle cx="80" cy="20" r="14" fill={mono && !dot ? 'currentColor' : '#FF7A2F'} />
    </svg>
  );
}

/** Live wordmark: Sora 700, "Learn" in ink, "Signal" in violet (white + night violet on dark). */
export function Wordmark({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn('font-brand text-[20px] font-bold tracking-[-0.03em]', className)}>
      <span className={light ? 'text-white' : 'text-ink'}>Learn</span><span className={light ? 'text-[#C9BEFF]' : 'text-violet'}>Signal</span>
    </span>
  );
}

export function Logo({ href = '/', compact, asSpan, className, light }: { href?: string; compact?: boolean; asSpan?: boolean; className?: string; dark?: boolean; light?: boolean }) {
  const inner = <><LogoMark mono={light} className={light ? 'text-white' : undefined} />{!compact && <Wordmark light={light} />}</>;
  if (asSpan) return <span className={cn('inline-flex items-center gap-2', className)}>{inner}</span>;
  return <Link href={href} className={cn('inline-flex items-center gap-2 rounded-lg', className)} aria-label="LearnSignal home">{inner}</Link>;
}

/** Loading mark: tiles pop in bottom-left to top, then the dot drops onto the top step. Static under reduced motion. */
export function LogoLoader({ size = 48, label = 'Loading' }: { size?: number; label?: string }) {
  return (
    <span role="status" className="inline-flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="logo-loader">
        {TILES.map((t, i) => <rect key={i} x={t.x} y={t.y} width="28" height="28" rx="9" fill={t.c} style={{ animationDelay: `${i * 90}ms` }} />)}
        <circle cx="80" cy="20" r="14" fill="#FF7A2F" style={{ animationDelay: `${TILES.length * 90}ms` }} />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
