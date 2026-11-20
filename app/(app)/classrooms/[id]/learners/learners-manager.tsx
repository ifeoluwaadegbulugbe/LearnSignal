'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ListPlus, Archive, ArchiveRestore, Pencil, ClipboardCheck, Search, MoreHorizontal, Check, Copy, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, IndexCard, Input, SummaryTiles, Textarea } from '@/components/ui/primitives';
import { SegmentedTabs, Segmented } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/states';
import { Avatar } from '@/components/ui/avatar';
import { CodeChip } from '@/components/ui/code-chip';
import { StatusPill } from '@/components/ui/status';
import { useToast } from '@/components/ui/toast';
import { addLearner, addLearnersBulk, archiveLearner, updateLearner } from '@/lib/actions/learners';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { cn, fmtDate } from '@/lib/utils';
import type { LearnerRow } from '@/lib/server/classroom';

const AGE = ['5-6', '7-8', '9-10', '11+'].map((a) => ({ id: a, label: a }));
const looksLikeFullName = (n: string) => n.trim().split(/\s+/).length >= 2;
type SortKey = 'name' | 'last';

export function LearnersManager({ classroomId, learners, initialTab, openAdd }: { classroomId: string; learners: LearnerRow[]; initialTab: string; openAdd: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<null | 'add' | 'bulk' | { edit: LearnerRow }>(openAdd ? 'add' : null);

  const notYet = (l: LearnerRow, strand: 'literacy' | 'numeracy') => l.states.some((s) => s.state === 'not_yet' && SKILL_BY_ID[s.skill_id].strand === strand);
  const filters: Record<string, (l: LearnerRow) => boolean> = {
    all: (l) => !l.archived_at,
    lit: (l) => !l.archived_at && notYet(l, 'literacy'),
    num: (l) => !l.archived_at && notYet(l, 'numeracy'),
    review: (l) => !l.archived_at && l.states.some((s) => s.retest_suggested),
    na: (l) => !l.archived_at && l.states.length === 0,
    archived: (l) => !!l.archived_at,
  };
  const visible = useMemo(() => learners.filter(filters[tab] ?? filters.all)
    .filter((l) => !query || l.display_name.toLowerCase().includes(query.toLowerCase()) || l.code.includes(query.toUpperCase()))
    .sort((a, b) => (sort === 'name' ? a.display_name.localeCompare(b.display_name) : (b.lastAssessed ?? '').localeCompare(a.lastAssessed ?? ''))),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [learners, tab, query, sort]);
  const PAGE = 20;
  const [page, setPage] = useState(0);
  useEffect(() => { setSelected(new Set()); setPage(0); }, [tab, query]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE));
  const shown = visible.slice(page * PAGE, page * PAGE + PAGE);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allOn = shown.length > 0 && shown.every((l) => selected.has(l.id));
  const bulkArchive = () => start(async () => {
    const arch = tab !== 'archived';
    for (const id of selected) await archiveLearner(id, arch);
    toast(`${selected.size} learner${selected.size === 1 ? '' : 's'} ${arch ? 'archived' : 'restored'}.`); setSelected(new Set()); router.refresh();
  });
  const count = (k: string) => learners.filter(filters[k]).length;

  return (
    <>
      <div className="mb-6">
        <SummaryTiles items={[
          { label: 'Learners', value: count('all'), tone: 'violet', glyph: 'dots' },
          { label: 'Checked', value: count('all') - count('na'), tone: 'violet', glyph: 'check' },
          { label: 'Not checked', value: count('na'), tone: 'sky', glyph: 'eye' },
          { label: 'Re-check suggested', value: count('review'), tone: 'tangerine', glyph: 'star' },
        ]} />
      </div>
      <div className="mb-5 flex flex-col-reverse gap-3">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <SegmentedTabs label="Filter learners" value={tab} onChange={setTab} items={[
            { id: 'all', label: 'All', count: count('all') }, { id: 'lit', label: 'Literacy not yet', count: count('lit') },
            { id: 'num', label: 'Numeracy not yet', count: count('num') }, { id: 'review', label: 'Needs review', count: count('review') },
            { id: 'na', label: 'Not checked', count: count('na') }, { id: 'archived', label: 'Archived', count: count('archived') },
          ]} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input aria-label="Search learners" placeholder="Name or code" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="hidden flex-1 sm:block" />
          <Button onClick={() => setMode('add')}><UserPlus className="size-4" aria-hidden /> Add learner</Button>
          <Button variant="secondary" onClick={() => setMode('bulk')}><ListPlus className="size-4" aria-hidden /> Paste several</Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-20 z-20 mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-teal/30 bg-teal-soft px-4 py-2.5 fade-up" role="region" aria-label="Bulk actions">
          <span className="text-[14px] font-semibold">{selected.size} selected</span>
          {tab !== 'archived' && <ButtonLink size="sm" href={`/learners/${[...selected][0]}/assess`}><ClipboardCheck className="size-4" aria-hidden /> Check first selected</ButtonLink>}
          {tab !== 'archived' && <ButtonLink size="sm" variant="secondary" href={`/classrooms/${classroomId}/groups`}>Add to a group</ButtonLink>}
          <Button size="sm" variant="secondary" loading={pending} onClick={bulkArchive}>{tab === 'archived' ? <><ArchiveRestore className="size-4" aria-hidden /> Restore</> : <><Archive className="size-4" aria-hidden /> Archive</>}</Button>
          <button className="ml-auto text-[13px] font-medium underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {learners.filter((l) => !l.archived_at).length === 0 && tab !== 'archived' ? (
        <EmptyState illustration="empty-learners" title="Add your first learners" body="Add children one at a time or paste a list of first names." action={<Button onClick={() => setMode('bulk')}>Paste names</Button>} secondary={<Button variant="secondary" onClick={() => setMode('add')}>Add one learner</Button>} />
      ) : visible.length === 0 ? (
        <EmptyState illustration="empty-learners" title={query ? 'No matches' : 'No one here'} body={query ? `No learner matches “${query}”.` : 'No learners match this filter.'} />
      ) : (
        <>
          {/* < 768: cards */}
          <ul className="space-y-3 md:hidden">
            {shown.map((l) => (
              <li key={l.id}>
                <IndexCard>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" aria-label={`Select ${l.display_name}`} className="mt-3 size-5 accent-[var(--teal)]" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                    <Avatar name={l.display_name} seed={l.code} size={40} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/learners/${l.id}`} className="block truncate font-semibold">{l.display_name}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2"><CodeChip code={l.code} /><span className="text-[12px] text-ink-2">{l.lastAssessed ? `Checked ${fmtDate(l.lastAssessed)}` : 'Not checked'}</span></div>
                    </div>
                    <RowMenu l={l} onEdit={() => setMode({ edit: l })} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    {(['literacy', 'numeracy'] as const).map((k) => <div key={k}><dt className="text-[12px] font-medium capitalize text-ink-2">{k}</dt><dd className="mt-0.5"><StrandCell l={l} strand={k} /></dd></div>)}
                  </dl>
                  {!l.archived_at && <ButtonLink href={`/learners/${l.id}/assess`} className="mt-4 w-full"><ClipboardCheck className="size-4" aria-hidden /> Start check</ButtonLink>}
                </IndexCard>
              </li>
            ))}
          </ul>
          {/* ≥ 768: table */}
          <div className="hidden overflow-x-auto rounded-[18px] border border-line bg-card shadow-card md:block">
            <table className="w-full text-left text-[14px]">
              <thead className="sticky top-0 border-b border-line bg-card-2 text-[12px] text-ink-2">
                <tr className="h-11">
                  <th className="w-12 pl-4"><input type="checkbox" aria-label="Select all" className="size-4 accent-[var(--teal)]" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(visible.map((l) => l.id)))} /></th>
                  <th className="font-medium"><button onClick={() => setSort('name')} className="inline-flex items-center gap-1">Learner <ArrowUpDown className={cn('size-3', sort === 'name' ? 'text-teal' : 'text-ink-3')} aria-hidden /></button></th>
                  <th className="font-medium">Code</th>
                  <th className="font-medium">Literacy</th>
                  <th className="font-medium">Numeracy</th>
                  <th className="font-medium"><button onClick={() => setSort('last')} className="inline-flex items-center gap-1">Last checked <ArrowUpDown className={cn('size-3', sort === 'last' ? 'text-teal' : 'text-ink-3')} aria-hidden /></button></th>
                  <th className="w-36 pr-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((l) => (
                  <tr key={l.id} className={cn('h-[52px] transition-colors hover:bg-paper-2/60', selected.has(l.id) && 'bg-teal-soft/40')}>
                    <td className="pl-4"><input type="checkbox" aria-label={`Select ${l.display_name}`} className="size-4 accent-[var(--teal)]" checked={selected.has(l.id)} onChange={() => toggle(l.id)} /></td>
                    <td><Link href={`/learners/${l.id}`} className="flex items-center gap-3 py-2 font-semibold hover:underline"><Avatar name={l.display_name} seed={l.code} size={32} />{l.display_name}</Link></td>
                    <td><CodeChip code={l.code} /></td>
                    <td><StrandCell l={l} strand="literacy" /></td>
                    <td><StrandCell l={l} strand="numeracy" /></td>
                    <td className="text-ink-2">{l.lastAssessed ? fmtDate(l.lastAssessed) : 'Not checked'}</td>
                    <td className="pr-3"><span className="flex items-center justify-end gap-1">
                      {!l.archived_at && <ButtonLink href={`/learners/${l.id}/assess`} variant="ghost" size="sm" aria-label={`Start a check for ${l.display_name}`}><ClipboardCheck className="size-4" aria-hidden />Check</ButtonLink>}
                      <RowMenu l={l} onEdit={() => setMode({ edit: l })} />
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 text-[13px] text-ink-2">
              <span className="tabular">{page * PAGE + 1}–{Math.min(visible.length, (page + 1) * PAGE)} of {visible.length}</span>
              <span className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((n) => n - 1)}><ChevronLeft className="size-4" aria-hidden /> Previous</Button>
                <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => setPage((n) => n + 1)}>Next <ChevronRight className="size-4" aria-hidden /></Button>
              </span>
            </nav>
          )}
        </>
      )}

      <AddLearnerDialog open={mode === 'add'} onClose={() => setMode(null)} classroomId={classroomId} />
      <BulkDialog open={mode === 'bulk'} onClose={() => setMode(null)} classroomId={classroomId} />
      {typeof mode === 'object' && mode && <EditDialog l={mode.edit} onClose={() => setMode(null)} />}
    </>
  );
}

/** One strand's status: the working skill and its state, or a plain-words summary. */
function StrandCell({ l, strand }: { l: LearnerRow; strand: 'literacy' | 'numeracy' }) {
  const mine = l.states.filter((s) => SKILL_BY_ID[s.skill_id].strand === strand);
  if (!mine.length) return <span className="text-[13px] text-ink-2">Not checked</span>;
  const id = l.working[strand];
  if (!id) return <span className="text-[13px] font-medium text-st-consistent">No gap flagged</span>;
  const st = mine.find((s) => s.skill_id === id);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[12px] text-ink-2">{id}</span>
      {st ? <StatusPill state={st.state} size="sm" short /> : <span className="text-[12px] text-ink-2">next to check</span>}
      {st?.retest_suggested && <span className="text-[11px] font-semibold text-st-notyet">re-check</span>}
    </span>
  );
}

function RowMenu({ l, onEdit }: { l: LearnerRow; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-block">
      <button aria-label={`Actions for ${l.display_name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex size-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-paper-2"><MoreHorizontal className="size-5" /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-30 w-48 rounded-[16px] border border-line bg-card p-1.5 text-left shadow-pop">
          {!l.archived_at && <Link role="menuitem" href={`/learners/${l.id}/assess`} className="flex min-h-10 items-center gap-2 rounded-[10px] px-3 text-[14px] hover:bg-paper-2"><ClipboardCheck className="size-4" aria-hidden /> Start check</Link>}
          <button role="menuitem" onClick={() => { setOpen(false); onEdit(); }} className="flex min-h-10 w-full items-center gap-2 rounded-[10px] px-3 text-[14px] hover:bg-paper-2"><Pencil className="size-4" aria-hidden /> Edit</button>
          <button role="menuitem" disabled={pending} onClick={() => start(async () => {
            const r = await archiveLearner(l.id, !l.archived_at); setOpen(false);
            if (!r.ok) toast(r.error.message, 'error'); else { toast(l.archived_at ? `${l.display_name} restored.` : `${l.display_name} archived.`); router.refresh(); }
          })} className="flex min-h-10 w-full items-center gap-2 rounded-[10px] px-3 text-[14px] hover:bg-paper-2">{l.archived_at ? <><ArchiveRestore className="size-4" aria-hidden /> Restore</> : <><Archive className="size-4" aria-hidden /> Archive</>}</button>
        </div>
      )}
    </div>
  );
}

function ConsentBox({ checked, onChange, error, id }: { checked: boolean; onChange: (v: boolean) => void; error?: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-[12px] border p-3', error ? 'border-st-notyet' : 'border-line')}>
        <input id={id} type="checkbox" className="mt-0.5 size-5 accent-[var(--teal)]" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error || undefined} />
        <span className="text-[14px]">The school or the child&apos;s guardian has agreed to their first name, age band and answers being recorded here.</span>
      </label>
      {error && <p className="mt-1 text-[12px] font-medium text-st-notyet" role="alert">{error}</p>}
    </div>
  );
}

function AddLearnerDialog({ open, onClose, classroomId }: { open: boolean; onClose: () => void; classroomId: string }) {
  const [form, setForm] = useState({ name: '', age: '7-8', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<{ name: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const reset = () => { setForm({ name: '', age: form.age, consent: form.consent }); setErrors({}); setSaved(null); setCopied(false); };
  const close = () => { reset(); setForm({ name: '', age: '7-8', consent: false }); onClose(); };
  const save = (another: boolean) => start(async () => {
    const r = await addLearner({ classroomId, displayName: form.name, ageBand: form.age, consent: form.consent || undefined });
    if (!r.ok) { setErrors(r.error.fields ?? { form: r.error.message }); return; }
    router.refresh();
    if (another) { toast(`${form.name.trim()} added as ${r.data.code}.`); setForm({ name: '', age: form.age, consent: form.consent }); setErrors({}); }
    else setSaved({ name: form.name.trim(), code: r.data.code });
  });
  return (
    <Dialog open={open} onClose={close} title={saved ? 'Learner added' : 'Add a learner'}>
      {saved ? (
        <div className="space-y-4">
          <IndexCard tab="Code" tabTone="sun" tint="sun" className="border-transparent text-center">
            <p className="text-[14px] text-ink-2">{saved.name}&apos;s code</p>
            <p className="my-1 font-mono text-[32px] font-medium tracking-wider">{saved.code}</p>
            <p className="text-[13px] text-ink-2">Write this on their folder. AI sees this code, never the name.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigator.clipboard?.writeText(saved.code).then(() => setCopied(true))}>{copied ? <><Check className="size-4" aria-hidden /> Copied</> : <><Copy className="size-4" aria-hidden /> Copy code</>}</Button>
          </IndexCard>
          <div className="flex gap-2"><Button onClick={reset}>Add another</Button><Button variant="ghost" onClick={close}>Done</Button></div>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); save(false); }}>
          {errors.form && <p role="alert" className="text-[14px] text-st-notyet">{errors.form}</p>}
          <Field label="First name or nickname" htmlFor="add-name" error={errors.displayName} counter={`${form.name.length}/30`}
            hint={looksLikeFullName(form.name) ? <span className="font-medium text-st-notyet">Please avoid surnames.</span> : 'First name or a nickname only.'}>
            <Input id="add-name" maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.displayName} autoFocus />
          </Field>
          <div><span className="mb-1.5 block text-[14px] font-semibold">Age band</span><Segmented name="add-age" label="Age band" value={form.age} onChange={(v) => setForm({ ...form, age: v })} options={AGE} /></div>
          <ConsentBox id="add-consent" checked={form.consent} onChange={(c) => setForm({ ...form, consent: c })} error={errors.consent} />
          <div className="flex flex-wrap gap-2"><Button type="submit" loading={pending}>Save</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => save(true)}>Save and add another</Button></div>
        </form>
      )}
    </Dialog>
  );
}

function BulkDialog({ open, onClose, classroomId }: { open: boolean; onClose: () => void; classroomId: string }) {
  const [form, setForm] = useState({ names: '', age: '7-8', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const names = form.names.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
  return (
    <Dialog open={open} onClose={onClose} title="Paste several learners" description="One first name or nickname per line.">
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await addLearnersBulk({ classroomId, names: form.names, ageBand: form.age, consent: form.consent || undefined });
        if (!r.ok) { setErrors(r.error.fields ?? { form: r.error.message }); return; }
        toast(`${r.data.added} learner${r.data.added === 1 ? '' : 's'} added.${r.data.skipped.length ? ` Skipped: ${r.data.skipped.join(', ')}` : ''}`);
        setForm({ names: '', age: '7-8', consent: false }); setErrors({}); onClose(); router.refresh();
      }); }}>
        {errors.form && <p role="alert" className="text-[14px] text-st-notyet">{errors.form}</p>}
        <Field label="Names" htmlFor="bulk-names" error={errors.names} hint="Each child gets a random code like LS-3F9A2C.">
          <Textarea id="bulk-names" rows={6} value={form.names} onChange={(e) => setForm({ ...form, names: e.target.value })} invalid={!!errors.names} placeholder={'Ada\nTolu\nMusa'} className="ruled leading-7" />
        </Field>
        {names.length > 0 && (
          <div aria-label="Preview" className="flex flex-wrap gap-1.5">
            {names.slice(0, 30).map((n, i) => <span key={i} className={cn('inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[13px]', n.length > 30 ? 'border-st-notyet text-st-notyet' : 'border-line')}><Avatar name={n} size={24} label="" />{n}</span>)}
            {names.length > 30 && <span className="text-[13px] text-ink-2">+{names.length - 30}</span>}
          </div>
        )}
        <div><span className="mb-1.5 block text-[14px] font-semibold">Age band for everyone</span><Segmented name="bulk-age" label="Age band" value={form.age} onChange={(v) => setForm({ ...form, age: v })} options={AGE} /></div>
        <ConsentBox id="bulk-consent" checked={form.consent} onChange={(c) => setForm({ ...form, consent: c })} error={errors.consent} />
        <Button type="submit" loading={pending} disabled={!names.length}>Add {names.length || ''} learner{names.length === 1 ? '' : 's'}</Button>
      </form>
    </Dialog>
  );
}

function EditDialog({ l, onClose }: { l: LearnerRow; onClose: () => void }) {
  const [form, setForm] = useState({ name: l.display_name, age: l.age_band ?? '' });
  const [err, setErr] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <Dialog open onClose={onClose} title={`Edit ${l.display_name}`}>
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await updateLearner({ learnerId: l.id, displayName: form.name, ageBand: form.age || null });
        if (!r.ok) { setErr(r.error.fields?.displayName ?? r.error.message); return; }
        toast('Saved.'); onClose(); router.refresh();
      }); }}>
        <Field label="First name or nickname" htmlFor="edit-name" error={err} hint={looksLikeFullName(form.name) ? 'Please avoid surnames.' : undefined}><Input id="edit-name" maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!err} /></Field>
        <div><span className="mb-1.5 block text-[14px] font-semibold">Age band</span><Segmented name="edit-age" label="Age band" value={form.age} onChange={(v) => setForm({ ...form, age: v })} options={AGE} /></div>
        <div className="flex gap-2"><Button type="submit" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button></div>
      </form>
    </Dialog>
  );
}
