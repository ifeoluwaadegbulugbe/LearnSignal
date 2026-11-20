import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { ButtonLink } from '@/components/ui/button';
import { DemoButton } from '@/components/layout/demo-button';
import { MobileNav } from './mobile-nav';

const LINKS = [['How it works', '/#how'], ['Scoring', '/how-scoring-works'], ['Privacy', '/privacy']];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map(([l, h]) => <Link key={l} href={h} className="rounded-[10px] px-3 py-2 text-[16px] font-medium text-ink hover:bg-violet-50">{l}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex"><ButtonLink href="/login" variant="ghost">Sign in</ButtonLink><DemoButton size="md" /></div>
          <MobileNav links={LINKS} />
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-4 px-4 py-8 text-[14px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:px-10">
          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"><span className="text-ink"><Logo asSpan mono /></span><span>A prototype. Not a diagnostic tool. Demo data is synthetic.</span></span>
          <span className="flex gap-4">{LINKS.map(([l, h]) => <Link key={l} href={h} className="underline">{l}</Link>)}</span>
        </div>
      </footer>
    </div>
  );
}
