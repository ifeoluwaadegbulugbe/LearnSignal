'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ListPlus, Archive, ArchiveRestore, Pencil, ClipboardCheck, Users, Search } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge, Field, Input, Select } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { BulkNamesFields, ConsentCheckbox } from '@/components/assessment/bulk-names-fields';
import { addLearner, addLearnersBulk, archiveLearner, updateLearner } from '@/lib/actions/learners';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { fmtDate } from '@/lib/utils';
import type { LearnerRow } from '@/lib/server/classroom';

const AGE_BANDS = ['5-6', '7-8', '9-10', '11+'];
const looksLikeFullName = (n: string) => /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(n.trim());

export function LearnersManager({ classroomId, learners, showArchived, openAdd }: { classroomId: string; learners: LearnerRow[]; showArchived: boolean; openAdd: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<null | 'add' | 'bulk' | { edit: LearnerRow }>(openAdd ? 'add' : null);
  const [form, setForm] = useState({ displayName: '', ageBand: '', consent: false });
  const [bulk, setBulk] = useState({ names: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');

  const close = () => { setMode(null); setErrors({}); setForm({ displayName: '', ageBand: '', consent: false }); setBulk({ names: '', consent: false }); };
  const visible = learners.filter((l) => !query || l.display_name.toLowerCase().includes(query.toLowerCase()) || l.code.includes(query.toUpperCase()));

  const submitAdd = () => start(async () => {
    const r = await addLearner({ classroomId, displayName: form.displayName, ageBand: form.ageBand || undefined, consent: form.consent || undefined });
    if (!r.ok) { setErrors(r.error.fields ?? { form: r.error.message }); return; }
    toast(`${form.displayName.trim()} added as ${r.data.code}.`); close(); router.refresh();
  });
  const submitBulk = () => start(async () => {
    const r = await addLearnersBulk({ classroomId, names: bulk.names, consent: bulk.consent || undefined });
    if (!r.ok) { setErrors(r.error.fields ?? { form: r.error.message }); return; }
    toast(`${r.data.added} learners added.${r.data.skipped.length ? ` Skipped: ${r.data.skipped.join(', ')}` : ''}`); close(); router.refresh();
  });
  const submitEdit = (l: LearnerRow) => start(async () => {
    const r = await updateLearner({ learnerId: l.id, displayName: form.displayName, ageBand: form.ageBand || null });
    if (!r.ok) { setErrors(r.error.fields ?? { form: r.error.message }); return; }
    toast('Saved.'); close(); router.refresh();
  });
  const toggleArchive = (l: LearnerRow) => start(async () => {
    const r = await archiveLearner(l.id, !l.archived_at);
    if (!r.ok) { toast(r.error.message, 'error'); return; }
    toast(l.archived_at ? `${l.display_name} restored.` : `${l.display_name} archived (hidden from lists).`); router.refresh();
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search learners" placeholder="Search name or code" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMode('add')}><UserPlus className="size-4" aria-hidden /> Add learner</Button>
          <Button variant="secondary" onClick={() => setMode('bulk')}><ListPlus className="size-4" aria-hidden /> Paste names</Button>
          <ButtonLink variant="ghost" href={`/classrooms/${classroomId}/learners${showArchived ? '' : '?archived=1'}`}>{showArchived ? 'Hide archived' : 'Show archived'}</ButtonLink>
        </div>
      </div>

      {learners.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title="No learners yet" body="Add children one at a time or paste a list of first names." action={<Button onClick={() => setMode('bulk')}>Paste names</Button>} />
      ) : visible.length === 0 ? (
        <EmptyState title="No matches" body={`No learner matches “${query}”.`} />
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {visible.map((l) => (
              <li key={l.id} className="rounded-[14px] border border-line bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/learners/${l.id}`} className="font-semibold underline-offset-2 hover:underline">{l.display_name}</Link>
                  <span className="font-mono text-[12px] text-muted">{l.code}</span>
                </div>
                <WorkingSkills l={l} />
                <div className="mt-2 flex gap-2">
                  <ButtonLink size="sm" variant="secondary" href={`/learners/${l.id}/assess`}><ClipboardCheck className="size-4" aria-hidden /> Assess</ButtonLink>
                  <Button size="sm" variant="ghost" onClick={() => { setForm({ displayName: l.display_name, ageBand: l.age_band ?? '', consent: true }); setMode({ edit: l }); }} aria-label={`Edit ${l.display_name}`}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleArchive(l)} aria-label={l.archived_at ? `Restore ${l.display_name}` : `Archive ${l.display_name}`}>{l.archived_at ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}</Button>
                </div>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-line bg-surface md:block">
            <table className="w-full text-left text-[15px]">
              <thead className="sticky top-0 bg-bg text-[13px] text-muted">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Last assessed</th><th className="px-4 py-3">Working skills</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((l) => (
                  <tr key={l.id} className="h-14">
                    <td className="px-4"><Link href={`/learners/${l.id}`} className="font-semibold hover:underline">{l.display_name}</Link>{l.archived_at && <Badge className="ml-2">archived</Badge>}</td>
                    <td className="px-4 font-mono text-[13px] text-muted">{l.code}</td>
                    <td className="px-4 text-muted">{l.lastAssessed ? fmtDate(l.lastAssessed) : 'Not yet'}</td>
                    <td className="px-4"><WorkingSkills l={l} /></td>
                    <td className="px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <ButtonLink size="sm" variant="secondary" href={`/learners/${l.id}/assess`}><ClipboardCheck className="size-4" aria-hidden /> Assess</ButtonLink>
                        <Button size="sm" variant="ghost" onClick={() => { setForm({ displayName: l.display_name, ageBand: l.age_band ?? '', consent: true }); setMode({ edit: l }); }} aria-label={`Edit ${l.display_name}`}><Pencil className="size-4" /></Button>
                        <Button size="sm" variant="ghost" disabled={pending} onClick={() => toggleArchive(l)} aria-label={l.archived_at ? `Restore ${l.display_name}` : `Archive ${l.display_name}`}>{l.archived_at ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={mode === 'add' || (typeof mode === 'object' && mode !== null)} onClose={close} title={typeof mode === 'object' && mode ? 'Edit learner' : 'Add a learner'}>
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); if (typeof mode === 'object' && mode) submitEdit(mode.edit); else submitAdd(); }}>
          {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
          <Field label="First name or nickname" htmlFor="dn" error={errors.displayName}
            hint={looksLikeFullName(form.displayName) ? <span className="text-[#8A5410]">This looks like a first name and surname. Please use a first name or nickname only.</span> : 'Up to 30 characters. No surnames.'}>
            <Input id="dn" maxLength={40} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} invalid={!!errors.displayName} autoFocus />
          </Field>
          <Field label="Age band" htmlFor="ab"><Select id="ab" value={form.ageBand} onChange={(e) => setForm({ ...form, ageBand: e.target.value })}><option value="">Not set</option>{AGE_BANDS.map((a) => <option key={a} value={a}>{a} years</option>)}</Select></Field>
          {!(typeof mode === 'object' && mode) && <ConsentCheckbox checked={form.consent} onChange={(c) => setForm({ ...form, consent: c })} error={errors.consent} id="consent-one" />}
          <div className="flex gap-2"><Button type="submit" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={close}>Cancel</Button></div>
        </form>
      </Dialog>

      <Dialog open={mode === 'bulk'} onClose={close} title="Paste a list of names">
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); submitBulk(); }}>
          {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
          <BulkNamesFields value={bulk} onChange={setBulk} errors={errors} />
          <div className="flex gap-2"><Button type="submit" loading={pending}>Add learners</Button><Button type="button" variant="ghost" onClick={close}>Cancel</Button></div>
        </form>
      </Dialog>
    </>
  );
}

function WorkingSkills({ l }: { l: LearnerRow }) {
  if (!l.states.length) return <span className="text-[13px] text-muted">Not assessed yet</span>;
  const items = (['literacy', 'numeracy'] as const).map((s) => l.working[s]).filter(Boolean) as string[];
  if (!items.length) return <span className="text-[13px] text-muted">No gaps flagged</span>;
  return <span className="flex flex-wrap gap-1">{items.map((id) => <Badge key={id} tone="accent">{id} {SKILL_BY_ID[id].shortName}</Badge>)}</span>;
}
