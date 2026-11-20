'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Send, Trash2, Merge, GripVertical, Users, Loader2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { IndexCard, Field, Select } from '@/components/ui/primitives';
import { SkillArt } from '@/components/ui/skill-art';
import { SegmentedTabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { ErrorPanel } from '@/components/ui/states';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { StatusPill } from '@/components/ui/status';
import { useToast } from '@/components/ui/toast';
import { acceptGroup, assignExercise, deleteGroup } from '@/lib/actions/intervention';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { INTERVENTIONS } from '@/lib/content/interventions';
import type { SkillStateName } from '@/lib/scoring/skillState';
import type { SuggestedGroup } from '@/lib/scoring/grouping';
import { cn, fmtDate } from '@/lib/utils';

type Accepted = { id: string; name: string; strand: string; target_skill_id: string; created_at: string; members: { id: string; code: string; name: string }[] };
type Ex = { id: string; skill_id: string; difficulty: number; source: string; created_at: string };
type Strand = 'literacy' | 'numeracy';

export function GroupPlanner({ classroomId, suggested, accepted, approvedExercises, loadError, states }: {
  classroomId: string; suggested: Record<Strand, SuggestedGroup[]>; accepted: Accepted[]; approvedExercises: Ex[]; loadError: string | null;
  states: Record<string, Record<string, SkillStateName>>;
}) {
  const [strand, setStrand] = useState<Strand>('numeracy');
  const [drafts, setDrafts] = useState(suggested);
  const [lastMove, setLastMove] = useState<{ learnerId: string; name: string; from: string; to: string } | null>(null);
  const [dragging, setDragging] = useState<{ learnerId: string; from: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [mover, setMover] = useState<{ learnerId: string; name: string; from: string } | null>(null);
  const [merges, setMerges] = useState(false);
  const [assignFor, setAssignFor] = useState<Accepted | null>(null);
  const [exerciseId, setExerciseId] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const boards = drafts[strand];
  const nameOf = (key: string) => boards.find((b) => b.key === key)?.targetSkillId ?? key;

  const move = (learnerId: string, from: string, to: string, record = true) => {
    if (from === to) return;
    setDrafts((d) => {
      const list = d[strand].map((g) => ({ ...g, learners: [...g.learners] }));
      const a = list.find((g) => g.key === from), b = list.find((g) => g.key === to);
      if (!a || !b) return d;
      const i = a.learners.findIndex((l) => l.learnerId === learnerId);
      if (i < 0) return d;
      const [l] = a.learners.splice(i, 1); b.learners.push(l);
      if (record) setLastMove({ learnerId, name: l.displayName, from, to });
      return { ...d, [strand]: list };
    });
  };
  const accept = (g: SuggestedGroup) => start(async () => {
    const r = await acceptGroup({ classroomId, strand, targetSkillId: g.targetSkillId, name: g.name, learnerIds: g.learners.map((l) => l.learnerId) });
    if (!r.ok) { toast(r.error.fields?.name ?? r.error.message, 'error'); return; }
    toast(`“${g.name}” saved.`); router.refresh();
  });
  const remove = (g: Accepted) => start(async () => {
    if (!confirm(`Remove “${g.name}”? Learners and their data are not affected.`)) return;
    const r = await deleteGroup(g.id);
    if (!r.ok) toast(r.error.message, 'error'); else { toast('Group removed.'); router.refresh(); }
  });
  const assign = () => start(async () => {
    if (!assignFor) return;
    const r = await assignExercise({ exerciseId, learnerIds: assignFor.members.map((m) => m.id) });
    if (!r.ok) { toast(r.error.message, 'error'); return; }
    toast(`Assigned to ${r.data.count} learner${r.data.count === 1 ? '' : 's'}.`); setAssignFor(null); router.refresh();
  });
  const exFor = (skill: string) => approvedExercises.filter((e) => e.skill_id === skill);
  const acceptedHere = accepted.filter((a) => a.strand === strand);
  const singletons = boards.filter((b) => b.learners.length === 1 && b.mergeSuggestion);

  return (
    <div className="space-y-8">
      {loadError && <ErrorPanel message={loadError} retry={() => router.refresh()} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs label="Strand" value={strand} onChange={(v) => { setStrand(v as Strand); setLastMove(null); }} items={[{ id: 'numeracy', label: 'Numeracy', count: drafts.numeracy.length }, { id: 'literacy', label: 'Literacy', count: drafts.literacy.length }]} />
        <div className="flex items-center gap-3">
          {pending && <span className="inline-flex items-center gap-1 text-[13px] text-ink-2"><Loader2 className="size-4 animate-spin" aria-hidden /> Saving…</span>}
          {singletons.length > 0 && <Button variant="secondary" size="sm" onClick={() => setMerges(true)}><Merge className="size-4" aria-hidden /> {singletons.length} merge suggestion{singletons.length === 1 ? '' : 's'}</Button>}
        </div>
      </div>

      {lastMove && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-card px-4 py-2.5 text-[14px] shadow-card fade-up">
          Moved <b>{lastMove.name}</b> to {nameOf(lastMove.to)}.
          <button className="font-semibold text-teal underline" onClick={() => { move(lastMove.learnerId, lastMove.to, lastMove.from, false); setLastMove(null); }}>Undo</button>
        </div>
      )}

      <section aria-label="Suggested groups">
        {boards.length === 0 ? <p className="text-[15px] text-ink-2">No {strand} gaps flagged among learners checked so far.</p> : (
          <div className="no-scrollbar -mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-4 pt-3">
            {boards.map((g) => {
              const t = INTERVENTIONS[g.targetSkillId];
              return (
                <div key={g.key} className="w-[min(320px,85vw)] shrink-0 snap-start space-y-5">
                  <IndexCard tab={g.targetSkillId} tabTone="violet" art={<SkillArt skill={g.targetSkillId} />}
                    className={cn('transition-shadow', over === g.key && 'ring-2 ring-teal')}
                    onDragOver={(e) => { e.preventDefault(); setOver(g.key); }} onDragLeave={() => setOver(null)}
                    onDrop={(e) => { e.preventDefault(); if (dragging) move(dragging.learnerId, dragging.from, g.key); setDragging(null); setOver(null); }}>
                    <h3 className="font-heading text-[16px] font-semibold leading-6">{SKILL_BY_ID[g.targetSkillId].name}</h3>
                    <p className="text-[13px] text-ink-2">{g.learners.length} learner{g.learners.length === 1 ? '' : 's'}</p>
                    <ul className="mt-3 min-h-14 space-y-2" aria-label={`Learners in ${g.targetSkillId}`}>
                      {g.learners.map((l) => {
                        const st = states[l.learnerId]?.[g.targetSkillId];
                        return (
                          <li key={l.learnerId} draggable onDragStart={() => setDragging({ learnerId: l.learnerId, from: g.key })} onDragEnd={() => setDragging(null)}
                            className={cn('flex cursor-grab items-center gap-2 rounded-[12px] border border-line bg-card px-2 py-2 active:cursor-grabbing', dragging?.learnerId === l.learnerId && 'opacity-50')}>
                            <GripVertical className="size-4 shrink-0 text-ink-3" aria-hidden />
                            <Avatar name={l.displayName} seed={l.code} size={32} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-semibold">{l.displayName}</span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-1.5"><span className="font-mono text-[11px] text-ink-2">{l.code}</span>{st && <StatusPill state={st} size="sm" short noTip />}</span>
                            </span>
                            {boards.length > 1 && (
                              <button onClick={() => setMover({ learnerId: l.learnerId, name: l.displayName, from: g.key })} onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); setMover({ learnerId: l.learnerId, name: l.displayName, from: g.key }); } }}
                                className="rounded-[8px] px-1.5 py-1 text-[12px] font-semibold text-teal hover:bg-teal-soft" aria-label={`Move ${l.displayName} to another group`}>Move</button>
                            )}
                          </li>
                        );
                      })}
                      {g.learners.length === 0 && <li className="rounded-[12px] border border-dashed border-line-strong p-3 text-center text-[13px] text-ink-3">Drop a learner here</li>}
                    </ul>
                    <Button className="mt-4 w-full" disabled={pending || !g.learners.length} onClick={() => accept(g)}><Check className="size-4" aria-hidden /> Accept group</Button>
                  </IndexCard>
                  <IndexCard tab="15-minute activity" tabTone="aqua" tint="aqua" className="text-[14px] leading-7">
                    <p>{t.activity}</p>
                    <p className="text-ink-2"><b className="font-semibold text-ink">Materials:</b> {t.materials}</p>
                    <p className="text-ink-2"><b className="font-semibold text-ink">Success check:</b> {t.successCheck}</p>
                    <ButtonLink href={`/exercises?skill=${g.targetSkillId}&generate=1`} size="sm" className="mt-3"><Sparkles className="size-4" aria-hidden /> Generate practice</ButtonLink>
                  </IndexCard>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="acc">
        <h2 id="acc" className="mb-4 font-heading text-[20px] font-semibold">Accepted {strand} groups</h2>
        {acceptedHere.length === 0 ? <p className="text-[15px] text-ink-2">None yet. Accept a board above.</p> : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {acceptedHere.map((g) => (
              <IndexCard key={g.id} tab="Group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="truncate font-heading text-[16px] font-semibold">{g.name}</h3><p className="font-mono text-[12px] text-ink-2">{g.target_skill_id} · saved {fmtDate(g.created_at)}</p></div>
                  <button onClick={() => remove(g)} aria-label={`Remove group ${g.name}`} className="rounded-[10px] p-2 text-ink-2 hover:bg-paper-2"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-3 flex items-center gap-2"><AvatarStack people={g.members.map((m) => ({ name: m.name, seed: m.code }))} max={6} /><span className="text-[13px] text-ink-2">{g.members.length}</span></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => { setAssignFor(g); setExerciseId(exFor(g.target_skill_id)[0]?.id ?? ''); }}><Send className="size-4" aria-hidden /> Assign</Button>
                  <ButtonLink size="sm" variant="secondary" href={`/exercises?skill=${g.target_skill_id}&generate=1`}>Generate practice</ButtonLink>
                </div>
              </IndexCard>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!mover} onClose={() => setMover(null)} title={mover ? `Move ${mover.name} to…` : ''}>
        <ul className="space-y-2">
          {boards.filter((b) => b.key !== mover?.from).map((b) => (
            <li key={b.key}><button autoFocus={b === boards.find((x) => x.key !== mover?.from)} onClick={() => { if (mover) move(mover.learnerId, mover.from, b.key); setMover(null); }}
              className="flex min-h-12 w-full items-center justify-between rounded-[12px] border border-line px-4 text-left hover:border-teal hover:bg-teal-soft">
              <span><span className="font-mono text-[12px] text-ink-2">{b.targetSkillId}</span> {SKILL_BY_ID[b.targetSkillId].shortName}</span><span className="text-[13px] text-ink-2">{b.learners.length}</span>
            </button></li>
          ))}
        </ul>
      </Dialog>

      <Dialog open={merges} onClose={() => setMerges(false)} side title="Singletons we suggest merging" description="A group of one is hard to run. You decide.">
        <ul className="space-y-3">
          {singletons.map((g) => (
            <li key={g.key} className="rounded-[14px] border border-line p-3">
              <div className="flex items-center gap-2"><Users className="size-4 text-ink-2" aria-hidden /><b>{g.learners[0].displayName}</b> <span className="font-mono text-[12px] text-ink-2">{g.targetSkillId}</span></div>
              <p className="mt-1 text-[13px] text-ink-2">{g.mergeSuggestion!.reason}</p>
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => { move(g.learners[0].learnerId, g.key, g.mergeSuggestion!.intoKey); setMerges(false); }}><Merge className="size-4" aria-hidden /> Merge</Button>
            </li>
          ))}
        </ul>
      </Dialog>

      <Dialog open={!!assignFor} onClose={() => setAssignFor(null)} title={assignFor ? `Assign practice to ${assignFor.name}` : ''}>
        {assignFor && (exFor(assignFor.target_skill_id).length === 0 ? (
          <div className="space-y-3 text-[15px]"><p>No approved practice sets for {SKILL_BY_ID[assignFor.target_skill_id].name} yet.</p><ButtonLink href={`/exercises?skill=${assignFor.target_skill_id}&generate=1`}>Generate and approve a set</ButtonLink></div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); assign(); }}>
            <Field label="Practice set" htmlFor="ex"><Select id="ex" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
              {exFor(assignFor.target_skill_id).map((e) => <option key={e.id} value={e.id}>{e.source === 'seed' ? 'Built-in' : 'AI-drafted, approved'} · level {e.difficulty} · {fmtDate(e.created_at)}</option>)}
            </Select></Field>
            <p className="text-[14px]">Assigning <b>{SKILL_BY_ID[assignFor.target_skill_id].name}</b> to {assignFor.members.length} learner{assignFor.members.length === 1 ? '' : 's'}: {assignFor.members.map((m) => m.name).join(', ')}.</p>
            <Button type="submit" loading={pending} disabled={!exerciseId}>Assign</Button>
          </form>
        ))}
      </Dialog>
    </div>
  );
}
