# Code for Change (HackathonForEveryone): submission draft

> Deadline shown on Devpost: **2 Dec 2026, 2:00am GMT+1**. Plan to submit by **30 Nov**. Judging: Impact, Originality, Technical Execution, Presentation.
> Before submitting: confirm eligibility (students only) with the organisers, and fill in the placeholders marked ▢.

**Project name:** LearnSignal
**Tagline:** Find the exact skill each child is missing, group children who need the same help, and check whether it worked.

## Impact (lead with this)
Roughly 7 in 10 Nigerian children of primary age cannot read and understand a simple text, by World Bank and UNICEF estimates ▢ *(link the primary World Bank report before submitting)*. Teachers with 40–60 children can't easily tell which foundational skill each child is missing, so lessons pitch to the middle of the class.

The approach that works in research is **Teaching at the Right Level**: group children by what they can do, not by age, and teach to that level. It is usually run with paper tallies. LearnSignal makes it practical on a teacher's phone:

1. **Assess:** a 10-minute, teacher-read check per strand (reading, numbers). No child accounts.
2. **Identify:** each child's *working skill*, the first rung on a 6-step ladder they haven't demonstrated.
3. **Group:** children on the same rung are grouped; the teacher decides.
4. **Intervene:** a 15-minute activity using bottle tops, sticks or cards, plus practice the teacher approves.
5. **Reassess:** see who moved up.

It is free to adopt, needs no special hardware, and keeps the teacher in charge.

**Honest status:** no pilot with real children yet. All learners shown are synthetic sample data. Next step: a pilot with 2–3 schools and structured teacher feedback.

## Originality
- The **Class Ladder**: every learner as a dot on the rung they are working on, so a teacher sees the whole class's level in one glance.
- Transparent scoring with a "Why?" panel for every result, and a safeguard so one bad day can't pull a child down.
- AI used only where it can be checked: drafting practice that code re-verifies, and answering teacher questions from class data only.

## Technical execution
Next.js + TypeScript + Supabase (Postgres with row-level security on every table) + Google Gemini. 54 unit tests and 12 live database isolation tests; production build passing. Answer keys never leave the server. See `docs/SAFETY.md` and `docs/AI_BEHAVIOR.md`.

## Presentation
- Live demo: ▢ *(Vercel URL; "Try the demo" opens a sample class with no sign-up)*
- Video (≤4 min): ▢ *(follows `docs/DEMO.md`)*
- Code and build instructions: https://github.com/ifeoluwaadegbulugbe/LearnSignal (README → "Run it locally")

## Team
▢ *(names and roles; see `docs/CREDITS.md`)*

## Built with
Next.js, React, TypeScript, Tailwind CSS, Supabase, Google Gemini (`gemini-3.6-flash`), Zod, Recharts, Vitest, Playwright. Coding assistance: Claude Code.
