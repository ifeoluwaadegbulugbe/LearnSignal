'use client';
import { useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Illustration, type IllustrationName } from './illustration';
import { SignalMark } from './signal';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('ls-skeleton h-4', className)} aria-hidden />;
}

export function CardSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('rounded-[18px] border border-line bg-card p-6 shadow-card', className)} aria-hidden>
      <Skeleton className="mb-4 h-5 w-40" />
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={cn('mb-3 h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />)}
    </div>
  );
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line rounded-[18px] border border-line bg-card shadow-card" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-16 items-center gap-3 px-4"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>
      ))}
    </div>
  );
}

export function LadderSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-8 w-16 sm:w-36" /><Skeleton className="h-10 flex-1 rounded-full" /></div>)}
    </div>
  );
}

/** Today-shaped skeleton: header, next step, ladder, two columns. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3"><Skeleton className="h-10 w-72" /><Skeleton className="h-4 w-80" /></div>
        <Skeleton className="h-16 w-full rounded-[14px] sm:w-96" />
      </div>
      <Skeleton className="h-24 rounded-[18px]" />
      <div className="rounded-[18px] border border-line bg-card p-6"><LadderSkeleton /></div>
      <div className="flex items-center gap-2 text-[13px] text-ink-2"><SignalMark level={3} size={20} animate /> Loading…</div>
    </div>
  );
}

export function EmptyState({ illustration = 'empty-results', icon, title, body, action, secondary, className }: {
  illustration?: IllustrationName; icon?: React.ReactNode; title: string; body?: React.ReactNode; action?: React.ReactNode; secondary?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-[18px] border border-line bg-card px-6 py-10 text-center shadow-card', className)}>
      <div className="mb-4 w-40">{icon && !illustration ? icon : <Illustration name={illustration} />}</div>
      <h2 className="font-heading text-[20px] font-semibold leading-7">{title}</h2>
      {body && <p className="mt-1.5 max-w-[48ch] text-[15px] text-ink-2">{body}</p>}
      {(action || secondary) && <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{action}{secondary}</div>}
    </div>
  );
}

export function ErrorPanel({ message, retry, className, details }: { message?: string; retry?: () => void; className?: string; details?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="alert" className={cn('flex flex-col items-start gap-4 rounded-[18px] border border-st-notyet/30 bg-st-notyet-soft p-5 sm:flex-row sm:items-center', className)}>
      <div className="w-16 shrink-0"><Illustration name="error" /></div>
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-st-notyet">{message ?? 'Something went wrong on our side. Your work is safe. Try again.'}</p>
        {details && (
          <button className="mt-1 inline-flex items-center gap-1 text-[12px] text-st-notyet underline" onClick={() => { navigator.clipboard?.writeText(details).then(() => setCopied(true)); }}>
            <Copy className="size-3" aria-hidden /> {copied ? 'Copied' : 'Copy error details'}
          </button>
        )}
      </div>
      {retry && <Button variant="secondary" size="sm" onClick={retry}><RotateCcw className="size-4" aria-hidden /> Try again</Button>}
    </div>
  );
}
