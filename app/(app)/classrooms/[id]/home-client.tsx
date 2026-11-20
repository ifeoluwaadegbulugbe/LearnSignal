'use client';
import { useEffect, useState } from 'react';
import { ChalkUnderline } from '@/components/ui/primitives';

/** Greeting with the browser's time of day and today's date (client-only: uses the local clock). */
export function Greeting({ firstName, className }: { firstName: string; className: string; learners?: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const h = now?.getHours() ?? 9;
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const date = now ? now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : '';
  return (
    <div>
      <h1 className="text-[28px] font-bold sm:text-[36px]">
        {part}, <ChalkUnderline>{firstName}</ChalkUnderline>
      </h1>
      <p className="mt-2 text-[16px] text-muted">{date && `${date}. `}Here is where {className} stands today.</p>
    </div>
  );
}
