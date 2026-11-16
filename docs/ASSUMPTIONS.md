# Assumptions and deviations from the build spec

Each entry: what the spec said, what we did, and why. Kept short on purpose.

## Data model
- **Answer keys are not stored in the database.** Spec: `assessment_items.answer` column, never fetched client-side. We dropped the column; answers live only in server code (`lib/content/items.seed.ts`) and are checked in server actions. Removes the risk entirely instead of relying on discipline.
- **`assessment_items.id` is text** (e.g. `N4-2-1`) so the seed is deterministic and readable.
- **Extra columns:** `skill_states.retest_suggested`, `assessment_sessions.ended_early`, `classrooms.is_demo`, `profiles.ai_enabled`, table `demo_accounts`.
- **Only approved exercises can be assigned** is enforced by a database trigger as well as in the server action.

## Scoring
- **Recency is ranked per skill.** Spec: `sessionsAgo` without saying across what. Ranking across all of a learner's sessions meant a literacy session "aged" numeracy evidence (a secure learner showed "not enough evidence"). We rank over the sessions that contain evidence for that skill.
- **Strong first session is not a gap.** Spec: working skill = lowest skill that is `not_yet` or `developing`. Because `consistent` needs two sessions, after one baseline every passed skill is `developing`, so every child would be grouped at L1/N1. We skip a `developing` skill when it is provisional (one session) **and** p ≥ 0.8. The state shown is still "Developing" (with "provisional"), so nothing is overstated.
- **Placement "two failures in a row going up"** is implemented as: after a failed skill reached by moving up, test the next skill up once; stop on a second failure.
- **Downgrade guard:** a `consistent` skill that computes `not_yet` from one new session is stored as `developing` with `retest_suggested = true`.

## AI
- Model id comes from `GEMINI_MODEL`; tested with `gemini-2.5-flash`.
- Exercise JSON is validated per item so one bad item does not discard the set; dropped items are filled from the built-in bank and labelled.
- Assistant answers are post-checked: any learner code not returned by a tool, or any diagnosis term, replaces the answer with "I don't have data for that." / a neutral refusal.

## Demo data
- The demo class is loaded in-memory and written in ~6 batched inserts (an earlier per-row version took ~40 s and risked serverless timeouts).
- Every demo learner is synthetic and labelled "illustrative sample data".

## UI
- Tailwind v4 is used, so design tokens live in `app/globals.css` (`@theme`) rather than `tailwind.config.ts`.
