'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Calculator, Layers, Volume2, SkipForward, Pause, Play, X, Timer, Eye, EyeOff, Check, CircleSlash, Repeat2, Undo2, Delete, ArrowLeft } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { IndexCard, NotADiagnosis, SampleDataBadge } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status';
import { Dialog } from '@/components/ui/dialog';
import { Illustration } from '@/components/ui/illustration';
import { CodeChip } from '@/components/ui/code-chip';
import { SkillLadder } from '@/components/learner/skill-ladder';
import { Counters } from '@/components/child/counters';
import { speak } from '@/components/child/speak';
import { completeSession, resumeSession, startSession, submitResponse } from '@/lib/actions/assessment';
import { SKILL_BY_ID, skillsForStrand } from '@/lib/content/skills';
import { INTERVENTIONS } from '@/lib/content/interventions';
import { cn, fmtDate } from '@/lib/utils';
import type { PublicItem } from '@/lib/server/items';
import type { StoredState } from '@/lib/server/engine';

type Strand = 'literacy' | 'numeracy';
type Phase = { kind: 'select' } | { kind: 'running'; strand: Strand; sessionId: string; item: PublicItem; answered: number } | { kind: 'results'; results: { strand: Strand; states: StoredState[] }[] };
type Mark = 'correct' | 'omitted' | 'substituted' | 'self_corrected';
const MARKS: Mark[] = ['correct', 'omitted', 'substituted', 'self_corrected'];
const MARK_UI: Record<Mark, { label: string; icon: typeof Check; cls: string }> = {
  correct: { label: 'Correct', icon: Check, cls: 'border-st-consistent bg-st-consistent-soft' },
  omitted: { label: 'Omitted', icon: CircleSlash, cls: 'border-stone bg-stone-soft text-ink-2 line-through' },
  substituted: { label: 'Substituted', icon: Repeat2, cls: 'border-st-notyet bg-st-notyet-soft' },
  self_corrected: { label: 'Self-corrected', icon: Undo2, cls: 'border-st-developing bg-st-developing-soft' },
};
const TILES = ['bg-violet-50', 'bg-violet-50', 'bg-violet-50', 'bg-violet-50'];
type Stone = 'answered' | 'skipped';

export function AssessmentRunner({ learner, isDemo, lastChecked }: { learner: { id: string; code: string; name: string; classroomId: string }; isDemo: boolean; lastChecked: Record<Strand, string | null> }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: 'select' });
  const [choice, setChoice] = useState<'literacy' | 'numeracy' | 'both'>('numeracy');
  const [queue, setQueue] = useState<Strand[]>([]);
  const [done, setDone] = useState<{ strand: Strand; states: StoredState[] }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [teacherView, setTeacherView] = useState(true);
  const [indicator, setIndicator] = useState<boolean | null>(null);
  const [ack, setAck] = useState(false);
  const [stones, setStones] = useState<Stone[]>([]);
  const [numeric, setNumeric] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [timer, setTimer] = useState<{ start: number | null; elapsed: number }>({ start: null, elapsed: 0 });
  const [oralResult, setOralResult] = useState<{ accuracy: number; wcpm: number } | null>(null);
  const [, tick] = useState(0);
  const shownAt = useRef(Date.now());
  const storageKey = `ls-session-${learner.id}`;

  useEffect(() => {
    let sid: string | null = null;
    try { sid = sessionStorage.getItem(storageKey); } catch {}
    if (!sid) return;
    resumeSession(sid).then((r) => {
      if (r.ok && !r.data.next.done) { setPhase({ kind: 'running', strand: r.data.strand, sessionId: sid!, item: r.data.next.item, answered: r.data.next.progress }); setStones(Array(r.data.next.progress).fill('answered')); }
      else try { sessionStorage.removeItem(storageKey); } catch {}
    });
  }, [storageKey]);
  useEffect(() => { if (timer.start === null) return; const t = setInterval(() => tick((n) => n + 1), 500); return () => clearInterval(t); }, [timer.start]);
  const item = phase.kind === 'running' ? phase.item : null;
  useEffect(() => {
    shownAt.current = Date.now(); setNumeric('');
    setMarks(item?.content.words ? item.content.words.map(() => 'correct') : []);
    setTimer({ start: null, elapsed: 0 });
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startStrand(strand: Strand) {
    const r = await startSession({ learnerId: learner.id, strand });
    if (!r.ok) { setError(r.error.message); return; }
    try { sessionStorage.setItem(storageKey, r.data.sessionId); } catch {}
    setStones([]);
    if (r.data.next.done) { await finish(r.data.sessionId, strand, false); return; }
    setPhase({ kind: 'running', strand, sessionId: r.data.sessionId, item: r.data.next.item, answered: 0 });
  }
  async function begin() {
    setError(null); setBusy(true); setDone([]);
    const strands: Strand[] = choice === 'both' ? ['literacy', 'numeracy'] : [choice];
    setQueue(strands.slice(1));
    await startStrand(strands[0]);
    setBusy(false);
  }
  async function finish(sessionId: string, strand: Strand, endedEarly: boolean) {
    setBusy(true); setConfirmEnd(false);
    const r = await completeSession({ sessionId, endedEarly });
    try { sessionStorage.removeItem(storageKey); } catch {}
    setBusy(false);
    if (!r.ok) { setError(r.error.message); return; }
    const results = [...done, { strand, states: r.data.states }];
    setDone(results);
    if (queue.length && !endedEarly) { const [next, ...rest] = queue; setQueue(rest); await startStrand(next); return; }
    setPhase({ kind: 'results', results });
    router.refresh();
  }

  const answer = useCallback(async (response: { kind: string; [k: string]: unknown }) => {
    if (phase.kind !== 'running' || busy) return;
    setBusy(true); setError(null);
    const r = await submitResponse({ sessionId: phase.sessionId, itemId: phase.item.id, response, timeMs: Date.now() - shownAt.current });
    setBusy(false);
    if (!r.ok) {
      setError('Saved so far. That answer did not reach the server. Try again.');
      const res = await resumeSession(phase.sessionId);
      if (res.ok && !res.data.next.done) setPhase({ ...phase, item: res.data.next.item, answered: res.data.next.progress });
      return;
    }
    setStones((s) => [...s, response.kind === 'skip' ? 'skipped' : 'answered']);
    setIndicator(r.data.correct);
    if (r.data.detail) setOralResult({ accuracy: r.data.detail.accuracy ?? 0, wcpm: r.data.detail.wcpm ?? 0 });
    if (response.kind !== 'skip') { setAck(true); setTimeout(() => setAck(false), 900); }
    if (r.data.next.done) { await finish(phase.sessionId, phase.strand, false); return; }
    setPhase({ ...phase, item: r.data.next.item, answered: phase.answered + 1 });
  }, [phase, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: 1–4 choose tiles, Enter confirms numeric.
  useEffect(() => {
    if (phase.kind !== 'running' || paused) return;
    const onKey = (e: KeyboardEvent) => {
      const opts = phase.item.content.options;
      if (opts && /^[1-4]$/.test(e.key) && opts[Number(e.key) - 1] && (phase.item.type === 'mcq' || phase.item.type === 'listen_choose')) answer({ kind: 'choice', value: opts[Number(e.key) - 1] });
      if (phase.item.type === 'numeric') {
        if (/^[0-9]$/.test(e.key)) setNumeric((n) => (n + e.key).slice(0, 3));
        if (e.key === 'Backspace') setNumeric((n) => n.slice(0, -1));
        if (e.key === 'Enter' && numeric !== '') answer({ kind: 'numeric', value: Number(numeric) });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, paused, numeric, answer]);

  const elapsed = timer.start !== null ? timer.elapsed + (Date.now() - timer.start) / 1000 : timer.elapsed;

  // ---------------- 7.10 Selection ----------------
  if (phase.kind === 'select') {
    const opts = [
      { id: 'literacy' as const, label: 'Literacy', icon: BookOpen, hue: 'sky' as const, mins: '8–10 min', covers: 'Letter sounds, blending, common words, reading a sentence, understanding a passage.', last: lastChecked.literacy },
      { id: 'numeracy' as const, label: 'Numeracy', icon: Calculator, hue: 'sun' as const, mins: '8–10 min', covers: 'Numbers to 20, counting, adding, taking away, place value, word problems.', last: lastChecked.numeracy },
      { id: 'both' as const, label: 'Both', icon: Layers, hue: 'teal' as const, mins: '16–20 min', covers: 'Literacy first, then numeracy. You can stop between them.', last: lastChecked.literacy && lastChecked.numeracy ? (lastChecked.literacy > lastChecked.numeracy ? lastChecked.literacy : lastChecked.numeracy) : null },
    ];
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href={`/learners/${learner.id}`} className="mb-4 inline-flex items-center gap-1 text-[14px] font-medium text-ink-2 hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> {learner.name}</Link>
        {isDemo && <div className="mb-3"><SampleDataBadge /></div>}
        <h1 className="text-[28px] font-bold sm:text-[36px]">Check {learner.name}</h1>
        <p className="mt-2 text-[16px] text-muted">You hold the device, read each question aloud (or tap the speaker) and tap the child&apos;s answer. There is no time limit.</p>
        {error && <ErrorPanel message={error} className="mt-5" />}
        <div role="radiogroup" aria-label="What to check" className="mt-8 grid gap-6 md:grid-cols-3">
          {opts.map((o) => {
            const on = choice === o.id;
            return (
              <button key={o.id} role="radio" aria-checked={on} onClick={() => setChoice(o.id)}
                className={cn('flex h-full flex-col rounded-[16px] bg-surface p-6 text-left shadow-card transition-colors', on ? 'border-2 border-ink' : 'border-2 border-line hover:border-line-strong')}>
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[13px] font-medium', o.last ? 'border border-tangerine-line bg-tangerine-tint text-tangerine-ink' : 'bg-violet-100 text-violet-700')}>{o.last ? 'Re-check' : 'Baseline'}</span>
                  <span aria-hidden className={cn('flex size-7 items-center justify-center rounded-full border-2', on ? 'border-ink bg-ink text-surface' : 'border-line-strong')}>{on && <Check className="size-4" />}</span>
                </div>
                <h2 className="mt-5 text-[20px] font-bold">{o.label}</h2>
                <p className="text-[15px] font-medium text-muted">About {o.mins}</p>
                <p className="mt-3 text-[15px] text-muted">{o.covers}</p>
                <p className="mt-4 text-[14px] text-muted">{o.last ? `Last checked ${fmtDate(o.last)}` : 'Not checked yet'}</p>
              </button>
            );
          })}
        </div>
        <section aria-labelledby="before" className="mt-8 rounded-[16px] border border-line bg-inset p-6">
          <h2 id="before" className="text-[16px] font-bold">Before you start</h2>
          <ul className="mt-3 space-y-2 text-[16px]">
            {['Find a quiet corner.', 'Make sure the child is comfortable and at ease.', 'You can pause or stop at any time. Answers so far are kept.'].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-violet-700" aria-hidden />{t}</li>)}
          </ul>
        </section>
        <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-surface px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <Button size="lg" onClick={begin} loading={busy} className="w-full sm:w-auto">Start {choice === 'both' ? 'both checks' : `${choice} check`}</Button>
        </div>
      </div>
    );
  }

  // ---------------- 7.13 Results ----------------
  if (phase.kind === 'results') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {isDemo && <div className="mb-3"><SampleDataBadge /></div>}
        <div className="flex items-center gap-4">
          <div className="w-20 shrink-0"><Illustration name="celebrate" /></div>
          <div>
            <h1 className="font-heading text-[30px] font-bold leading-9">Check complete · {phase.results.map((r) => r.strand).join(' and ')}</h1>
            <p className="text-ink-2">{learner.name} <CodeChip code={learner.code} copy={false} /></p>
          </div>
        </div>
        {phase.results.map(({ strand, states }) => {
          const ladder = skillsForStrand(strand);
          const sorted = [...states].sort((a, b) => SKILL_BY_ID[a.skill_id].sequence - SKILL_BY_ID[b.skill_id].sequence);
          const working = sorted.find((s) => s.state === 'not_yet' || (s.state === 'developing' && !(s.provisional && Number(s.p) >= 0.8)));
          const secure = sorted.filter((s) => SKILL_BY_ID[s.skill_id].sequence < (working ? SKILL_BY_ID[working.skill_id].sequence : 99) && s.state !== 'not_yet' && s.state !== 'insufficient');
          const thin = sorted.find((s) => s.state === 'insufficient');
          const summary = sorted.length === 0 ? 'No questions were answered.'
            : `${secure.length ? `Secure on ${secure[0].skill_id}${secure.length > 1 ? `–${secure[secure.length - 1].skill_id}` : ''}. ` : ''}${working ? `Working on ${working.skill_id}: ${SKILL_BY_ID[working.skill_id].name.toLowerCase()}.`
              : thin ? `Not enough evidence yet on ${thin.skill_id} ${SKILL_BY_ID[thin.skill_id].shortName.toLowerCase()}. A few more questions are needed.` : 'No gaps flagged on the skills checked.'}`;
          const by = (k: StoredState['state'][]) => sorted.filter((s) => k.includes(s.state));
          return (
            <section key={strand} className="mt-10 space-y-6" aria-label={`${strand} results`}>
              <p className="font-heading text-[20px] font-semibold">{summary}</p>
              <IndexCard><SkillLadder strand={strand} states={states} /></IndexCard>
              <div className="grid gap-6 md:grid-cols-3">
                {([['Demonstrated consistently', ['consistent'], 'teal'], ['Developing', ['developing'], 'sky'], ['Not yet demonstrated', ['not_yet', 'insufficient'], 'clay']] as const).map(([title, keys, tone]) => (
                  <IndexCard key={title} tab={title} tabTone={tone}>
                    {by([...keys]).length === 0 ? <p className="text-[14px] text-ink-2">None from this check.</p> : (
                      <ul className="space-y-2">{by([...keys]).map((s) => <li key={s.skill_id} className="flex items-center justify-between gap-2 text-[14px]"><span><span className="font-mono text-[12px] text-ink-2">{s.skill_id}</span> {SKILL_BY_ID[s.skill_id].shortName}</span><StatusPill state={s.state} size="sm" short /></li>)}</ul>
                    )}
                  </IndexCard>
                ))}
              </div>
              {states.some((s) => s.provisional) && (
                <IndexCard tab="Note" tabTone="stone" className="bg-inset"><p className="text-[15px]">Based on one session. A re-check in 1–2 weeks makes this more reliable.</p></IndexCard>
              )}
              {working && (
                <IndexCard tab="Recommended" tabTone="tangerine">
                  <p className="font-heading text-[16px] font-semibold">{working.skill_id} {SKILL_BY_ID[working.skill_id].name}</p>
                  <p className="mt-1 text-[15px] leading-7">{INTERVENTIONS[working.skill_id].activity}</p>
                  <p className="text-[14px] leading-7 text-ink-2">Materials: {INTERVENTIONS[working.skill_id].materials}. Success check: {INTERVENTIONS[working.skill_id].successCheck}.</p>
                </IndexCard>
              )}
              <span className="sr-only">{ladder.length} skills on this strand.</span>
            </section>
          );
        })}
        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonLink href={`/learners/${learner.id}`}>Save and view recommendations</ButtonLink>
          <Button variant="secondary" onClick={() => { setPhase({ kind: 'select' }); setDone([]); }}>Check another strand</Button>
          <ButtonLink href={`/classrooms/${learner.classroomId}`} variant="ghost">Back to Today</ButtonLink>
        </div>
        <NotADiagnosis />
      </div>
    );
  }

  // ---------------- 7.11 / 7.12 Runner ----------------
  const it = phase.item;
  const audio = it.content.audioText ?? it.content.stem;
  const isChoice = it.type === 'mcq' || it.type === 'listen_choose';
  const wordsCorrect = marks.filter((m) => m === 'correct' || m === 'self_corrected').length;
  return (
    <div className="flex min-h-dvh flex-col">
      {/* slim top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Button variant="ghost" size="sm" onClick={() => setConfirmEnd(true)} disabled={busy}><X className="size-4" aria-hidden /> End early</Button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-[14px] font-semibold">{learner.name} <span className="font-mono text-[12px] font-normal text-ink-2">{learner.code}</span></div>
            <ol className="mt-1 flex justify-center gap-1" aria-label={`Question ${phase.answered + 1}`}>
              {stones.slice(-14).map((s, i) => <li key={i} className={cn('h-2 w-3 rounded-[50%]', s === 'answered' ? 'bg-teal' : 'border border-ink-3')} aria-hidden />)}
              <li className="h-2 w-3 rounded-[50%] bg-sun ring-2 ring-sun/30" aria-hidden />
            </ol>
          </div>
          {it.type === 'tap_word_sequence' && <span className="inline-flex items-center gap-1 font-mono text-[14px]"><Timer className="size-4" aria-hidden />{elapsed.toFixed(0)}s</span>}
          <button onClick={() => setTeacherView((v) => !v)} aria-pressed={teacherView} aria-label={teacherView ? 'Hide teacher indicator' : 'Show teacher indicator'} className="flex size-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-paper-2">{teacherView ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
          <Button variant="secondary" size="sm" onClick={() => setPaused(true)} aria-label="Pause"><Pause className="size-4" aria-hidden /><span className="hidden sm:inline">Pause</span></Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="mb-2 flex items-center justify-between text-[13px] text-ink-2">
          <span className="capitalize">{phase.strand} · <span className="font-mono">{it.skillId}</span> {SKILL_BY_ID[it.skillId].shortName}</span>
          {teacherView && indicator !== null && <span aria-live="polite" className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold', indicator ? 'bg-leaf-soft text-st-consistent' : 'bg-stone-soft text-ink-2')} title="Visible to you only">Teacher: last answer {indicator ? 'correct' : 'not yet'}</span>}
        </div>
        {error && <ErrorPanel message={error} className="mb-4" />}

        {paused ? (
          <IndexCard className="py-16 text-center"><h2 className="font-heading text-[30px] font-bold">Paused</h2><p className="mt-1 text-ink-2">Take your time.</p><Button className="mt-5" size="lg" onClick={() => setPaused(false)}><Play className="size-5" aria-hidden /> Continue</Button></IndexCard>
        ) : (
          <div className="relative rounded-[24px] border border-line bg-card p-5 shadow-card sm:p-8 font-[family-name:var(--font-child)]">
            <p aria-live="polite" className={cn('pointer-events-none absolute inset-x-0 -top-4 mx-auto w-fit rounded-full bg-leaf-soft px-4 py-1 text-[15px] font-bold text-st-consistent transition-opacity', ack ? 'opacity-100' : 'opacity-0')}>Thanks, next one</p>
            {it.content.passage && it.type !== 'tap_word_sequence' && <p className="mb-5 rounded-[16px] bg-paper-2 p-4 text-[24px] leading-relaxed">{it.content.passage}</p>}
            {it.content.picture && <Counters picture={it.content.picture} className="mb-5" />}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[32px] font-extrabold leading-[42px] sm:text-[40px] sm:leading-[50px]">{it.type === 'listen_choose' ? 'Listen…' : it.content.stem}</h1>
              <button onClick={() => speak(audio)} aria-label="Read the question aloud" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-violet text-white shadow-[0_6px_16px_rgba(91,63,224,.32)] active:translate-y-0.5 active:shadow-none"><Volume2 className="size-6" aria-hidden /></button>
            </div>
            {it.type === 'listen_choose' && <p className="mt-1 font-sans text-[14px] text-ink-2">Teacher: tap the speaker or say “{audio}”.</p>}

            {isChoice && (
              <div className={cn('mt-6 grid gap-3', it.content.options!.length === 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
                {it.content.options!.map((o, i) => (
                  <button key={o} disabled={busy} onClick={() => answer({ kind: 'choice', value: o })}
                    className={cn('relative min-h-24 rounded-[24px] border-[3px] border-white px-4 text-[28px] font-extrabold shadow-[0_0_0_1px_var(--line)] transition-transform hover:-translate-y-0.5 active:scale-[.98] disabled:opacity-60 dark:border-card', TILES[i % 4])}>
                    <span className="absolute left-3 top-2 font-sans text-[12px] font-semibold text-ink-3" aria-hidden>{i + 1}</span>{o}
                  </button>
                ))}
              </div>
            )}

            {it.type === 'numeric' && (
              <div className="mx-auto mt-6 max-w-sm">
                <output aria-live="polite" className="mb-3 flex h-20 items-center justify-center rounded-[18px] border-2 border-line-strong bg-paper text-[44px] font-extrabold tabular">{numeric || <span className="text-ink-3">?</span>}</output>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((k) => (
                    <button key={k} disabled={busy || (k === 'ok' && numeric === '')} aria-label={k === 'del' ? 'Delete' : k === 'ok' ? 'Check' : k}
                      onClick={() => (k === 'ok' ? answer({ kind: 'numeric', value: Number(numeric) }) : setNumeric((n) => (k === 'del' ? n.slice(0, -1) : (n + k).slice(0, 3))))}
                      className={cn('flex min-h-16 items-center justify-center rounded-[18px] text-[28px] font-extrabold disabled:opacity-40', k === 'ok' ? 'bg-teal text-white dark:text-[#06222A]' : 'border-2 border-line bg-card hover:border-teal')}>
                      {k === 'del' ? <Delete className="size-6" /> : k === 'ok' ? <span className="text-[20px]">Check</span> : k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {it.type === 'tap_word_sequence' && (
              <div className="mt-6 font-sans">
                <p className="mb-3 text-[14px] text-ink-2">Start the timer when the child begins. Tap a word to change its mark: correct → omitted → substituted → self-corrected.</p>
                <div className="mb-4 flex flex-wrap gap-2 font-[family-name:var(--font-child)]">
                  {it.content.words!.map((w, i) => {
                    const m = MARK_UI[marks[i] ?? 'correct']; const Icon = m.icon;
                    return (
                      <button key={i} onClick={() => setMarks((ms) => ms.map((x, j) => (j === i ? MARKS[(MARKS.indexOf(x) + 1) % MARKS.length] : x)))}
                        className={cn('flex min-h-16 flex-col items-center justify-center rounded-[16px] border-2 px-3 text-[32px] font-extrabold leading-9', m.cls)} aria-label={`${w}: ${m.label}`}>
                        {w}<span className="flex items-center gap-0.5 font-sans text-[11px] font-semibold text-ink-2"><Icon className="size-3" aria-hidden />{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-leaf-soft px-3 py-1 text-[14px] font-semibold text-st-consistent tabular">{wordsCorrect}/{marks.length} words correct</span>
                  {timer.start === null
                    ? <Button variant="secondary" onClick={() => setTimer((t) => ({ ...t, start: Date.now() }))}><Timer className="size-4" aria-hidden />{timer.elapsed ? 'Resume timer' : 'Start timer'}</Button>
                    : <Button variant="secondary" onClick={() => setTimer((t) => ({ start: null, elapsed: t.elapsed + (Date.now() - (t.start ?? Date.now())) / 1000 }))}>Stop timer</Button>}
                  <Button disabled={busy} onClick={() => answer({ kind: 'oral', marks, seconds: Math.max(1, Math.round(elapsed)) })}>Finish</Button>
                </div>
              </div>
            )}
            {oralResult && it.type !== 'tap_word_sequence' && teacherView && (
              <p className="mt-4 font-sans text-[13px] text-ink-2">Last reading: {Math.round(oralResult.accuracy * 100)}% accuracy, {oralResult.wcpm} words correct per minute.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[12px] text-ink-2">{isChoice ? 'Keys 1–4 choose an answer.' : it.type === 'numeric' ? 'Type digits, Enter to check.' : ''}</span>
          <Button variant="ghost" disabled={busy || paused} onClick={() => answer({ kind: 'skip' })}><SkipForward className="size-4" aria-hidden /> Skip (not counted)</Button>
        </div>
      </main>

      <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)} title="End this check early?">
        <p className="text-[15px]">{phase.answered} answer{phase.answered === 1 ? ' is' : 's are'} saved and will be scored. Skills not reached stay as they were.{queue.length ? ` The ${queue.join(' and ')} check will not start.` : ''}</p>
        <div className="mt-5 flex gap-2"><Button onClick={() => finish(phase.sessionId, phase.strand, true)} loading={busy}>End and see results</Button><Button variant="ghost" onClick={() => setConfirmEnd(false)}>Keep going</Button></div>
      </Dialog>
    </div>
  );
}
