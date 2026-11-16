'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Accessible modal built on the native <dialog> (focus trap + Esc handled by the browser). */
export function Dialog({ open, onClose, title, children, className, side }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string; side?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="dlg-title"
      className={cn('m-auto w-[calc(100%-2rem)] max-w-lg rounded-[14px] border border-line bg-white p-0 text-ink',
        side && 'mr-0 h-dvh max-h-dvh max-w-md rounded-none sm:rounded-l-[14px]', className)}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="dlg-title" className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-bg"><X className="size-5" /></button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
