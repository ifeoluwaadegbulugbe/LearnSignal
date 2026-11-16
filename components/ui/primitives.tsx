import { forwardRef } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, FlaskConical, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTile, type Hue } from './icon-tile';

export function Card({ className, children, interactive, ...p }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn('rounded-[20px] border border-line bg-surface p-5 shadow-card sm:p-6', interactive && 'lift', className)} {...p}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, eyebrow, display }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; display?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-[13px] font-medium text-ink-2">{eyebrow}</div>}
        <h1 className={cn('font-bold text-ink', display ? 'text-[28px] leading-9 tracking-[-0.02em] sm:text-[40px] sm:leading-[48px]' : 'text-[24px] leading-8 tracking-[-0.01em] sm:text-[28px] sm:leading-9')}>{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] leading-[22px] text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, info, href, linkLabel = 'View all', action, id }: { title: string; info?: string; href?: string; linkLabel?: string; action?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-1.5 text-[18px] font-semibold leading-[26px]">
        {title}
        {info && <Tooltip text={info}><Info className="size-4 text-ink-3" aria-label={info} /></Tooltip>}
      </h2>
      {href ? <Link href={href} className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline">{linkLabel}</Link> : action}
    </div>
  );
}

export function Tooltip({ text, children, side = 'top' }: { text: string; children: React.ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span role="tooltip" className={cn('pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium leading-4 text-surface opacity-0 shadow-pop transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
        side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2')}>{text}</span>
    </span>
  );
}

export function Field({ label, htmlFor, error, hint, children, counter }: { label: string; htmlFor: string; error?: string; hint?: React.ReactNode; children: React.ReactNode; counter?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="block text-[14px] font-semibold">{label}</label>
        {counter && <span className="text-[12px] tabular text-ink-3">{counter}</span>}
      </div>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="text-[12px] leading-4 text-ink-2">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} className="flex items-center gap-1 text-[12px] font-medium leading-4 text-amber-ink" role="alert"><AlertCircle className="size-3.5 shrink-0" aria-hidden />{error}</p>}
    </div>
  );
}

const inputBase = 'w-full rounded-[12px] border border-line-strong bg-surface px-3.5 min-h-11 text-[14px] text-ink placeholder:text-ink-3 transition-shadow aria-[invalid=true]:border-st-notyet disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} aria-describedby={p.id ? (invalid ? `${p.id}-error` : `${p.id}-hint`) : undefined} className={cn(inputBase, className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...p }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} aria-describedby={p.id ? (invalid ? `${p.id}-error` : `${p.id}-hint`) : undefined} className={cn(inputBase, 'min-h-24 py-2.5', className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ className, invalid, children, ...p }, ref) {
  return <select ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, 'pr-8', className)} {...p}>{children}</select>;
});

export function Badge({ className, children, tone = 'neutral' }: { className?: string; children: React.ReactNode; tone?: 'neutral' | 'primary' | 'accent' | 'sky' | 'mint' | 'dark' }) {
  const tones = {
    neutral: 'bg-surface-2 text-ink-2 border border-line',
    primary: 'bg-primary-soft text-primary-ink',
    accent: 'bg-amber-bg text-amber-ink',
    sky: 'bg-st-developing-soft text-st-developing',
    mint: 'bg-mint-bg text-mint-ink',
    dark: 'bg-ink text-surface',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold leading-5', tones[tone], className)}>{children}</span>;
}

/** Small stat chip (icon tile + number + caption). */
export function StatChip({ icon, hue = 'indigo', value, label }: { icon: LucideIcon; hue?: Hue; value: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-[132px] shrink-0 items-center gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-2.5 shadow-card">
      <IconTile icon={icon} hue={hue} size={32} />
      <div>
        <div className="text-[18px] font-bold leading-6 tabular">{value}</div>
        <div className="text-[12px] leading-4 text-ink-2">{label}</div>
      </div>
    </div>
  );
}

/** Large stat card (icon + big number + label), used in right rails. */
export function Stat({ label, value, sub, icon, hue = 'grey' }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: LucideIcon; hue?: Hue }) {
  return (
    <Card className="flex items-center gap-4 p-5 sm:p-5">
      {icon && <IconTile icon={icon} hue={hue} size={56} className="rounded-full" />}
      <div className="min-w-0">
        <div className="text-[32px] font-bold leading-9 tracking-[-0.02em] tabular">{value}</div>
        <div className="text-[13px] text-ink-2">{label}</div>
        {sub && <div className="text-[12px] text-ink-3">{sub}</div>}
      </div>
    </Card>
  );
}

export function SampleDataBadge({ className }: { className?: string }) {
  return (
    <Tooltip text="These are synthetic learners created for the demo, not real children.">
      <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-st-notyet/30 bg-amber-bg px-2.5 py-1 text-[12px] font-semibold text-amber-ink', className)}>
        <FlaskConical className="size-3.5" aria-hidden /> Illustrative sample data
      </span>
    </Tooltip>
  );
}
/** Back-compat: older screens render a banner; it is now the badge. */
export const SampleDataBanner = ({ className }: { className?: string }) => <div className={cn('mb-1', className)}><SampleDataBadge /></div>;

export function NotADiagnosis() {
  return <p className="mt-8 border-t border-line pt-4 text-[12px] text-ink-3">This shows which skills a child has demonstrated so far. It is not a diagnosis.</p>;
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] font-medium leading-4 text-ink-3">{label}</div>
      <div className="mt-1 truncate text-[14px] font-semibold">{children}</div>
    </div>
  );
}

export const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-surface-2 px-1.5 font-mono text-[11px] font-semibold text-ink-2">{children}</kbd>
);

export function LinkArrow({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">{children}<ArrowRight className="size-4" aria-hidden /></Link>;
}

export function LinearProgress({ value, label }: { value: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
