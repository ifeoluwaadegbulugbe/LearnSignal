import { StatusPill } from '@/components/ui/status';
import { SKILLS } from '@/lib/content/skills';

export const metadata = { title: 'How scoring works' };

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`s${n}`} className="border-t border-line pt-8">
      <h2 id={`s${n}`} className="flex items-baseline gap-3 text-[24px] font-bold">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-violet-100 text-[16px] text-violet-700">{n}</span>{title}
      </h2>
      <div className="mt-4 space-y-4 text-[17px] leading-[1.6]">{children}</div>
    </section>
  );
}

export default function HowScoringWorks() {
  return (
    <article className="mx-auto max-w-[680px] space-y-10 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-[36px] font-bold sm:text-[44px]">How scoring works</h1>
        <p className="mt-4 text-[18px] text-muted">No AI is used to score children. Every level and group comes from the rules below, and the same rules are covered by automated tests.</p>
      </header>

      <Section n={1} title="The skill ladders">
        <div className="grid gap-6 sm:grid-cols-2">
          {(['literacy', 'numeracy'] as const).map((strand) => (
            <div key={strand} className="rounded-[16px] border border-line bg-surface p-5">
              <h3 className="text-[18px] font-bold capitalize">{strand}</h3>
              <ol className="mt-3 space-y-2 text-[16px]">
                {SKILLS.filter((s) => s.strand === strand).reverse().map((s) => <li key={s.id} className="flex gap-3"><b className="w-7 shrink-0 tabular">{s.id}</b>{s.name}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section n={2} title="The placement check">
        <p>It starts on the second skill with 4 questions (2 easy, 2 medium). 3 or 4 right: move up. 0 or 1 right: move down. 2 right: 2 more questions decide.</p>
        <p>It stops when a child misses two skills in a row going up, passes the top skill, or the teacher ends early. Skipped questions are never counted as wrong.</p>
      </Section>

      <Section n={3} title="Skill states">
        <p>Each answer is evidence. Recent sessions count more than older ones (each older session counts 70% as much), and practice counts half as much as a formal check.</p>
        <ul className="space-y-3">
          <li className="flex flex-wrap items-center gap-3"><StatusPill state="insufficient" /> fewer than 3 questions&apos; worth of evidence.</li>
          <li className="flex flex-wrap items-center gap-3"><StatusPill state="not_yet" /> fewer than half right.</li>
          <li className="flex flex-wrap items-center gap-3"><StatusPill state="developing" /> in between.</li>
          <li className="flex flex-wrap items-center gap-3"><StatusPill state="consistent" /> at least 80% right, across at least two separate sessions.</li>
        </ul>
        <blockquote className="my-8 border-l-4 border-violet-500 py-1 pl-6">
          <p className="font-heading text-[26px] font-bold leading-tight">One bad day cannot define a child.</p>
          <p className="mt-2 text-[16px] text-muted">A skill demonstrated consistently is never dropped to &quot;not yet&quot; from a single session. It shows &quot;developing&quot; with a re-check suggested.</p>
        </blockquote>
        <p>Results from only one session are marked <b>provisional</b>.</p>
      </Section>

      <Section n={4} title="Groups">
        <p>Each child&apos;s <b>working skill</b> is the first skill on the ladder that is &quot;not yet&quot; or &quot;developing&quot;. Children with the same working skill are grouped (Teaching at the Right Level).</p>
        <p>Groups are suggestions. The teacher can rename them, move children and decide whether to accept.</p>
      </Section>
    </article>
  );
}
