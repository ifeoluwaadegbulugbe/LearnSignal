'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, RefreshCw, Lightbulb, Info, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndexCard, Select } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';
import { Avatar } from '@/components/ui/avatar';
import { SignalMark } from '@/components/ui/signal';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; text: string; asOf?: string; tools?: string[]; blocked?: boolean };
export const SUGGESTED: { theme: string; qs: string[] }[] = [
  { theme: 'Gaps', qs: ['Who needs subtraction support?', 'Which skills have the most gaps in my class?'] },
  { theme: 'Progress', qs: ['What changed since the last assessment?', 'How is the class doing overall?'] },
  { theme: 'Planning', qs: ['Give me a 15-minute blending activity.', 'Which group should I start with this week?'] },
];
const READING = ['Reading your class data…', 'Reading skill states…', 'Reading recent results…'];
const NO_DATA = "I don't have data for that.";

export function AssistantChat({ classrooms, learners, aiReady, compact, initialClassroomId, seedQuestion }: {
  classrooms: { id: string; name: string }[]; learners: { id: string; code: string; display_name: string }[]; aiReady: boolean;
  compact?: boolean; initialClassroomId?: string; seedQuestion?: string;
}) {
  const [classroomId, setClassroomId] = useState(initialClassroomId ?? classrooms[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [readingIdx, setReadingIdx] = useState(0);
  const [error, setError] = useState<{ message: string; q: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const byCode = new Map(learners.map((l) => [l.code, l]));

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [msgs, loading]);
  useEffect(() => { if (!loading) return; const t = setInterval(() => setReadingIdx((i) => (i + 1) % READING.length), 1400); return () => clearInterval(t); }, [loading]);
  useEffect(() => { if (seedQuestion) ask(seedQuestion); }, [seedQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function ask(q: string) {
    const text = q.trim();
    if (!text || loading || !classroomId) return;
    setError(null); setLoading(true); setQuestion(''); setReadingIdx(0);
    setMsgs((m) => [...m, { role: 'user', text }]);
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classroomId, question: text }) });
      const json = await res.json();
      if (!json.ok) { setError({ message: json.error?.message ?? 'Something went wrong on our side. Try again.', q: text }); return; }
      setMsgs((m) => [...m, { role: 'assistant', text: json.data.answer, asOf: json.data.asOf, tools: json.data.toolCalls, blocked: json.data.blocked }]);
    } catch {
      setError({ message: 'Could not reach the server. Check your connection and try again.', q: text });
    } finally { setLoading(false); }
  }

  /** Codes become learner chips; names are resolved here, the model only saw the code. */
  const inline = (line: string) => line.split(/(LS-[A-Z0-9]{6})/g).map((part, i) => {
    const l = byCode.get(part);
    return l ? (
      <Link key={i} href={`/learners/${l.id}`} className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-line bg-card py-0.5 pl-0.5 pr-2 align-middle text-[13px] font-semibold hover:border-teal">
        <Avatar name={l.display_name} seed={l.code} size={24} label="" /> {l.display_name} <span className="font-mono text-[11px] font-normal text-ink-2">{part}</span>
      </Link>
    ) : <Fragment key={i}>{part}</Fragment>;
  });
  const renderAnswer = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim());
    const items = lines.filter((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
    if (items.length >= 2) {
      return <>{lines.filter((l) => !items.includes(l)).map((l, i) => <p key={i}>{inline(l)}</p>)}
        <ul className="mt-2 divide-y divide-line rounded-[12px] border border-line bg-card">{items.map((l, i) => <li key={i} className="px-3 py-2">{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>)}</ul></>;
    }
    return lines.map((l, i) => <p key={i} className={i ? 'mt-2' : ''}>{inline(l)}</p>);
  };
  const asOf = [...msgs].reverse().find((m) => m.asOf)?.asOf;

  return (
    <div className={cn('flex min-h-0 flex-col', compact ? 'h-[70dvh] sm:h-[calc(100dvh-130px)]' : 'h-[calc(100dvh-230px)] min-h-[540px]')}>
      {classrooms.length > 1 && (
        <div className="mb-3"><label htmlFor="as-cls" className="sr-only">Classroom</label>
          <Select id="as-cls" value={classroomId} onChange={(e) => { setClassroomId(e.target.value); setMsgs([]); }}>{classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </div>
      )}
      {!aiReady && (
        <IndexCard tab="Unavailable" tabTone="stone" className="mb-4">
          <p className="text-[15px]">Ask is unavailable right now (AI is off or not configured).</p>
          <p className="mt-1 text-[14px] text-ink-2">Your <Link href="/dashboard" className="font-semibold text-teal underline">class pages</Link> still show every learner&apos;s skills and groups.</p>
        </IndexCard>
      )}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 pt-3" aria-live="polite">
        {msgs.length === 0 && (
          <div>
            <IndexCard tab="Answer" tabTone="teal">
              <p className="text-[15px]">Ask about your class. I answer only from your class data, refer to learners by code (you see their names), and say so when I don&apos;t know.</p>
            </IndexCard>
            <div className="mt-6 space-y-4">
              {SUGGESTED.map((g) => (
                <div key={g.theme}>
                  <p className="mb-2 text-[12px] font-medium tracking-[.02em] text-ink-2">{g.theme}</p>
                  <div className="flex flex-wrap gap-2">{g.qs.map((s) => <button key={s} onClick={() => ask(s)} disabled={!aiReady || loading} className="min-h-10 rounded-full border border-line-strong bg-card px-3.5 text-left text-[14px] hover:border-teal hover:bg-teal-soft disabled:opacity-50">{s}</button>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user' ? (
          <div key={i} className="ml-auto w-fit max-w-[85%] rounded-[18px] rounded-br-md bg-teal-soft px-4 py-2.5 text-[15px] text-teal-ink dark:text-teal">{m.text}</div>
        ) : m.text === NO_DATA || m.blocked ? (
          <IndexCard key={i} tab="Answer" tabTone="stone" className="max-w-[92%]"><p className="flex items-start gap-2 text-[15px] text-ink-2"><Info className="mt-1 size-4 shrink-0" aria-hidden />{m.text === NO_DATA ? "I don't have data for that yet." : m.text}</p></IndexCard>
        ) : /^General guidance/i.test(m.text) ? (
          <IndexCard key={i} tab="General guidance" tabTone="sun" tint="sun" className="max-w-[92%] border-transparent">
            <p className="mb-2 flex items-center gap-1 text-[12px] font-semibold text-sun-ink dark:text-sun"><Lightbulb className="size-3.5" aria-hidden /> General guidance, not from your class data</p>
            <div className="text-[15px]">{renderAnswer(m.text.replace(/^General guidance[^:]*:\s*/i, ''))}</div>
          </IndexCard>
        ) : (
          <IndexCard key={i} tab="Answer" tabTone="teal" className="max-w-[92%]">
            <div className="text-[15px]">{renderAnswer(m.text)}</div>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2"><Database className="size-3" aria-hidden /> From your class data</span>
          </IndexCard>
        ))}
        {loading && <p className="flex items-center gap-2 text-[14px] text-ink-2" role="status"><SignalMark level={3} size={20} animate /> {READING[readingIdx]}</p>}
        <div ref={endRef} />
      </div>
      {error && <ErrorPanel className="mt-3" message={error.message} retry={() => ask(error.q)} />}
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-2">
        <span>{asOf ? `Answers use your class data as of ${new Date(asOf).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Answers use your live class data'}</span>
        {msgs.length > 0 && <button onClick={() => { setMsgs([]); setError(null); }} className="inline-flex items-center gap-1 font-semibold text-teal"><RefreshCw className="size-3" aria-hidden /> New conversation</button>}
      </div>
      <form className="mt-2 flex items-end gap-2 rounded-[16px] border border-line-strong bg-card p-2 focus-within:shadow-[var(--focus)]" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
        <label htmlFor="as-q" className="sr-only">Your question</label>
        <textarea id="as-q" rows={1} maxLength={300} placeholder="Ask about your class…" value={question} disabled={!aiReady}
          onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(question); } }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-ink-3" />
        <span className="pb-2.5 text-[11px] tabular text-ink-3">{question.length}/300</span>
        <Button type="submit" size="sm" loading={loading} disabled={!aiReady || !question.trim()} aria-label="Send" className="size-10 p-0"><ArrowUp className="size-4" /></Button>
      </form>
    </div>
  );
}
