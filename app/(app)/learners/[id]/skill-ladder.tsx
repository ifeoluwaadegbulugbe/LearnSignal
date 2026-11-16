'use client';
import { useState } from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { skillsForStrand, SKILL_BY_ID } from '@/lib/content/skills';
import { StateBadge, ConfidenceBadge, STATE_UI } from '@/components/ui/state-badge';
import { Dialog } from '@/components/ui/dialog';
import { fmtDate } from '@/lib/utils';
import type { SkillStateName } from '@/lib/scoring/skillState';
import type { SkillEvidence } from '@/lib/server/learner';

type S = { skill_id: string; state: SkillStateName; p: number; n_eff: number; sessions: number; confidence: 'low' | 'medium' | 'high'; provisional: boolean; retest_suggested: boolean };

export function SkillLadder({ strand, states, evidence, oral }: { strand: 'literacy' | 'numeracy'; states: S[]; evidence: Record<string, SkillEvidence>; oral: { wcpm: number; accuracy: number }[] }) {
  const [why, setWhy] = useState<string | null>(null);
  const skills = skillsForStrand(strand);
  const sel = why ? states.find((s) => s.skill_id === why) : null;

  return (
    <>
      <h2 className="mb-3 text-lg font-bold capitalize">{strand}</h2>
      <ol className="space-y-2">
        {[...skills].reverse().map((sk) => {
          const s = states.find((x) => x.skill_id === sk.id);
          return (
            <li key={sk.id} className="rounded-xl border border-line p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-semibold">{sk.id} {sk.shortName}</div>
                  {s ? <div className="mt-1"><ConfidenceBadge confidence={s.confidence} provisional={s.provisional} /></div> : <div className="mt-1 text-[12px] text-muted">Not tested</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s ? <StateBadge state={s.state} short /> : <span className="text-[12px] text-muted">—</span>}
                  {s && <button onClick={() => setWhy(sk.id)} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-primary hover:bg-primary-soft"><HelpCircle className="size-4" aria-hidden /> Why?</button>}
                </div>
              </div>
              {s?.retest_suggested && <p className="mt-2 flex items-center gap-1 text-[13px] text-[#8A5410]"><RotateCcw className="size-3.5" aria-hidden /> Retest suggested: the latest session differs from earlier evidence.</p>}
            </li>
          );
        })}
      </ol>
      {states.some((s) => s.provisional && SKILL_BY_ID[s.skill_id].strand === strand) && <p className="mt-2 text-[12px] text-muted">Provisional = based on one session only.</p>}

      <Dialog open={!!sel} onClose={() => setWhy(null)} title={sel ? `Why: ${SKILL_BY_ID[sel.skill_id].name}` : ''} side>
        {sel && (
          <div className="space-y-4 text-[15px]">
            <StateBadge state={sel.state} />
            <p>{explain(sel)}</p>
            <dl className="grid grid-cols-2 gap-2 rounded-xl bg-bg p-3 text-[14px]">
              <dt className="text-muted">Weighted score</dt><dd className="font-semibold">{Math.round(sel.p * 100)}%</dd>
              <dt className="text-muted">Evidence weight</dt><dd className="font-semibold">{Number(sel.n_eff).toFixed(1)} items</dd>
              <dt className="text-muted">Sessions</dt><dd className="font-semibold">{sel.sessions}</dd>
              <dt className="text-muted">Confidence</dt><dd className="font-semibold capitalize">{sel.confidence}</dd>
            </dl>
            <div>
              <h3 className="mb-2 font-semibold">Evidence, newest first</h3>
              <ul className="space-y-2">
                {(evidence[sel.skill_id]?.sessions ?? []).map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-[14px]">
                    <span><span className="capitalize">{e.kind}</span> · {fmtDate(e.at)}{e.source === 'exercise' && <span className="text-muted"> (counts half)</span>}</span>
                    <span className="font-semibold">{e.correct}/{e.total}{e.skipped ? <span className="font-normal text-muted"> · {e.skipped} skipped</span> : null}</span>
                  </li>
                ))}
              </ul>
            </div>
            {sel.skill_id === 'L4' && oral.length > 0 && (
              <p className="text-[14px]">Latest oral reading: <b>{Math.round(oral[oral.length - 1].accuracy * 100)}% accuracy</b>, {oral[oral.length - 1].wcpm} words correct per minute.</p>
            )}
            <p className="text-[13px] text-muted">Recent sessions count more (each older session counts 70% as much). Practice counts half. “Consistent” needs ≥80% across at least two sessions. {STATE_UI[sel.state].label} is a description of evidence so far, not a judgement of the child.</p>
          </div>
        )}
      </Dialog>
    </>
  );
}

function explain(s: S) {
  const pc = Math.round(s.p * 100);
  switch (s.state) {
    case 'insufficient': return `Only ${Number(s.n_eff).toFixed(1)} items' worth of evidence so far — at least 3 are needed before we describe this skill.`;
    case 'not_yet': return `The weighted score is ${pc}%, below 50%. This is the kind of skill a short daily group activity can help with.`;
    case 'developing': return s.sessions < 2 && pc >= 80
      ? `The score is strong (${pc}%), but “consistent” needs evidence from at least two separate sessions.`
      : `The weighted score is ${pc}%: some right, some not yet. More practice and a later check will clarify.`;
    case 'consistent': return `The weighted score is ${pc}% across ${s.sessions} sessions — demonstrated consistently.`;
  }
}
