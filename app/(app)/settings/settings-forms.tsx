'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Trash2, RotateCcw, Plus, User, GraduationCap, Languages, ShieldCheck, Palette, Database } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge, Field, IndexCard, Input, Select } from '@/components/ui/primitives';
import { Switch } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { NightSwitch } from '@/components/layout/theme-toggle';
import { deleteClassroom, setAiEnabled, updateProfile } from '@/lib/actions/setup';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { deleteLearner } from '@/lib/actions/learners';
import { resetDemoClass } from '@/lib/actions/demo';
import { cn } from '@/lib/utils';
import type { ClassroomLite } from '@/lib/server/context';

function ChangePassword() {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="mt-8 max-w-md space-y-3 border-t border-dashed border-line-strong pt-6" onSubmit={async (e) => {
      e.preventDefault();
      if (pw.length < 8) { setMsg({ ok: false, text: 'Use at least 8 characters.' }); return; }
      setBusy(true);
      const { error } = await createBrowserClient().auth.updateUser({ password: pw });
      setBusy(false);
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Password updated.' }); if (!error) setPw('');
    }}>
      <Field label="New password" htmlFor="new-pw" error={msg && !msg.ok ? msg.text : undefined} hint={msg?.ok ? msg.text : 'At least 8 characters.'}>
        <Input id="new-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} invalid={!!msg && !msg.ok} />
      </Field>
      <Button type="submit" variant="secondary" loading={busy}>Change password</Button>
    </form>
  );
}

type L = { id: string; code: string; name: string; classroomId: string; archived: boolean; states: { skill_id: string; state: string }[] };
const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User }, { id: 'class', label: 'Classes', icon: GraduationCap }, { id: 'language', label: 'Language', icon: Languages },
  { id: 'ai', label: 'AI and privacy', icon: ShieldCheck }, { id: 'appearance', label: 'Appearance', icon: Palette }, { id: 'data', label: 'Data', icon: Database },
];

export function SettingsForms({ fullName, email, aiEnabled, aiServer, schools, classrooms, learners, isDemo }: {
  fullName: string; email: string; aiEnabled: boolean; aiServer: { enabled: boolean; ready: boolean; model: string | null };
  schools: { id: string; name: string; role: string }[]; classrooms: ClassroomLite[]; learners: L[]; isDemo: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [section, setSection] = useState('profile');
  const [name, setName] = useState(fullName);
  const [nameErr, setNameErr] = useState<string>();
  const [del, setDel] = useState<null | { kind: 'class'; c: ClassroomLite; confirm: string; error?: string } | { kind: 'learner'; l: L; confirm: string; error?: string }>(null);
  const [learnerPick, setLearnerPick] = useState('');

  const exportCsv = (c: ClassroomLite) => {
    const rows = [['name', 'code', 'skill', 'state', ...(c.is_demo ? ['note'] : [])], ...learners.filter((l) => l.classroomId === c.id).flatMap((l) => (l.states.length ? l.states : [{ skill_id: '', state: 'not checked' }]).map((s) => [l.name, l.code, s.skill_id, s.state, ...(c.is_demo ? ['Illustrative sample data'] : [])]))];
    const body = rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${c.name.replace(/\W+/g, '-')}-skill-states.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const go = (id: string) => { setSection(id); document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
        <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
          {SECTIONS.map((s) => (
            <li key={s.id}><button onClick={() => go(s.id)} aria-current={section === s.id ? 'true' : undefined}
              className={cn('flex min-h-11 w-full shrink-0 items-center gap-2 rounded-[12px] px-3 text-[14px] font-semibold whitespace-nowrap', section === s.id ? 'bg-teal-soft text-teal-ink dark:text-teal' : 'text-ink-2 hover:bg-paper-2 hover:text-ink')}>
              <s.icon className="size-4" aria-hidden />{s.label}</button></li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        <IndexCard tab="Profile" id="s-profile">
          <form className="max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => {
            const r = await updateProfile({ fullName: name });
            if (!r.ok) { setNameErr(r.error.fields?.fullName ?? r.error.message); return; }
            setNameErr(undefined); toast('Profile saved.'); router.refresh();
          }); }}>
            <Field label="Your name" htmlFor="fn" error={nameErr}><Input id="fn" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} invalid={!!nameErr} /></Field>
            <p className="text-[14px] text-ink-2">Signed in as {email}</p>
            <Button type="submit" loading={pending}>Save</Button>
          </form>
          {!isDemo && <ChangePassword />}
        </IndexCard>

        <IndexCard tab="Classes" id="s-class">
          <div className="mb-4 flex items-center justify-between gap-2"><p className="text-[15px] text-ink-2">Your schools and classes.</p><ButtonLink size="sm" variant="secondary" href="/onboarding"><Plus className="size-4" aria-hidden /> New class</ButtonLink></div>
          <ul className="space-y-5">
            {schools.map((s) => (
              <li key={s.id}>
                <div className="flex items-center gap-2 font-heading font-semibold">{s.name} <Badge>{s.role}</Badge></div>
                <ul className="mt-2 divide-y divide-line rounded-[14px] border border-line">
                  {classrooms.filter((c) => c.school_id === s.id).map((c) => (
                    <li key={c.id} className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4">
                      <Link href={`/classrooms/${c.id}`} className="text-[15px] font-medium hover:underline">{c.name}{c.is_demo && <Badge tone="sun" className="ml-2">sample</Badge>}</Link>
                      <span className="text-[13px] text-ink-2">{learners.filter((l) => l.classroomId === c.id && !l.archived).length} learners · {c.grade_label}</span>
                    </li>
                  ))}
                </ul>
                {(isDemo || classrooms.some((c) => c.school_id === s.id && c.is_demo)) && (
                  <Button size="sm" variant="secondary" className="mt-3" disabled={pending} onClick={() => start(async () => {
                    const r = await resetDemoClass(s.id);
                    if (!r.ok) toast(r.error.message, 'error'); else { toast('Demo class reset.'); router.push(`/classrooms/${r.data.classroomId}`); }
                  })}><RotateCcw className="size-4" aria-hidden /> Reset demo class</Button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-ink-2">Renaming a class and inviting co-teachers are not available in this version.</p>
        </IndexCard>

        <IndexCard tab="Language" id="s-language">
          <Field label="Content language" htmlFor="lang" hint="Yoruba, Hausa and Igbo content is planned. All practice and checks are in English for now."><Select id="lang" disabled className="max-w-xs"><option>English</option></Select></Field>
        </IndexCard>

        <IndexCard tab="AI and privacy" id="s-ai">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-semibold">Use AI for practice drafts and Ask</p>
              <p className="mt-1 max-w-prose text-[14px] text-ink-2">When on, Google&apos;s Gemini drafts practice questions and answers questions about your class. It receives skill facts and random learner codes only, never names, ages or notes. When off, you get built-in practice and Ask is turned off.</p>
            </div>
            <Switch checked={aiEnabled} disabled={pending} label="Use AI" onChange={(v) => start(async () => {
              const r = await setAiEnabled(v);
              if (!r.ok) toast(r.error.message, 'error'); else { toast(v ? 'AI features on.' : 'AI features off. Built-in practice only.'); router.refresh(); }
            })} />
          </div>
          <p className="mt-4 text-[13px] text-ink-2">Server status: {aiServer.ready ? <>ready{aiServer.model ? <> · model <span className="font-mono">{aiServer.model}</span></> : null}</> : aiServer.enabled ? 'not configured' : 'turned off by the administrator'}. <Link href="/privacy" className="font-semibold text-teal underline">How we handle data</Link></p>
        </IndexCard>

        <IndexCard tab="Appearance" id="s-appearance"><NightSwitch /></IndexCard>

        <IndexCard tab="Data" id="s-data" tabTone="clay">
          <div className="space-y-6">
            <div>
              <p className="font-semibold">Export class data</p>
              <p className="mb-3 text-[14px] text-ink-2">A CSV of each learner&apos;s skill states. Sample-data classes are labelled in the file.</p>
              <div className="flex flex-wrap gap-2">{classrooms.map((c) => <Button key={c.id} size="sm" variant="secondary" onClick={() => exportCsv(c)}><Download className="size-4" aria-hidden /> {c.name}</Button>)}</div>
            </div>
            <div>
              <p className="font-semibold">Archive a learner</p>
              <p className="text-[14px] text-ink-2">Archiving hides a child but keeps their history. Do it from the <Link href={classrooms[0] ? `/classrooms/${classrooms[0].id}/learners` : '/dashboard'} className="font-semibold text-teal underline">Learners</Link> page.</p>
            </div>
            <div className="rounded-[14px] border border-st-notyet/30 bg-st-notyet-soft p-4">
              <p className="font-semibold text-st-notyet">Danger zone</p>
              <p className="mt-1 text-[14px]">Deleting is permanent and removes all answers, skill states and notes.</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-56 flex-1"><label htmlFor="del-learner" className="mb-1.5 block text-[13px] font-semibold">Delete a learner</label>
                  <Select id="del-learner" value={learnerPick} onChange={(e) => setLearnerPick(e.target.value)}><option value="">Choose a learner</option>{learners.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.code}){l.archived ? ' · archived' : ''}</option>)}</Select></div>
                <Button variant="quiet-warn" disabled={!learnerPick} onClick={() => { const l = learners.find((x) => x.id === learnerPick); if (l) setDel({ kind: 'learner', l, confirm: '' }); }}><Trash2 className="size-4" aria-hidden /> Delete learner</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{classrooms.map((c) => <Button key={c.id} size="sm" variant="quiet-warn" onClick={() => setDel({ kind: 'class', c, confirm: '' })}><Trash2 className="size-4" aria-hidden /> Delete {c.name}</Button>)}</div>
              <p className="mt-4 text-[13px] text-ink-2">Deleting your account is not available in this version. Deleting your classes removes all learner data.</p>
            </div>
          </div>
        </IndexCard>
      </div>

      <Dialog open={!!del} onClose={() => setDel(null)} title={del?.kind === 'class' ? `Delete ${del.c.name}?` : del ? `Delete ${del.l.name}?` : ''}>
        {del && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
            const r = del.kind === 'class' ? await deleteClassroom(del.c.id, del.confirm) : await deleteLearner(del.l.id, del.confirm);
            if (!r.ok) { setDel({ ...del, error: r.error.message }); return; }
            toast('Deleted permanently.'); setDel(null); setLearnerPick(''); router.refresh();
          }); }}>
            <p className="text-[15px]">This permanently deletes {del.kind === 'class' ? 'the class, all its learners and all their data' : 'this learner and all their answers, skill states and notes'}. It can&apos;t be undone.</p>
            <Field label={`Type ${del.kind === 'class' ? 'the class name' : 'the learner code'} to confirm: ${del.kind === 'class' ? del.c.name : del.l.code}`} htmlFor="cf" error={del.error}>
              <Input id="cf" value={del.confirm} onChange={(e) => setDel({ ...del, confirm: e.target.value })} invalid={!!del.error} autoComplete="off" />
            </Field>
            <div className="flex gap-2"><Button type="submit" variant="quiet-warn" loading={pending}>Delete permanently</Button><Button type="button" variant="ghost" onClick={() => setDel(null)}>Cancel</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
