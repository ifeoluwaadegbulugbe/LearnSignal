import Link from 'next/link';
import { ClipboardCheck, Search, Users, BookOpenCheck, RefreshCw, ShieldCheck, Sparkles, Scale } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import { StateBadge } from '@/components/ui/state-badge';
import { DemoButton } from '@/components/layout/demo-button';

const LOOP = [
  { icon: ClipboardCheck, title: 'Assess', body: 'A 8–10 minute check per strand. The teacher reads aloud and taps the answer.' },
  { icon: Search, title: 'Identify', body: 'See the first reading or number skill each child has not yet demonstrated.' },
  { icon: Users, title: 'Group', body: 'Children who need the same help are grouped automatically. You can edit every group.' },
  { icon: BookOpenCheck, title: 'Intervene', body: 'A 15-minute activity per group plus practice you review and approve.' },
  { icon: RefreshCw, title: 'Reassess', body: 'Check again and see what changed, skill by skill.' },
];

export default function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-[#7A4E0C]">For primary teachers · Literacy & numeracy</p>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight">Find the exact skill each child is missing.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            LearnSignal groups children who need the same help, gives you reviewed practice for each group, and shows whether it worked.
            Free to use. Built for large classes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/signup" size="lg">Create a free account</ButtonLink>
            <DemoButton />
          </div>
          <p className="mt-3 text-[13px] text-muted">The demo uses illustrative sample data only.</p>
        </div>
        <Card className="space-y-3 p-5" aria-label="Example learner skill ladder (sample data)">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Learner C · Numeracy</div>
            <span className="text-[12px] text-muted">sample data</span>
          </div>
          {([['Numbers 0–20', 'consistent'], ['Counting', 'consistent'], ['Addition within 20', 'consistent'], ['Subtraction within 20', 'not_yet'], ['Place value', 'insufficient']] as const).map(([n, s]) => (
            <div key={n} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
              <span className="text-[15px]">{n}</span><StateBadge state={s} short />
            </div>
          ))}
          <p className="rounded-xl bg-primary-soft px-3 py-2 text-[14px] text-primary-dark">Working skill: <b>Subtraction within 20</b> → joins the subtraction group with 3 classmates.</p>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-labelledby="loop">
        <h2 id="loop" className="text-[28px] font-bold">One simple loop</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LOOP.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Card className="h-full">
                <div className="mb-2 flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">{i + 1}</span><Icon className="size-5 text-primary" aria-hidden /></div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-[14px] text-muted">{body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
        <Card>
          <Scale className="mb-2 size-6 text-primary" aria-hidden />
          <h3 className="font-bold">Transparent scoring</h3>
          <p className="mt-1 text-[14px] text-muted">Levels and groups come from clear rules, not AI. Every result has a “Why?” button showing the evidence. One bad day cannot define a child.</p>
          <Link href="/how-scoring-works" className="mt-2 inline-block text-[14px] font-semibold text-primary underline">How scoring works</Link>
        </Card>
        <Card>
          <Sparkles className="mb-2 size-6 text-primary" aria-hidden />
          <h3 className="font-bold">AI you can check</h3>
          <p className="mt-1 text-[14px] text-muted">AI drafts practice questions; code re-checks every answer and word; you approve before any child sees them. The assistant answers only from your class data.</p>
        </Card>
        <Card>
          <ShieldCheck className="mb-2 size-6 text-primary" aria-hidden />
          <h3 className="font-bold">Private by design</h3>
          <p className="mt-1 text-[14px] text-muted">First names or nicknames only. No surnames, birthdays, photos or child accounts. AI sees random codes, never names.</p>
          <Link href="/privacy" className="mt-2 inline-block text-[14px] font-semibold text-primary underline">Our privacy promise</Link>
        </Card>
      </section>
    </>
  );
}
