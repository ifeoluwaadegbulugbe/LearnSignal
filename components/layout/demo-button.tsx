'use client';
import { useState } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { buttonClass, type ButtonVariant } from '@/components/ui/button';

/** Posts to /api/demo, which signs into the shared sandbox account (synthetic data only). Shows loading while signing in. */
export function DemoButton({ size = 'lg', variant = 'primary', label = 'Try the demo' }: { size?: 'md' | 'lg'; variant?: ButtonVariant; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form action="/api/demo" method="post" onSubmit={() => setBusy(true)}>
      <button type="submit" disabled={busy} aria-busy={busy || undefined} className={buttonClass(variant, size)}>
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <PlayCircle className="size-5" aria-hidden />} {busy ? 'Opening the demo…' : label}
      </button>
    </form>
  );
}
