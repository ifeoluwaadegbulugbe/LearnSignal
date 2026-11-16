'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Native <dialog> (focus trap + Esc by the browser). Centred card on desktop, bottom sheet on mobile.
 * `side` renders a right-hand drawer on desktop (still a bottom sheet on mobile).
 */
export function Dialog({ open, onClose, title, description, children, className, side }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; className?: string; side?: boolean;
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
      className={cn(
        'max-h-[92dvh] w-full max-w-none border border-line bg-surface p-0 text-ink shadow-pop',
        // mobile: bottom sheet
        'mb-0 mt-auto rounded-t-[24px]',
        // desktop
        side
          ? 'sm:my-0 sm:ml-auto sm:mr-0 sm:h-dvh sm:max-h-dvh sm:w-[440px] sm:rounded-none sm:rounded-l-[24px]'
          : 'sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-lg sm:rounded-[24px]',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col sm:h-full">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-4 sm:pt-5">
            <div>
              <h2 id="dlg-title" className="text-[18px] font-bold leading-[26px]">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="-mr-2 rounded-xl p-2 text-ink-2 hover:bg-surface-2"><X className="size-5" /></button>
          </div>
          <div className="overflow-y-auto px-6 pb-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
