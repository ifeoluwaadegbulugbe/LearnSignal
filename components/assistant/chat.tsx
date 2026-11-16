'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Sparkles, RefreshCw, Database, Lightbulb, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; text: string; asOf?: string; tools?: string[]; blocked?: boolean };
export const SUGGESTED: { theme: string; qs: string[] }[] = [
  { theme: 'Gaps', qs: ['Who needs subtraction support?', 'Which skills have the most gaps in my class?'] },
  { theme: 'Progress', qs: ['What changed since the last assessment?', 'Who has not been assessed yet?'] },
  { theme: 'Planning', qs: ['Give me a 15-minute blending activity.', 'Which group should I start with this week?'] },
];
const WORKING = ['Looking at your class data…', 'Checking skill states…', 'Matching learners to skills…'];
const NO_DATA = "I don't have data for that.";

export function AssistantChat({ classrooms, learners, aiReady, compact, initialClassroomId, seedQuestion }: {
  classrooms: { id: string; name: string }[]; learners: { id: string; code: string; display_name: string }[]; aiReady: boolean;
  compact?: boolean; initialClassroomId?: string; seedQuestion?: string;
}) {
  const [classroomId, setClassroomId] = useState(initialClassroomId ?? classrooms[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [workingIdx, setWorkingIdx] = useState(0);
  const [error, setError] = useState<{ message: string; q: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const byCode = new Map(learners.map((l) => [l.code, l]));

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [msgs, loading]);
  useEffect(() => { if (!loading) return; const t = setInterval(() => setWorkingIdx((i) => (i + 1) % WORKING.length), 1400); return () => clearInterval(t); }, [loading]);
  useEffect(() => { if (seedQuestion) ask(seedQuestion); }, [seedQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function ask(q: string) {
    const text = q.trim();
    if (!text || loading || !classroomId) return;
    setError(null); setLoading(true); setQuestion(''); setWorkingIdx(0);
    setMsgs((m) => [...m, { role: 'user', text }]);
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classroomId, question: text }) });
      const json = await res.json();
      if (!json.ok) { setError({ message: json.error?.message ?? 'The assistant could not answer.', q: text }); return; }
      setMsgs((m) => [...m, { role: 'assistant', text: json.data.answer, asOf: json.data.asOf, tools: json.data.toolCalls, blocked: json.data.blocked }]);
    } catch {
      setError({ message: 'Could not reach the server. Check your connection.', q: text });
    } finally {
      setLoading(false);
    }
  }

  /** Learner codes become chips linking to profiles; the name is resolved here, the model only saw the code. */
  const inline = (line: string) => line.split(/(LS-[A-Z0-9]{6})/g).map((part, i) => {
    const l = byCode.get(part);
    return l ? (
      <Link key={i} href={`/learners/${l.id}`} className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-line bg-surface py-0.5 pl-0.5 pr-2 align-middle text-[13px] font-semibold hover:border-primary">
        <Avatar name={l.display_name} seed={l.code} size={24} /> {l.display_name} <span className="font-mono text-[11px] font-normal text-ink-3">{part}</span>
      </Link>
    ) : <Fragment key={i}>{part}</Fragment>;
  });
  const renderAnswer = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());
    const items = lines.filter((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
    if (items.length >= 2) {
      const intro = lines.filter((l) => !items.includes(l));
      return <>{intro.map((l, i) => <p key={i}>{inline(l)}</p>)}<ul className="mt-2 divide-y divide-line rounded-[12px] border border-line bg-surface-2">{items.map((l, i) => <li key={i} className="px-3 py-2">{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>)}</ul></>;
    }
    return lines.map((l, i) => <p key={i} className={i ? 'mt-2' : ''}>{inline(l)}</p>);
  };

  const asOf = [...msgs].reverse().find((m) => m.asOf)?.asOf;

  return (
    <div className={cn('flex min-h-0 flex-col', compact ? 'h-[70dvh] sm:h-[calc(100dvh-120px)]' : 'h-[calc(100dvh-220px)] min-h-[520px]')}>
      {classrooms.length > 1 && (
        <div className="mb-3"><label htmlFor="as-cls" className="sr-only">Classroom</label>
          <Select id="as-cls" value={classroomId} onChange={(e) => { setClassroomId(e.target.value); setMsgs([]); }}>{classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </div>
      )}
      {!aiReady && (
        <div className="mb-3 rounded-[14px] bg-amber-bg p-3 text-[13px] text-amber-ink">
          The assistant is unavailable right now (AI is off or not configured). <Link href="/dashboard" className="font-semibold underline">Dashboards</Link> still work.
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
        {msgs.length === 0 && (
          <div className="py-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-g-lime text-[#0E1220]"><Sparkles className="size-4" aria-hidden /></span>
              <div className="rounded-[18px] rounded-tl-md border border-line bg-surface px-4 py-3 text-[14px]">
                Hi! Ask me about your class. I answer only from your data, refer to learners by code (you see names), and say so when I don&apos;t know.
              </div>
            </div>
            {compact && (
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTED.flatMap((g) => g.qs).slice(0, 4).map((s) => <button key={s} onClick={() => ask(s)} disabled={!aiReady || loading} className="rounded-full border border-line bg-surface px-3 py-2 text-left text-[13px] hover:border-primary disabled:opacity-50">{s}</button>)}
              </div>
            )}
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user' ? (
          <div key={i} className="ml-auto w-fit max-w-[85%] rounded-[18px] rounded-tr-md bg-primary-soft px-4 py-2.5 text-[14px] text-primary-ink">{m.text}</div>
        ) : (
          <div key={i} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-g-lime text-[#0E1220]"><Sparkles className="size-4" aria-hidden /></span>
            <div className="min-w-0 max-w-[85%]">
              {m.text === NO_DATA || m.blocked ? (
                <div className="flex items-start gap-2 rounded-[18px] rounded-tl-md border border-dashed border-line-strong bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />{m.text === NO_DATA ? "I don't have data for that yet." : m.text}
                </div>
              ) : /^General guidance/i.test(m.text) ? (
                <div className="rounded-[18px] rounded-tl-md border border-st-developing/30 bg-st-developing-soft px-4 py-3 text-[14px]">
                  <span className="mb-1 flex items-center gap-1 text-[12px] font-bold text-st-developing"><Lightbulb className="size-3.5" aria-hidden /> General teaching guidance · not from your class data</span>
                  {renderAnswer(m.text.replace(/^General guidance[^:]*:\s*/i, ''))}
                </div>
              ) : (
                <div className="rounded-[18px] rounded-tl-md border border-line bg-surface px-4 py-3 text-[14px] shadow-card">
                  {renderAnswer(m.text)}
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint-bg px-2 py-0.5 text-[11px] font-semibold text-mint-ink"><Database className="size-3" aria-hidden /> Sources: class data</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-[13px] text-ink-2" role="status">
            <span className="flex size-9 items-center justify-center rounded-full bg-g-lime text-[#0E1220]"><Sparkles className="size-4 animate-pulse" aria-hidden /></span>{WORKING[workingIdx]}
          </div>
        )}
        <div ref={endRef} />
      </div>
      {error && <ErrorPanel className="mt-3" message={error.message} retry={() => ask(error.q)} />}
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-3">
        <span>{asOf ? `Data as of ${new Date(asOf).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Answers use live class data'}</span>
        {msgs.length > 0 && <button onClick={() => { setMsgs([]); setError(null); }} className="inline-flex items-center gap-1 font-semibold text-primary"><RefreshCw className="size-3" aria-hidden /> New chat</button>}
      </div>
      <form className="mt-2 flex items-end gap-2 rounded-[18px] border border-line-strong bg-surface p-2 focus-within:shadow-[var(--focus)]" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
        <label htmlFor="as-q" className="sr-only">Your question</label>
        <textarea id="as-q" rows={1} maxLength={300} placeholder="Ask about your class…" value={question} disabled={!aiReady}
          onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(question); } }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-ink-3" />
        <span className="pb-2.5 text-[11px] tabular text-ink-3">{question.length}/300</span>
        <Button type="submit" size="sm" pill loading={loading} disabled={!aiReady || !question.trim()} aria-label="Send" className="size-10 p-0"><ArrowUp className="size-4" /></Button>
      </form>
    </div>
  );
}
