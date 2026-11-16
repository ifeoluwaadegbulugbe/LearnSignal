'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Learner code in a subtle monospace chip with a copy button. */
export function CodeChip({ code, copy = true }: { code: string; copy?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 py-0.5 pl-1.5 pr-0.5 font-mono text-[12px] text-ink-2">
      {code}
      {copy && (
        <button type="button" aria-label={`Copy code ${code}`} className="rounded p-0.5 hover:bg-line"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard?.writeText(code).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}>
          {done ? <Check className="size-3 text-st-consistent" aria-hidden /> : <Copy className="size-3" aria-hidden />}
        </button>
      )}
    </span>
  );
}
