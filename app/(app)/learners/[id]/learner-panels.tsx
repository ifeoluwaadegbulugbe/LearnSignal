'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, Field, Textarea } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { addNote, setRecommendationStatus } from '@/lib/actions/learners';
import { fmtDate } from '@/lib/utils';

export function NotesPanel({ learnerId, notes }: { learnerId: string; notes: { id: string; body: string; created_at: string }[] }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <Card>
      <h2 className="mb-2 text-lg font-bold">Notes</h2>
      <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await addNote({ learnerId, body });
        if (!r.ok) { setError(r.error.fields?.body ?? r.error.message); return; }
        setBody(''); setError(undefined); toast('Note saved.'); router.refresh();
      }); }}>
        <Field label="Add a note" htmlFor="note" error={error} hint="Observations about skills only. Avoid health or family details.">
          <Textarea id="note" maxLength={1000} rows={3} value={body} onChange={(e) => setBody(e.target.value)} invalid={!!error} />
        </Field>
        <Button type="submit" size="sm" loading={pending}>Save note</Button>
      </form>
      {notes.length > 0 && (
        <ul className="mt-4 space-y-3">
          {notes.map((n) => <li key={n.id} className="border-l-2 border-line pl-3 text-[14px]"><p className="whitespace-pre-wrap">{n.body}</p><p className="text-[12px] text-muted">{fmtDate(n.created_at)}</p></li>)}
        </ul>
      )}
    </Card>
  );
}

export function RecommendationActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const act = (status: 'accepted' | 'dismissed') => start(async () => {
    const r = await setRecommendationStatus(id, status);
    if (!r.ok) { toast(r.error.message, 'error'); return; }
    toast(status === 'accepted' ? 'Recommendation accepted.' : 'Recommendation dismissed.'); router.refresh();
  });
  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => act('accepted')}>Accept</Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => act('dismissed')}>Dismiss</Button>
    </div>
  );
}
