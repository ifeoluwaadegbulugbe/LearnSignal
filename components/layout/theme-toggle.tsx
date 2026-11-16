'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/tabs';

export type Theme = 'light' | 'night';
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => { setTheme(document.documentElement.dataset.theme === 'night' ? 'night' : 'light'); }, []);
  const set = (t: Theme) => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('ls-theme', t); } catch {}
    setTheme(t);
  };
  return [theme, set] as const;
}

/** Small icon button (rail / user menu). */
export function NightButton({ className }: { className?: string }) {
  const [theme, set] = useTheme();
  const night = theme === 'night';
  return (
    <button onClick={() => set(night ? 'light' : 'night')} aria-pressed={night} aria-label={night ? 'Switch to light theme' : 'Switch to night theme'} title={night ? 'Light theme' : 'Night theme'}
      className={className ?? 'flex size-10 items-center justify-center rounded-[12px] text-ink-2 hover:bg-paper hover:text-ink'}>
      {night ? <Sun className="size-5" strokeWidth={1.75} /> : <Moon className="size-5" strokeWidth={1.75} />}
    </button>
  );
}

/** Labelled switch (Settings → Appearance). */
export function NightSwitch() {
  const [theme, set] = useTheme();
  return (
    <label className="flex items-center justify-between gap-4">
      <span><span className="block font-semibold">Night theme</span><span className="block text-[13px] text-ink-2">Darker colours for evening planning. Saved on this device.</span></span>
      <Switch checked={theme === 'night'} onChange={(v) => set(v ? 'night' : 'light')} label="Night theme" />
    </label>
  );
}
