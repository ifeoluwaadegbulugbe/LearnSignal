import { forwardRef } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, FlaskConical, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconTile, type Hue } from './icon-tile';

const TINT = { plain: 'bg-surface', teal: 'bg-violet-soft', violet: 'bg-violet-soft', sun: 'bg-tangerine-soft', tangerine: 'bg-tangerine-soft', sky: 'bg-sky-soft', clay: 'bg-rose-soft', leaf: 'bg-aqua-soft', aqua: 'bg-aqua-soft' } as const;
export type CardTint = keyof typeof TINT;
const LABEL_TONE = {
  teal: 'bg-violet-soft text-violet-deep', sun: 'bg-tangerine-soft text-tangerine-ink', sky: 'bg-sky-soft text-sky-ink',
  clay: 'bg-rose-soft text-ink-2', stone: 'bg-surface-2 text-ink-2', violet: 'bg-violet-soft text-violet-deep', tangerine: 'bg-tangerine-soft text-tangerine-ink', aqua: 'bg-aqua-soft text-aqua-ink',
} as const;

/**
 * Card (Daylight). White, 20px radius, hairline + soft shadow. Optional small `tab` label (an eyebrow pill, not a folded tab),
 * optional SkillArt band via `art`, tints, and hover lift. `ruled`/`margin` are accepted for older call sites and ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- margin is accepted for older call sites and ignored
export function IndexCard({ tab, tabTone = 'teal', tint = 'plain', art, interactive, className, children, ruled, margin: _m, ...p }: React.HTMLAttributes<HTMLDivElement> & {
  tab?: string; tabTone?: keyof typeof LABEL_TONE; tint?: CardTint; ruled?: boolean; margin?: boolean; interactive?: boolean; art?: React.ReactNode;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-[16px] border border-line shadow-card', TINT[tint], interactive && 'lift', className)} {...p}>
      {art}
      <div className={cn('relative h-full p-5 sm:p-6', ruled && 'ruled')}>
        {tab && <span className={cn('mb-3 inline-flex h-5 items-center rounded-[6px] px-2 text-[11px] font-semibold uppercase tracking-[.06em]', LABEL_TONE[tabTone])}>{tab}</span>}
        {children}
      </div>
    </div>
  );
}
/** Plain card. */
export function Card({ className, children, interactive, ...p }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn('rounded-[16px] border border-line bg-surface p-5 shadow-card sm:p-6', interactive && 'lift', className)} {...p}>{children}</div>;
}

/** Soft aurora wash behind a page header (full-bleed, decorative). */
export function AuroraBackdrop({ className }: { className?: string }) {
  return <div aria-hidden className={cn('pointer-events-none absolute -inset-x-4 top-0 -z-10 h-[280px] bg-aurora sm:-inset-x-6 lg:-inset-x-10', className)} />;
}

/** Signature hand-drawn underline under ONE word per screen (violet or tangerine). */
export function ChalkUnderline({ children, tone = 'violet' }: { children: React.ReactNode; tone?: 'violet' | 'tangerine' }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg aria-hidden viewBox="0 0 120 12" preserveAspectRatio="none" className={cn('pointer-events-none absolute -bottom-1.5 left-0 h-[0.32em] w-full', tone === 'tangerine' ? 'text-tangerine' : 'text-violet')}>
        <path d="M2 8.5C22 4.5 46 3 70 4.2c17 .8 32 2.2 48 4.3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" className="ring-draw" style={{ ['--len' as string]: '130', strokeDasharray: 130 }} />
      </svg>
    </span>
  );
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

/** SummaryTiles (MetricCards): white cards, a big tabular number, a label and a small tinted icon chip. */
type Tone = 'violet' | 'aqua' | 'tangerine' | 'sky';
type Glyph = 'dots' | 'check' | 'eye' | 'star';
const GLYPHS: Record<Glyph, React.ReactNode> = {
  dots: <g fill="currentColor"><circle cx="5" cy="5" r="2.5" /><circle cx="13" cy="5" r="2.5" /><circle cx="5" cy="13" r="2.5" /><circle cx="13" cy="13" r="2.5" /></g>,
  check: <path d="M3 9l4 4 8-9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  eye: <g fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" /><circle cx="9" cy="9" r="2.5" /></g>,
  star: <g fill="currentColor"><rect x="1" y="11" width="6" height="6" rx="2" /><rect x="6" y="6" width="6" height="6" rx="2" opacity=".7" /><circle cx="14" cy="4" r="3" /></g>,
};
export function SummaryTiles({ items }: { items: { label: string; value: React.ReactNode; tone: Tone; glyph?: Glyph; hint?: React.ReactNode }[] }) {
  const tone: Record<Tone, string> = { violet: 'bg-violet-soft text-violet-deep', aqua: 'bg-aqua-soft text-aqua-ink', tangerine: 'bg-tangerine-soft text-tangerine-ink', sky: 'bg-sky-soft text-sky-ink' };
  return (
    <div className={cn('grid gap-3', items.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3')}>
      {items.map((it, i) => (
        <div key={it.label} className="rounded-[16px] border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-ink-2">{it.label}</span>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-[10px]', tone[it.tone])}>
              <svg viewBox="0 0 18 18" className="size-4" aria-hidden>{GLYPHS[it.glyph ?? (['dots', 'check', 'eye', 'star'] as const)[i % 4]]}</svg>
            </span>
          </div>
          <div className="mt-1 font-heading text-[30px] font-bold leading-9 tabular sm:text-[32px]">{it.value}</div>
          {it.hint && <div className="mt-0.5 text-[12px] text-ink-2">{it.hint}</div>}
        </div>
      ))}
    </div>
  );
}

/** StatStrip: one card, up to four figures separated by hairlines; each has a number, a line and a thin violet bar. */
export function StatStrip({ items }: { items: { label: string; value: React.ReactNode; sub?: React.ReactNode; pct?: number }[] }) {
  return (
    <div className="@container/strip overflow-hidden rounded-[16px] border border-line bg-surface shadow-card">
      <dl className="grid grid-cols-2 gap-px bg-line @min-[880px]/strip:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="bg-surface p-5 @min-[500px]/strip:p-6">
            <dt className="text-[15px] text-muted">{it.label}</dt>
            <dd className="mt-1 font-heading text-[28px] font-bold leading-tight tabular @min-[500px]/strip:text-[32px]">{it.value}</dd>
            {it.sub && <dd className="mt-1 text-[14px] text-muted">{it.sub}</dd>}
            {it.pct !== undefined && (
              <dd className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100" aria-hidden>
                <span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(100, it.pct))}%` }} />
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; display?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-[14px] font-medium text-muted">{eyebrow}</div>}
        <h1 className="text-[28px] font-bold text-ink sm:text-[36px]">{title}</h1>
        {subtitle && <p className="mt-2 text-[16px] text-muted">{subtitle}</p>}
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
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-1.5 text-[20px] font-bold">
        {title}
        {info && <Tooltip text={info}><Info className="size-4 text-ink-3" aria-label={info} /></Tooltip>}
      </h2>
      {href ? <Link href={href} className="text-[15px] font-medium text-violet-700 underline underline-offset-4 hover:no-underline">{linkLabel}</Link> : action}
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
    neutral: 'bg-paper-2 text-ink-2 border border-line', primary: 'bg-violet-soft text-violet-deep', teal: 'bg-violet-soft text-violet-deep',
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
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[13px] font-medium text-violet-700', className)}>
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
