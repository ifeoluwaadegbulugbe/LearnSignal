'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, LogOut, Star, ArrowRight, Lightbulb, PartyPopper } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/primitives';
import { speak } from '@/components/child/speak';
import { checkPracticeAnswer, getAssignmentForChild, submitAttempt, verifyTeacherExit, type ChildItem } from '@/lib/actions/intervention';
import { cn } from '@/lib/utils';

type View = { kind: 'home' } | { kind: 'loading' } | { kind: 'play'; assignmentId: string; items: ChildItem[]; index: number } | { kind: 'done'; tried: number; total: number } | { kind: 'error'; message: string };
type Rec = { index: number; firstValue: string | number; tries: number };

const pill = 'min-h-16 rounded-full px-6 text-[28px] font-extrabold transition-transform active:scale-95 disabled:opacity-60';

export function ChildMode({ learner, cards, completed, isDemo }: { learner: { id: string; name: string }; cards: { id: string; title: string; count: number }[]; completed: number; isDemo: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [exit, setExit] = useState({ open: false, password: '', error: '', busy: false });
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const records = useRef<Rec[]>([]);

  const item = view.kind === 'play' ? view.items[view.index] : null;
  useEffect(() => { setAnswer(''); setFeedback(null); setTries(0); if (item) speak(item.audioText ?? item.stem); }, [view.kind === 'play' ? `${view.assignmentId}-${view.index}` : view.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  async function open(id: string) {
    setView({ kind: 'loading' });
    const r = await getAssignmentForChild(id);
    if (!r.ok || r.data.status === 'completed') { setView({ kind: 'error', message: 'This practice is not available. Ask your teacher.' }); return; }
    records.current = [];
    setView({ kind: 'play', assignmentId: id, items: r.data.items, index: 0 });
  }

  async function check(value: string | number) {
    if (view.kind !== 'play' || busy || feedback?.good) return;
    setBusy(true);
    const r = await checkPracticeAnswer({ assignmentId: view.assignmentId, index: view.index, value });
    setBusy(false);
    if (!r.ok) { setFeedback({ text: 'Let’s try that again.', good: false }); return; }
    const n = tries + 1;
    setTries(n);
    if (n === 1) records.current.push({ index: view.index, firstValue: value, tries: 1 });
    else records.current[records.current.length - 1].tries = n;
    setFeedback({ text: r.data.correct ? r.data.feedback : n >= 3 ? 'Good trying! Let’s go to the next one.' : r.data.feedback, good: r.data.correct });
    setAnswer('');
  }

  async function next() {
    if (view.kind !== 'play') return;
    if (view.index + 1 < view.items.length) { setView({ ...view, index: view.index + 1 }); return; }
    setBusy(true);
    const r = await submitAttempt({ assignmentId: view.assignmentId, responses: records.current });
    setBusy(false);
    if (!r.ok) { setView({ kind: 'error', message: 'We could not save your practice. Please tell your teacher.' }); return; }
    setView({ kind: 'done', tried: view.items.length, total: view.items.length });
    router.refresh();
  }

  async function doExit(e?: React.FormEvent) {
    e?.preventDefault();
    setExit((x) => ({ ...x, busy: true, error: '' }));
    const r = await verifyTeacherExit(exit.password);
    if (!r.ok) { setExit((x) => ({ ...x, busy: false, error: r.error.message })); return; }
    router.push(`/learners/${learner.id}`);
  }

  const canMoveOn = feedback?.good || tries >= 3;

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFF8EC] font-[family-name:var(--font-child)] text-[20px] text-ink">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-[18px] font-bold text-primary">LearnSignal</span>
        <button onClick={() => (isDemo ? doExit() : setExit({ ...exit, open: true }))} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-sans text-[14px] font-semibold">
          <LogOut className="size-4" aria-hidden /> Teacher exit
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8">
        {view.kind === 'home' && (
          <>
            <h1 className="mt-6 text-[36px] font-extrabold">Hello, {learner.name}!</h1>
            {cards.length === 0 ? (
              <div className="mt-10 rounded-3xl bg-white p-8 text-center">
                <PartyPopper className="mx-auto size-12 text-accent" aria-hidden />
                <p className="mt-3 text-[28px] font-bold">No practice today — well done!</p>
              </div>
            ) : (
              <>
                <p className="mt-2 text-[22px]">Today&apos;s practice</p>
                <div className="mt-4 space-y-4">
                  {cards.map((c, i) => (
                    <button key={c.id} onClick={() => open(c.id)} className="flex w-full items-center justify-between rounded-3xl border-2 border-line bg-white p-6 text-left hover:border-primary">
                      <span><span className="block text-[28px] font-extrabold">{c.title}</span><span className="text-[18px] text-muted">{c.count} questions</span></span>
                      <span className={cn('flex size-16 items-center justify-center rounded-full text-white', ['bg-primary', 'bg-sky', 'bg-accent'][i % 3])}><ArrowRight className="size-8" aria-hidden /></span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="mt-8 flex items-center gap-2" aria-label={`${completed} practice sets finished`}>
              {Array.from({ length: Math.min(completed, 10) }).map((_, i) => <span key={i} className="size-4 rounded-full bg-st-consistent" aria-hidden />)}
              {completed > 0 && <span className="text-[16px] text-muted">{completed} finished</span>}
            </div>
          </>
        )}

        {view.kind === 'loading' && <p className="mt-20 text-center text-[24px]" role="status">Getting ready…</p>}

        {view.kind === 'error' && (
          <div className="mt-16 rounded-3xl bg-white p-8 text-center">
            <p className="text-[24px]">{view.message}</p>
            <button className={cn(pill, 'mt-6 bg-primary text-white')} onClick={() => setView({ kind: 'home' })}>Back</button>
          </div>
        )}

        {view.kind === 'play' && item && (
          <div className="mt-4 flex flex-1 flex-col">
            <div className="mb-4 flex gap-2" aria-label={`Question ${view.index + 1} of ${view.items.length}`}>
              {view.items.map((_, i) => <span key={i} className={cn('h-3 flex-1 rounded-full', i < view.index ? 'bg-st-consistent' : i === view.index ? 'bg-accent' : 'bg-line')} aria-hidden />)}
            </div>
            <div className="rounded-3xl bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="break-words text-[30px] font-extrabold leading-snug">{item.type === 'listen_choose' ? 'Listen and tap.' : item.stem}</h1>
                <button onClick={() => speak(item.audioText ?? item.stem)} aria-label="Hear it again" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent"><Volume2 className="size-8" aria-hidden /></button>
              </div>

              {item.options ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {item.options.map((o) => <button key={o} disabled={busy || !!canMoveOn} onClick={() => check(o)} className={cn(pill, 'border-2 border-line bg-white hover:border-primary')}>{o}</button>)}
                </div>
              ) : (
                <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (answer !== '') check(Number(answer)); }}>
                  <label htmlFor="ans" className="sr-only">Your answer</label>
                  <input id="ans" value={answer} readOnly className="mb-3 w-full rounded-2xl border-2 border-line px-4 py-3 text-center text-[40px] font-extrabold" />
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
                      <button key={k} type={k === 'OK' ? 'submit' : 'button'} disabled={busy || !!canMoveOn || (k === 'OK' && answer === '')} aria-label={k === '⌫' ? 'Delete' : k}
                        onClick={k === 'OK' ? undefined : () => setAnswer((a) => (k === '⌫' ? a.slice(0, -1) : (a + k).slice(0, 2)))}
                        className={cn('min-h-16 rounded-2xl text-[28px] font-extrabold disabled:opacity-50', k === 'OK' ? 'bg-primary text-white' : 'border-2 border-line bg-white')}>{k}</button>
                    ))}
                  </div>
                </form>
              )}

              <div aria-live="assertive" className="mt-5 min-h-16">
                {feedback && (
                  <p className={cn('rounded-2xl px-4 py-3 text-[24px] font-bold', feedback.good ? 'bg-st-consistent-soft text-[#1D6B47]' : 'bg-sky-soft text-[#1F5C91]')}>{feedback.text}</p>
                )}
                {!feedback?.good && tries >= 2 && tries < 3 && <p className="mt-2 flex items-center gap-2 text-[20px]"><Lightbulb className="size-6 text-accent" aria-hidden /> {item.hint}</p>}
              </div>
            </div>
            {canMoveOn && <button onClick={next} disabled={busy} className={cn(pill, 'mt-6 self-end bg-primary text-white')}>{view.index + 1 < view.items.length ? 'Next' : 'Finish'} <ArrowRight className="ml-1 inline size-7" aria-hidden /></button>}
          </div>
        )}

        {view.kind === 'done' && (
          <div className="mt-12 rounded-3xl bg-white p-8 text-center">
            <div className="flex justify-center gap-2" aria-hidden>{[0, 1, 2].map((i) => <Star key={i} className="size-14 fill-accent text-accent" />)}</div>
            <h1 className="mt-4 text-[36px] font-extrabold">You did it!</h1>
            <p className="mt-2 text-[24px]">You tried all {view.tried} questions. Great effort!</p>
            <p className="mt-1 text-[20px] text-muted">Every try helps your brain grow.</p>
            <button className={cn(pill, 'mt-6 bg-primary text-white')} onClick={() => { setView({ kind: 'home' }); router.refresh(); }}>Done</button>
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
