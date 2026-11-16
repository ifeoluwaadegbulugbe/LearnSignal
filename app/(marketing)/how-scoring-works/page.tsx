import { Card } from '@/components/ui/primitives';
import { StateBadge } from '@/components/ui/state-badge';
import { SKILLS } from '@/lib/content/skills';

export const metadata = { title: 'How scoring works' };

export default function HowScoringWorks() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
      <h1 className="text-[40px] font-bold leading-tight">How scoring works</h1>
      <p className="text-lg text-muted">No AI is used to score children. Every level and group comes from the rules below, and the same rules are covered by automated tests.</p>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">1. The skill ladders</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['literacy', 'numeracy'] as const).map((strand) => (
            <div key={strand}>
              <h3 className="mb-2 font-semibold capitalize">{strand}</h3>
              <ol className="space-y-1 text-[15px]">
                {SKILLS.filter((s) => s.strand === strand).map((s) => <li key={s.id}><b>{s.id}</b> {s.name}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-2 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">2. The placement check</h2>
        <p>It starts on the second skill with 4 questions (2 easy, 2 medium). 3 or 4 right: move up. 0 or 1 right: move down. 2 right: 2 more questions decide. It stops when a child misses two skills in a row going up, passes the top skill, or the teacher ends early. Skipped questions are never counted as wrong.</p>
      </Card>

      <Card className="space-y-3 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">3. Skill states</h2>
        <p>Each answer is evidence. Recent sessions count more than older ones (each older session counts 70% as much), and practice counts half as much as a formal check.</p>
        <ul className="space-y-2">
          <li className="flex flex-wrap items-center gap-2"><StateBadge state="insufficient" /> fewer than 3 questions’ worth of evidence.</li>
          <li className="flex flex-wrap items-center gap-2"><StateBadge state="not_yet" /> fewer than half right.</li>
          <li className="flex flex-wrap items-center gap-2"><StateBadge state="developing" /> in between.</li>
          <li className="flex flex-wrap items-center gap-2"><StateBadge state="consistent" /> at least 80% right, across at least two separate sessions.</li>
        </ul>
        <p><b>One bad day cannot define a child.</b> A skill demonstrated consistently is never dropped to “not yet” from a single session; it shows “developing — retest suggested”.</p>
        <p>Results from only one session are marked <b>provisional</b>.</p>
      </Card>

      <Card className="space-y-2 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold">4. Groups</h2>
        <p>Each child&apos;s <b>working skill</b> is the first skill on the ladder that is “not yet” or “developing”. Children with the same working skill are grouped (Teaching at the Right Level). Groups are suggestions: the teacher can rename them, move children and decide whether to accept.</p>
      </Card>
    </article>
  );
}
