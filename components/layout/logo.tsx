import Link from 'next/link';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold text-ink" aria-label="LearnSignal home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#0F6B5C" />
        <rect x="7" y="19" width="4" height="6" rx="1.5" fill="#FAF8F4" />
        <rect x="14" y="14" width="4" height="11" rx="1.5" fill="#FAF8F4" />
        <rect x="21" y="8" width="4" height="17" rx="1.5" fill="#F2A93B" />
      </svg>
      <span className="text-lg tracking-tight">LearnSignal</span>
    </Link>
  );
}
