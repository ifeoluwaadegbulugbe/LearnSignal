'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarStack } from './avatar';
import { MiniBars } from './viz';
import { ArchOutline, Illustration, type IllustrationName } from './illustration';

/** Mint/amber/indigo banner with tag, title, body and link. Dismissible per id (localStorage). */
export function AnnouncementBanner({ id, tag = 'Next step', title, body, href, linkLabel, variant = 'mint' }: {
  id: string; tag?: string; title: string; body: React.ReactNode; href?: string; linkLabel?: string; variant?: 'mint' | 'amber' | 'indigo';
}) {
  const key = `ls-banner-${id}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(key) === '1') setHidden(true); } catch {} }, [key]);
  if (hidden) return null;
  const v = { mint: ['bg-mint-bg', 'bg-[#1F8A5B] text-white', 'text-mint-ink'], amber: ['bg-amber-bg', 'bg-[#B4690E] text-white', 'text-amber-ink'], indigo: ['bg-primary-soft', 'bg-primary text-white', 'text-primary-ink'] }[variant];
  return (
    <div className={cn('relative flex flex-col gap-2 rounded-[16px] px-5 py-4 pr-12 fade-up', v[0])} role="region" aria-label={title}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('rounded-md px-2.5 py-0.5 text-[12px] font-bold', v[1])}>{tag}</span>
        <h2 className="text-[16px] font-bold">{title}</h2>
      </div>
      <p className="text-[14px] text-ink">
        {body}{' '}
        {href && <Link href={href} className={cn('ml-1 inline-flex items-center gap-1 font-semibold underline underline-offset-4', v[2])}>{linkLabel ?? 'Go'}<ArrowRight className="size-4" aria-hidden /></Link>}
      </p>
      <button onClick={() => { setHidden(true); try { localStorage.setItem(key, '1'); } catch {} }} aria-label="Dismiss" className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-2 hover:bg-black/5">
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Dark hero with lime radial glow, big headline and an arch-framed illustration. */
export function HeroCard({ tag, title, body, people, peopleLabel, action, secondary, illustration = 'skill-steps' }: {
  tag: string; title: string; body?: React.ReactNode; people?: { name: string; seed?: string }[]; peopleLabel?: string;
  action?: React.ReactNode; secondary?: React.ReactNode; illustration?: IllustrationName;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-g-hero p-6 text-on-dark sm:p-8 fade-up" aria-label={title}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[.06]" aria-hidden>
        <defs><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#fff" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <span className="inline-flex rounded-full bg-lime px-3 py-1 text-[12px] font-bold text-[#0E1220]">{tag}</span>
          <h2 className="mt-4 max-w-[24ch] text-[28px] font-bold leading-9 tracking-[-0.02em] text-white sm:text-[40px] sm:leading-[48px]">{title}</h2>
          {body && <p className="mt-3 max-w-[52ch] text-[14px] text-on-dark-2">{body}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {people && people.length > 0 && (
              <span className="flex items-center gap-2 text-[13px] text-on-dark-2"><AvatarStack people={people} size={32} />{peopleLabel}</span>
            )}
            {action}{secondary}
          </div>
        </div>
        <div className="relative hidden h-[220px] lg:block" aria-hidden>
          <ArchOutline className="absolute inset-x-4 top-0 h-full text-lime" />
          <div className="absolute inset-x-10 bottom-0 top-14 overflow-hidden rounded-t-[100px] bg-lime/20">
            <Illustration name={illustration} className="absolute bottom-0" />
          </div>
        </div>
      </div>
    </section>
  );
}

export type Pastel = 'lime' | 'lilac' | 'sky' | 'peach';

/** Pastel gradient focus card: mini bars, chip, title, caption, avatar stack and pill button. */
export function PastelStatCard({ tone, values, chip, title, caption, people, href, cta = 'View', barsLabel }: {
  tone: Pastel; values: number[]; chip: string; title: string; caption: string; people: { name: string; seed?: string }[]; href: string; cta?: string; barsLabel: string;
}) {
  return (
    <Link href={href} className={cn('lift group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-[20px] p-5 text-[#0E1220] shadow-card', `bg-g-${tone}`)}>
      <div className="flex items-start justify-between gap-3">
        <MiniBars values={values} label={barsLabel} />
        <span className="rounded-full bg-[#0E1220] px-2.5 py-1 text-[12px] font-bold text-white tabular">{chip}</span>
      </div>
      <div className="mt-3">
        <h3 className="text-[16px] font-bold leading-6">{title}</h3>
        <p className="text-[12px] leading-4 text-[#0E1220]/70">{caption}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {people.length ? <AvatarStack people={people} size={24} /> : <span className="text-[12px] text-[#0E1220]/60">No learners here</span>}
        <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white/85 px-3 text-[12px] font-semibold">{cta}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
      </div>
    </Link>
  );
}

/** One bordered card with hairline-separated rows. */
export function ListCard({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return <ul aria-label={label} className={cn('divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface shadow-card', className)}>{children}</ul>;
}

export function ListRow({ leading, tag, title, href, meta, trailing, ring }: {
  leading: React.ReactNode; tag?: React.ReactNode; title: React.ReactNode; href?: string;
  meta?: { label: string; value: React.ReactNode; always?: boolean }[]; trailing?: React.ReactNode; ring?: React.ReactNode;
}) {
  return (
    <li className="flex min-h-[72px] items-center gap-4 p-4 transition-colors hover:bg-surface-2/60">
      {leading}
      <div className="min-w-0 flex-1">
        {tag && <div className="mb-0.5 text-[12px] font-medium text-ink-2">{tag}</div>}
        <div className="truncate text-[15px] font-semibold">{href ? <Link href={href} className="hover:underline">{title}</Link> : title}</div>
      </div>
      {meta?.map((m) => (
        <div key={m.label} className={cn('w-28 shrink-0', !m.always && 'hidden md:block')}>
          <div className="text-[12px] font-medium text-ink-3">{m.label}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold">{m.value}</div>
        </div>
      ))}
      {ring}
      {trailing && <div className="shrink-0">{trailing}</div>}
    </li>
  );
}

export function AiBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[12px] font-semibold text-primary-ink"><Sparkles className="size-3" aria-hidden /> AI-drafted</span>;
}
export function ValidatedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-mint-bg px-2.5 py-0.5 text-[12px] font-semibold text-mint-ink"><ShieldCheck className="size-3" aria-hidden /> Validated</span>;
}
