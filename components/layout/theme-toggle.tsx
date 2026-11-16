'use client';
import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';
import { Switch } from '@/components/ui/tabs';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'); }, []);
  const set = (t: 'light' | 'dark') => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('ls-theme', t); } catch {}
    setTheme(t);
  };
  return [theme, set] as const;
}

/** Dark Mode switch for the sidebar footer (on dark background). */
export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const [theme, set] = useTheme();
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-on-dark-2">
      <span className="flex items-center gap-3 text-[14px]"><Moon className="size-5" strokeWidth={1.75} aria-hidden />{!collapsed && 'Dark mode'}</span>
      {!collapsed && <Switch checked={theme === 'dark'} onChange={(v) => set(v ? 'dark' : 'light')} label="Dark mode" />}
    </div>
  );
}
