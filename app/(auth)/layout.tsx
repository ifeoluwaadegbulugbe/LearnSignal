import { Logo, LogoMark, Wordmark } from '@/components/layout/logo';

const LOOP = [['Assess', 'A 10 minute check'], ['Identify', 'The exact skill'], ['Group', 'Same help together'], ['Intervene', '15 minute activities'], ['Reassess', 'See what changed']];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[45%_55%]">
      <aside className="relative hidden overflow-hidden bg-grad-violet p-12 text-white lg:flex lg:flex-col" aria-label="About LearnSignal">
        {/* the logo tiles as a quiet watermark */}
        <LogoMark size={420} mono dot={false} className="pointer-events-none absolute -bottom-24 -right-24 text-white opacity-[.07]" />
        <div className="relative flex items-center gap-2.5"><LogoMark size={32} mono className="text-white" /><Wordmark light /></div>
        <div className="relative my-auto max-w-md">
          <p className="font-heading text-[34px] font-bold leading-[1.15]">Find the exact skill each child is missing, and help them climb.</p>
          <ol className="mt-10 space-y-4">
            {LOOP.map(([t, d], i) => (
              <li key={t} className="flex items-center gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-[15px] font-bold text-white ring-1 ring-white/30">{i + 1}</span>
                <span><span className="block font-semibold">{t}</span><span className="block text-[15px] text-white/80">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <p className="relative text-[14px] text-white/80">First names only. No child accounts. AI never sets a level.</p>
      </aside>
      <main id="main" className="relative flex flex-col items-center justify-center bg-surface px-4 py-10">
        <div className="mb-8 lg:hidden"><Logo /></div>
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
