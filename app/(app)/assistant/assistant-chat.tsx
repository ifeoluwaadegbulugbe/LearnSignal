'use client';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Send, Bot, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, Field, Input, Select } from '@/components/ui/primitives';
import { ErrorPanel } from '@/components/ui/states';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; text: string; asOf?: string; codes?: string[]; tools?: string[]; blocked?: boolean };
const SUGGESTED = [
  'Who needs subtraction support?',
  'Which skills have the most gaps in my class?',
  'What changed since the last assessment?',
  'Give me a 15-minute blending activity.',
];

export function AssistantChat({ classrooms, learners, aiReady }: { classrooms: { id: string; name: string }[]; learners: { id: string; code: string; display_name: string }[]; aiReady: boolean }) {
  const [classroomId, setClassroomId] = useState(classrooms[0].id);
  const [question, setQuestion] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; q: string } | null>(null);
  const byCode = new Map(learners.map((l) => [l.code, l]));

  async function ask(q: string) {
    const text = q.trim();
    if (!text || loading) return;
    setError(null); setLoading(true); setQuestion('');
    setMsgs((m) => [...m, { role: 'user', text }]);
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classroomId, question: text }) });
      const json = await res.json();
      if (!json.ok) { setError({ message: json.error?.message ?? 'The assistant could not answer.', q: text }); return; }
      setMsgs((m) => [...m, { role: 'assistant', text: json.data.answer, asOf: json.data.asOf, codes: json.data.citedCodes, tools: json.data.toolCalls, blocked: json.data.blocked }]);
    } catch {
      setError({ message: 'Could not reach the server. Check your connection.', q: text });
    } finally {
      setLoading(false);
    }
  }

  /** Replace codes with links showing the local display name (the model never saw names). */
  const render = (text: string) => text.split(/(LS-[A-Z0-9]{6})/g).map((part, i) => {
    const l = byCode.get(part);
    return l ? <Link key={i} href={`/learners/${l.id}`} className="font-semibold text-primary underline">{l.display_name} ({part})</Link> : <Fragment key={i}>{part}</Fragment>;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Card className="flex min-h-[60dvh] flex-col">
        {!aiReady && <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-[14px] text-[#7A4E0C]">The assistant is unavailable on this deployment (AI is off or not configured). Dashboards and groups still work.</p>}
        <div className="flex-1 space-y-4 overflow-y-auto" aria-live="polite">
          {msgs.length === 0 && (
            <div className="py-6 text-center">
              <Bot className="mx-auto mb-2 size-8 text-primary" aria-hidden />
              <p className="text-[15px] text-muted">Try a question:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGGESTED.map((s) => <button key={s} onClick={() => ask(s)} disabled={!aiReady || loading} className="rounded-full border border-line bg-white px-3 py-2 text-[14px] hover:border-primary disabled:opacity-50">{s}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-[15px]', m.role === 'user' ? 'ml-auto bg-primary text-white' : 'bg-bg')}>
              <p className="whitespace-pre-wrap">{m.role === 'assistant' ? render(m.text) : m.text}</p>
              {m.role === 'assistant' && (
                <p className="mt-2 text-[12px] text-muted">
                  Data as of {m.asOf ? new Date(m.asOf).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  {m.tools?.length ? ` · looked up: ${m.tools.join(', ').replace(/_/g, ' ')}` : ''}
                  {m.blocked ? ' · an unsupported answer was withheld' : ''}
                </p>
              )}
            </div>
          ))}
          {loading && <div className="max-w-[85%] rounded-2xl bg-bg px-4 py-3 text-[15px] text-muted" role="status">Looking at your class data…</div>}
        </div>
        {error && <ErrorPanel className="mt-3" message={error.message} retry={() => ask(error.q)} />}
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
          <label htmlFor="q" className="sr-only">Your question</label>
          <Input id="q" maxLength={300} placeholder="Ask about your class…" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={!aiReady} />
          <Button type="submit" loading={loading} disabled={!aiReady || !question.trim()} aria-label="Send"><Send className="size-4" /></Button>
        </form>
      </Card>
      <aside className="space-y-4">
        <Card>
          <Field label="Classroom" htmlFor="cls"><Select id="cls" value={classroomId} onChange={(e) => { setClassroomId(e.target.value); setMsgs([]); }}>{classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        </Card>
        <Card className="text-[14px] text-muted">
          <p className="mb-2 flex items-center gap-1 font-semibold text-ink"><Info className="size-4" aria-hidden /> How it works</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>The AI looks up your class with fixed tools, under your own permissions.</li>
            <li>It sees learner codes, never names. Names are filled in on your screen only.</li>
            <li>If there is no data, it says so. It never guesses causes or labels children.</li>
            <li>Activity ideas are marked as general guidance.</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
