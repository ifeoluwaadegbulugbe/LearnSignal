'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, X, Send, Pencil, Eye, Volume2, ShieldCheck, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Field, IndexCard, Input, Select } from '@/components/ui/primitives';
import { SegmentedTabs, Segmented } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorPanel } from '@/components/ui/states';
import { AiBadge, ValidatedBadge } from '@/components/ui/cards';
import { Avatar } from '@/components/ui/avatar';
import { Counters } from '@/components/child/counters';
import { useToast } from '@/components/ui/toast';
import { assignExercise, editExerciseItem, reviewExercise } from '@/lib/actions/intervention';
import { SKILLS, SKILL_BY_ID } from '@/lib/content/skills';
import { cn, fmtDate } from '@/lib/utils';
import type { ExerciseT } from '@/lib/ai/exerciseSchema';
import type { ValidationReport } from '@/lib/ai/validate';

export interface ExerciseRow {
  id: string; skill_id: string; difficulty: number; source: 'seed' | 'ai'; review_status: 'pending' | 'approved' | 'rejected';
  content: { items: ExerciseT[] }; validation: (ValidationReport & { aiItems?: number; seedItems?: number; model?: string }) | null; created_by: string | null; created_at: string;
}
type GenResult = { exerciseId: string | null; fallback: 'none' | 'partial' | 'full'; notice?: string; report: ValidationReport | null; items: ExerciseT[] };
type Group = { id: string; name: string; skill: string; classroomId: string; members: string[] };
const STEPS = ['Drafting', 'Checking answers', 'Ready to review'];
const STATUS_TONE = { pending: 'sun', approved: 'teal', rejected: 'neutral' } as const;
const STATUS_LABEL = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' };
const title = (e: { skill_id: string; difficulty: number }) => `${SKILL_BY_ID[e.skill_id]?.name} · level ${e.difficulty}`;

/** Practice library views (v5 filters). */
const VIEWS: Record<string, (e: ExerciseRow) => boolean> = {
  all: () => true,
  literacy: (e) => SKILL_BY_ID[e.skill_id]?.strand === 'literacy',
  numeracy: (e) => SKILL_BY_ID[e.skill_id]?.strand === 'numeracy',
  drafts: (e) => e.source === 'ai' && e.review_status !== 'approved',
  validated: (e) => e.review_status === 'approved',
  review: (e) => e.review_status === 'pending',
};

export function ExerciseLibrary({ exercises, loadError, userId, aiReady, learners, groups, classrooms, initialSkill, openGenerator }: {
  exercises: ExerciseRow[]; loadError: string | null; userId: string; aiReady: boolean;
  learners: { id: string; display_name: string; code: string; classroom_id: string }[]; groups: Group[]; classrooms: { id: string; name: string }[];
  initialSkill: string; openGenerator: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [skill, setSkill] = useState(initialSkill);
  const [view, setView] = useState('all');
  const [filters, setFilters] = useState({ difficulty: '', source: '', status: '' });
  const [genOpen, setGenOpen] = useState(openGenerator);
  const [preview, setPreview] = useState<ExerciseRow | null>(null);
  const [assign, setAssign] = useState<{ exId: string; selected: Set<string> } | null>(null);
  const [edit, setEdit] = useState<{ ex: ExerciseRow; index: number; stem: string; hint: string; error?: string } | null>(null);
  const [lastFallback, setLastFallback] = useState<string | null>(null);

  const list = useMemo(() => exercises.filter((e) => (VIEWS[view] ?? VIEWS.all)(e) &&
    (skill === 'all' || e.skill_id === skill) && (!filters.difficulty || String(e.difficulty) === filters.difficulty) &&
    (!filters.source || e.source === filters.source) && (!filters.status || e.review_status === filters.status)), [exercises, skill, filters, view]);

  const review = (ex: ExerciseRow, status: 'approved' | 'rejected') => start(async () => {
    const r = await reviewExercise({ exerciseId: ex.id, status });
    if (!r.ok) { toast(r.error.message, 'error'); return; }
    toast(status === 'approved' ? 'Approved. You can assign this set now.' : 'Rejected. It will not be assigned.'); setPreview(null); router.refresh();
  });
  const saveEdit = () => start(async () => {
    if (!edit) return;
    const r = await editExerciseItem({ exerciseId: edit.ex.id, index: edit.index, stem: edit.stem, hint: edit.hint });
    if (!r.ok) { setEdit({ ...edit, error: r.error.message }); return; }
    toast('Wording updated.'); setEdit(null); setPreview(null); router.refresh();
  });

  return (
    <div className="space-y-6">
      {loadError && <ErrorPanel message={loadError} retry={() => router.refresh()} />}
      {(!aiReady || lastFallback) && (
        <div role="status" className="flex items-start gap-2 rounded-[14px] border border-st-notyet/30 bg-st-notyet-soft px-4 py-3 text-[14px] text-st-notyet">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{lastFallback ?? 'AI unavailable. Showing built-in practice.'}
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <SegmentedTabs label="Show" value={view} onChange={setView} items={[
            { id: 'all', label: 'All', count: exercises.length }, { id: 'literacy', label: 'Literacy', count: exercises.filter(VIEWS.literacy).length },
            { id: 'numeracy', label: 'Numeracy', count: exercises.filter(VIEWS.numeracy).length }, { id: 'drafts', label: 'Drafts', count: exercises.filter(VIEWS.drafts).length },
            { id: 'validated', label: 'Validated', count: exercises.filter(VIEWS.validated).length }, { id: 'review', label: 'Needs review', count: exercises.filter(VIEWS.review).length },
          ]} />
        </div>
        <Button onClick={() => setGenOpen(true)}><Sparkles className="size-4" aria-hidden /> Generate practice</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Select aria-label="Filter by skill" value={skill} onChange={(e) => setSkill(e.target.value)}><option value="all">Any skill</option>{SKILLS.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.shortName}</option>)}</Select>
        <Select aria-label="Filter by level" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">Any level</option>{[1, 2, 3].map((d) => <option key={d} value={d}>Level {d}</option>)}</Select>
        <Select aria-label="Filter by source" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}><option value="">Any source</option><option value="seed">Built-in</option><option value="ai">AI-drafted</option></Select>
        <Select aria-label="Filter by review status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Any status</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>
      </div>

      {exercises.length === 0 ? (
        <EmptyState illustration="empty-practice" title="Generate your first practice set" body="Built-in sets appear here once the content seed has been run." action={<Button onClick={() => setGenOpen(true)}>Generate practice</Button>} />
      ) : list.length === 0 ? <EmptyState illustration="empty-practice" title="No sets match these filters" /> : (
        <ul className="grid gap-6 pt-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((ex) => {
            const mine = ex.created_by === userId;
            return (
              <li key={ex.id}>
                <IndexCard interactive className="h-full">
                  <div className="flex h-full flex-col">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-[10px] bg-violet-100 font-mono text-[13px] font-semibold text-aqua-ink">{ex.skill_id}</span>
                      <span className="text-[12px] font-medium capitalize text-ink-2">{SKILL_BY_ID[ex.skill_id]?.strand} · level {ex.difficulty}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ex.source === 'ai' ? <><AiBadge /><ValidatedBadge /></> : <Badge>Built-in</Badge>}
                      <Badge tone={STATUS_TONE[ex.review_status]}>{STATUS_LABEL[ex.review_status]}</Badge>
                    </div>
                    <h3 className="mt-3 font-heading text-[16px] font-semibold leading-6">{title(ex)}</h3>
                    <p className="font-mono text-[12px] text-ink-2">{ex.skill_id} · {ex.content.items.length} items{ex.source === 'ai' ? ` · ${fmtDate(ex.created_at)}` : ''}</p>
                    <p className="mt-2 line-clamp-2 text-[14px] text-ink-2">{ex.content.items[0]?.stem}</p>
                    {ex.validation?.seedItems ? <p className="mt-1 text-[12px] text-ink-2">{ex.validation.seedItems} built-in item{ex.validation.seedItems === 1 ? '' : 's'} filled in after validation</p> : null}
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Button size="sm" variant="secondary" onClick={() => setPreview(ex)}><Eye className="size-4" aria-hidden /> Preview</Button>
                      {ex.review_status === 'pending' && mine && <>
                        <Button size="sm" disabled={pending} onClick={() => review(ex, 'approved')}><Check className="size-4" aria-hidden /> Approve</Button>
                        <Button size="sm" variant="quiet-warn" disabled={pending} onClick={() => review(ex, 'rejected')}><X className="size-4" aria-hidden /> Reject</Button>
                      </>}
                      {ex.review_status === 'approved' && <Button size="sm" onClick={() => setAssign({ exId: ex.id, selected: new Set() })}><Send className="size-4" aria-hidden /> Assign</Button>}
                    </div>
                  </div>
                </IndexCard>
              </li>
            );
          })}
        </ul>
      )}

      <GenerateSheet open={genOpen} onClose={() => setGenOpen(false)} initialSkill={skill === 'all' ? 'N4' : skill} aiReady={aiReady} groups={groups}
        onDone={(r) => { setLastFallback(r.fallback === 'full' ? (r.notice ?? 'AI unavailable. Showing built-in practice.') : null); router.refresh(); }} />

      <Dialog open={!!preview} onClose={() => setPreview(null)} side title={preview ? title(preview) : ''} description={preview ? (preview.source === 'ai' ? 'AI-drafted · answers shown for you only' : 'Built-in practice · answers shown for you only') : undefined}>
        {preview && (
          <div className="space-y-4">
            {preview.validation?.items && <ValidatorReport report={preview.validation} />}
            <ol className="space-y-4">
              {preview.content.items.map((it, i) => (
                <li key={i} className="rounded-[18px] border border-line bg-paper p-4">
                  <div className="mb-2 flex items-center justify-between text-[12px] text-ink-2"><span>Item {i + 1}</span>{it.source === 'ai' ? <ValidatedBadge /> : <Badge>Built-in</Badge>}</div>
                  <ChildItemPreview item={it} />
                  <p className="mt-3 text-[13px]"><span className="text-ink-2">Answer:</span> <b>{String(it.answer)}</b> · <span className="text-ink-2">Hint:</span> {it.hint}</p>
                  {preview.review_status === 'pending' && preview.created_by === userId && (
                    <Button size="sm" variant="ghost" className="mt-1 -ml-3" onClick={() => setEdit({ ex: preview, index: i, stem: it.stem, hint: it.hint })}><Pencil className="size-4" aria-hidden /> Edit wording</Button>
                  )}
                </li>
              ))}
            </ol>
            {preview.review_status === 'pending' && preview.created_by === userId && (
              <div className="sticky bottom-0 flex gap-2 bg-card py-3">
                <Button disabled={pending} onClick={() => review(preview, 'approved')}><Check className="size-4" aria-hidden /> Approve</Button>
                <Button variant="quiet-warn" disabled={pending} onClick={() => review(preview, 'rejected')}><X className="size-4" aria-hidden /> Reject</Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Edit wording">
        {edit && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
            {edit.error && <p role="alert" className="text-[14px] text-st-notyet">{edit.error}</p>}
            <Field label="Question" htmlFor="e-stem" counter={`${edit.stem.length}/160`}><Input id="e-stem" maxLength={160} value={edit.stem} onChange={(e) => setEdit({ ...edit, stem: e.target.value })} /></Field>
            <Field label="Hint" htmlFor="e-hint" counter={`${edit.hint.length}/100`}><Input id="e-hint" maxLength={100} value={edit.hint} onChange={(e) => setEdit({ ...edit, hint: e.target.value })} /></Field>
            <p className="text-[13px] text-ink-2">Answers can&apos;t be changed here, because they were checked by code.</p>
            <Button type="submit" loading={pending}>Save</Button>
          </form>
        )}
      </Dialog>

      {assign && <AssignDialog exercises={exercises} initialId={assign.exId} learners={learners} groups={groups} classrooms={classrooms} onClose={() => setAssign(null)} />}
    </div>
  );
}

function ChildItemPreview({ item }: { item: ExerciseT }) {
  const pic = item.stem.match(/[\p{Extended_Pictographic}]+/u)?.[0];
  const text = pic ? item.stem.replace(pic, '').trim() : item.stem;
  return (
    <div className="font-[family-name:var(--font-child)]">
      {pic && <Counters picture={pic} className="mb-2 [&_svg]:size-8" />}
      <div className="flex items-start justify-between gap-2"><p className="text-[22px] font-extrabold leading-7">{item.type === 'listen_choose' ? 'Listen and tap.' : text}</p>{item.audioText && <Volume2 className="size-5 shrink-0 text-ink-2" aria-label={`Read aloud: ${item.audioText}`} />}</div>
      {item.options && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {item.options.map((o, i) => <span key={o} className={cn('flex min-h-12 items-center justify-center rounded-[14px] border-2 border-white text-[18px] font-extrabold shadow-[0_0_0_1px_var(--line)]', ['bg-teal-soft', 'bg-sun-soft', 'bg-sky-soft', 'bg-clay-soft'][i % 4], String(item.answer) === o && 'ring-2 ring-teal')}>{o}</span>)}
        </div>
      )}
    </div>
  );
}

function ValidatorReport({ report }: { report: ValidationReport }) {
  const dropped = report.items.filter((i) => !i.ok);
  return (
    <IndexCard tab="Validator report" tabTone="stone" className="text-[14px]">
      <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-teal" aria-hidden /> {report.accepted} kept · {report.rejected} dropped</p>
      {dropped.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {dropped.map((r) => <li key={r.index} className="text-ink-2"><b className="text-ink">Item {r.index + 1}</b>{r.stem ? ` (“${r.stem.slice(0, 48)}”)` : ''}: {r.reasons.slice(0, 2).join('; ')}</li>)}
        </ul>
      )}
    </IndexCard>
  );
}

function GenerateSheet({ open, onClose, initialSkill, aiReady, groups, onDone }: { open: boolean; onClose: () => void; initialSkill: string; aiReady: boolean; groups: Group[]; onDone: (r: GenResult) => void }) {
  const [form, setForm] = useState({ skillId: initialSkill, difficulty: '1', count: '5', group: '' });
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<GenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) { setForm((f) => ({ ...f, skillId: initialSkill })); setStep(-1); setResult(null); setError(null); } }, [open, initialSkill]);

  async function run() {
    setError(null); setResult(null); setStep(0);
    const t = setTimeout(() => setStep(1), 2500);
    try {
      const res = await fetch('/api/generate-exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skillId: form.skillId, difficulty: Number(form.difficulty), count: Number(form.count), language: 'en' }) });
      const json = await res.json();
      clearTimeout(t);
      if (!json.ok) { setStep(-1); setError(json.error?.message ?? 'Something went wrong on our side. Try again.'); return; }
      setStep(2); setResult(json.data); onDone(json.data);
    } catch {
      clearTimeout(t); setStep(-1); setError('Could not reach the server. Check your connection and try again.');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} side title="Generate practice" description="AI drafts, code checks every item, you approve.">
      <div className="space-y-4">
        {!aiReady && <p className="rounded-[12px] bg-st-notyet-soft p-3 text-[14px] text-st-notyet">AI is off or not configured. You&apos;ll get the built-in set for this skill, clearly labelled.</p>}
        {groups.length > 0 && (
          <Field label="For a group (optional)" htmlFor="g-group" hint="Picks the group's skill.">
            <Select id="g-group" value={form.group} onChange={(e) => { const g = groups.find((x) => x.id === e.target.value); setForm({ ...form, group: e.target.value, skillId: g?.skill ?? form.skillId }); }}>
              <option value="">No group</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.skill})</option>)}
            </Select>
          </Field>
        )}
        <Field label="Skill" htmlFor="g-skill"><Select id="g-skill" value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })}>{SKILLS.map((s) => <option key={s.id} value={s.id}>{s.id} {s.name}</option>)}</Select></Field>
        <div><span className="mb-1.5 block text-[14px] font-semibold">Level</span><Segmented name="g-diff" label="Level" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={[{ id: '1', label: '1 · easy' }, { id: '2', label: '2' }, { id: '3', label: '3 · harder' }]} /></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Language" htmlFor="g-lang" hint="Others coming soon."><Select id="g-lang" disabled><option>English</option></Select></Field>
          <Field label="Items" htmlFor="g-count"><Select id="g-count" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })}>{[3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></Field>
        </div>
        <Button onClick={run} disabled={step >= 0 && step < 2} className="w-full"><Sparkles className="size-4" aria-hidden /> Generate</Button>

        {step >= 0 && (
          <ol className="flex items-start" aria-live="polite" aria-label="Progress">
            {STEPS.map((s, i) => {
              const done = i < step || (i === 2 && step === 2);
              const now = i === step && !done;
              return (
                <li key={s} className="flex flex-1 flex-col items-center text-center">
                  <span className="flex w-full items-center">
                    <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : i <= step ? 'bg-violet-500' : 'bg-line')} aria-hidden />
                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border-2', done ? 'border-violet-500 bg-violet-500 text-on-primary' : now ? 'border-violet-500 bg-surface text-violet-700' : 'border-line-strong bg-surface text-muted')} aria-hidden>
                      {done ? <Check className="size-4" /> : now ? <Loader2 className="size-4 animate-spin" /> : <Circle className="size-2.5" />}
                    </span>
                    <span className={cn('h-0.5 flex-1', i === STEPS.length - 1 ? 'bg-transparent' : i < step ? 'bg-violet-500' : 'bg-line')} aria-hidden />
                  </span>
                  <span className={cn('mt-2 text-[14px]', done || now ? 'font-semibold text-ink' : 'text-muted')}>{s}<span className="sr-only">{done ? ', done' : now ? ', in progress' : ', waiting'}</span></span>
                </li>
              );
            })}
          </ol>
        )}
        {error && <ErrorPanel message={error} retry={run} />}
        {result && (
          <div className="space-y-3">
            {result.notice && <p className={cn('rounded-[12px] p-3 text-[14px]', result.fallback === 'full' ? 'bg-st-notyet-soft text-st-notyet' : 'bg-sky-soft text-sky')}>{result.fallback === 'full' ? 'Built-in practice (AI unavailable). Try generating again in a few minutes.' : result.notice}</p>}
            {result.report && <ValidatorReport report={result.report} />}
            <p className="text-[14px] text-ink-2">{result.fallback === 'full' ? 'The built-in set for this skill is already approved and can be assigned.' : 'Saved as pending review. Open it in the library to approve or reject. Nothing reaches a child until you approve.'}</p>
            <Button variant="secondary" onClick={onClose}>Back to the library</Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function AssignDialog({ exercises, initialId, learners, groups, classrooms, onClose }: {
  exercises: ExerciseRow[]; initialId: string; learners: { id: string; display_name: string; code: string; classroom_id: string }[]; groups: Group[]; classrooms: { id: string; name: string }[]; onClose: () => void;
}) {
  const [exId, setExId] = useState(initialId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const ex = exercises.find((e) => e.id === exId)!;
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const sets = exercises.filter((e) => e.skill_id === ex.skill_id || e.id === exId);
  return (
    <Dialog open onClose={onClose} title="Assign practice">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await assignExercise({ exerciseId: exId, learnerIds: [...selected] });
        if (!r.ok) { toast(r.error.fields?.learnerIds ?? r.error.message, 'error'); return; }
        toast(`Assigned to ${r.data.count} learner${r.data.count === 1 ? '' : 's'}. They'll see it in learner mode.`); onClose(); router.refresh();
      }); }}>
        <Field label="Practice set" htmlFor="as-set">
          <Select id="as-set" value={exId} onChange={(e) => setExId(e.target.value)}>
            {sets.map((s) => <option key={s.id} value={s.id} disabled={s.review_status !== 'approved'}>{title(s)} · {s.source === 'ai' ? 'AI-drafted' : 'built-in'}{s.review_status !== 'approved' ? ' · approve first' : ''}</option>)}
          </Select>
        </Field>
        {groups.filter((g) => g.skill === ex.skill_id).length > 0 && (
          <div className="flex flex-wrap gap-2">{groups.filter((g) => g.skill === ex.skill_id).map((g) => (
            <Button key={g.id} type="button" size="sm" variant="secondary" onClick={() => setSelected(new Set(g.members))}>Select group: {g.name}</Button>
          ))}</div>
        )}
        <div className="max-h-[40dvh] space-y-4 overflow-y-auto rounded-[12px] border border-line p-3">
          {classrooms.map((c) => {
            const ls = learners.filter((l) => l.classroom_id === c.id);
            if (!ls.length) return null;
            return (
              <fieldset key={c.id}>
                <legend className="mb-1 text-[13px] font-semibold text-ink-2">{c.name}</legend>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {ls.map((l) => (
                    <label key={l.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] px-2 hover:bg-paper-2">
                      <input type="checkbox" className="size-5 accent-[var(--teal)]" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                      <Avatar name={l.display_name} seed={l.code} size={24} label="" /><span className="text-[14px]">{l.display_name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
        <p className="text-[14px]">Assigning <b>‘{title(ex)}’</b> to {selected.size} learner{selected.size === 1 ? '' : 's'}.</p>
        <Button type="submit" loading={pending} disabled={!selected.size || ex.review_status !== 'approved'}>Assign</Button>
      </form>
    </Dialog>
  );
}
