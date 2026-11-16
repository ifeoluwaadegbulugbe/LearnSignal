'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, X, AlertTriangle, Sparkles } from 'lucide-react';
import { IconTile } from './icon-tile';

type Tone = 'success' | 'info' | 'error' | 'warning' | 'ai-fallback';
interface ToastItem { id: number; message: string; tone: Tone }
const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

const ICON = { success: [CheckCircle2, 'mint'], info: [Info, 'sky'], error: [AlertTriangle, 'amber'], warning: [AlertTriangle, 'amber'], 'ai-fallback': [Sparkles, 'lilac'] } as const;

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
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end no-print">
        {items.map((t) => {
          const [Icon, hue] = ICON[t.tone];
          return (
            <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[16px] border border-line bg-surface p-3 pr-2 shadow-pop fade-up">
              <IconTile icon={Icon} hue={hue} size={32} />
              <span className="flex-1 text-[14px] font-medium">{t.message}</span>
              <button aria-label="Dismiss" className="rounded-lg p-1.5 text-ink-2 hover:bg-surface-2" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}><X className="size-4" /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
