'use client';
import { useEffect, useState } from 'react';
import { ChalkUnderline } from '@/components/ui/primitives';

/** Greeting with the browser's time of day and today's date (client-only: uses the local clock). */
export function Greeting({ firstName, className, learners }: { firstName: string; className: string; learners: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const h = now?.getHours() ?? 9;
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const date = now ? now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : '';
  return (
    <div>
      {date && <p className="text-[13px] font-medium text-ink-2">{date}</p>}
      <h1 className="mt-1 font-heading text-[30px] font-bold leading-[38px] sm:text-[38px] sm:leading-[46px]">
        {part}, <ChalkUnderline>{firstName}</ChalkUnderline>.
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">Here&apos;s what is happening in {className} today · {learners} learner{learners === 1 ? '' : 's'}</p>
    </div>
  );
}
