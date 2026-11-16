'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'info' | 'error';
interface ToastItem { id: number; message: string; tone: Tone }
const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 no-print">
        {items.map((t) => {
          const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertTriangle : Info;
          return (
            <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={cn('pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border bg-white px-4 py-3 text-[15px] shadow-sm',
              t.tone === 'error' ? 'border-danger/40' : 'border-line')}>
              <Icon className={cn('size-5 shrink-0', t.tone === 'success' ? 'text-st-consistent' : t.tone === 'error' ? 'text-danger' : 'text-sky')} aria-hidden />
              <span className="flex-1">{t.message}</span>
              <button aria-label="Dismiss" className="rounded p-1 hover:bg-bg" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}><X className="size-4" /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
