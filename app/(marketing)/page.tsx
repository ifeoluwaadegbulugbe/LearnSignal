import Image from 'next/image';
import { Smartphone, Timer, Hand, MonitorSmartphone, ShieldCheck, EyeOff, Sparkles, Scale } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status';
import { ConfidenceTiles } from '@/components/ui/signal';
import { DemoButton } from '@/components/layout/demo-button';
import { LogoMark } from '@/components/layout/logo';
import { Faq } from './faq';

const LOOP = [
  { title: 'Assess', body: 'A 10 minute check per strand. You read aloud and tap the answer.' },
  { title: 'Identify', body: 'See the first reading or number skill each child has not shown yet.' },
  { title: 'Group', body: 'Children who need the same help are grouped. You can change anything.' },
  { title: 'Intervene', body: 'A 15 minute activity per group, plus practice you approve.' },
  { title: 'Reassess', body: 'Check again and see who moved up the ladder.' },
];
const BENEFITS = [
  [Smartphone, 'Phone friendly', 'Works on the phone you already carry.'],
  [Timer, '10 minute checks', 'Short enough to fit around the school day.'],
  [Hand, 'You stay in control', 'Every group and practice set waits for your yes.'],
  [MonitorSmartphone, 'Shared devices', 'Children never log in. Exit needs your password.'],
] as const;
const PRIVACY = [
  [ShieldCheck, 'First names only', 'No surnames, birthdays, photos or addresses.'],
  [EyeOff, 'AI sees codes', 'Never names. Prompts carry skill facts only.'],
  [Scale, 'Rules set levels', 'AI never decides where a child is.'],
  [Sparkles, 'You approve', 'AI practice waits for your review.'],
] as const;
const FAQ: [string, string][] = [
  ['Is this a diagnosis?', 'No. LearnSignal shows which skills a child has demonstrated so far. It never labels a child or suggests a condition.'],
  ['Does AI see children’s names?', 'No. AI sees random codes like LS-3F9A2C and skill facts only. Names are filled in on your screen.'],
  ['Who sees what?', 'Teachers see only their own classes. School admins see totals, never names or codes, and groups smaller than three are hidden.'],
  ['Which languages?', 'English for now. Yoruba, Hausa and Igbo content is planned.'],
];
const WRAP = 'mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-10';

export default function Landing() {
  return (
    <>
      {/* Hero (light band) */}
      <section className="bg-ground">
        <div className={`${WRAP} grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1fr_1.1fr] lg:pb-20 lg:pt-16`}>
          <div>
            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-[14px] font-semibold text-violet-700">For primary teachers</span>
            <h1 className="mt-5 text-[36px] font-bold sm:text-[52px]">Find the exact skill each child is missing</h1>
            <p className="mt-5 max-w-xl text-[18px] text-muted">A short check shows where every child is on the reading and number ladders. LearnSignal groups children who need the same help and shows whether it worked.</p>
            <div className="mt-8 flex flex-wrap gap-3"><DemoButton size="lg" /><ButtonLink href="/signup" size="lg" variant="secondary">Create free account</ButtonLink></div>
            <p className="mt-6 text-[15px] text-muted">No child accounts. First names only. AI never sets a level.</p>
          </div>
          <figure>
            <div className="overflow-hidden rounded-[16px] border border-line bg-surface p-2 shadow-pop">
              <Image src="/brand/today-hero.png" alt="The Today screen for a sample class: a next step to re-check one learner, a summary strip, the class ladder with most learners on N4 subtraction, and today's plan." width={1695} height={1470} priority className="h-auto w-full rounded-[10px]" />
            </div>
            <figcaption className="mt-3 text-[14px] text-muted">The Today screen, with a sample class.</figcaption>
          </figure>
        </div>
      </section>

      {/* Five step timeline (white band) */}
      <section id="how" className="border-y border-line bg-surface">
        <div className={`${WRAP} py-16`}>
          <h2 className="text-[30px] font-bold">One simple loop</h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-5 md:gap-6">
            <span aria-hidden className="absolute left-5 top-5 hidden h-0.5 w-[calc(100%-40px)] bg-line-strong md:block" />
            <span aria-hidden className="absolute bottom-5 left-5 top-5 w-0.5 bg-line-strong md:hidden" />
            {LOOP.map(({ title, body }, i) => (
              <li key={title} className="relative flex gap-4 md:block">
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-violet-500 text-[16px] font-bold text-on-primary">{i + 1}</span>
                <div className="md:mt-4">
                  <h3 className="text-[20px] font-bold">{title}</h3>
                  <p className="mt-1 text-[16px] text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* One worked example (light band) */}
      <section className="bg-ground">
        <div className={`${WRAP} grid items-center gap-10 py-16 lg:grid-cols-2`}>
          <div>
            <h2 className="text-[30px] font-bold">How we decide</h2>
            <p className="mt-3 text-[17px] text-muted">Clear rules, not AI, decide every level. Each answer is evidence. Recent sessions count more, and a skill is only called <b className="text-ink">demonstrated consistently</b> after strong results in two separate sessions. One bad day can&apos;t pull a child down.</p>
            <ButtonLink href="/how-scoring-works" variant="link" className="mt-4">Read the full rules</ButtonLink>
          </div>
          <div className="rounded-[16px] border border-line bg-surface p-6 shadow-card">
            <p className="text-[13px] font-bold uppercase tracking-[.06em] text-violet-700">Worked example</p>
            <p className="mt-3 text-[16px]">A sample learner answers subtraction questions in two checks.</p>
            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-line bg-line">
              <div className="bg-surface p-4"><dt className="text-[14px] text-muted">First check</dt><dd className="mt-1 font-heading text-[28px] font-bold tabular">1 of 4</dd><dd className="mt-2"><StatusPill state="not_yet" size="sm" short /></dd></div>
              <div className="bg-surface p-4"><dt className="text-[14px] text-muted">Re-check</dt><dd className="mt-1 font-heading text-[28px] font-bold tabular">3 of 4</dd><dd className="mt-2"><StatusPill state="developing" size="sm" short /></dd></div>
            </dl>
            <p className="mt-5 text-[16px]">Now <b>developing</b>, with medium confidence <span className="inline-block align-middle"><ConfidenceTiles confidence="medium" showLabel={false} /></span>. One more strong check makes it <b>demonstrated consistently</b>.</p>
          </div>
        </div>
      </section>

      {/* Four classroom benefits (white band) */}
      <section className="border-y border-line bg-surface">
        <div className={`${WRAP} py-16`}>
          <h2 className="text-[30px] font-bold">Made for real classrooms</h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(([I, t, d]) => (
              <li key={t}><I className="size-6 text-violet-700" aria-hidden /><h3 className="mt-3 text-[18px] font-bold">{t}</h3><p className="mt-1 text-[16px] text-muted">{d}</p></li>
            ))}
          </ul>
        </div>
      </section>

      {/* Short privacy band (light band) */}
      <section className="bg-ground">
        <div className={`${WRAP} py-14`}>
          <h2 className="text-[24px] font-bold">Privacy and safety</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRIVACY.map(([I, t, d]) => (
              <li key={t} className="flex gap-3"><I className="mt-0.5 size-5 shrink-0 text-violet-700" aria-hidden /><span><span className="block text-[16px] font-semibold">{t}</span><span className="block text-[15px] text-muted">{d}</span></span></li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ (white band) */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-[30px] font-bold">Questions</h2>
          <div className="mt-6"><Faq items={FAQ} /></div>
        </div>
      </section>

      {/* Dark violet closing call to action */}
      <section className="bg-grad-violet text-white">
        <div className={`${WRAP} flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between`}>
          <div className="flex items-center gap-5">
            <LogoMark size={56} mono className="shrink-0 text-white" />
            <div><h2 className="text-[30px] font-bold">See it with a sample class</h2><p className="mt-1 text-[16px] text-white/85">No sign-up. Synthetic learners only.</p></div>
          </div>
          <DemoButton size="lg" variant="secondary" />
        </div>
      </section>
    </>
  );
}
