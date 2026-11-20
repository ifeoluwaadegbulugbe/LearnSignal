'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Accessible accordion: real buttons with aria-expanded and aria-controls. */
export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-line rounded-[16px] border border-line bg-surface shadow-card">
      {items.map(([q, a], i) => {
        const on = open === i;
        return (
          <div key={q}>
            <h3>
              <button id={`faq-q-${i}`} aria-expanded={on} aria-controls={`faq-a-${i}`} onClick={() => setOpen(on ? null : i)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-6 text-left text-[16px] font-semibold">
                {q}<Plus className={cn('size-5 shrink-0 text-violet-700 transition-transform duration-200', on && 'rotate-45')} aria-hidden />
              </button>
            </h3>
            <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!on} className="px-6 pb-5 text-[16px] text-muted">{a}</div>
          </div>
        );
      })}
    </div>
  );
}
