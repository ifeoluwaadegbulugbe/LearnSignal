'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NextStepCard (banner): one rules-based next action. Tangerine tint, a small NEXT STEP tab,
 * one headline, one sentence, one violet button and a quiet "Not now". The logo tiles sit on
 * the right as a 140px illustration (hidden on phones). Dismiss is remembered per id for the session.
 */
export function NextStepCard({ id, sentence, detail, action }: { id: string; sentence: React.ReactNode; detail?: React.ReactNode; action: React.ReactNode; tone?: 'sun' | 'teal' }) {
  const key = `ls-next-${id}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { if (sessionStorage.getItem(key) === '1') setHidden(true); } catch {} }, [key]);
  if (hidden) return null;
  return (
    <section aria-label="Next step" className="fade-up @container/next rounded-[16px] border border-tangerine-line bg-tangerine-tint p-6 @tab:p-8">
      <div className="flex items-center gap-8">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-[8px] bg-tangerine px-2.5 py-1 text-[13px] font-bold uppercase tracking-[.06em] text-on-tangerine">Next step</span>
          <h2 className="mt-4 max-w-[640px] text-[24px] font-bold @min-[600px]/next:text-[30px]">{sentence}</h2>
          {detail && <p className="mt-3 max-w-[600px] text-[16px] text-muted">{detail}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {action}
            <button onClick={() => { setHidden(true); try { sessionStorage.setItem(key, '1'); } catch {} }} className="min-h-11 text-[16px] font-medium text-ink underline underline-offset-4 hover:no-underline">Not now</button>
          </div>
        </div>
        <svg viewBox="0 0 100 100" className="hidden size-[140px] shrink-0 @min-[640px]/next:block" aria-hidden>
          {([[6, 66, '#B9A8FF'], [36, 66, '#8B73F5'], [66, 66, '#5B3FE0'], [36, 36, '#8B73F5'], [66, 36, '#5B3FE0']] as const).map(([x, y, c], i) => <rect key={i} x={x} y={y} width="28" height="28" rx="9" fill={c} />)}
          <circle cx="80" cy="20" r="14" fill="#FF7A2F" />
        </svg>
      </div>
    </section>
  );
}

export function WorkRow({ leading, title, subline, trailing, href, onClick, chevron = true }: {
  leading?: React.ReactNode; title: React.ReactNode; subline?: React.ReactNode; trailing?: React.ReactNode; href?: string; onClick?: () => void; chevron?: boolean;
}) {
  const inner = (
    <>
      {leading}
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[15px] font-semibold">{title}</div>
        {subline && <div className="truncate text-[13px] text-ink-2">{subline}</div>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      {chevron && (href || onClick) && <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />}
    </>
  );
  const cls = 'flex min-h-16 w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/70';
  return (
    <li className="list-none">
      {href ? <Link href={href} className={cls}>{inner}</Link> : onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>}
    </li>
  );
}
export function WorkList({ children, label, className }: { children: React.ReactNode; label?: string; className?: string }) {
  return <ul aria-label={label} className={cn('divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-surface shadow-card', className)}>{children}</ul>;
}

/** Timeline: vertical line with round nodes. */
export function Timeline({ items, empty }: { items: { id: string; title: React.ReactNode; meta?: React.ReactNode; href?: string; tone?: 'teal' | 'sun' | 'leaf' | 'sky' | 'stone' }[]; empty?: string }) {
  if (!items.length) return <p className="text-[14px] text-ink-2">{empty ?? 'Nothing yet.'}</p>;
  const dot = { teal: 'bg-violet', sun: 'bg-tangerine', leaf: 'bg-[var(--st-consistent)]', sky: 'bg-sky', stone: 'bg-slate' };
  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:rounded-full before:bg-line">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span className={cn('absolute -left-6 top-1.5 size-4 rounded-full border-[3px] border-surface', dot[it.tone ?? 'teal'])} aria-hidden />
          {it.href ? <Link href={it.href} className="text-[14px] font-medium hover:underline">{it.title}</Link> : <span className="text-[14px] font-medium">{it.title}</span>}
          {it.meta && <div className="text-[12px] text-ink-2">{it.meta}</div>}
        </li>
      ))}
    </ol>
  );
}

export function AiBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-0.5 text-[12px] font-semibold text-sky-ink"><Sparkles className="size-3" aria-hidden /> AI-drafted</span>;
}
export function ValidatedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-st-consistent-soft px-2.5 py-0.5 text-[12px] font-semibold text-st-consistent"><ShieldCheck className="size-3" aria-hidden /> Validated</span>;
}
