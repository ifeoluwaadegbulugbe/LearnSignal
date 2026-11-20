import { forwardRef } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, FlaskConical, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTile, type Hue } from './icon-tile';

const TINT = { plain: 'bg-surface', teal: 'bg-violet-soft', violet: 'bg-violet-soft', sun: 'bg-tangerine-soft', tangerine: 'bg-tangerine-soft', sky: 'bg-sky-soft', clay: 'bg-rose-soft', leaf: 'bg-aqua-soft', aqua: 'bg-aqua-soft' } as const;
export type CardTint = keyof typeof TINT;
const LABEL_TONE = {
  teal: 'bg-violet-soft text-violet-deep dark:text-violet', sun: 'bg-tangerine-soft text-tangerine-ink', sky: 'bg-sky-soft text-sky-ink',
  clay: 'bg-rose-soft text-ink-2', stone: 'bg-surface-2 text-ink-2', violet: 'bg-violet-soft text-violet-deep dark:text-violet', tangerine: 'bg-tangerine-soft text-tangerine-ink', aqua: 'bg-aqua-soft text-aqua-ink',
} as const;

/**
 * Card (Daylight). White, 20px radius, hairline + soft shadow. Optional small `tab` label (an eyebrow pill, not a folded tab),
 * optional SkillArt band via `art`, tints, and hover lift. `ruled`/`margin` are accepted for older call sites and ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ruled/margin are accepted for older call sites and ignored
export function IndexCard({ tab, tabTone = 'teal', tint = 'plain', art, interactive, className, children, ruled: _r, margin: _m, ...p }: React.HTMLAttributes<HTMLDivElement> & {
  tab?: string; tabTone?: keyof typeof LABEL_TONE; tint?: CardTint; ruled?: boolean; margin?: boolean; interactive?: boolean; art?: React.ReactNode;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-[20px] border border-line shadow-card', TINT[tint], interactive && 'lift', className)} {...p}>
      {art}
      <div className="relative h-full p-5 sm:p-6">
        {tab && <span className={cn('mb-3 inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold', LABEL_TONE[tabTone])}>{tab}</span>}
        {children}
      </div>
    </div>
  );
}
/** Plain card. */
export function Card({ className, children, interactive, ...p }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn('rounded-[20px] border border-line bg-surface p-5 shadow-card sm:p-6', interactive && 'lift', className)} {...p}>{children}</div>;
}

/** Soft aurora wash behind a page header (full-bleed, decorative). */
export function AuroraBackdrop({ className }: { className?: string }) {
  return <div aria-hidden className={cn('pointer-events-none absolute left-1/2 top-0 -z-10 h-[320px] w-screen -translate-x-1/2 bg-aurora', className)} />;
}

/** Retired notebook motif: renders its text plainly. */
export function ChalkUnderline({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** MetaRow: small label over value pairs, separated by hairlines; wraps on phones. */
export function MetaRow({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-5 gap-y-2', className)}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-[12px] font-medium text-ink-2">{it.label}</dt>
          <dd className="truncate text-[14px] font-semibold tabular">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** SummaryTiles: tinted metric tiles with a big Sora number, a label and a tiny corner glyph. */
export function SummaryTiles({ items }: { items: { label: string; value: React.ReactNode; tone: 'violet' | 'aqua' | 'tangerine'; glyph?: 'dots' | 'check' | 'eye' }[] }) {
  const tone = { violet: 'bg-violet-soft text-violet-deep dark:text-violet', aqua: 'bg-aqua-soft text-aqua-ink', tangerine: 'bg-tangerine-soft text-tangerine-ink' };
  const G = { dots: <g fill="currentColor"><circle cx="5" cy="5" r="2.5" /><circle cx="13" cy="5" r="2.5" /><circle cx="5" cy="13" r="2.5" /><circle cx="13" cy="13" r="2.5" /></g>,
    check: <path d="M3 9l4 4 8-9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    eye: <g fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" /><circle cx="9" cy="9" r="2.5" /></g> };
  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {items.map((it, i) => (
        <div key={it.label} className={cn('relative min-w-[140px] flex-1 rounded-[16px] px-4 py-3', tone[it.tone])}>
          <svg viewBox="0 0 18 18" className="absolute right-3 top-3 size-[18px] opacity-70" aria-hidden>{G[it.glyph ?? (['dots', 'check', 'eye'] as const)[i % 3]]}</svg>
          <div className="text-[12px] font-medium opacity-90">{it.label}</div>
          <div className="font-heading text-[32px] font-bold leading-10 tracking-[-0.02em] tabular text-ink">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow, display }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; display?: boolean }) {
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-[13px] font-medium text-ink-2">{eyebrow}</div>}
        <h1 className={cn('font-heading font-bold text-ink tracking-[-0.02em]', display ? 'text-[30px] leading-[38px] tracking-[-0.03em] sm:text-[42px] sm:leading-[50px]' : 'text-[24px] leading-8 sm:text-[30px] sm:leading-[38px]')}>{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 text-ink-3" aria-hidden />}
            {it.href ? <Link href={it.href} className="hover:text-ink hover:underline">{it.label}</Link> : <span aria-current="page" className="font-medium text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeader({ title, info, href, linkLabel = 'See all', action, id }: { title: string; info?: string; href?: string; linkLabel?: string; action?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-1.5 font-heading text-[20px] font-semibold leading-7">
        {title}
        {info && <Tooltip text={info}><Info className="size-4 text-ink-3" aria-label={info} /></Tooltip>}
      </h2>
      {href ? <Link href={href} className="text-[13px] font-semibold text-violet-deep underline-offset-4 hover:underline dark:text-violet">{linkLabel}</Link> : action}
    </div>
  );
}

export function Tooltip({ text, children, side = 'top' }: { text: string; children: React.ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span role="tooltip" className={cn('pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-[10px] bg-ink px-2.5 py-1.5 text-[12px] font-medium leading-4 text-paper opacity-0 shadow-pop transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
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
      {error && <p id={`${htmlFor}-error`} className="flex items-center gap-1 text-[12px] font-medium leading-4 text-st-notyet" role="alert"><AlertCircle className="size-3.5 shrink-0" aria-hidden />{error}</p>}
    </div>
  );
}

const inputBase = 'w-full rounded-[12px] border border-line-strong bg-surface px-3.5 min-h-11 text-[15px] text-ink placeholder:text-ink-3 transition-shadow aria-[invalid=true]:border-st-notyet disabled:opacity-60';
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} aria-describedby={p.id ? (invalid ? `${p.id}-error` : `${p.id}-hint`) : undefined} className={cn(inputBase, className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...p }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} aria-describedby={p.id ? (invalid ? `${p.id}-error` : `${p.id}-hint`) : undefined} className={cn(inputBase, 'min-h-24 py-2.5', className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ className, invalid, children, ...p }, ref) {
  return <select ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, 'pr-8', className)} {...p}>{children}</select>;
});

export function Badge({ className, children, tone = 'neutral' }: { className?: string; children: React.ReactNode; tone?: 'neutral' | 'primary' | 'accent' | 'sky' | 'mint' | 'dark' | 'sun' | 'teal' | 'sunshine' }) {
  const tones = {
    neutral: 'bg-paper-2 text-ink-2 border border-line', primary: 'bg-violet-soft text-violet-deep dark:text-violet', teal: 'bg-violet-soft text-violet-deep dark:text-violet',
    accent: 'bg-st-notyet-soft text-st-notyet', sky: 'bg-sky-soft text-sky-ink', mint: 'bg-leaf-soft text-st-consistent', dark: 'bg-ink text-paper', sun: 'bg-tangerine-soft text-tangerine-ink', sunshine: 'bg-sunshine-soft text-sunshine-ink',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold leading-5', tones[tone], className)}>{children}</span>;
}

/** Older call sites: renders as SummaryTiles. */
export function SummaryStrip({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return <SummaryTiles items={items.map((it, i) => ({ ...it, tone: (['violet', 'aqua', 'tangerine'] as const)[i % 3] }))} />;
}

/** Kept for older call sites: a quiet figure card. */
export function StatChip({ icon, hue = 'teal', value, label }: { icon: LucideIcon; hue?: Hue; value: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-[132px] shrink-0 items-center gap-3 rounded-[14px] border border-line bg-card px-3.5 py-2.5">
      <IconTile icon={icon} hue={hue} size={32} />
      <div><div className="font-heading text-[18px] font-bold leading-6 tabular">{value}</div><div className="text-[12px] leading-4 text-ink-2">{label}</div></div>
    </div>
  );
}
export function Stat({ label, value, sub, icon, hue = 'stone' }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: LucideIcon; hue?: Hue }) {
  return (
    <Card className="flex items-center gap-4 p-5 sm:p-5">
      {icon && <IconTile icon={icon} hue={hue} size={48} />}
      <div className="min-w-0">
        <div className="font-heading text-[36px] font-bold leading-10 tracking-[-0.02em] tabular">{value}</div>
        <div className="text-[13px] text-ink-2">{label}</div>
        {sub && <div className="text-[12px] text-ink-3">{sub}</div>}
      </div>
    </Card>
  );
}

export function SampleDataBadge({ className }: { className?: string }) {
  return (
    <Tooltip text="These are synthetic learners created for the demo, not real children.">
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-sunshine-soft px-2.5 py-1 text-[12px] font-semibold text-sunshine-ink', className)}>
        <FlaskConical className="size-3.5" aria-hidden /> Illustrative sample data
      </span>
    </Tooltip>
  );
}
export const SampleDataBanner = ({ className }: { className?: string }) => <div className={cn('mb-2', className)}><SampleDataBadge /></div>;

export function NotADiagnosis() {
  return <p className="mt-10 border-t border-line pt-4 text-[13px] text-ink-2">This shows which skills a child has demonstrated so far. It is not a diagnosis.</p>;
}
export const InlineNote = NotADiagnosis;

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-medium tracking-[.02em] text-ink-2">{label}</dt>
      <dd className="mt-0.5 truncate text-[15px] font-semibold">{children}</dd>
    </div>
  );
}

export const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-paper-2 px-1.5 font-mono text-[11px] text-ink-2">{children}</kbd>
);

export function LinearProgress({ value, label }: { value: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-paper-2">
      <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
