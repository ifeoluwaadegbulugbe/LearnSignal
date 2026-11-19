import { Logo, LogoMark } from '@/components/layout/logo';

const LOOP = [['Assess', 'A 10-minute check'], ['Identify', 'The exact skill'], ['Group', 'Same help together'], ['Intervene', '15-minute activities'], ['Reassess', 'See what changed']];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0D5C63] p-12 text-[#FBF8F2] lg:flex lg:flex-col" aria-label="About LearnSignal">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.12]" style={{ backgroundImage: 'radial-gradient(#FBF8F2 1px, transparent 1.2px)', backgroundSize: '14px 28px' }} />
        <div className="relative flex items-center gap-2"><LogoMark size={36} /><span className="font-heading text-[20px] font-bold">LearnSignal</span></div>
        <div className="relative my-auto max-w-md">
          <p className="font-heading text-[36px] font-bold leading-[44px]">Find the exact skill each child is missing, and help them climb.</p>
          <ol className="mt-10 space-y-4">
            {LOOP.map(([t, d], i) => (
              <li key={t} className="flex items-center gap-4" style={{ marginLeft: `${i * 18}px` }}>
                <span className="flex h-9 w-14 items-center justify-center rounded-[50%] bg-[#FFB627] text-[14px] font-bold text-[#2A1C00]">{i + 1}</span>
                <span><span className="block font-semibold">{t}</span><span className="block text-[14px] text-[#BFEFF1]">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <p className="relative text-[13px] text-[#BFEFF1]">First names only · no child accounts · AI never sets a level</p>
      </aside>
      <main className="flex flex-col items-center justify-center bg-paper px-4 py-10">
        <div className="mb-8 lg:hidden"><Logo /></div>
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
