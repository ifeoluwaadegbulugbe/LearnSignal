import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { ButtonLink } from '@/components/ui/button';
import { DemoButton } from '@/components/layout/demo-button';
import { MobileNav } from './mobile-nav';

const LINKS = [['How it works', '/#how'], ['Scoring', '/how-scoring-works'], ['Privacy', '/privacy']];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map(([l, h]) => <Link key={l} href={h} className="rounded-[10px] px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">{l}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex"><ButtonLink href="/login" variant="ghost">Sign in</ButtonLink><DemoButton size="md" /></div>
          <MobileNav links={LINKS} />
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-8 text-[13px] text-ink-2 sm:flex-row sm:justify-between sm:px-6 xl:px-10">
          <span>LearnSignal is a prototype. Not a diagnostic tool. Demo data is synthetic.</span>
          <span className="flex gap-4">{LINKS.map(([l, h]) => <Link key={l} href={h} className="underline">{l}</Link>)}</span>
        </div>
      </footer>
    </div>
  );
}
