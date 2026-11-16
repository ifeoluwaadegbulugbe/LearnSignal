'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Check, X, Send, Pencil, BookOpen, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Card, Field, Input, Select } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorPanel } from '@/components/ui/states';
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

export function ExerciseLibrary({ exercises, loadError, userId, aiReady, learners, classrooms, initialSkill, openGenerator }: {
  exercises: ExerciseRow[]; loadError: string | null; userId: string; aiReady: boolean;
  learners: { id: string; display_name: string; code: string; classroom_id: string }[]; classrooms: { id: string; name: string }[];
  initialSkill: string; openGenerator: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [filters, setFilters] = useState({ skill: initialSkill, difficulty: '', source: '', status: '' });
  const [gen, setGen] = useState({ open: openGenerator, skillId: initialSkill || 'N4', difficulty: '1', count: '5', loading: false, error: '' as string, result: null as GenResult | null });
  const [preview, setPreview] = useState<ExerciseRow | null>(null);
  const [assign, setAssign] = useState<{ ex: ExerciseRow; selected: Set<string> } | null>(null);
  const [edit, setEdit] = useState<{ ex: ExerciseRow; index: number; stem: string; hint: string; error?: string } | null>(null);

  const list = useMemo(() => exercises.filter((e) =>
    (!filters.skill || e.skill_id === filters.skill) && (!filters.difficulty || String(e.difficulty) === filters.difficulty) &&
    (!filters.source || e.source === filters.source) && (!filters.status || e.review_status === filters.status)), [exercises, filters]);

  async function generate() {
    setGen((g) => ({ ...g, loading: true, error: '', result: null }));
    try {
      const res = await fetch('/api/generate-exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skillId: gen.skillId, difficulty: Number(gen.difficulty), count: Number(gen.count), language: 'en' }) });
      const json = await res.json();
      if (!json.ok) { setGen((g) => ({ ...g, loading: false, error: json.error?.message ?? 'Generation failed.' })); return; }
      setGen((g) => ({ ...g, loading: false, result: json.data }));
      router.refresh();
    } catch {
      setGen((g) => ({ ...g, loading: false, error: 'Could not reach the server. Check your connection.' }));
    }
  }

  const review = (ex: ExerciseRow, status: 'approved' | 'rejected') => start(async () => {
    const r = await reviewExercise({ exerciseId: ex.id, status });
    if (!r.ok) { toast(r.error.message, 'error'); return; }
    toast(status === 'approved' ? 'Approved. You can now assign this set.' : 'Rejected. It will not be assigned.'); setPreview(null); router.refresh();
  });
  const doAssign = () => start(async () => {
    if (!assign) return;
    const r = await assignExercise({ exerciseId: assign.ex.id, learnerIds: [...assign.selected] });
    if (!r.ok) { toast(r.error.fields?.learnerIds ?? r.error.message, 'error'); return; }
    toast(`Assigned to ${r.data.count} learner${r.data.count === 1 ? '' : 's'}.`); setAssign(null); router.refresh();
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

      <Card className={cn(!gen.open && 'py-3')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="size-5 text-primary" aria-hidden /> Generate a practice set</h2>
          <Button variant="ghost" size="sm" onClick={() => setGen((g) => ({ ...g, open: !g.open }))} aria-expanded={gen.open}>{gen.open ? 'Hide' : 'Open'}</Button>
        </div>
        {gen.open && (
          <div className="mt-4 space-y-4">
            {!aiReady && <p className="rounded-xl bg-accent-soft px-3 py-2 text-[14px] text-[#7A4E0C]">AI is off or not configured on this deployment. Generating will return the built-in practice set, clearly labelled.</p>}
            <form className="grid gap-3 sm:grid-cols-4 sm:items-end" onSubmit={(e) => { e.preventDefault(); generate(); }}>
              <Field label="Skill" htmlFor="g-skill"><Select id="g-skill" value={gen.skillId} onChange={(e) => setGen({ ...gen, skillId: e.target.value })}>{SKILLS.map((s) => <option key={s.id} value={s.id}>{s.id} {s.shortName}</option>)}</Select></Field>
              <Field label="Level" htmlFor="g-diff"><Select id="g-diff" value={gen.difficulty} onChange={(e) => setGen({ ...gen, difficulty: e.target.value })}><option value="1">1 · easy</option><option value="2">2 · medium</option><option value="3">3 · harder</option></Select></Field>
              <Field label="Items" htmlFor="g-count"><Select id="g-count" value={gen.count} onChange={(e) => setGen({ ...gen, count: e.target.value })}>{[3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></Field>
              <Button type="submit" loading={gen.loading}><Sparkles className="size-4" aria-hidden /> Generate</Button>
            </form>
            {gen.loading && <p role="status" className="text-[14px] text-muted">Drafting and checking items… this can take up to 20 seconds.</p>}
            {gen.error && <ErrorPanel message={gen.error} retry={generate} />}
            {gen.result && <GenerationResult result={gen.result} />}
          </div>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Select aria-label="Filter by skill" value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })}><option value="">All skills</option>{SKILLS.map((s) => <option key={s.id} value={s.id}>{s.id} {s.shortName}</option>)}</Select>
        <Select aria-label="Filter by level" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">All levels</option>{[1, 2, 3].map((d) => <option key={d} value={d}>Level {d}</option>)}</Select>
        <Select aria-label="Filter by source" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}><option value="">All sources</option><option value="seed">Built-in</option><option value="ai">AI-drafted</option></Select>
        <Select aria-label="Filter by review status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Any status</option><option value="pending">Waiting for review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>
      </div>

      {exercises.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-6" />} title="Generate your first set" body="Built-in sets appear here once the database seed has been run. Generate an AI-drafted set above." />
      ) : list.length === 0 ? <EmptyState title="No sets match these filters" /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ex) => (
            <li key={ex.id}>
              <Card className="flex h-full flex-col">
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={ex.source === 'ai' ? 'sky' : 'neutral'}>{ex.source === 'ai' ? <><Sparkles className="size-3" aria-hidden /> AI-drafted</> : 'Built-in'}</Badge>
                  {ex.source === 'ai' && <Badge tone="primary"><ShieldCheck className="size-3" aria-hidden /> validated</Badge>}
                  <Badge tone={ex.review_status === 'approved' ? 'primary' : ex.review_status === 'pending' ? 'accent' : 'neutral'}>{ex.review_status === 'pending' ? 'needs review' : ex.review_status}</Badge>
                </div>
                <h3 className="mt-3 font-bold">{ex.skill_id} {SKILL_BY_ID[ex.skill_id]?.shortName} · level {ex.difficulty}</h3>
                <p className="mt-1 line-clamp-2 text-[14px] text-muted">{ex.content.items[0]?.stem}</p>
                <p className="mt-1 text-[12px] text-muted">{ex.content.items.length} items · {ex.source === 'seed' ? 'built-in' : fmtDate(ex.created_at)}{ex.validation?.seedItems ? ` · ${ex.validation.seedItems} built-in filler` : ''}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button size="sm" variant="secondary" onClick={() => setPreview(ex)}><Eye className="size-4" aria-hidden /> {ex.review_status === 'pending' && ex.created_by === userId ? 'Review' : 'Preview'}</Button>
                  {ex.review_status === 'approved' && <Button size="sm" onClick={() => setAssign({ ex, selected: new Set() })}><Send className="size-4" aria-hidden /> Assign</Button>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview ? `${preview.skill_id} ${SKILL_BY_ID[preview.skill_id]?.shortName} · level ${preview.difficulty}` : ''} side>
        {preview && (
          <div className="space-y-4">
            {preview.validation?.items && <ValidatorSummary report={preview.validation} />}
            <ol className="space-y-3">
              {preview.content.items.map((it, i) => (
                <li key={i} className="rounded-xl border border-line p-3 text-[14px]">
                  <div className="mb-1 flex items-center justify-between"><span className="font-semibold">Item {i + 1}</span><Badge tone={it.source === 'ai' ? 'sky' : 'neutral'}>{it.source === 'ai' ? 'AI · passed checks' : 'built-in'}</Badge></div>
                  <p className="text-[16px]">{it.stem}</p>
                  {it.audioText && <p className="text-muted">Read aloud: “{it.audioText}”</p>}
                  {it.options && <p>Options: {it.options.join(' · ')}</p>}
                  <p>Answer: <b>{String(it.answer)}</b></p>
                  <p className="text-muted">Hint: {it.hint}</p>
                  {preview.review_status === 'pending' && preview.created_by === userId && (
                    <Button size="sm" variant="ghost" className="mt-1" onClick={() => setEdit({ ex: preview, index: i, stem: it.stem, hint: it.hint })}><Pencil className="size-4" aria-hidden /> Edit wording</Button>
                  )}
                </li>
              ))}
            </ol>
            {preview.review_status === 'pending' && preview.created_by === userId && (
              <div className="sticky bottom-0 flex gap-2 bg-white py-2">
                <Button disabled={pending} onClick={() => review(preview, 'approved')}><Check className="size-4" aria-hidden /> Approve</Button>
                <Button variant="danger" disabled={pending} onClick={() => review(preview, 'rejected')}><X className="size-4" aria-hidden /> Reject</Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Edit wording">
        {edit && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
            {edit.error && <p role="alert" className="text-[14px] text-danger">{edit.error}</p>}
            <Field label="Question" htmlFor="e-stem"><Input id="e-stem" maxLength={160} value={edit.stem} onChange={(e) => setEdit({ ...edit, stem: e.target.value })} /></Field>
            <Field label="Hint" htmlFor="e-hint"><Input id="e-hint" maxLength={100} value={edit.hint} onChange={(e) => setEdit({ ...edit, hint: e.target.value })} /></Field>
            <p className="text-[13px] text-muted">Answers cannot be changed here because they were checked by code.</p>
            <Button type="submit" loading={pending}>Save</Button>
          </form>
        )}
      </Dialog>

      <Dialog open={!!assign} onClose={() => setAssign(null)} title="Assign practice">
        {assign && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); doAssign(); }}>
            <p className="text-[14px]">{assign.ex.skill_id} {SKILL_BY_ID[assign.ex.skill_id]?.name} · level {assign.ex.difficulty}</p>
            {learners.length === 0 ? <p className="text-[14px] text-muted">No learners yet.</p> : classrooms.map((c) => {
              const ls = learners.filter((l) => l.classroom_id === c.id);
              if (!ls.length) return null;
              return (
                <fieldset key={c.id}>
                  <legend className="mb-1 text-[14px] font-semibold">{c.name}</legend>
                  <div className="grid grid-cols-2 gap-1">
                    {ls.map((l) => (
                      <label key={l.id} className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-bg">
                        <input type="checkbox" className="size-5 accent-[#0F6B5C]" checked={assign.selected.has(l.id)} onChange={(e) => {
                          const s = new Set(assign.selected); if (e.target.checked) s.add(l.id); else s.delete(l.id); setAssign({ ...assign, selected: s });
                        }} />
                        <span className="text-[14px]">{l.display_name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
            <Button type="submit" loading={pending} disabled={assign.selected.size === 0}>Assign to {assign.selected.size}</Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}

function GenerationResult({ result }: { result: GenResult }) {
  return (
    <div className="space-y-3 rounded-xl border border-line bg-bg p-4">
      {result.notice && (
        <p role="status" className={cn('flex items-start gap-2 rounded-lg px-3 py-2 text-[14px]', result.fallback === 'full' ? 'bg-accent-soft text-[#7A4E0C]' : 'bg-sky-soft text-[#1F5C91]')}>
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {result.notice}
        </p>
      )}
      {result.report && <ValidatorSummary report={result.report} />}
      <p className="text-[14px]">
        {result.fallback === 'full'
          ? 'Showing the built-in set for this skill (already approved). You can assign it from the library below.'
          : 'Saved as “needs review”. Open it in the library below to approve or reject. Nothing is assigned until you approve.'}
      </p>
    </div>
  );
}

function ValidatorSummary({ report }: { report: ValidationReport }) {
  const rejected = report.items.filter((i) => !i.ok);
  return (
    <div className="rounded-xl bg-white p-3 text-[14px]">
      <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-primary" aria-hidden /> Validator: {report.accepted} accepted, {report.rejected} rejected</p>
      {rejected.length > 0 && (
        <ul className="mt-2 space-y-1">
          {rejected.map((r) => <li key={r.index} className="text-muted">Rejected item {r.index + 1}{r.stem ? ` (“${r.stem.slice(0, 50)}”)` : ''}: {r.reasons.slice(0, 2).join('; ')}</li>)}
        </ul>
      )}
    </div>
  );
}
