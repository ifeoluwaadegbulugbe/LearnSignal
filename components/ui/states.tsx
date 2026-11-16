'use client';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('ls-skeleton h-4', className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-8 w-60" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon?: React.ReactNode; title: string; body?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-[14px] border border-dashed border-line bg-surface px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 rounded-full bg-primary-soft p-3 text-primary">{icon}</div>}
      <h2 className="text-lg font-bold">{title}</h2>
      {body && <p className="mt-1 max-w-md text-[15px] text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorPanel({ message, retry, className }: { message: string; retry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3 rounded-[14px] border border-danger/30 bg-white p-5 sm:flex-row sm:items-center', className)}>
      <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
      <p className="flex-1 text-[15px]">{message}</p>
      {retry && <Button variant="secondary" size="sm" onClick={retry}><RotateCcw className="size-4" aria-hidden /> Retry</Button>}
    </div>
  );
}
