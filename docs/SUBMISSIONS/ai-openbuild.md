# AI OpenBuild: submission draft

> Deadline shown on Devpost: **11 Dec 2026, 5:45am GMT+1** (text says "submit by December 10", ET). Plan to submit by **9 Dec**.
> Judging: AI integration and technical execution 30, Originality and problem framing 25, Usefulness and UX 25, Testing and communication 20.
> Before submitting: confirm student eligibility (hackathonsmadeforfun@yahoo.com); fill in ▢.

## The idea and who it's for
**LearnSignal** helps primary teachers in Nigeria find the exact foundational reading or number skill each child is missing, group children who need the same help, and check whether it worked. Users: teachers (main), school admins (totals only), and children (a teacher-launched practice mode, no accounts).

## The AI, with representative inputs and outputs
AI is used in two narrow, checkable places. Scoring, levels and groups are deterministic rules, never AI.

**1. Practice drafting** (`/api/generate-exercises`)
- Input: `{ skillId: "N4", difficulty: 2, count: 5 }`
- Output: "14 − 6 = ?" (8), "17 − 9 = ?" (8), "15 − 8 = ?" (7), "12 − 5 = ?" (7), "16 − 7 = ?" (9). The validator recomputed every answer: **5 kept**. Saved as *pending* until a teacher approves.
- Input: `{ skillId: "N6", difficulty: 2, count: 5 }` (word problems)
- Output: **3 kept, 2 dropped.** "His mother gave him 7 more oranges" mixes an add word and a take-away word, so code can't verify the intended answer. Dropped items were replaced with labelled built-in items.

**2. Ask, a grounded assistant** (`/api/assistant`)
- "Who needs subtraction support?" → called `learners_by_skill_state(N4, needs_support)` → listed 9 learner codes (6 not yet, 3 developing). Every code was checked against the tool result before display; the teacher sees first names, the model never did.
- "Which learners have the best handwriting?" → "I don't have data for that."

Full logs: `docs/AI_BEHAVIOR.md` and raw JSON in `docs/ai-runs/`.

## At least one failure case, and how we tested
- **Observed:** `gemini-2.5-flash` returned 404 ("no longer available to new users") and `gemini-3.8-flash` returned 503 ("high demand"). The app retried three times with backoff, then showed built-in practice labelled "AI unavailable". We switched `GEMINI_MODEL` to `gemini-3.6-flash`.
- **Observed:** the validator **falsely rejected** two correct word problems because their wording was ambiguous to the checker. We kept the conservative rule (an unverifiable item never reaches a child) and documented the trade-off.
- **Observed:** real answers used Markdown, and one mixed class data with general guidance; we fixed the display so guidance is never styled as class data.
- **Tested with scripted model output:** wrong arithmetic, malformed JSON, an invented learner code, diagnosis language and data claims without a tool call are all rejected (`tests/unit/`).

**Test totals:** 54 unit tests (scoring, placement, grouping, validator, generation fallback, assistant golden tests) and 12 live row-level-security checks with two real teacher accounts. Production build passes.

## Usefulness and UX
The Class Ladder shows every child's level at a glance; groups come with 15-minute activities using bottle tops and sticks; child mode is calm (no red, no points). Mobile-first, keyboard accessible, Night theme. Screenshots: `docs/screenshots/`. Short video: ▢

## Stack, providers and AI assistance (disclosure)
Next.js 15, TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, RLS), Google Gemini via `@google/genai`, Zod, Recharts, Vitest, Playwright, Vercel. **Coding assistance:** Claude Code (Anthropic) wrote and refactored code, tests and docs under the team's direction; all of it was reviewed and run.

## Pre-existing vs built during the event
Everything in the repository was built during the event; the repository was created on 16 Nov 2026 and the commit history shows each step. Pre-existing: only open-source libraries and the `create-next-app` starter. See `docs/CREDITS.md`.

## Team roles
▢ *(names and roles)*

## Links
- Repository: https://github.com/ifeoluwaadegbulugbe/LearnSignal
- Live demo: ▢
- Video: ▢
