'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IndexCard } from './primitives';

/** NextStepCard: one rules-based next action. Used instead of banners. Dismiss is remembered per id. */
export function NextStepCard({ id, sentence, detail, action, tone = 'sun' }: { id: string; sentence: React.ReactNode; detail?: React.ReactNode; action: React.ReactNode; tone?: 'sun' | 'teal' }) {
  const key = `ls-next-${id}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { if (sessionStorage.getItem(key) === '1') setHidden(true); } catch {} }, [key]);
  if (hidden) return null;
  return (
    <IndexCard tab="Next step" tabTone={tone === 'sun' ? 'sun' : 'teal'} tint={tone === 'sun' ? 'sun' : 'teal'} className="fade-up border-transparent">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-[20px] font-semibold leading-7">{sentence}</p>
          {detail && <p className="mt-1 text-[14px] text-ink-2">{detail}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {action}
          <button onClick={() => { setHidden(true); try { sessionStorage.setItem(key, '1'); } catch {} }} className="text-[13px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink">Not now</button>
        </div>
      </div>
    </IndexCard>
  );
}

/** WorkRow: compact 64px list row (learners, groups, sets). */
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
  const cls = 'flex min-h-16 w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper-2/60';
  return (
    <li className="list-none">
      {href ? <Link href={href} className={cls}>{inner}</Link> : onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>}
    </li>
  );
}
export function WorkList({ children, label, className }: { children: React.ReactNode; label?: string; className?: string }) {
  return <ul aria-label={label} className={cn('divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-card shadow-card', className)}>{children}</ul>;
}

/** Timeline: vertical line with round nodes. */
export function Timeline({ items, empty }: { items: { id: string; title: React.ReactNode; meta?: React.ReactNode; href?: string; tone?: 'teal' | 'sun' | 'leaf' | 'sky' | 'stone' }[]; empty?: string }) {
  if (!items.length) return <p className="text-[14px] text-ink-2">{empty ?? 'Nothing yet.'}</p>;
  const dot = { teal: 'bg-teal', sun: 'bg-sun', leaf: 'bg-[var(--st-consistent)]', sky: 'bg-sky', stone: 'bg-stone' };
  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:rounded-full before:bg-line">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span className={cn('absolute -left-6 top-1.5 size-4 rounded-full border-[3px] border-card', dot[it.tone ?? 'teal'])} aria-hidden />
          {it.href ? <Link href={it.href} className="text-[14px] font-medium hover:underline">{it.title}</Link> : <span className="text-[14px] font-medium">{it.title}</span>}
          {it.meta && <div className="text-[12px] text-ink-2">{it.meta}</div>}
        </li>
      ))}
    </ol>
  );
}

export function AiBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-0.5 text-[12px] font-semibold text-sky"><Sparkles className="size-3" aria-hidden /> AI-drafted</span>;
}
export function ValidatedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-0.5 text-[12px] font-semibold text-st-consistent"><ShieldCheck className="size-3" aria-hidden /> Validated</span>;
}
