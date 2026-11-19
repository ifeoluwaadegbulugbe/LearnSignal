import { ClipboardCheck, Search, Users, BookOpen, RefreshCw, Smartphone, Timer, Hand, MonitorSmartphone, ShieldCheck, EyeOff, Sparkles, Scale } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { ChalkUnderline, IndexCard } from '@/components/ui/primitives';
import { IconTile } from '@/components/ui/icon-tile';
import { StatusPill } from '@/components/ui/status';
import { ConfidenceSignal, SignalMark } from '@/components/ui/signal';
import { MeterRing } from '@/components/ui/viz';
import { Avatar } from '@/components/ui/avatar';
import { AiBadge, ValidatedBadge } from '@/components/ui/cards';
import { DemoButton } from '@/components/layout/demo-button';
import { ClassLadder, type LadderLearner } from '@/components/learner/class-ladder';

// Sample-only fixtures for the marketing illustrations. Clearly labelled; never real children.
const SAMPLE: LadderLearner[] = [['Ada', 'N4'], ['Tolu', 'N4'], ['Musa', 'N3'], ['Ngozi', 'N4'], ['Emeka', null], ['Aisha', 'N2'], ['Bayo', 'N5'], ['Chika', 'N4'], ['Femi', null], ['Zainab', 'N3']]
  .map(([n, w], i) => ({ id: `s${i}`, name: n as string, code: `SAMPLE-${i}`, assessed: true, working: { literacy: null, numeracy: w }, recheck: { literacy: false, numeracy: i === 3 }, states: [{ skill_id: 'N1', state: 'consistent', confidence: 'medium', provisional: false }] }));

const LOOP = [
  { icon: ClipboardCheck, title: 'Assess', body: 'A 10-minute check per strand. You read aloud and tap the answer.' },
  { icon: Search, title: 'Identify', body: 'See the first reading or number skill each child hasn’t shown yet.' },
  { icon: Users, title: 'Group', body: 'Children who need the same help are grouped. You can change anything.' },
  { icon: BookOpen, title: 'Intervene', body: 'A 15-minute activity per group, plus practice you approve.' },
  { icon: RefreshCw, title: 'Reassess', body: 'Check again and see who moved up the ladder.' },
];
const FAQ = [
  ['Is this a diagnosis?', 'No. LearnSignal shows which skills a child has demonstrated so far. It never labels a child or suggests a condition.'],
  ['Does AI see children’s names?', 'No. AI sees random codes like LS-3F9A2C and skill facts only. Names are filled in on your screen.'],
  ['Who sees what?', 'Teachers see only their own classes. School admins see totals, never names or codes, and groups smaller than three are hidden.'],
  ['Which languages?', 'English for now. Yoruba, Hausa and Igbo content is planned.'],
];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] xl:px-10 xl:pt-16">
        <div className="fade-up">
          <span className="inline-flex h-7 items-center rounded-t-[10px] rounded-br-[10px] bg-teal px-3 text-[12px] font-bold uppercase tracking-[.08em] text-white">For primary teachers</span>
          <h1 className="mt-5 font-heading text-[40px] font-bold leading-[46px] tracking-[-0.02em] sm:text-[56px] sm:leading-[60px]">
            Find the <ChalkUnderline>exact skill</ChalkUnderline> each child is missing
          </h1>
          <p className="mt-5 max-w-xl text-[18px] leading-8 text-ink-2">A short check shows where every child is on the reading and number ladders. LearnSignal groups children who need the same help and shows whether it worked.</p>
          <div className="mt-8 flex flex-wrap gap-3"><DemoButton size="lg" /><ButtonLink href="/signup" size="lg" variant="secondary">Create free account</ButtonLink></div>
          <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-ink-2"><span>No child accounts</span><span aria-hidden>·</span><span>First names only</span><span aria-hidden>·</span><span>AI never sets a level</span></p>
        </div>
        <div className="relative">
          <div aria-hidden className="absolute -right-6 -top-10 opacity-20"><SignalMark size={260} /></div>
          <div className="torn-edge relative rounded-t-[18px] border border-line bg-card p-5 pb-8 shadow-pop sm:p-6 sm:pb-10">
            <div className="mb-3 flex items-center justify-between"><p className="font-heading text-[16px] font-semibold">Class ladder · numeracy</p><span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-[12px] font-semibold text-sun-ink dark:text-sun">Sample</span></div>
            <ClassLadder learners={SAMPLE} strand="numeracy" interactive={false} />
          </div>
        </div>
      </section>

      {/* 1. Loop as stepping stones */}
      <section id="how" className="border-y border-line bg-paper-2/60">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 xl:px-10">
          <h2 className="font-heading text-[30px] font-bold">One simple loop</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-5">
            {LOOP.map(({ icon, title, body }, i) => (
              <li key={title} className="relative md:pt-[calc(var(--i)*14px)]" style={{ ['--i' as string]: 4 - i }}>
                <div className="flex items-center gap-3"><span className="flex h-10 w-16 items-center justify-center rounded-[50%] border-2 border-teal bg-teal-soft font-heading text-[16px] font-bold text-teal-ink dark:text-teal">{i + 1}</span><IconTile icon={icon} /></div>
                <h3 className="mt-3 font-heading text-[18px] font-semibold">{title}</h3>
                <p className="mt-1 text-[15px] text-ink-2">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 2. How we decide */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 xl:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-[30px] font-bold">How we decide</h2>
            <p className="mt-3 text-[17px] leading-8 text-ink-2">Clear rules, not AI, decide every level. Each answer is evidence. Recent sessions count more, and a skill is only called <b className="text-ink">demonstrated consistently</b> after strong results in two separate sessions. One bad day can&apos;t pull a child down.</p>
            <ButtonLink href="/how-scoring-works" variant="link" className="mt-3">Read the full rules</ButtonLink>
          </div>
          <IndexCard tab="Worked example" tabTone="sun" ruled margin>
            <p className="text-[15px] leading-7">A sample learner answers subtraction questions in two checks:</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><MeterRing value={25} size={56} stroke={6} color="var(--st-not-yet)" label="First check"><b className="text-[13px]">1/4</b></MeterRing><div><p className="text-[13px] text-ink-2">First check</p><StatusPill state="not_yet" size="sm" short /></div></div>
              <div className="flex items-center gap-3"><MeterRing value={75} size={56} stroke={6} color="var(--st-dev)" label="Re-check"><b className="text-[13px]">3/4</b></MeterRing><div><p className="text-[13px] text-ink-2">Re-check</p><StatusPill state="developing" size="sm" short /></div></div>
            </div>
            <p className="mt-4 text-[15px] leading-7">Now <b>developing</b>, with medium confidence <ConfidenceSignal confidence="medium" showLabel={false} />. One more strong check and it becomes <b>demonstrated consistently</b>.</p>
          </IndexCard>
        </div>
      </section>

      {/* 3. Feature rows with real components */}
      <section className="mx-auto max-w-[1240px] space-y-16 px-4 pb-16 sm:px-6 xl:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div><h3 className="font-heading text-[24px] font-bold">See every child on one ladder</h3><p className="mt-2 text-[17px] leading-8 text-ink-2">Each dot is a learner on the rung they&apos;re working on. Tap a rung to see who&apos;s there and start a check.</p></div>
          <IndexCard tab="Sample"><ClassLadder learners={SAMPLE.slice(0, 7)} strand="numeracy" interactive={false} /></IndexCard>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <IndexCard tab="N4" tabTone="sun" className="lg:order-1">
            <h4 className="font-heading font-semibold">Subtraction within 20</h4>
            <ul className="mt-3 space-y-2">{SAMPLE.filter((s) => s.working.numeracy === 'N4').map((s) => <li key={s.id} className="flex items-center gap-2 rounded-[12px] border border-line px-2 py-1.5 text-[14px]"><Avatar name={s.name} seed={s.code} size={24} />{s.name}<span className="ml-auto"><StatusPill state="not_yet" size="sm" short noTip /></span></li>)}</ul>
            <p className="mt-4 rounded-[12px] bg-paper-2 p-3 text-[14px] ruled">15 minutes: take-away with bottle tops, then count back on a number line.</p>
          </IndexCard>
          <div className="lg:order-2"><h3 className="font-heading text-[24px] font-bold">Groups that match the need</h3><p className="mt-2 text-[17px] leading-8 text-ink-2">Children working on the same skill are grouped, with a short activity using things every classroom has. You decide who goes where.</p></div>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div><h3 className="font-heading text-[24px] font-bold">Practice you can trust</h3><p className="mt-2 text-[17px] leading-8 text-ink-2">AI drafts questions. Code re-checks every answer and word, drops anything wrong, and nothing reaches a child until you approve it.</p></div>
          <IndexCard tab="Example" tabTone="sky">
            <div className="flex flex-wrap gap-1.5"><AiBadge /><ValidatedBadge /></div>
            <p className="mt-3 font-heading font-semibold">Subtraction within 20 · level 2</p>
            <p className="mt-2 rounded-[12px] border border-line p-3 font-[family-name:var(--font-child)] text-[20px] font-extrabold">13 − 6 = ?</p>
            <p className="mt-2 text-[13px] text-ink-2">Validator: 5 kept · 1 dropped (wrong answer: 9 + 4 = 13, model said 12)</p>
          </IndexCard>
        </div>
      </section>

      {/* 4. Real classrooms */}
      <section className="border-y border-line bg-paper-2/60">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 xl:px-10">
          <h2 className="font-heading text-[30px] font-bold">Made for real classrooms</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[[Smartphone, 'Phone-friendly', 'Works on the phone you already carry.'], [Timer, '10-minute checks', 'Short enough to fit around the school day.'], [Hand, 'You stay in control', 'Every group and practice set waits for your yes.'], [MonitorSmartphone, 'Shared devices', 'Children never log in. Exit needs your password.']].map(([I, t, d]) => (
              <li key={t as string}><IconTile icon={I as typeof Smartphone} hue="sun" size={48} /><h3 className="mt-3 font-heading text-[18px] font-semibold">{t as string}</h3><p className="mt-1 text-[15px] text-ink-2">{d as string}</p></li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Privacy */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 xl:px-10">
        <h2 className="font-heading text-[30px] font-bold">Privacy and safety</h2>
        <div className="mt-8 grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {[[ShieldCheck, 'First names only', 'No surnames, birthdays, photos or addresses.'], [EyeOff, 'AI sees codes', 'Never names. Prompts carry skill facts only.'], [Scale, 'Rules set levels', 'AI never decides where a child is.'], [Sparkles, 'You approve', 'AI practice waits for your review.']].map(([I, t, d]) => (
            <IndexCard key={t as string} tab={t as string} tabTone="teal"><IconTile icon={I as typeof ShieldCheck} /><p className="mt-3 text-[15px] text-ink-2">{d as string}</p></IndexCard>
          ))}
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="font-heading text-[30px] font-bold">Questions</h2>
        <div className="mt-6 divide-y divide-line rounded-[18px] border border-line bg-card shadow-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<span aria-hidden className="text-[20px] text-teal transition-transform group-open:rotate-45">+</span></summary>
              <p className="pb-5 text-[15px] text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 7. Closing band */}
      <section className="bg-[#0D5C63] text-[#FBF8F2]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between xl:px-10">
          <div><h2 className="font-heading text-[30px] font-bold">See it with a sample class</h2><p className="mt-1 text-[#BFEFF1]">No sign-up. Synthetic learners only.</p></div>
          <DemoButton size="lg" variant="sun" />
        </div>
      </section>
    </>
  );
}
