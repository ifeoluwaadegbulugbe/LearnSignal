import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { ButtonLink } from '@/components/ui/button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Link href="/how-scoring-works" className="hidden rounded-lg px-3 py-2 text-[15px] font-medium hover:bg-primary-soft sm:block">How scoring works</Link>
          <Link href="/privacy" className="hidden rounded-lg px-3 py-2 text-[15px] font-medium hover:bg-primary-soft sm:block">Privacy</Link>
          <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
          <ButtonLink href="/signup" size="sm">Sign up free</ButtonLink>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[13px] text-muted sm:flex-row sm:justify-between sm:px-6">
          <span>LearnSignal is a hackathon prototype. Not a diagnostic tool. No real-child data has been used.</span>
          <span className="flex gap-4"><Link href="/privacy" className="underline">Privacy</Link><Link href="/how-scoring-works" className="underline">How scoring works</Link></span>
        </div>
      </footer>
    </div>
  );
}
