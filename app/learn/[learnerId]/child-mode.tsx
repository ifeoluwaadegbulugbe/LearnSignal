'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, LogOut, ArrowRight, Lightbulb, Check, X, BookOpen, Calculator, Hash, Plus, Minus, Search, Shapes, Type } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/primitives';
import { Illustration } from '@/components/ui/illustration';
import { Counters } from '@/components/child/counters';
import { speak } from '@/components/child/speak';
import { checkPracticeAnswer, getAssignmentForChild, submitAttempt, verifyTeacherExit, type ChildItem } from '@/lib/actions/intervention';
import { cn } from '@/lib/utils';

// Plain, child-friendly activity names (no skill codes on child screens).
const ACTIVITY: Record<string, { name: string; icon: typeof BookOpen }> = {
  L1: { name: 'Letter sounds', icon: Type }, L2: { name: 'Joining sounds', icon: Type }, L3: { name: 'Word spotting', icon: Search },
  L4: { name: 'Reading sentences', icon: BookOpen }, L5: { name: 'Story questions', icon: BookOpen }, L6: { name: 'Word detective', icon: Search },
  N1: { name: 'Finding numbers', icon: Hash }, N2: { name: 'Counting', icon: Shapes }, N3: { name: 'Adding numbers', icon: Plus },
  N4: { name: 'Taking away numbers', icon: Minus }, N5: { name: 'Tens and ones', icon: Calculator }, N6: { name: 'Number stories', icon: BookOpen },
};
const CARD_TINT = ['bg-teal-soft', 'bg-sun-soft', 'bg-sky-soft'];
const TILE_TINT = ['bg-teal-soft', 'bg-sun-soft', 'bg-sky-soft', 'bg-clay-soft'];
const YES = ['Nice!', 'You got it!', 'Good thinking!', 'Well done!'];
const AGAIN = ["Let's try again!", 'Have another go!', 'Nearly. Try again!'];

type View = { kind: 'home' } | { kind: 'loading' } | { kind: 'play'; assignmentId: string; skillId: string; items: ChildItem[]; index: number } | { kind: 'done'; tried: number; skillId: string } | { kind: 'error' };
type Rec = { index: number; firstValue: string | number; tries: number };

/** Big pill with a 4px "press edge" that compresses on tap. */
function ChildButton({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={cn('inline-flex min-h-16 items-center justify-center gap-2 rounded-full bg-teal px-8 text-[24px] font-extrabold text-white shadow-[0_4px_0_var(--teal-ink)] transition-[transform,box-shadow] active:translate-y-1 active:shadow-none disabled:opacity-50 dark:text-[#06222A]', className)}>{children}</button>
  );
}

/** Stepping-stone path for progress. */
function Stones({ total, filled, current, label }: { total: number; filled: number; current?: number; label: string }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label={label}>
      {Array.from({ length: total }).map((_, i) => (
        <li key={i} aria-hidden className={cn('h-4 w-7 rounded-[50%] border-2 transition-colors', i < filled ? 'border-teal bg-teal' : i === current ? 'border-sun bg-sun-soft' : 'border-line-strong bg-card')} />
      ))}
    </ol>
  );
}

export function ChildMode({ learner, cards, doneThisWeek, isDemo }: { learner: { id: string; name: string }; cards: { id: string; skillId: string; count: number }[]; doneThisWeek: number; isDemo: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [exit, setExit] = useState({ open: false, password: '', error: '', busy: false });
  const [answer, setAnswer] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const records = useRef<Rec[]>([]);
  const phrase = useMemo(() => Math.floor(Math.random() * 4), [view.kind === 'play' ? view.index : -1]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetItem = () => { setAnswer(''); setPicked(null); setFeedback(null); setTries(0); };
  async function open(id: string, skillId: string) {
    setView({ kind: 'loading' });
    const r = await getAssignmentForChild(id);
    if (!r.ok || r.data.status === 'completed') { setView({ kind: 'error' }); return; }
    records.current = []; resetItem();
    setView({ kind: 'play', assignmentId: id, skillId, items: r.data.items, index: 0 });
  }
  async function check(value: string | number) {
    if (view.kind !== 'play' || busy || feedback?.good || tries >= 3) return;
    setBusy(true); setPicked(String(value));
    const r = await checkPracticeAnswer({ assignmentId: view.assignmentId, index: view.index, value });
    setBusy(false);
    if (!r.ok) { setFeedback({ text: "Let's try that again.", good: false }); return; }
    const n = tries + 1;
    setTries(n);
    if (n === 1) records.current.push({ index: view.index, firstValue: value, tries: 1 });
    else records.current[records.current.length - 1].tries = n;
    setFeedback(r.data.correct ? { text: YES[(phrase + n) % YES.length], good: true }
      : n >= 3 ? { text: "Good trying. Let's look at this one with your teacher.", good: false }
      : { text: AGAIN[(phrase + n) % AGAIN.length], good: false });
    setAnswer('');
  }
  async function next() {
    if (view.kind !== 'play') return;
    if (view.index + 1 < view.items.length) { resetItem(); setView({ ...view, index: view.index + 1 }); return; }
    setBusy(true);
    const r = await submitAttempt({ assignmentId: view.assignmentId, responses: records.current });
    setBusy(false);
    if (!r.ok) { setView({ kind: 'error' }); return; }
    setView({ kind: 'done', tried: view.items.length, skillId: view.skillId });
    router.refresh();
  }
  async function doExit(e?: React.FormEvent) {
    e?.preventDefault();
    setExit((x) => ({ ...x, busy: true, error: '' }));
    const r = await verifyTeacherExit(exit.password);
    if (!r.ok) { setExit((x) => ({ ...x, busy: false, error: r.error.message })); return; }
    router.push(`/learners/${learner.id}`);
  }

  const item = view.kind === 'play' ? view.items[view.index] : null;
  const canMoveOn = !!feedback?.good || tries >= 3;
  const pic = item?.stem.match(/[\p{Extended_Pictographic}]+/u)?.[0];
  const stemText = pic && item ? item.stem.replace(pic, '').trim() : item?.stem;
  const remaining = cards; // the finished set drops out after refresh

  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper font-[family-name:var(--font-child)] text-[24px] text-ink">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-sun-soft opacity-80 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 size-[480px] rounded-full bg-teal-soft opacity-70 blur-3xl" />

      <header className="relative flex items-center justify-between px-4 py-4 sm:px-6">
        <button onClick={() => (isDemo ? doExit() : setExit({ ...exit, open: true }))} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 font-sans text-[14px] font-semibold text-ink-2" aria-label="Teacher exit (needs the teacher's password)">
          <LogOut className="size-4" aria-hidden /> Teacher
        </button>
        <p className="text-[24px] font-extrabold sm:text-[28px]">Hi, {learner.name}</p>
      </header>

      <main className="relative mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-12">
        {view.kind === 'home' && (
          <>
            {cards.length === 0 ? (
              <div className="mt-10 rounded-[28px] bg-card p-8 text-center shadow-card">
                <div className="mx-auto w-48"><Illustration name="celebrate" /></div>
                <p className="mt-4 text-[32px] font-extrabold leading-10">All done for today. Well done.</p>
              </div>
            ) : (
              <>
                <h1 className="mt-6 text-[36px] font-extrabold leading-[44px]">Today&apos;s practice</h1>
                <div className="mt-6 space-y-5">
                  {cards.map((c, i) => {
                    const a = ACTIVITY[c.skillId] ?? { name: 'Practice', icon: BookOpen };
                    return (
                      <div key={c.id} className={cn('flex flex-col gap-5 rounded-[28px] p-6 shadow-card sm:flex-row sm:items-center', CARD_TINT[i % 3])}>
                        <span className="flex size-20 shrink-0 items-center justify-center rounded-[20px] bg-card text-teal"><a.icon className="size-10" strokeWidth={2} aria-hidden /></span>
                        <div className="flex-1"><p className="text-[30px] font-extrabold leading-9">{a.name}</p><p className="text-[22px] text-ink-2">{c.count} questions</p></div>
                        <ChildButton onClick={() => open(c.id, c.skillId)}>Let&apos;s go <ArrowRight className="size-7" aria-hidden /></ChildButton>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div className="mt-10">
              <p className="mb-2 text-[20px] font-bold text-ink-2">This week</p>
              <Stones total={Math.max(5, doneThisWeek + cards.length)} filled={doneThisWeek} current={doneThisWeek} label={`${doneThisWeek} practice sets finished this week`} />
            </div>
          </>
        )}

        {view.kind === 'loading' && <p className="mt-24 text-center text-[28px] font-bold" role="status">Getting ready…</p>}

        {view.kind === 'error' && (
          <div className="mt-16 rounded-[28px] bg-card p-8 text-center shadow-card">
            <p className="text-[30px] font-extrabold">Let&apos;s ask your teacher.</p>
            <p className="mt-2 text-[22px] text-ink-2">Something got stuck. Your work is safe.</p>
            <ChildButton className="mt-6" onClick={() => setView({ kind: 'home' })}>Back</ChildButton>
          </div>
        )}

        {view.kind === 'play' && item && (
          <div className="mt-2 flex flex-1 flex-col">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button onClick={() => setView({ kind: 'home' })} aria-label="Close and go back" className="flex size-12 items-center justify-center rounded-full bg-card text-ink-2 shadow-card"><X className="size-6" /></button>
              <Stones total={view.items.length} filled={view.index} current={view.index} label={`Question ${view.index + 1} of ${view.items.length}`} />
            </div>
            <div className="rounded-[28px] bg-card p-6 shadow-card sm:p-8">
              {pic && <Counters picture={pic} className="mb-5" />}
              <div className="flex items-start justify-between gap-4">
                <h1 className="break-words text-[36px] font-extrabold leading-[46px] sm:text-[44px] sm:leading-[54px]">{item.type === 'listen_choose' ? 'Listen and tap.' : stemText}</h1>
                <button onClick={() => speak(item.audioText ?? item.stem)} aria-label="Hear it" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-sun text-[#2A1C00] shadow-[0_4px_0_#C98A00] active:translate-y-1 active:shadow-none"><Volume2 className="size-8" aria-hidden /></button>
              </div>

              {item.options ? (
                <div className={cn('mt-7 grid gap-4', item.options.length === 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                  {item.options.map((o, i) => {
                    const sel = picked === o;
                    const faded = sel && feedback && !feedback.good;
                    return (
                      <button key={o} disabled={busy || canMoveOn} onClick={() => check(o)}
                        className={cn('relative min-h-24 rounded-[24px] border-[3px] border-white px-4 text-[30px] font-extrabold shadow-[0_0_0_1px_var(--line)] transition-[opacity,transform] active:scale-[.98] dark:border-card',
                          TILE_TINT[i % 4], sel && feedback?.good && 'ring-4 ring-teal', faded && 'opacity-40')}>
                        {sel && feedback?.good && <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-teal text-white"><Check className="size-5" aria-hidden /></span>}
                        {o}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form className="mx-auto mt-7 max-w-sm" onSubmit={(e) => { e.preventDefault(); if (answer !== '') check(Number(answer)); }}>
                  <label htmlFor="ans" className="sr-only">Your answer</label>
                  <output id="ans" className="mb-3 flex h-20 items-center justify-center rounded-[20px] border-2 border-line-strong bg-paper text-[44px] font-extrabold">{answer || <span className="text-ink-3">?</span>}</output>
                  <div className="grid grid-cols-3 gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((k) => (
                      <button key={k} type={k === 'ok' ? 'submit' : 'button'} disabled={busy || canMoveOn || (k === 'ok' && answer === '')} aria-label={k === 'del' ? 'Delete' : k === 'ok' ? 'Check' : k}
                        onClick={k === 'ok' ? undefined : () => setAnswer((a) => (k === 'del' ? a.slice(0, -1) : (a + k).slice(0, 2)))}
                        className={cn('min-h-16 rounded-[20px] text-[30px] font-extrabold disabled:opacity-40', k === 'ok' ? 'bg-teal text-[22px] text-white dark:text-[#06222A]' : 'border-2 border-line bg-card')}>
                        {k === 'del' ? '⌫' : k === 'ok' ? 'Check' : k}
                      </button>
                    ))}
                  </div>
                </form>
              )}

              <div aria-live="polite" className="mt-6 min-h-16">
                {feedback && (
                  <p className={cn('flex items-center gap-3 rounded-[20px] px-5 py-3 text-[26px] font-extrabold', feedback.good ? 'bg-leaf-soft text-st-consistent' : 'bg-sky-soft text-sky')}>
                    {feedback.good ? <Check className="size-7 shrink-0" aria-hidden /> : <ArrowRight className="size-7 shrink-0" aria-hidden />}{feedback.text}
                  </p>
                )}
                {!feedback?.good && tries === 2 && <p className="mt-3 flex items-center gap-3 text-[22px]"><Lightbulb className="size-7 shrink-0 text-sun" aria-hidden /> {item.hint}</p>}
              </div>
            </div>
            {canMoveOn && <ChildButton onClick={next} disabled={busy} className="mt-6 self-end">{view.index + 1 < view.items.length ? 'Next' : 'Finish'} <ArrowRight className="size-7" aria-hidden /></ChildButton>}
          </div>
        )}

        {view.kind === 'done' && (
          <div className="mt-8 rounded-[28px] bg-card p-8 text-center shadow-card">
            <div className="mx-auto w-52"><Illustration name="celebrate" /></div>
            <h1 className="mt-4 text-[40px] font-extrabold leading-[48px]">You tried {view.tried} questions</h1>
            <div className="mt-4 flex justify-center"><Stones total={3} filled={3} label="Three effort stones" /></div>
            <p className="mt-4 text-[24px] text-ink-2">You&apos;re getting stronger at {(ACTIVITY[view.skillId]?.name ?? 'this').toLowerCase()}.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {remaining.length > 1 && <ChildButton onClick={() => { setView({ kind: 'home' }); router.refresh(); }}>Next practice <ArrowRight className="size-7" aria-hidden /></ChildButton>}
              <ChildButton className="bg-card text-ink shadow-[0_4px_0_var(--line-strong)]" onClick={() => { setView({ kind: 'home' }); router.refresh(); }}>Finish</ChildButton>
            </div>
          </div>
        )}
      </main>

      <Dialog open={exit.open} onClose={() => setExit({ open: false, password: '', error: '', busy: false })} title="Teacher exit">
        <form className="space-y-3 font-sans text-[15px]" onSubmit={doExit}>
          <Field label="Enter your password to leave learner mode" htmlFor="pw" error={exit.error}>
            <Input id="pw" type="password" autoComplete="current-password" value={exit.password} onChange={(e) => setExit({ ...exit, password: e.target.value })} invalid={!!exit.error} autoFocus />
          </Field>
          <Button type="submit" loading={exit.busy}>Exit</Button>
        </form>
      </Dialog>
    </div>
  );
}
