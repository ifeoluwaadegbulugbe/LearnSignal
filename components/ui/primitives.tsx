import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[14px] border border-line bg-surface p-4 sm:p-5', className)} {...p}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-sm text-muted">{eyebrow}</div>}
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="text-[13px] text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} className="text-[13px] font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

const inputBase = 'w-full rounded-xl border border-line bg-white px-3.5 min-h-11 text-[15px] placeholder:text-muted/70 aria-[invalid=true]:border-danger';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} aria-describedby={invalid && p.id ? `${p.id}-error` : undefined} className={cn(inputBase, className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...p }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, 'py-2.5 min-h-24', className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ className, invalid, children, ...p }, ref) {
  return <select ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, 'pr-8', className)} {...p}>{children}</select>;
});

export function Badge({ className, children, tone = 'neutral' }: { className?: string; children: React.ReactNode; tone?: 'neutral' | 'primary' | 'accent' | 'sky' }) {
  const tones = { neutral: 'bg-st-insufficient-soft text-ink', primary: 'bg-primary-soft text-primary-dark', accent: 'bg-accent-soft text-[#7A4E0C]', sky: 'bg-sky-soft text-[#1F5C91]' };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold', tones[tone], className)}>{children}</span>;
}

export function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card className="flex items-start gap-3">
      {icon && <div className="rounded-xl bg-primary-soft p-2.5 text-primary">{icon}</div>}
      <div>
        <div className="text-sm text-muted">{label}</div>
        <div className="text-[28px] font-bold leading-tight">{value}</div>
        {sub && <div className="text-[13px] text-muted">{sub}</div>}
      </div>
    </Card>
  );
}

export function SampleDataBanner({ className }: { className?: string }) {
  return (
    <div role="note" className={cn('rounded-xl border border-accent/50 bg-accent-soft px-3 py-2 text-[13px] font-medium text-[#7A4E0C]', className)}>
      Illustrative sample data — these are synthetic learners, not real children.
    </div>
  );
}

export function NotADiagnosis() {
  return <p className="mt-6 text-[13px] text-muted">This shows which skills a child has demonstrated so far. It is not a diagnosis.</p>;
}
