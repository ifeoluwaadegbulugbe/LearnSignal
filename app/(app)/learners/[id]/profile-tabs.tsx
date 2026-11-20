'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, BookOpen, HelpCircle } from 'lucide-react';
import { SKILL_BY_ID } from '@/lib/content/skills';
import { INTERVENTIONS } from '@/lib/content/interventions';
import { TextTabs, SegmentedTabs } from '@/components/ui/tabs';
import { Button, ButtonLink } from '@/components/ui/button';
import { IndexCard, Field, Textarea, Badge } from '@/components/ui/primitives';
import { StatusPill } from '@/components/ui/status';
import { ConfidenceSignal } from '@/components/ui/signal';
import { Timeline, WorkList, WorkRow } from '@/components/ui/cards';
import { EmptyState } from '@/components/ui/states';
import { IconTile } from '@/components/ui/icon-tile';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { SkillLadder, EvidenceBody, type LadderState, type LadderEvidence } from '@/components/learner/skill-ladder';
import { BeforeAfterChart, type BeforeAfterPoint } from '@/components/charts/before-after-chart';
import { addNote, setRecommendationStatus } from '@/lib/actions/learners';
import { fmtDate } from '@/lib/utils';

type Props = {
  learner: { id: string; name: string; code: string };
  states: LadderState[]; evidence: LadderEvidence; oral: { wcpm: number; accuracy: number }[];
  sessions: { id: string; strand: string; kind: string; started_at: string; completed_at: string | null; ended_early: boolean }[];
  recs: { id: string; skill_id: string; rationale: string; status: string; created_at: string }[];
  notes: { id: string; body: string; created_at: string }[];
  assignments: { id: string; status: string; created_at: string; skill_id: string; source: string }[];
  chart: BeforeAfterPoint[]; chartSkills: { id: string; name: string }[];
};

export function ProfileTabs(p: Props) {
  const [tab, setTab] = useState('overview');
  const assessed = p.states.length > 0;
  return (
    <div>
      <div className="mb-6 border-b border-line">
        <TextTabs label="Learner sections" value={tab} onChange={setTab} items={[
          { id: 'overview', label: 'Overview' },
          { id: 'history', label: 'History', count: p.sessions.filter((s) => s.completed_at).length },
          { id: 'practice', label: 'Practice', count: p.assignments.length },
          { id: 'notes', label: 'Notes', count: p.notes.length },
        ]} />
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="fade-up" key={tab}>
        {tab === 'overview' && (assessed ? <Overview {...p} /> : <NotChecked learnerId={p.learner.id} />)}
        {tab === 'history' && <History {...p} />}
        {tab === 'practice' && <Practice {...p} />}
        {tab === 'notes' && <Notes {...p} />}
      </div>
    </div>
  );
}

function NotChecked({ learnerId }: { learnerId: string }) {
  return (
    <div className="relative">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 opacity-40 md:grid-cols-2" aria-hidden>
        <IndexCard><SkillLadder strand="literacy" states={[]} /></IndexCard>
        <IndexCard><SkillLadder strand="numeracy" states={[]} /></IndexCard>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <IndexCard tab="Next step" tabTone="sun" className="max-w-sm text-center shadow-pop">
          <p className="font-heading text-[20px] font-semibold">No checks yet</p>
          <p className="mt-1 text-[14px] text-ink-2">A baseline takes about 8–10 minutes per strand.</p>
          <ButtonLink href={`/learners/${learnerId}/assess`} variant="sun" className="mt-4"><ClipboardCheck className="size-4" aria-hidden /> Start check</ButtonLink>
        </IndexCard>
      </div>
    </div>
  );
}

function Overview({ states, evidence, oral, recs, learner }: Props) {
  const [why, setWhy] = useState<string | null>(null);
  const [strand, setStrand] = useState('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const suggested = recs.filter((r) => r.status === 'suggested');
  const gaps = states.filter((s) => (s.state === 'not_yet' || s.state === 'developing') && !(s.state === 'developing' && s.provisional && Number(s.p) >= 0.8))
    .filter((s) => strand === 'all' || SKILL_BY_ID[s.skill_id].strand === strand)
    .filter((s) => !lowOnly || s.confidence === 'low')
    .sort((a, b) => SKILL_BY_ID[a.skill_id].sequence - SKILL_BY_ID[b.skill_id].sequence || a.skill_id.localeCompare(b.skill_id));
  const act = (id: string, status: 'accepted' | 'dismissed') => start(async () => {
    const r = await setRecommendationStatus(id, status);
    if (!r.ok) toast(r.error.message, 'error'); else { toast(status === 'accepted' ? 'Next step accepted.' : 'Dismissed.'); router.refresh(); }
  });
  const sel = why ? states.find((s) => s.skill_id === why) : null;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
        {(['literacy', 'numeracy'] as const).map((s) => {
          const rec = suggested.find((r) => SKILL_BY_ID[r.skill_id].strand === s);
          return (
            <div key={s} className="space-y-6">
              <IndexCard><SkillLadder strand={s} states={states} evidence={evidence} oral={oral} /></IndexCard>
              {rec && (
                <IndexCard tab="Next step" tabTone="sun" tint="sun" className="border-transparent">
                  <p className="font-heading text-[16px] font-semibold">{rec.skill_id} {SKILL_BY_ID[rec.skill_id].name}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{INTERVENTIONS[rec.skill_id].activity}</p>
                  <p className="mt-1 text-[13px] text-ink-2">Success check: {INTERVENTIONS[rec.skill_id].successCheck}.</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" disabled={pending} onClick={() => act(rec.id, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(rec.id, 'dismissed')}>Dismiss</Button>
                  </div>
                </IndexCard>
              )}
            </div>
          );
        })}
      </div>

      <section aria-labelledby="gaps">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="gaps" className="font-heading text-[20px] font-semibold">Gaps, in foundational order</h2>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedTabs label="Strand" value={strand} onChange={setStrand} items={[{ id: 'all', label: 'Both' }, { id: 'literacy', label: 'Literacy' }, { id: 'numeracy', label: 'Numeracy' }]} />
            <label className="flex items-center gap-2 text-[13px] font-medium"><input type="checkbox" className="size-4 accent-[var(--teal)]" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low confidence only</label>
          </div>
        </div>
        {gaps.length === 0 ? (
          <EmptyState illustration="celebrate" title="No gaps flagged" body="Keep practising to confirm consistency." />
        ) : (
          <div className="space-y-3">
            {gaps.map((g) => {
              const ev = evidence[g.skill_id]?.sessions ?? [];
              const c = ev.reduce((n, e) => n + e.correct, 0), t = ev.reduce((n, e) => n + e.total, 0);
              return (
                <details key={g.skill_id} className="group rounded-[18px] border border-line bg-card shadow-card">
                  <summary className="flex min-h-16 cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-3">
                    <StatusPill state={g.state} size="sm" short />
                    <span className="min-w-0 flex-1 font-semibold">{g.skill_id} {SKILL_BY_ID[g.skill_id].name}</span>
                    <Badge>{c} of {t} correct · {g.sessions} session{g.sessions === 1 ? '' : 's'}</Badge>
                    <ConfidenceSignal confidence={g.confidence} provisional={g.provisional} />
                  </summary>
                  <div className="border-t border-dashed border-line px-5 pb-5 pt-3">
                    <p className="text-[14px] text-ink-2">{SKILL_BY_ID[g.skill_id].objective}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setWhy(g.skill_id)}><HelpCircle className="size-4" aria-hidden /> Why?</Button>
                      {(() => { const r = suggested.find((x) => x.skill_id === g.skill_id); return r ? <><Button size="sm" disabled={pending} onClick={() => act(r.id, 'accepted')}>Accept recommendation</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => act(r.id, 'dismissed')}>Dismiss</Button></> : null; })()}
                      <ButtonLink size="sm" variant="ghost" href={`/exercises?skill=${g.skill_id}`}>Practice sets</ButtonLink>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
      <Dialog open={!!sel} onClose={() => setWhy(null)} side title={sel ? SKILL_BY_ID[sel.skill_id].name : ''} description={sel ? `${learner.name} · ${SKILL_BY_ID[sel.skill_id].objective}` : undefined}>
        {sel && <EvidenceBody s={sel} evidence={evidence} oral={oral} />}
      </Dialog>
    </div>
  );
}

function History({ sessions, chart, chartSkills }: Props) {
  const done = sessions.filter((s) => s.completed_at || s.started_at);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <IndexCard tab="Sessions" ruled>
        <Timeline empty="No sessions yet." items={done.map((s) => ({
          id: s.id, tone: s.kind === 'baseline' ? 'teal' : 'sun',
          title: <span className="capitalize">{s.strand} {s.kind === 'reassessment' ? 're-check' : 'baseline'}</span>,
          meta: `${fmtDate(s.completed_at ?? s.started_at)}${s.ended_early ? ' · ended early' : ''}${!s.completed_at ? ' · unfinished' : ''}`,
        }))} />
      </IndexCard>
      <IndexCard>
        {chartSkills.length ? <BeforeAfterChart title="Before and after: % correct per skill" data={chart} skills={chartSkills} />
          : <EmptyState className="border-0 shadow-none" illustration="empty-results" title="Re-check to see change" body="A before-and-after view appears once a skill has been checked in two sessions." />}
      </IndexCard>
    </div>
  );
}

function Practice({ assignments, learner }: Props) {
  if (!assignments.length) return <EmptyState illustration="empty-practice" title="No practice assigned" body="Assign an approved set from Practice or from a group." action={<ButtonLink href="/exercises">Open Practice</ButtonLink>} />;
  const open = assignments.filter((a) => a.status !== 'completed');
  const doneA = assignments.filter((a) => a.status === 'completed');
  const rows = (list: typeof assignments) => list.map((a) => (
    <WorkRow key={a.id} leading={<IconTile icon={BookOpen} hue={a.source === 'ai' ? 'sky' : 'teal'} />}
      title={`${a.skill_id} ${SKILL_BY_ID[a.skill_id].name}`} subline={`${a.source === 'ai' ? 'AI-drafted, approved' : 'Built-in'} · assigned ${fmtDate(a.created_at)}`}
      trailing={<Badge tone={a.status === 'completed' ? 'mint' : 'sun'}>{a.status === 'completed' ? 'Completed' : 'To do'}</Badge>} />
  ));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
      <section><h2 className="mb-3 font-heading text-[18px] font-semibold">To do ({open.length})</h2>{open.length ? <WorkList>{rows(open)}</WorkList> : <p className="text-[14px] text-ink-2">Nothing waiting.</p>}
        {open.length > 0 && <ButtonLink href={`/learn/${learner.id}`} variant="secondary" className="mt-3">Open learner mode</ButtonLink>}</section>
      <section><h2 className="mb-3 font-heading text-[18px] font-semibold">Completed ({doneA.length})</h2>{doneA.length ? <WorkList>{rows(doneA)}</WorkList> : <p className="text-[14px] text-ink-2">None yet.</p>}</section>
    </div>
  );
}

function Notes({ notes, learner }: Props) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        {notes.length === 0 && <p className="text-[14px] text-ink-2">No notes yet.</p>}
        {notes.map((n) => (
          <IndexCard key={n.id} tab="Note" tabTone="clay" ruled margin>
            <p className="whitespace-pre-wrap text-[15px] leading-7">{n.body}</p>
            <p className="mt-2 text-[12px] text-ink-2">{fmtDate(n.created_at)}</p>
          </IndexCard>
        ))}
      </div>
      <IndexCard tab="New note" tabTone="stone" className="self-start">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
          const r = await addNote({ learnerId: learner.id, body });
          if (!r.ok) { setError(r.error.fields?.body ?? r.error.message); return; }
          setBody(''); setError(undefined); toast('Note saved.'); router.refresh();
        }); }}>
          <Field label="Note" htmlFor="note" error={error} counter={`${body.length}/1000`} hint="Observations about skills only. Avoid health or family details.">
            <Textarea id="note" maxLength={1000} rows={5} value={body} onChange={(e) => setBody(e.target.value)} invalid={!!error} className="ruled leading-7" />
          </Field>
          <Button type="submit" loading={pending} disabled={!body.trim()}>Save note</Button>
        </form>
      </IndexCard>
    </div>
  );
}
