'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, UserRound } from 'lucide-react';
import { skillsForStrand, SKILL_BY_ID } from '@/lib/content/skills';
import type { SkillStateName } from '@/lib/scoring/skillState';
import { Avatar, initials } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { SegmentedTabs } from '@/components/ui/tabs';
import { StatusPill } from '@/components/ui/status';
import { ConfidenceTiles } from '@/components/ui/signal';
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

/**
 * The Class Ladder: a staircase of six steps per strand. Each learner is an initials circle
 * standing on the step they are working on. Only the busiest ("working") step is solid violet;
 * a tangerine "Working here" chip sits above it. A dashed tangerine ring means re-check suggested.
 * Below ~520px of card width the staircase becomes stacked rows (N6 down to N1).
 */
export function ClassLadder({ learners, strand, onSelect, interactive = true }: { learners: LadderLearner[]; strand: Strand; onSelect?: (s: Selection) => void; interactive?: boolean }) {
  const skills = skillsForStrand(strand); // N1 → N6
  const assessed = learners.filter((l) => l.states.some((s) => SKILL_BY_ID[s.skill_id].strand === strand));
  const secure = assessed.filter((l) => !l.working[strand]);
  const unchecked = learners.filter((l) => !assessed.includes(l));
  const on = (id: string) => assessed.filter((l) => l.working[strand] === id);
  const busiest = [...skills].map((s) => ({ id: s.id, n: on(s.id).length })).sort((a, b) => b.n - a.n)[0];
  const workingId = busiest && busiest.n > 0 ? busiest.id : null;

  const circle = (l: LadderLearner, solid: boolean) => (
    <Tooltip key={l.id} text={`${l.name} · ${l.code}${l.recheck[strand] ? ' · re-check suggested' : ''}`}>
      <button type="button" disabled={!interactive} onClick={(e) => { e.stopPropagation(); onSelect?.({ kind: 'learner', id: l.id }); }}
        className={cn('dot-settle flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-[13px] font-semibold text-ink',
          l.recheck[strand] ? 'border-2 border-dashed border-tangerine' : solid ? 'border border-surface' : 'border border-line-strong',
          'enabled:hover:border-violet-500')}>
        <span aria-hidden>{initials(l.name)}</span><span className="sr-only">{l.name}, {l.code}{l.recheck[strand] ? ', re-check suggested' : ''}</span>
      </button>
    </Tooltip>
  );

  return (
    <div className="@container/ladder">
      {/* ---------- Staircase (wide) ---------- */}
      <div className="hidden @min-[520px]/ladder:block">
        <ol className="flex items-end gap-2 border-b-2 border-line-strong" aria-label={`${strand} class ladder`}>
          {skills.map((sk, i) => {
            const here = on(sk.id);
            const isWorking = sk.id === workingId;
            return (
              <li key={sk.id} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                {isWorking && <span className="mb-2 whitespace-nowrap rounded-full bg-tangerine px-3 py-0.5 text-[13px] font-semibold text-on-tangerine">Working here</span>}
                {here.length > 0 && (
                  <div className="mb-2 flex max-w-full flex-wrap-reverse justify-center gap-1.5 px-1">{here.map((l) => circle(l, false))}</div>
                )}
                <button type="button" disabled={!interactive} onClick={() => onSelect?.({ kind: 'rung', skillId: sk.id })}
                  style={{ height: `${88 + i * 24}px` }}
                  className={cn('flex w-full flex-col justify-end overflow-hidden rounded-t-[12px] border border-b-0 p-2.5 text-left transition-colors @min-[700px]/ladder:p-3',
                    isWorking ? 'border-violet-500 bg-violet-500 text-on-primary' : 'border-line bg-violet-50 text-ink enabled:hover:bg-violet-100')}>
                  <span className="text-[15px] font-bold">{sk.id}</span>
                  <span className={cn('line-clamp-2 break-words text-[13px] leading-tight', isWorking ? 'opacity-95' : 'text-muted')}>{sk.shortName}</span>
                  <span className="sr-only">: {here.length} learner{here.length === 1 ? '' : 's'} working here</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ---------- Rows (narrow): N6 down to N1 ---------- */}
      <ol className="space-y-3 @min-[520px]/ladder:hidden" aria-label={`${strand} class ladder`}>
        {[...skills].reverse().map((sk) => {
          const here = on(sk.id);
          const isWorking = sk.id === workingId;
          return (
            <li key={sk.id}>
              <div role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
                onClick={() => interactive && onSelect?.({ kind: 'rung', skillId: sk.id })}
                onKeyDown={(e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect?.({ kind: 'rung', skillId: sk.id }); } }}
                className={cn('flex items-center gap-3 rounded-[16px] border p-4', isWorking ? 'border-violet-500 bg-violet-500 text-on-primary' : 'border-line bg-surface', interactive && 'cursor-pointer')}>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold">{sk.id}</div>
                  <div className={cn('text-[15px]', isWorking ? '' : 'text-muted')}>{sk.shortName}</div>
                  {isWorking && <span className="mt-2 inline-flex whitespace-nowrap rounded-full bg-tangerine px-3 py-0.5 text-[13px] font-semibold text-on-tangerine">Working here</span>}
                  <span className="sr-only">{here.length} learner{here.length === 1 ? '' : 's'} working here</span>
                </div>
                {here.length ? <div className="flex max-w-[60%] flex-wrap justify-end gap-1.5">{here.map((l) => circle(l, isWorking))}</div>
                  : <span className={cn('text-[14px]', isWorking ? '' : 'text-muted')}>No one yet</span>}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Legend and the learners not on a step */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted">
        <span className="flex items-center gap-2"><span className="size-4 rounded-full border border-line-strong bg-surface" aria-hidden /> Learner</span>
        <span className="flex items-center gap-2"><span className="size-4 rounded-full border-2 border-dashed border-tangerine bg-surface" aria-hidden /> Re-check suggested</span>
        {secure.length > 0 && (
          <button type="button" disabled={!interactive} onClick={() => onSelect?.({ kind: 'secure' })} className="enabled:underline enabled:underline-offset-4">
            No gap flagged: {secure.length}
          </button>
        )}
        {unchecked.length > 0 && <span>Not checked on {strand}: {unchecked.length}</span>}
      </div>
    </div>
  );
}

/** Ladder + strand switcher + Focus Panel (slide-over / bottom sheet). */
/** Strand toggle for the board header (rendered by the page next to the card title). */
export function StrandToggle({ value, onChange }: { value: Strand; onChange: (s: Strand) => void }) {
  return <SegmentedTabs label="Strand" value={value} onChange={(v) => onChange(v as Strand)} items={[{ id: 'literacy', label: 'Literacy' }, { id: 'numeracy', label: 'Numeracy' }]} />;
}

/** Card: title, strand toggle, staircase, Focus Panel (slide-over / bottom sheet). */
export function ClassLadderBoard({ learners, defaultStrand = 'numeracy', title = 'Class ladder', subtitle = 'Each learner stands on the step they are working on.' }: { learners: LadderLearner[]; defaultStrand?: Strand; title?: string; subtitle?: string }) {
  const [strand, setStrand] = useState<Strand>(defaultStrand);
  const [sel, setSel] = useState<Selection>(null);
  const assessed = learners.filter((l) => l.states.some((s) => SKILL_BY_ID[s.skill_id].strand === strand));

  const panelLearners = !sel ? [] : sel.kind === 'rung' ? assessed.filter((l) => l.working[strand] === sel.skillId)
    : sel.kind === 'secure' ? assessed.filter((l) => !l.working[strand]) : learners.filter((l) => l.id === sel.id);
  const panelTitle = !sel ? '' : sel.kind === 'rung' ? `${sel.skillId} · ${SKILL_BY_ID[sel.skillId].name}` : sel.kind === 'secure' ? 'No gap flagged' : panelLearners[0]?.name ?? '';
  const skillFor = (l: LadderLearner) => (sel?.kind === 'rung' ? sel.skillId : l.working[strand]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 @container sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[20px] font-bold">{title}</h2>
          <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
        </div>
        <StrandToggle value={strand} onChange={setStrand} />
      </div>
      <ClassLadder learners={learners} strand={strand} onSelect={setSel} />

      <Dialog open={!!sel} onClose={() => setSel(null)} side title={panelTitle}
        description={sel?.kind === 'rung' ? SKILL_BY_ID[sel.skillId].objective : sel?.kind === 'learner' ? panelLearners[0]?.code : undefined}>
        {panelLearners.length === 0 ? <p className="text-[14px] text-ink-2">No learners here yet.</p> : (
          <ul className="space-y-3">
            {panelLearners.map((l) => {
              const sk = skillFor(l);
              const st = sk ? l.states.find((s) => s.skill_id === sk) : undefined;
              return (
                <li key={l.id} className="rounded-[12px] border border-line p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} seed={l.code} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{l.name}</div>
                      <div className="font-mono text-[12px] text-ink-2">{l.code}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                    {sk ? <><span className="text-ink-2">{sk} {SKILL_BY_ID[sk].shortName}</span>{st && <><StatusPill state={st.state} size="sm" short /><ConfidenceTiles confidence={st.confidence} provisional={st.provisional} /></>}</>
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
        {sel?.kind === 'rung' && <p className="mt-4 text-[13px] text-ink-2">Plan a 15-minute activity for this rung in <Link href="#groups" onClick={() => setSel(null)} className="font-semibold text-violet-700 underline">Groups</Link>.</p>}
      </Dialog>
    </div>
  );
}
