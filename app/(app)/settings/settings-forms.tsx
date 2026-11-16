'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Trash2, RotateCcw, Plus } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge, Card, Field, Input, Select } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { deleteClassroom, setAiEnabled, updateProfile } from '@/lib/actions/setup';
import { deleteLearner } from '@/lib/actions/learners';
import { resetDemoClass } from '@/lib/actions/demo';
import type { ClassroomLite } from '@/lib/server/context';

type L = { id: string; code: string; name: string; classroomId: string; archived: boolean; states: { skill_id: string; state: string }[] };

export function SettingsForms({ fullName, email, aiEnabled, aiServer, schools, classrooms, learners, isDemo }: {
  fullName: string; email: string; aiEnabled: boolean; aiServer: { enabled: boolean; ready: boolean; model: string | null };
  schools: { id: string; name: string; role: string }[]; classrooms: ClassroomLite[]; learners: L[]; isDemo: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [name, setName] = useState(fullName);
  const [nameErr, setNameErr] = useState<string>();
  const [del, setDel] = useState<null | { kind: 'class'; c: ClassroomLite; confirm: string; error?: string } | { kind: 'learner'; l: L; confirm: string; error?: string }>(null);
  const [learnerPick, setLearnerPick] = useState('');

  const exportCsv = (c: ClassroomLite) => {
    const rows = [['name', 'code', 'skill', 'state'], ...learners.filter((l) => l.classroomId === c.id).flatMap((l) => (l.states.length ? l.states : [{ skill_id: '', state: 'not assessed' }]).map((s) => [l.name, l.code, s.skill_id, s.state]))];
    const body = rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${c.name.replace(/\W+/g, '-')}-skill-states.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-lg font-bold">Profile</h2>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
          const r = await updateProfile({ fullName: name });
          if (!r.ok) { setNameErr(r.error.fields?.fullName ?? r.error.message); return; }
          setNameErr(undefined); toast('Profile saved.'); router.refresh();
        }); }}>
          <Field label="Your name" htmlFor="fn" error={nameErr}><Input id="fn" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} invalid={!!nameErr} /></Field>
          <p className="text-[14px] text-muted">Signed in as {email}</p>
          <Button type="submit" loading={pending}>Save</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">AI features</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 size-5 accent-[#0F6B5C]" checked={aiEnabled} disabled={pending} onChange={(e) => {
            const next = e.target.checked; // read before the controlled input re-renders
            start(async () => {
              const r = await setAiEnabled(next);
              if (!r.ok) toast(r.error.message, 'error'); else { toast(next ? 'AI features on.' : 'AI features off. Built-in practice only.'); router.refresh(); }
            });
          }} />
          <span className="text-[15px]">Use AI to draft practice and answer questions. When off, you get built-in practice only and the assistant is disabled.</span>
        </label>
        <p className="mt-3 text-[13px] text-muted">
          Server status: {aiServer.ready ? <>ready{aiServer.model ? <> · model <code>{aiServer.model}</code></> : null}</> : aiServer.enabled ? 'not configured (missing key or model)' : 'turned off by the administrator'}.
          AI sees learner codes and skill data only, never names.
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Schools and classrooms</h2><ButtonLink size="sm" variant="secondary" href="/onboarding"><Plus className="size-4" aria-hidden /> Add</ButtonLink></div>
        <ul className="space-y-4">
          {schools.map((s) => (
            <li key={s.id}>
              <div className="flex items-center gap-2 font-semibold">{s.name} <Badge>{s.role}</Badge></div>
              <ul className="mt-2 divide-y divide-line">
                {classrooms.filter((c) => c.school_id === s.id).map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/classrooms/${c.id}`} className="text-[15px] hover:underline">{c.name}{c.is_demo && <Badge tone="accent" className="ml-2">sample</Badge>}</Link>
                    <span className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => exportCsv(c)} aria-label={`Export ${c.name}`}><Download className="size-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDel({ kind: 'class', c, confirm: '' })} aria-label={`Delete ${c.name}`}><Trash2 className="size-4" /></Button>
                    </span>
                  </li>
                ))}
              </ul>
              {(isDemo || classrooms.some((c) => c.school_id === s.id && c.is_demo)) && (
                <Button size="sm" variant="secondary" className="mt-2" disabled={pending} onClick={() => start(async () => {
                  const r = await resetDemoClass(s.id);
                  if (!r.ok) toast(r.error.message, 'error'); else { toast('Demo class reset.'); router.push(`/classrooms/${r.data.classroomId}`); }
                })}><RotateCcw className="size-4" aria-hidden /> Reset demo class</Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Delete a learner&apos;s data</h2>
        <p className="mb-3 text-[14px] text-muted">Archiving (on the Learners page) hides a child but keeps their history. Deleting removes the learner and all their answers, states and notes permanently.</p>
        <div className="flex gap-2">
          <Select aria-label="Learner to delete" value={learnerPick} onChange={(e) => setLearnerPick(e.target.value)}>
            <option value="">Choose a learner</option>
            {learners.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.code}){l.archived ? ' · archived' : ''}</option>)}
          </Select>
          <Button variant="danger" disabled={!learnerPick} onClick={() => { const l = learners.find((x) => x.id === learnerPick); if (l) setDel({ kind: 'learner', l, confirm: '' }); }}>Delete</Button>
        </div>
        <p className="mt-3 text-[13px] text-muted">Retention: data is kept until a teacher deletes it. See the <Link href="/privacy" className="underline">privacy page</Link>.</p>
      </Card>

      <Dialog open={!!del} onClose={() => setDel(null)} title={del?.kind === 'class' ? `Delete ${del.c.name}?` : del ? `Delete ${del.l.name}?` : ''}>
        {del && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
            const r = del.kind === 'class' ? await deleteClassroom(del.c.id, del.confirm) : await deleteLearner(del.l.id, del.confirm);
            if (!r.ok) { setDel({ ...del, error: r.error.message }); return; }
            toast('Deleted permanently.'); setDel(null); setLearnerPick(''); router.refresh();
          }); }}>
            <p className="text-[15px]">This permanently deletes {del.kind === 'class' ? 'the classroom, all its learners and all their data' : 'this learner and all their answers, skill states and notes'}. It cannot be undone.</p>
            <Field label={`Type ${del.kind === 'class' ? 'the class name' : 'the learner code'} to confirm: ${del.kind === 'class' ? del.c.name : del.l.code}`} htmlFor="cf" error={del.error}>
              <Input id="cf" value={del.confirm} onChange={(e) => setDel({ ...del, confirm: e.target.value })} invalid={!!del.error} autoComplete="off" />
            </Field>
            <div className="flex gap-2"><Button type="submit" variant="danger" loading={pending}>Delete permanently</Button><Button type="button" variant="ghost" onClick={() => setDel(null)}>Cancel</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
