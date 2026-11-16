'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Calculator, Layers, Volume2, SkipForward, Pause, Play, Flag, Timer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, NotADiagnosis, SampleDataBanner } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';
import { StateBadge, ConfidenceBadge } from '@/components/ui/state-badge';
import { useToast } from '@/components/ui/toast';
import { speak } from '@/components/child/speak';
import { completeSession, resumeSession, startSession, submitResponse } from '@/lib/actions/assessment';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { cn } from '@/lib/utils';
import type { PublicItem } from '@/lib/server/items';
import type { StoredState } from '@/lib/server/engine';

type Strand = 'literacy' | 'numeracy';
type Phase = { kind: 'select' } | { kind: 'running'; strand: Strand; sessionId: string; item: PublicItem; answered: number } | { kind: 'results'; results: { strand: Strand; states: StoredState[] }[] };
type Mark = 'correct' | 'omitted' | 'substituted' | 'self_corrected';
const MARKS: Mark[] = ['correct', 'omitted', 'substituted', 'self_corrected'];
const MARK_UI: Record<Mark, { label: string; cls: string }> = {
  correct: { label: '✓', cls: 'border-st-consistent bg-st-consistent-soft' },
  omitted: { label: 'omitted', cls: 'border-st-notyet bg-st-notyet-soft line-through' },
  substituted: { label: 'substituted', cls: 'border-st-notyet bg-st-notyet-soft' },
  self_corrected: { label: 'self-corrected', cls: 'border-sky bg-sky-soft' },
};

export function AssessmentRunner({ learner, isDemo }: { learner: { id: string; code: string; name: string }; isDemo: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>({ kind: 'select' });
  const [queue, setQueue] = useState<Strand[]>([]);
  const [done, setDone] = useState<{ strand: Strand; states: StoredState[] }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [numeric, setNumeric] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [timer, setTimer] = useState<{ start: number | null; elapsed: number }>({ start: null, elapsed: 0 });
  const [, tick] = useState(0);
  const [live, setLive] = useState('');
  const shownAt = useRef(Date.now());
  const storageKey = `ls-session-${learner.id}`;

  // Resume an unfinished session after a refresh.
  useEffect(() => {
    let sid: string | null = null;
    try { sid = sessionStorage.getItem(storageKey); } catch {}
    if (!sid) return;
    resumeSession(sid).then((r) => {
      if (r.ok && !r.data.next.done) setPhase({ kind: 'running', strand: r.data.strand, sessionId: sid!, item: r.data.next.item, answered: r.data.next.progress });
      else try { sessionStorage.removeItem(storageKey); } catch {}
    });
  }, [storageKey]);

  useEffect(() => {
    if (timer.start === null) return;
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, [timer.start]);

  const item = phase.kind === 'running' ? phase.item : null;
  useEffect(() => {
    shownAt.current = Date.now();
    setNumeric('');
    setMarks(item?.content.words ? item.content.words.map(() => 'correct') : []);
    setTimer({ start: null, elapsed: 0 });
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function begin(strands: Strand[]) {
    setError(null); setBusy(true); setDone([]);
    const [first, ...rest] = strands;
    setQueue(rest);
    await startStrand(first);
    setBusy(false);
  }

  async function startStrand(strand: Strand) {
    const r = await startSession({ learnerId: learner.id, strand });
    if (!r.ok) { setError(r.error.message); return; }
    try { sessionStorage.setItem(storageKey, r.data.sessionId); } catch {}
    if (r.data.next.done) { await finish(r.data.sessionId, strand, false); return; }
    setPhase({ kind: 'running', strand, sessionId: r.data.sessionId, item: r.data.next.item, answered: 0 });
  }

  async function finish(sessionId: string, strand: Strand, endedEarly: boolean) {
    setBusy(true);
    const r = await completeSession({ sessionId, endedEarly });
    try { sessionStorage.removeItem(storageKey); } catch {}
    setBusy(false);
    if (!r.ok) { setError(r.error.message); return; }
    const results = [...done, { strand, states: r.data.states }];
    setDone(results);
    if (queue.length) { const [next, ...rest] = queue; setQueue(rest); toast(`${strand} saved. Starting ${next}.`, 'info'); await startStrand(next); return; }
    setPhase({ kind: 'results', results });
    router.refresh();
  }

  async function answer(response: { kind: string; [k: string]: unknown }) {
    if (phase.kind !== 'running' || busy) return;
    setBusy(true); setError(null);
    const r = await submitResponse({ sessionId: phase.sessionId, itemId: phase.item.id, response, timeMs: Date.now() - shownAt.current });
    setBusy(false);
    if (!r.ok) {
      setError(r.error.message);
      const res = await resumeSession(phase.sessionId);
      if (res.ok && !res.data.next.done) setPhase({ ...phase, item: res.data.next.item, answered: res.data.next.progress });
      return;
    }
    setLive(`Answer recorded. ${r.data.detail ? `Accuracy ${Math.round((r.data.detail.accuracy ?? 0) * 100)}%.` : ''}`);
    if (r.data.next.done) { await finish(phase.sessionId, phase.strand, false); return; }
    setPhase({ ...phase, item: r.data.next.item, answered: phase.answered + 1 });
  }

  const elapsed = timer.start !== null ? timer.elapsed + (Date.now() - timer.start) / 1000 : timer.elapsed;

  // ---------------- Select ----------------
  if (phase.kind === 'select') {
    return (
      <div className="mx-auto max-w-3xl">
        {isDemo && <SampleDataBanner className="mb-4" />}
        <Link href={`/learners/${learner.id}`} className="mb-3 inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> {learner.name}</Link>
        <h1 className="text-[28px] font-bold">Assess {learner.name}</h1>
        <p className="mt-1 text-muted">You hold the device, read each question aloud (or tap the speaker), and tap the child&apos;s answer. There is no time limit.</p>
        {error && <ErrorPanel message={error} className="mt-4" />}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {([['literacy', 'Literacy', BookOpen, '8–10 min'], ['numeracy', 'Numeracy', Calculator, '8–10 min'], ['both', 'Both', Layers, '16–20 min']] as const).map(([k, label, Icon, mins]) => (
            <button key={k} disabled={busy} onClick={() => begin(k === 'both' ? ['literacy', 'numeracy'] : [k])}
              className="rounded-[14px] border border-line bg-surface p-5 text-left transition-colors hover:border-primary disabled:opacity-60">
              <Icon className="mb-3 size-7 text-primary" aria-hidden />
              <div className="text-lg font-bold">{label}</div>
              <div className="text-[14px] text-muted">About {mins}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- Results ----------------
  if (phase.kind === 'results') {
    return (
      <div className="mx-auto max-w-3xl">
        {isDemo && <SampleDataBanner className="mb-4" />}
        <h1 className="flex items-center gap-2 text-[28px] font-bold"><CheckCircle2 className="size-7 text-st-consistent" aria-hidden /> Results for {learner.name}</h1>
        {phase.results.map(({ strand, states }) => {
          const sorted = [...states].sort((a, b) => SKILL_BY_ID[a.skill_id].sequence - SKILL_BY_ID[b.skill_id].sequence);
          const first = sorted.find((s) => s.state === 'not_yet' || s.state === 'developing');
          return (
            <Card key={strand} className="mt-5">
              <h2 className="text-lg font-bold capitalize">{strand}</h2>
              <p className="mt-1 text-[15px]">{first ? <>Working skill: <b>{SKILL_BY_ID[first.skill_id].name}</b>. {learner.name} is ready for practice at this level.</> : sorted.length ? 'No gaps flagged among the skills tested.' : 'No questions were answered.'}</p>
              <ul className="mt-3 space-y-2">
                {sorted.map((s) => (
                  <li key={s.skill_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                    <span className="font-medium">{s.skill_id} {SKILL_BY_ID[s.skill_id].shortName}</span>
                    <span className="flex flex-wrap items-center gap-2"><ConfidenceBadge confidence={s.confidence} provisional={s.provisional} /><StateBadge state={s.state} short /></span>
                  </li>
                ))}
              </ul>
              {sorted.some((s) => s.provisional) && <p className="mt-2 text-[13px] text-muted">Provisional: based on one session. A second check confirms the picture.</p>}
            </Card>
          );
        })}
        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink href={`/learners/${learner.id}`}>View profile and recommendations</ButtonLink>
          <Button variant="secondary" onClick={() => setPhase({ kind: 'select' })}>Assess another strand</Button>
        </div>
        <NotADiagnosis />
      </div>
    );
  }

  // ---------------- Running ----------------
  const it = phase.item;
  const audio = it.content.audioText ?? it.content.stem;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="text-[14px] text-muted"><span className="capitalize">{phase.strand}</span> · {learner.name} · question {phase.answered + 1} · <span className="font-semibold text-ink">{SKILL_BY_ID[it.skillId].shortName}</span></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPaused(true)}><Pause className="size-4" aria-hidden /> Pause</Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => { if (confirm('End early? Answers so far are saved and scored.')) finish(phase.sessionId, phase.strand, true); }}><Flag className="size-4" aria-hidden /> End early</Button>
        </div>
      </div>
      {error && <ErrorPanel message={error} className="mb-4" />}
      <p aria-live="polite" className="sr-only">{live}</p>

      {paused ? (
        <Card className="py-16 text-center">
          <h2 className="text-2xl font-bold">Paused</h2>
          <p className="mt-1 text-muted">Take your time.</p>
          <Button className="mt-4" size="lg" onClick={() => setPaused(false)}><Play className="size-5" aria-hidden /> Continue</Button>
        </Card>
      ) : (
        <Card className="font-[family-name:var(--font-child)]">
          {it.content.passage && it.type !== 'tap_word_sequence' && <p className="mb-4 rounded-xl bg-bg p-4 text-[22px] leading-relaxed">{it.content.passage}</p>}
          {it.content.picture && <p className="mb-3 break-words text-[40px] leading-snug tracking-wider" aria-label={`${[...new Intl.Segmenter().segment(it.content.picture)].length} pictures`}>{it.content.picture}</p>}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[28px] font-bold leading-snug">{it.type === 'listen_choose' ? 'Listen…' : it.content.stem}</h2>
            <Button variant="lime" size="lg" className="shrink-0 rounded-full" onClick={() => speak(audio)} aria-label="Read the question aloud"><Volume2 className="size-6" aria-hidden /></Button>
          </div>
          {it.type === 'listen_choose' && <p className="mt-1 text-[15px] text-muted font-sans">Teacher: tap the speaker or say: “{audio}”</p>}

          {(it.type === 'mcq' || it.type === 'listen_choose') && (
            <div className={cn('mt-6 grid gap-3', (it.content.options?.length ?? 0) > 3 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
              {it.content.options!.map((o) => (
                <button key={o} disabled={busy} onClick={() => answer({ kind: 'choice', value: o })}
                  className="min-h-16 rounded-full border-2 border-line bg-white px-5 text-[26px] font-bold hover:border-primary disabled:opacity-60">{o}</button>
              ))}
            </div>
          )}

          {it.type === 'numeric' && (
            <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (numeric !== '') answer({ kind: 'numeric', value: Number(numeric) }); }}>
              <label htmlFor="num" className="sr-only">Answer</label>
              <input id="num" inputMode="numeric" value={numeric} readOnly className="mb-3 w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-center text-[36px] font-bold" aria-live="polite" />
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((k) => (
                  <button key={k} type={k === '✓' ? 'submit' : 'button'} disabled={busy || (k === '✓' && numeric === '')}
                    aria-label={k === '⌫' ? 'Delete' : k === '✓' ? 'Submit answer' : k}
                    onClick={k === '✓' ? undefined : () => setNumeric((n) => (k === '⌫' ? n.slice(0, -1) : (n + k).slice(0, 3)))}
                    className={cn('min-h-16 rounded-2xl text-[26px] font-bold disabled:opacity-50', k === '✓' ? 'bg-primary text-white' : 'border-2 border-line bg-white hover:border-primary')}>{k}</button>
                ))}
              </div>
            </form>
          )}

          {it.type === 'tap_word_sequence' && (
            <div className="mt-6 font-sans">
              <p className="mb-3 text-[14px] text-muted">Start the timer when the child begins. Tap a word to mark an error (tap again to change type). Untouched words count as read correctly.</p>
              <div className="mb-4 flex flex-wrap gap-2 font-[family-name:var(--font-child)]">
                {it.content.words!.map((w, i) => (
                  <button key={i} onClick={() => setMarks((m) => m.map((x, j) => (j === i ? MARKS[(MARKS.indexOf(x) + 1) % MARKS.length] : x)))}
                    className={cn('flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-3 text-[26px] font-bold', MARK_UI[marks[i] ?? 'correct'].cls)}
                    aria-label={`${w}: ${MARK_UI[marks[i] ?? 'correct'].label === '✓' ? 'read correctly' : MARK_UI[marks[i] ?? 'correct'].label}`}>
                    {w}<span className="text-[11px] font-semibold text-muted">{MARK_UI[marks[i] ?? 'correct'].label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-lg"><Timer className="size-5" aria-hidden /> {elapsed.toFixed(0)}s</span>
                {timer.start === null
                  ? <Button variant="secondary" onClick={() => setTimer((t) => ({ ...t, start: Date.now() }))}>{timer.elapsed ? 'Resume timer' : 'Start timer'}</Button>
                  : <Button variant="secondary" onClick={() => setTimer((t) => ({ start: null, elapsed: t.elapsed + (Date.now() - (t.start ?? Date.now())) / 1000 }))}>Stop timer</Button>}
                <Button disabled={busy} onClick={() => answer({ kind: 'oral', marks, seconds: Math.max(1, Math.round(elapsed)) })}>Save reading</Button>
              </div>
              <p className="mt-2 text-[13px] text-muted">If you did not time it, saving uses 1 second; accuracy is still recorded correctly.</p>
            </div>
          )}

          <div className="mt-6 flex justify-end font-sans">
            <Button variant="ghost" disabled={busy} onClick={() => answer({ kind: 'skip' })}><SkipForward className="size-4" aria-hidden /> Skip (not counted)</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
