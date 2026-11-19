# SLAY HACKS 2026: submission draft

> Deadline shown on Devpost: **7 Dec 2026, 11:00pm GMT+1**. Plan to submit by **5 Dec**.
> The rules list: Innovation 25, Technical 25, Real-world impact 20, AI integration and responsible use 15, UX and presentation 15. The Devpost page lists: Innovation 30, Technical 30, Design/UX 20, Presentation/impact 20. This draft covers both.
> Before submitting: confirm student eligibility (slayyhacks@gmail.com) and that one project may enter more than one event; fill in ▢.

**Title:** LearnSignal
**One line:** A teacher-first tool that finds the exact reading or number skill each child is missing, groups children who need the same help, and checks whether it worked.

## Problem
Roughly 7 in 10 Nigerian primary-age children cannot read and understand a simple text (World Bank/UNICEF estimates ▢ *link*). In classes of 40–60, teachers can't see which foundational skill each child lacks, so many children move up a grade without the basics.

## Solution
Assess → Identify → Group → Intervene → Reassess, on a teacher's phone:
- A 10-minute teacher-read check per strand, adaptive, with oral reading marked by tapping words.
- A **Class Ladder** showing every learner as a dot on the rung they're working on.
- Groups by working skill (Teaching at the Right Level), each with a 15-minute low-resource activity.
- Teacher-approved practice, a gentle child mode, and before/after insights.

## Innovation
- **Explainable levels.** Deterministic, unit-tested scoring with recency weighting, confidence signals and a "Why?" panel. A child is never defined by one bad day.
- **AI that can be checked.** The model drafts practice; code recomputes arithmetic, counts the objects shown, checks words against curated banks and drops anything it can't verify. Teachers approve before any child sees it.
- **Grounded assistant.** It answers only from five fixed database tools under the teacher's own permissions, and a post-check blocks invented learner codes or diagnosis language.

## AI implementation and responsible use
- Model: Google Gemini (`gemini-3.6-flash`), structured JSON output with a schema derived from our Zod types.
- **AI never sets a level, forms a group or assigns work.** It never sees names (codes only).
- Real behaviour, including failures we observed (a retired model, an overloaded model, items the validator dropped), is documented with raw logs in `docs/AI_BEHAVIOR.md`.
- **Dependencies and limitations (as the rules require):** Gemini free tier (Google may use prompts, so we send only pseudonymous skill data; responses take 13–55 s); English-only content; no pilot with real children; no speech recognition. See `docs/LIMITATIONS.md`.

## Technical
Next.js 15, TypeScript, Supabase Postgres with row-level security on every table, server-side scoring (answer keys are not in the database), database trigger preventing unapproved practice from being assigned. 54 unit tests + 12 live RLS isolation tests (teacher B cannot read or change teacher A's data; admin views return totals only).

## UX and presentation
An original "teacher's notebook" design (paper, ink, teal and sun): index cards, the Class Ladder, signal-arc confidence. Mobile-first with a raised Check button, Night theme, keyboard support, no red in learner-related UI, no gamification for children. Screenshots at 390/768/1440px in `docs/screenshots/`.

## Required links
- Working demo: ▢ *(Vercel URL; "Try the demo")*
- Video (2–4 min): ▢
- Screenshots: `docs/screenshots/`
- Repository with setup: https://github.com/ifeoluwaadegbulugbe/LearnSignal
- Team info: ▢ *(see `docs/CREDITS.md`)*
