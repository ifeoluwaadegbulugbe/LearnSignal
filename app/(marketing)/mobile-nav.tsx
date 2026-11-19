'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { ButtonLink } from '@/components/ui/button';
import { DemoButton } from '@/components/layout/demo-button';

export function MobileNav({ links }: { links: string[][] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(true)} aria-label="Open menu" className="flex size-11 items-center justify-center rounded-[12px] hover:bg-paper-2"><Menu className="size-6" /></button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Menu">
        <ul className="space-y-1">{links.map(([l, h]) => <li key={l}><Link href={h} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-[12px] px-3 text-[16px] font-medium hover:bg-paper-2">{l}</Link></li>)}</ul>
        <div className="mt-4 flex flex-col gap-2"><DemoButton size="lg" /><ButtonLink href="/login" variant="secondary" size="lg">Sign in</ButtonLink></div>
      </Dialog>
    </div>
  );
}
