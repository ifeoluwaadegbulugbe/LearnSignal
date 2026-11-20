'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, UserRound } from 'lucide-react';
import { skillsForStrand, SKILL_BY_ID } from '@/lib/content/skills';
import type { SkillStateName } from '@/lib/scoring/skillState';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { SegmentedTabs } from '@/components/ui/tabs';
import { StatusPill } from '@/components/ui/status';
import { ConfidenceSignal } from '@/components/ui/signal';
import { ButtonLink } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export interface LadderLearner {
  id: string; name: string; code: string;
  working: { literacy: string | null; numeracy: string | null };
  recheck: { literacy: boolean; numeracy: boolean };
  states: { skill_id: string; state: SkillStateName; confidence: 'low' | 'medium' | 'high'; provisional: boolean }[];
  assessed: boolean;
}
type Strand = 'literacy' | 'numeracy';
type Selection = { kind: 'rung'; skillId: string } | { kind: 'learner'; id: string } | { kind: 'secure' } | null;

/** The Class Ladder: six rungs per strand; each learner is a dot on the rung they are working on. */
export function ClassLadder({ learners, strand, onSelect, interactive = true }: { learners: LadderLearner[]; strand: Strand; onSelect?: (s: Selection) => void; interactive?: boolean }) {
  const skills = [...skillsForStrand(strand)].reverse(); // top rung = highest skill
  const assessed = learners.filter((l) => l.states.some((s) => SKILL_BY_ID[s.skill_id].strand === strand));
  const secure = assessed.filter((l) => !l.working[strand]);
  const unchecked = learners.filter((l) => !assessed.includes(l));

  const dot = (l: LadderLearner, i: number) => (
    <Tooltip key={l.id} text={`${l.name} · ${l.code}${l.recheck[strand] ? ' · re-check suggested' : ''}`}>
      <button type="button" disabled={!interactive} onClick={() => onSelect?.({ kind: 'learner', id: l.id })}
        className={cn('dot-settle -ml-1.5 rounded-full ring-2 ring-surface first:ml-0 enabled:hover:z-10 enabled:hover:-translate-y-0.5 enabled:transition-transform', l.recheck[strand] && 'outline-2 outline-dashed outline-offset-1 outline-st-notyet')}
        style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
        <Avatar name={l.name} seed={l.code} size={28} />
      </button>
    </Tooltip>
  );

  return (
    <div>
      {/* Above the ladder: no gap flagged on skills checked */}
      <div className="mb-3 flex min-h-11 items-center gap-3 rounded-[14px] bg-st-consistent-soft/60 px-3 py-1.5">
        <button type="button" disabled={!interactive || !secure.length} onClick={() => onSelect?.({ kind: 'secure' })} className="w-28 shrink-0 text-left text-[12px] font-semibold text-st-consistent sm:w-40">No gap flagged <span className="tabular">({secure.length})</span></button>
        <div className="flex flex-wrap gap-y-1">{secure.length ? secure.map(dot) : <span className="text-[12px] text-ink-3">—</span>}</div>
      </div>
      <ol className="relative overflow-hidden rounded-[16px] border border-line" aria-label={`${strand} class ladder`}>
        {/* violet rails on both edges */}
        <span aria-hidden className="absolute inset-y-0 left-0 z-[2] w-1.5 bg-violet" />
        <span aria-hidden className="absolute inset-y-0 right-0 z-[2] w-1.5 bg-violet" />
        {skills.map((sk, i) => {
          const here = assessed.filter((l) => l.working[strand] === sk.id);
          return (
            <li key={sk.id} className={cn('relative flex min-h-[60px] items-center gap-3 border-b border-line px-4 py-2 last:border-b-0 sm:px-5', i % 2 ? 'bg-surface' : 'bg-surface-2/70')}>
              <button type="button" disabled={!interactive} onClick={() => onSelect?.({ kind: 'rung', skillId: sk.id })}
                className="flex w-[4.25rem] shrink-0 items-center gap-2 rounded-[10px] py-1 text-left enabled:hover:text-violet-deep sm:w-[10.5rem]">
                <span className="rounded-full bg-violet-soft px-2 py-0.5 font-mono text-[12px] font-medium text-violet-deep dark:text-violet">{sk.id}</span>
                <span className="hidden truncate text-[14px] font-semibold sm:block">{sk.shortName}</span>
                <span className="sr-only sm:hidden">{sk.shortName}</span>
                <span className="sr-only">: {here.length} learner{here.length === 1 ? '' : 's'} working here</span>
              </button>
              <div className="flex min-h-10 flex-1 items-center gap-3">
                {here.length ? (
                  <div className="no-scrollbar flex flex-1 flex-wrap items-center gap-y-1 overflow-x-auto">{here.map(dot)}</div>
                ) : <span className="flex-1 border-b border-dotted border-line-strong pb-1 text-[12px] text-ink-3">No one here yet</span>}
                <span className={cn('shrink-0 rounded-full px-2.5 text-[12px] font-semibold tabular', here.length ? 'bg-violet text-white dark:text-[#0C0F1A]' : 'bg-surface-2 text-ink-3')}>{here.length}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {unchecked.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
          Not checked on {strand} yet:
          <span className="flex">{unchecked.slice(0, 12).map((l) => <Avatar key={l.id} name={l.name} seed={l.code} size={24} className="-ml-1.5 ring-2 ring-surface first:ml-0" />)}</span>
          {unchecked.length > 12 && <span>+{unchecked.length - 12}</span>}
        </p>
      )}
    </div>
  );
}

/** Ladder + strand switcher + Focus Panel (slide-over / bottom sheet). */
export function ClassLadderBoard({ learners, defaultStrand = 'numeracy' }: { learners: LadderLearner[]; defaultStrand?: Strand }) {
  const [strand, setStrand] = useState<Strand>(defaultStrand);
  const [sel, setSel] = useState<Selection>(null);
  const assessed = learners.filter((l) => l.states.some((s) => SKILL_BY_ID[s.skill_id].strand === strand));
  const counts = new Map<string, number>();
  for (const l of assessed) { const w = l.working[strand]; if (w) counts.set(w, (counts.get(w) ?? 0) + 1); }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  const panelLearners = !sel ? [] : sel.kind === 'rung' ? assessed.filter((l) => l.working[strand] === sel.skillId)
    : sel.kind === 'secure' ? assessed.filter((l) => !l.working[strand]) : learners.filter((l) => l.id === sel.id);
  const title = !sel ? '' : sel.kind === 'rung' ? `${sel.skillId} · ${SKILL_BY_ID[sel.skillId].name}` : sel.kind === 'secure' ? 'No gap flagged' : panelLearners[0]?.name ?? '';
  const skillFor = (l: LadderLearner) => (sel?.kind === 'rung' ? sel.skillId : l.working[strand]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs label="Strand" value={strand} onChange={(v) => setStrand(v as Strand)} items={[{ id: 'literacy', label: 'Literacy' }, { id: 'numeracy', label: 'Numeracy' }]} />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2" aria-label="Legend">
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-violet" aria-hidden /> Count working here</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-full outline-2 outline-dashed outline-st-notyet" aria-hidden /> Re-check suggested</li>
        </ul>
      </div>
      <ClassLadder learners={learners} strand={strand} onSelect={setSel} />
      <p className="mt-4 text-[14px] text-ink-2">
        {top ? <>Most learners are working on <b className="text-ink">{top[0]} {SKILL_BY_ID[top[0]].shortName.toLowerCase()}</b> ({top[1]} of {assessed.length} checked).</>
          : assessed.length ? 'No gaps flagged on the skills checked so far.' : `No one has been checked on ${strand} yet.`}
      </p>

      <Dialog open={!!sel} onClose={() => setSel(null)} side title={title}
        description={sel?.kind === 'rung' ? SKILL_BY_ID[sel.skillId].objective : sel?.kind === 'learner' ? panelLearners[0]?.code : undefined}>
        {panelLearners.length === 0 ? <p className="text-[14px] text-ink-2">No learners here yet.</p> : (
          <ul className="space-y-3">
            {panelLearners.map((l) => {
              const sk = skillFor(l);
              const st = sk ? l.states.find((s) => s.skill_id === sk) : undefined;
              return (
                <li key={l.id} className="rounded-[14px] border border-line p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} seed={l.code} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{l.name}</div>
                      <div className="font-mono text-[12px] text-ink-2">{l.code}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                    {sk ? <><span className="text-ink-2">{sk} {SKILL_BY_ID[sk].shortName}</span>{st && <><StatusPill state={st.state} size="sm" short /><ConfidenceSignal confidence={st.confidence} provisional={st.provisional} /></>}</>
                      : <span className="text-ink-2">No gap flagged on {strand} skills checked so far.</span>}
                    {l.recheck[strand] && <span className="text-[12px] font-semibold text-st-notyet">Re-check suggested</span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <ButtonLink href={`/learners/${l.id}/assess`} size="sm"><ClipboardCheck className="size-4" aria-hidden /> Start check</ButtonLink>
                    <ButtonLink href={`/learners/${l.id}`} size="sm" variant="secondary"><UserRound className="size-4" aria-hidden /> View profile</ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {sel?.kind === 'rung' && <p className="mt-4 text-[13px] text-ink-2">Plan a 15-minute activity for this rung in <Link href="#groups" onClick={() => setSel(null)} className="font-semibold text-teal underline">Groups</Link>.</p>}
      </Dialog>
    </div>
  );
}
