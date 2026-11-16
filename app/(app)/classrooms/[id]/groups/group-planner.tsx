'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Send, Trash2, Info, Merge } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge, Card, Field, Input, Select } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { ErrorPanel } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { acceptGroup, assignExercise, deleteGroup } from '@/lib/actions/intervention';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { INTERVENTIONS } from '@/lib/content/interventions';
import { cn, fmtDate } from '@/lib/utils';
import type { SuggestedGroup } from '@/lib/scoring/grouping';

type Accepted = { id: string; name: string; strand: string; target_skill_id: string; created_at: string; members: { id: string; code: string; name: string }[] };
type Ex = { id: string; skill_id: string; difficulty: number; source: string; created_at: string };

export function GroupPlanner({ classroomId, suggested, accepted, approvedExercises, loadError }: {
  classroomId: string; suggested: Record<'literacy' | 'numeracy', SuggestedGroup[]>; accepted: Accepted[]; approvedExercises: Ex[]; loadError: string | null;
}) {
  const [strand, setStrand] = useState<'literacy' | 'numeracy'>('numeracy');
  const [drafts, setDrafts] = useState(suggested);
  const [assignFor, setAssignFor] = useState<Accepted | null>(null);
  const [exerciseId, setExerciseId] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const groups = drafts[strand];

  const move = (learnerId: string, fromKey: string, toKey: string) => setDrafts((d) => {
    const list = d[strand].map((g) => ({ ...g, learners: [...g.learners] }));
    const from = list.find((g) => g.key === fromKey)!, to = list.find((g) => g.key === toKey)!;
    const idx = from.learners.findIndex((l) => l.learnerId === learnerId);
    to.learners.push(...from.learners.splice(idx, 1));
    return { ...d, [strand]: list };
  });
  const rename = (key: string, name: string) => setDrafts((d) => ({ ...d, [strand]: d[strand].map((g) => (g.key === key ? { ...g, name } : g)) }));
  const mergeInto = (g: SuggestedGroup) => g.mergeSuggestion && g.learners.forEach((l) => move(l.learnerId, g.key, g.mergeSuggestion!.intoKey));

  const accept = (g: SuggestedGroup) => start(async () => {
    const r = await acceptGroup({ classroomId, strand, targetSkillId: g.targetSkillId, name: g.name, learnerIds: g.learners.map((l) => l.learnerId) });
    if (!r.ok) { toast(r.error.fields?.name ?? r.error.message, 'error'); return; }
    toast(`Group “${g.name}” saved.`); router.refresh();
  });
  const remove = (g: Accepted) => start(async () => {
    if (!confirm(`Remove the group “${g.name}”? Learners and their data are not affected.`)) return;
    const r = await deleteGroup(g.id);
    if (!r.ok) toast(r.error.message, 'error'); else { toast('Group removed.'); router.refresh(); }
  });
  const assign = () => start(async () => {
    if (!assignFor) return;
    const r = await assignExercise({ exerciseId, learnerIds: assignFor.members.map((m) => m.id) });
    if (!r.ok) { toast(r.error.message, 'error'); return; }
    toast(`Assigned to ${r.data.count} learner${r.data.count === 1 ? '' : 's'}. They will see it in learner mode.`); setAssignFor(null); router.refresh();
  });

  const acceptedHere = accepted.filter((a) => a.strand === strand);
  const exFor = (skill: string) => approvedExercises.filter((e) => e.skill_id === skill);

  return (
    <div className="space-y-6">
      {loadError && <ErrorPanel message={loadError} retry={() => router.refresh()} />}
      <div role="tablist" aria-label="Strand" className="inline-flex rounded-xl border border-line bg-surface p-1">
        {(['numeracy', 'literacy'] as const).map((s) => (
          <button key={s} role="tab" aria-selected={strand === s} onClick={() => setStrand(s)} className={cn('min-h-10 rounded-lg px-4 text-[15px] font-semibold capitalize', strand === s ? 'bg-primary text-white' : 'text-ink')}>{s}</button>
        ))}
      </div>

      <section aria-labelledby="sugg">
        <h2 id="sugg" className="mb-3 text-lg font-bold">Suggested groups</h2>
        {groups.length === 0 ? <p className="text-[15px] text-muted">No {strand} gaps flagged among assessed learners.</p> : (
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {groups.map((g) => (
              <Card key={g.key} className="min-w-[280px] snap-start">
                <Field label="Group name" htmlFor={`n-${g.key}`}><Input id={`n-${g.key}`} value={g.name} maxLength={80} onChange={(e) => rename(g.key, e.target.value)} /></Field>
                <p className="mt-2 text-[13px] text-muted">Target: {g.targetSkillId} {SKILL_BY_ID[g.targetSkillId].name}</p>
                <ul className="mt-3 space-y-2">
                  {g.learners.map((l) => (
                    <li key={l.learnerId} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                      <span className="text-[15px]"><b>{l.displayName}</b> <span className="font-mono text-[12px] text-muted">{l.code}</span>{l.recheck && <Badge className="ml-1">re-check</Badge>}</span>
                      {groups.length > 1 && (
                        <select aria-label={`Move ${l.displayName} to another group`} className="min-h-9 rounded-lg border border-line bg-white px-2 text-[13px]" value={g.key} onChange={(e) => move(l.learnerId, g.key, e.target.value)}>
                          {groups.map((o) => <option key={o.key} value={o.key}>{o.key === g.key ? 'Move to…' : o.name.slice(0, 24)}</option>)}
                        </select>
                      )}
                    </li>
                  ))}
                  {g.learners.length === 0 && <li className="text-[14px] text-muted">Empty group</li>}
                </ul>
                {g.mergeSuggestion && g.learners.length === 1 && (
                  <div className="mt-3 rounded-xl bg-sky-soft p-2 text-[13px]">
                    <p className="flex gap-1"><Info className="size-4 shrink-0" aria-hidden /> {g.mergeSuggestion.reason}</p>
                    <Button size="sm" variant="ghost" className="mt-1" onClick={() => mergeInto(g)}><Merge className="size-4" aria-hidden /> Merge</Button>
                  </div>
                )}
                <div className="mt-3 rounded-xl bg-bg p-3 text-[13px]"><b>15-minute activity:</b> {INTERVENTIONS[g.targetSkillId].activity}</div>
                <Button className="mt-3 w-full" disabled={pending || g.learners.length === 0} onClick={() => accept(g)}><Check className="size-4" aria-hidden /> Accept group</Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="acc">
        <h2 id="acc" className="mb-3 text-lg font-bold">Accepted {strand} groups</h2>
        {acceptedHere.length === 0 ? <p className="text-[15px] text-muted">None yet. Accept a suggested group above.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {acceptedHere.map((g) => {
              const t = INTERVENTIONS[g.target_skill_id];
              return (
                <Card key={g.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div><h3 className="font-bold">{g.name}</h3><p className="text-[13px] text-muted">{g.target_skill_id} {SKILL_BY_ID[g.target_skill_id].name} · saved {fmtDate(g.created_at)}</p></div>
                    <Button variant="ghost" size="sm" onClick={() => remove(g)} aria-label={`Remove group ${g.name}`}><Trash2 className="size-4" /></Button>
                  </div>
                  <p className="mt-2 text-[14px]">{g.members.map((m) => m.name).join(', ')}</p>
                  <dl className="mt-3 space-y-1 rounded-xl bg-bg p-3 text-[13px]">
                    <div><dt className="inline font-semibold">Activity: </dt><dd className="inline">{t.activity}</dd></div>
                    <div><dt className="inline font-semibold">Materials: </dt><dd className="inline">{t.materials}</dd></div>
                    <div><dt className="inline font-semibold">Success check: </dt><dd className="inline">{t.successCheck}</dd></div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ButtonLink size="sm" variant="secondary" href={`/exercises?skill=${g.target_skill_id}&generate=1`}><Sparkles className="size-4" aria-hidden /> Generate exercises</ButtonLink>
                    <Button size="sm" onClick={() => { setAssignFor(g); setExerciseId(exFor(g.target_skill_id)[0]?.id ?? ''); }}><Send className="size-4" aria-hidden /> Assign practice</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={!!assignFor} onClose={() => setAssignFor(null)} title={assignFor ? `Assign practice to ${assignFor.name}` : ''}>
        {assignFor && (exFor(assignFor.target_skill_id).length === 0 ? (
          <div className="space-y-3 text-[15px]">
            <p>No approved exercise sets for {SKILL_BY_ID[assignFor.target_skill_id].name} yet.</p>
            <ButtonLink href={`/exercises?skill=${assignFor.target_skill_id}&generate=1`}>Generate and approve a set</ButtonLink>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); assign(); }}>
            <Field label="Exercise set" htmlFor="ex">
              <Select id="ex" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                {exFor(assignFor.target_skill_id).map((e) => <option key={e.id} value={e.id}>{e.source === 'seed' ? 'Built-in' : 'AI-drafted (approved)'} · level {e.difficulty} · {fmtDate(e.created_at)}</option>)}
              </Select>
            </Field>
            <p className="text-[14px] text-muted">Learners: {assignFor.members.map((m) => m.name).join(', ')}</p>
            <Button type="submit" loading={pending} disabled={!exerciseId}>Assign to {assignFor.members.length}</Button>
          </form>
        ))}
      </Dialog>
    </div>
  );
}
