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
        className={cn('dot-settle -ml-1.5 rounded-full ring-2 ring-card first:ml-0 enabled:hover:z-10 enabled:hover:-translate-y-0.5 enabled:transition-transform', l.recheck[strand] && 'outline-2 outline-dashed outline-offset-1 outline-st-notyet')}
        style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} aria-label={`${l.name}, learner code ${l.code}`}>
        <Avatar name={l.name} seed={l.code} size={24} label="" />
      </button>
    </Tooltip>
  );

  return (
    <div>
      {/* Above the ladder: no gap flagged on skills checked */}
      <div className="mb-2 flex min-h-10 items-center gap-3 rounded-[12px] border border-dashed border-line-strong px-3 py-1.5">
        <button type="button" disabled={!interactive || !secure.length} onClick={() => onSelect?.({ kind: 'secure' })} className="w-28 shrink-0 text-left text-[12px] font-semibold text-ink-2 sm:w-40">No gap flagged <span className="tabular text-ink">({secure.length})</span></button>
        <div className="flex flex-wrap gap-y-1">{secure.length ? secure.map(dot) : <span className="text-[12px] text-ink-3">—</span>}</div>
      </div>
      <ol className="relative" aria-label={`${strand} class ladder`}>
        {/* ladder rails */}
        <span aria-hidden className="absolute bottom-3 left-[4.75rem] top-3 w-1 rounded-full bg-teal/20 sm:left-[9.25rem]" />
        <span aria-hidden className="absolute bottom-3 right-2 top-3 w-1 rounded-full bg-teal/20" />
        {skills.map((sk) => {
          const here = assessed.filter((l) => l.working[strand] === sk.id);
          return (
            <li key={sk.id} className="relative flex min-h-14 items-center gap-3 py-1.5">
              <button type="button" disabled={!interactive} onClick={() => onSelect?.({ kind: 'rung', skillId: sk.id })}
                className="w-[4.25rem] shrink-0 rounded-[10px] px-1 py-1 text-left enabled:hover:bg-paper-2 sm:w-[8.75rem]" aria-label={`${sk.id} ${sk.name}: ${here.length} learner${here.length === 1 ? '' : 's'} working here`}>
                <span className="block font-mono text-[12px] text-ink-2">{sk.id}</span>
                <span className="hidden truncate text-[13px] font-semibold sm:block">{sk.shortName}</span>
              </button>
              <div className={cn('relative z-[1] flex min-h-10 flex-1 items-center gap-3 rounded-full border px-3 py-1.5', here.length ? 'border-teal/30 bg-teal-soft/70' : 'border-dashed border-line-strong bg-card')}>
                {here.length ? (
                  <div className="no-scrollbar flex flex-1 flex-wrap items-center gap-y-1 overflow-x-auto">{here.map(dot)}</div>
                ) : <span className="flex-1 text-[12px] text-ink-3">No one here yet</span>}
                <span className="shrink-0 rounded-full bg-card px-2 text-[12px] font-semibold tabular text-ink-2">{here.length}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {unchecked.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
          Not checked on {strand} yet:
          <span className="flex opacity-60">{unchecked.slice(0, 12).map((l) => <Avatar key={l.id} name={l.name} seed={l.code} size={24} className="-ml-1.5 ring-2 ring-paper first:ml-0" />)}</span>
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
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-teal-soft ring-1 ring-teal/40" aria-hidden /> Working here</li>
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
