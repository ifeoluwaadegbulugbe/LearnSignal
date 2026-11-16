'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type TabItem = { id: string; label: string; count?: number; href?: string };

/** Pill filter tabs: active = ink background, white text. Scrolls horizontally on mobile. */
export function FilterTabs({ items, value, onChange, label }: { items: TabItem[]; value: string; onChange?: (id: string) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar fade-x -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {items.map((t) => {
        const on = t.id === value;
        const cls = cn('inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors',
          on ? 'bg-ink text-surface' : 'border border-line bg-surface text-ink hover:bg-surface-2');
        const inner = <>{t.label}{t.count !== undefined && <span className={cn('rounded-full px-1.5 text-[11px] tabular', on ? 'bg-surface/20' : 'bg-surface-2 text-ink-2')}>{t.count}</span>}</>;
        return t.href
          ? <Link key={t.id} href={t.href} role="tab" aria-selected={on} className={cls}>{inner}</Link>
          : <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange?.(t.id)} className={cls}>{inner}</button>;
      })}
    </div>
  );
}

/** Underline tabs for in-page sections. */
export function UnderlineTabs({ items, value, onChange, label }: { items: TabItem[]; value: string; onChange: (id: string) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-1 flex gap-6 overflow-x-auto border-b border-line px-1">
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={on} aria-controls={`panel-${t.id}`} onClick={() => onChange(t.id)}
            className={cn('relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-[14px] font-semibold transition-colors',
              on ? 'border-primary text-ink' : 'border-transparent text-ink-2 hover:text-ink')}>
            {t.label}
            {t.count !== undefined && <span className="rounded-md bg-surface-2 px-1.5 text-[11px] text-ink-2 tabular">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Segmented control (radio group styling). */
export function Segmented({ options, value, onChange, label, name }: { options: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string; name: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-[12px] border border-line-strong bg-surface-2 p-1 sm:w-auto">
      {options.map((o) => (
        <label key={o.id} className={cn('flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-[9px] px-3 text-[13px] font-semibold transition-colors sm:flex-none',
          value === o.id ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink')}>
          <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-primary' : 'bg-line-strong')}>
      <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}
