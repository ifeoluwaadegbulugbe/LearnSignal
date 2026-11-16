import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Signal-arc mark in teal on a paper tile. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--teal)" />
      <circle cx="16" cy="23" r="2.2" fill="var(--sun)" />
      <g fill="none" stroke="#FBF8F2" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12.2 19.6a5.2 5.2 0 0 1 7.6 0" /><path d="M9 16.2a9.8 9.8 0 0 1 14 0" /><path d="M5.8 12.8a14.4 14.4 0 0 1 20.4 0" />
      </g>
    </svg>
  );
}

export function Logo({ href = '/', compact, asSpan, className }: { href?: string; compact?: boolean; asSpan?: boolean; className?: string; dark?: boolean }) {
  const inner = <><LogoMark />{!compact && <span className="font-heading text-[18px] font-bold tracking-tight text-ink">LearnSignal</span>}</>;
  if (asSpan) return <span className={cn('inline-flex items-center gap-2', className)}>{inner}</span>;
  return <Link href={href} className={cn('inline-flex items-center gap-2 rounded-lg', className)} aria-label="LearnSignal home">{inner}</Link>;
}
