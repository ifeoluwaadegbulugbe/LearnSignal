'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { skillsForStrand, SKILL_BY_ID } from '@/lib/content/skills';
import { workingSkill, type SkillStateName } from '@/lib/scoring/skillState';
import { STATUS, StatusPill } from '@/components/ui/status';
import { ConfidenceTiles } from '@/components/ui/signal';
import { Dialog } from '@/components/ui/dialog';
import { cn, fmtDate } from '@/lib/utils';

export type LadderState = { skill_id: string; state: SkillStateName; p: number; n_eff: number; sessions: number; confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean };
export type LadderEvidence = Record<string, { sessions: { id: string; kind: string; at: string; correct: number; total: number; skipped: number; source: 'assessment' | 'exercise' }[] }>;

/** One learner, one strand: six steps, widest at the top. Click a step to open the evidence drawer. */
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
      <h3 className="text-[20px] font-bold capitalize">{strand}</h3>
      <p className="mb-5 mt-1 text-[15px] text-muted">{summary}</p>
      {/* Staircase turned on its side: the top step (6) is the widest; each row is one step. */}
      <ol className="flex flex-col-reverse gap-2" aria-label={`${strand} skill ladder`}>
        {skills.map((sk, i) => {
          const st = states.find((x) => x.skill_id === sk.id);
          const working = i === workingIdx;
          return (
            <li key={sk.id} style={{ width: `${compact ? 100 : 64 + i * 7.2}%` }} className="min-w-[min(100%,300px)]">
              <button
                onClick={() => st && setOpen(sk.id)} disabled={!st}
                className={cn('flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors',
                  working ? 'border-violet-500 bg-violet-500 text-on-primary'
                    : st ? 'border-line bg-violet-50 enabled:hover:bg-violet-100' : 'border-dashed border-line-strong bg-surface text-muted',
                  st?.retest_suggested && !working && 'border-2 border-dashed border-tangerine')}>
                <span className="w-8 shrink-0 text-[15px] font-bold">{sk.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{sk.shortName}</span><span className="sr-only">{sk.name}. {st ? STATUS[st.state].label : ''}</span>
                  {working && <span className="mt-1 inline-flex whitespace-nowrap rounded-full bg-tangerine px-2.5 py-0.5 text-[13px] font-semibold text-on-tangerine">Working here</span>}
                </span>
                {st ? (
                  <span className="flex shrink-0 items-center gap-2">
                    {st.retest_suggested && <span className={cn('hidden items-center gap-1 text-[13px] font-semibold sm:inline-flex', working ? '' : 'text-tangerine-ink')}><RotateCcw className="size-3.5" aria-hidden />Re-check</span>}
                    <StatusPill state={st.state} size="sm" short />
                    <span className={cn('hidden sm:inline', working && '[&_svg_rect]:!fill-[var(--on-primary)]')}><ConfidenceTiles confidence={st.confidence} provisional={st.provisional} showLabel={false} /></span>
                  </span>
                ) : <span className="shrink-0 text-[14px]">Not checked yet</span>}
              </button>
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

export function EvidenceBody({ s, evidence, oral }: { s: LadderState; evidence: LadderEvidence; oral: { wcpm: number; accuracy: number }[] }) {
  const [explain, setExplain] = useState(false);
  const pc = Math.round(Number(s.p) * 100);
  const ev = evidence[s.skill_id]?.sessions ?? [];
  return (
    <div className="space-y-5 text-[15px]">
      <div className="flex flex-wrap items-center gap-3"><StatusPill state={s.state} /><ConfidenceTiles confidence={s.confidence} provisional={s.provisional} /></div>
      <p>{sentence(s, pc)}</p>
      {s.retest_suggested && (
        <p className="flex items-start gap-2 rounded-[12px] border border-tangerine-line bg-tangerine-tint p-3 text-tangerine-ink"><RotateCcw className="mt-0.5 size-4 shrink-0" aria-hidden />
          Retest suggested: the latest session differs from earlier evidence, so we have not changed the overall picture from one session.</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {[['Weighted score', `${pc}%`], ['Evidence', `${Number(s.n_eff).toFixed(1)} items`], ['Sessions', String(s.sessions)]].map(([k, v]) => (
          <div key={k} className="rounded-[12px] bg-inset p-3"><div className="text-[13px] text-muted">{k}</div><div className="text-[16px] font-bold tabular">{v}</div></div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 text-[14px] font-semibold">Sessions, newest first</h3>
        <ol className="relative space-y-3 border-l-2 border-line pl-4">
          {ev.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-surface bg-violet-500" aria-hidden />
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
        <p className="rounded-[12px] bg-inset p-3">Latest oral reading: <b>{Math.round(oral[oral.length - 1].accuracy * 100)}% accuracy</b>, <b className="tabular">{oral[oral.length - 1].wcpm}</b> words correct per minute.</p>
      )}
      <div>
        <button className="min-h-11 text-[15px] font-semibold text-violet-700 underline underline-offset-4" onClick={() => setExplain((x) => !x)} aria-expanded={explain}>How is this calculated?</button>
        {explain && (
          <p className="mt-2 text-[15px] text-muted">Each answer is evidence. Recent sessions count more (each older session counts 70% as much) and practice counts half. “Demonstrated consistently” needs at least 80% across two or more sessions. A strong single session is shown as developing and marked provisional. <Link href="/how-scoring-works" className="underline">Full explanation</Link></p>
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
