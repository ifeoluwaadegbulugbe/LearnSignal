import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Signal-arc mark in a violet rounded square, with a tangerine signal dot. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" aria-hidden>
      <defs><linearGradient id="ls-mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6C52F0" /><stop offset="1" stopColor="#4A2FD0" /></linearGradient></defs>
      <rect width="32" height="32" rx="10" fill="url(#ls-mark)" />
      <circle cx="16" cy="23" r="2.4" fill="#FF7A2F" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12.2 19.6a5.2 5.2 0 0 1 7.6 0" /><path d="M9 16.2a9.8 9.8 0 0 1 14 0" /><path d="M5.8 12.8a14.4 14.4 0 0 1 20.4 0" />
      </g>
    </svg>
  );
}

export function Logo({ href = '/', compact, asSpan, className, light }: { href?: string; compact?: boolean; asSpan?: boolean; className?: string; dark?: boolean; light?: boolean }) {
  const inner = <><LogoMark />{!compact && <span className={cn('font-heading text-[18px] font-bold tracking-[-0.02em]', light ? 'text-white' : 'text-ink')}>LearnSignal</span>}</>;
  if (asSpan) return <span className={cn('inline-flex items-center gap-2', className)}>{inner}</span>;
  return <Link href={href} className={cn('inline-flex items-center gap-2 rounded-lg', className)} aria-label="LearnSignal home">{inner}</Link>;
}
