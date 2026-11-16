'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { skillsForStrand, SKILL_BY_ID } from '@/lib/content/skills';
import { workingSkill, type SkillStateName } from '@/lib/scoring/skillState';
import { STATUS, StatusPill, ConfidenceDots } from '@/components/ui/status';
import { Dialog } from '@/components/ui/dialog';
import { cn, fmtDate } from '@/lib/utils';

export type LadderState = { skill_id: string; state: SkillStateName; p: number; n_eff: number; sessions: number; confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean };
export type LadderEvidence = Record<string, { sessions: { id: string; kind: string; at: string; correct: number; total: number; skipped: number; source: 'assessment' | 'exercise' }[] }>;

/** Horizontal 6-step ladder per strand. Click a node to open the evidence drawer. */
export function SkillLadder({ strand, states, evidence = {}, oral = [], compact }: {
  strand: 'literacy' | 'numeracy'; states: LadderState[]; evidence?: LadderEvidence; oral?: { wcpm: number; accuracy: number }[]; compact?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const skills = skillsForStrand(strand);
  const ws = workingSkill(skills.map((s) => {
    const st = states.find((x) => x.skill_id === s.id);
    return st ? { skillId: s.id, sequence: s.sequence, state: st.state, p: Number(st.p), provisional: st.provisional } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x));
  const workingIdx = ws ? skills.findIndex((s) => s.id === ws.skillId) : -1;
  const anyState = states.some((s) => SKILL_BY_ID[s.skill_id]?.strand === strand);
  const sel = open ? states.find((s) => s.skill_id === open) : null;
  const summary = !anyState ? 'No checks yet on this strand.'
    : ws ? `Working on ${SKILL_BY_ID[ws.skillId].name.toLowerCase()}.${ws.recheck ? ' A re-check is suggested first.' : ''}`
    : 'No gaps flagged on the skills checked so far.';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold capitalize">{strand}</h3>
      </div>
      <p className="mb-4 text-[13px] text-ink-2">{summary}</p>
      <ol className="no-scrollbar -mx-1 flex snap-x overflow-x-auto px-1 pb-2" aria-label={`${strand} skill ladder`}>
        {skills.map((sk, i) => {
          const st = states.find((x) => x.skill_id === sk.id);
          const ui = st ? STATUS[st.state] : null;
          const Icon = ui?.icon;
          const working = i === workingIdx;
          const reached = workingIdx === -1 ? !!st : i < workingIdx;
          return (
            <li key={sk.id} className={cn('relative flex min-w-[92px] flex-1 snap-start flex-col items-center text-center', compact && 'min-w-[72px]')}>
              {i > 0 && <span aria-hidden className={cn('absolute right-1/2 top-[22px] h-0.5 w-full -translate-y-1/2', reached || working ? 'bg-primary/60' : 'bg-line')} />}
              <button
                onClick={() => st && setOpen(sk.id)} disabled={!st}
                aria-label={`${sk.id} ${sk.name}: ${st ? STATUS[st.state].label : 'not checked yet'}${working ? ', working skill' : ''}`}
                className={cn('relative z-10 flex size-11 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-transform enabled:hover:scale-105',
                  st ? cn(ui!.cls, ui!.ring) : 'border-dashed border-line-strong bg-surface text-ink-3',
                  working && 'pulse-ring border-primary')}>
                {Icon ? <Icon className="size-4" aria-hidden /> : sk.id}
              </button>
              <span className="mt-2 text-[11px] font-bold text-ink-2">{sk.id}</span>
              <span className="mt-0.5 line-clamp-2 px-1 text-[12px] leading-4">{sk.shortName}</span>
              {working && <span className="mt-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Working here</span>}
              {st?.retest_suggested && <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-st-notyet"><RotateCcw className="size-3" aria-hidden />retest</span>}
            </li>
          );
        })}
      </ol>

      <Dialog open={!!sel} onClose={() => setOpen(null)} side title={sel ? SKILL_BY_ID[sel.skill_id].name : ''} description={sel ? SKILL_BY_ID[sel.skill_id].objective : undefined}>
        {sel && <EvidenceBody s={sel} evidence={evidence} oral={oral} />}
      </Dialog>
    </div>
  );
}

function EvidenceBody({ s, evidence, oral }: { s: LadderState; evidence: LadderEvidence; oral: { wcpm: number; accuracy: number }[] }) {
  const [explain, setExplain] = useState(false);
  const pc = Math.round(Number(s.p) * 100);
  const ev = evidence[s.skill_id]?.sessions ?? [];
  return (
    <div className="space-y-5 text-[14px]">
      <div className="flex flex-wrap items-center gap-3"><StatusPill state={s.state} /><ConfidenceDots confidence={s.confidence} provisional={s.provisional} /></div>
      <p>{sentence(s, pc)}</p>
      {s.retest_suggested && (
        <p className="flex items-start gap-2 rounded-[14px] bg-amber-bg p-3 text-amber-ink"><RotateCcw className="mt-0.5 size-4 shrink-0" aria-hidden />
          Retest suggested: the latest session differs from earlier evidence, so we have not changed the overall picture from one session.</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {[['Weighted score', `${pc}%`], ['Evidence', `${Number(s.n_eff).toFixed(1)} items`], ['Sessions', String(s.sessions)]].map(([k, v]) => (
          <div key={k} className="rounded-[14px] bg-surface-2 p-3"><div className="text-[12px] text-ink-3">{k}</div><div className="text-[16px] font-bold tabular">{v}</div></div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 text-[14px] font-semibold">Sessions, newest first</h3>
        <ol className="relative space-y-3 border-l-2 border-line pl-4">
          {ev.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-surface bg-primary" aria-hidden />
              <div className="flex items-center justify-between gap-2">
                <span><span className="font-semibold capitalize">{e.kind === 'reassessment' ? 're-check' : e.kind}</span> <span className="text-ink-2">· {fmtDate(e.at)}</span></span>
                <span className="font-semibold tabular">{e.correct}/{e.total}</span>
              </div>
              {(e.source === 'exercise' || e.skipped > 0) && <div className="text-[12px] text-ink-3">{e.source === 'exercise' && 'practice counts half'}{e.skipped ? ` ${e.skipped} skipped (not counted)` : ''}</div>}
            </li>
          ))}
          {ev.length === 0 && <li className="text-ink-2">No sessions recorded.</li>}
        </ol>
      </div>
      {s.skill_id === 'L4' && oral.length > 0 && (
        <p className="rounded-[14px] bg-surface-2 p-3">Latest oral reading: <b>{Math.round(oral[oral.length - 1].accuracy * 100)}% accuracy</b>, <b className="tabular">{oral[oral.length - 1].wcpm}</b> words correct per minute.</p>
      )}
      <div>
        <button className="text-[13px] font-semibold text-primary underline underline-offset-4" onClick={() => setExplain((x) => !x)} aria-expanded={explain}>How is this calculated?</button>
        {explain && (
          <p className="mt-2 text-[13px] text-ink-2">Each answer is evidence. Recent sessions count more (each older session counts 70% as much) and practice counts half. “Demonstrated consistently” needs at least 80% across two or more sessions. A strong single session is shown as developing and marked provisional. <Link href="/how-scoring-works" className="underline">Full explanation</Link></p>
        )}
      </div>
    </div>
  );
}

function sentence(s: LadderState, pc: number) {
  switch (s.state) {
    case 'insufficient': return `Only ${Number(s.n_eff).toFixed(1)} items' worth of evidence so far. A few more questions are needed before we can say.`;
    case 'not_yet': return `The weighted score is ${pc}%, below half. A short daily group activity on this skill can help.`;
    case 'developing': return s.provisional && pc >= 80
      ? `A strong first check (${pc}%). One more session will confirm it as demonstrated consistently.`
      : `The weighted score is ${pc}%: some correct, some not yet.`;
    case 'consistent': return `The weighted score is ${pc}% across ${s.sessions} sessions.`;
  }
}
