import { Logo, LogoMark, Wordmark } from '@/components/layout/logo';

const LOOP = [['Assess', 'A 10-minute check'], ['Identify', 'The exact skill'], ['Group', 'Same help together'], ['Intervene', '15-minute activities'], ['Reassess', 'See what changed']];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[45%_55%]">
      <aside className="relative hidden overflow-hidden bg-grad-violet p-12 text-white lg:flex lg:flex-col" aria-label="About LearnSignal">
        {/* soft concentric arcs at 10% white */}
        <svg aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 size-[620px] opacity-10" viewBox="0 0 200 200" fill="none" stroke="#fff" strokeWidth="6">
          <circle cx="100" cy="100" r="30" /><circle cx="100" cy="100" r="58" /><circle cx="100" cy="100" r="86" />
        </svg>
        <div className="relative flex items-center gap-2"><LogoMark size={36} mono className="text-white" /><Wordmark light /></div>
        <div className="relative my-auto max-w-md">
          <p className="font-heading text-[34px] font-bold leading-[42px] tracking-[-0.02em]">Find the exact skill each child is missing, and help them climb.</p>
          <ol className="mt-10 space-y-4">
            {LOOP.map(([t, d], i) => (
              <li key={t} className="flex items-center gap-4" style={{ marginLeft: `${i * 18}px` }}>
                <span className={i === 0 ? 'flex h-9 w-14 items-center justify-center rounded-[50%] bg-tangerine text-[14px] font-bold text-[#2A1300]' : 'flex h-9 w-14 items-center justify-center rounded-[50%] bg-white/15 text-[14px] font-bold text-white ring-1 ring-white/30'}>{i + 1}</span>
                <span><span className="block font-semibold">{t}</span><span className="block text-[14px] text-white/75">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <p className="relative text-[13px] text-white/75">First names only · no child accounts · AI never sets a level</p>
      </aside>
      <main id="main" className="relative isolate flex flex-col items-center justify-center bg-surface px-4 py-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora lg:hidden" />
        <div className="mb-8 lg:hidden"><Logo /></div>
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
