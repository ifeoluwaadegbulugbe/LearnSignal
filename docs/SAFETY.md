# Safety, privacy and responsible AI

LearnSignal handles information about young children, so the defaults are cautious. This file lists what is in place and how it is checked.

## What we store about a child
| Stored | Not stored |
|---|---|
| First name or nickname (1–30 characters) | Surnames, dates of birth, photos, addresses, phone numbers |
| Age band (5–6, 7–8, 9–10, 11+) | Audio recordings (oral reading is marked by the teacher tapping words) |
| A random code, e.g. `LS-3F9A2C` | Any child login or password |
| Answers to check and practice questions, skill states, teacher notes | Health, behaviour or family details (the notes field warns against these) |

- **Consent:** a learner cannot be created unless the teacher ticks a consent box. The database rejects `consent_confirmed = false` (column check) and stores the time of consent.
- **Surname hint:** if a name looks like two words, the form asks the teacher to avoid surnames.

## Who can see what (enforced in the database)
- Row-level security is enabled on **every** table. Teachers see only classrooms they teach and the learners in them.
- School admins get **aggregate counts only** through two `security definer` functions that check admin role first. They return no names or codes. The UI hides any count below 3.
- The app uses only the public anon key. **No service-role key exists anywhere** in the code or deployment.
- Answer keys for checks are **not in the database at all**; they live in server code and answers are scored in server actions. Practice answers are checked server-side; the child's screen never receives them.
- An exercise must be **approved** before it can be assigned. This is enforced by a database trigger as well as the server action.
- Verified by `npm run test:rls` (12 checks with two real teacher accounts; see `tests/rls/rls.test.ts`).

## AI boundaries
- **AI never sets a level, never groups children and never assigns work.** Levels come from deterministic, unit-tested rules (`lib/scoring`).
- **AI never sees names.** Prompts carry skill facts and random codes only. Names are swapped in on the teacher's screen.
- **Practice generation:** the model drafts; code re-checks every item (arithmetic recomputed, counting checked against the objects shown, words checked against curated banks, banned words, unexpected names, reading level). Failing items are dropped and replaced with labelled built-in items. Nothing reaches a child until a teacher approves it.
- **Ask (assistant):** answers only from five fixed tools run under the teacher's own permissions. A post-check replaces any answer that cites a learner code the tools did not return, uses diagnosis language, or states class facts without calling a tool.
- **Fallback:** if AI is off, rate-limited, overloaded or retired, the app shows built-in practice labelled "Built-in practice (AI unavailable)". Observed in practice; see `docs/AI_BEHAVIOR.md`.
- **Free tier:** prompts may be used by Google to improve its products, which is why only pseudonymous skill data is sent. A paid, no-training tier should be used before any real pilot.
- **Logs:** `ai_logs` records user, kind, token counts and success, never prompt or answer content. Server error logs never include learner content.

## Language and labels
- Allowed wording only: "not yet demonstrated", "developing", "demonstrated consistently", "not enough evidence yet".
- Every result page ends with: "This shows which skills a child has demonstrated so far. It is not a diagnosis."
- Diagnosis and labelling terms (e.g. dyslexia, disorder, disability, lazy, slow learner) are blocked in generated content and assistant answers.
- No red anywhere in learner-related UI; amber is used for "not yet" and for destructive actions.

## Child mode
- Runs on the teacher's signed-in device; children never log in. Leaving needs the teacher's password.
- No points, streaks, badges, leaderboards, timers or loss states. Effort stones only, based on finishing, never on score.
- The child never sees other learners' names, never sees a score, and wrong answers fade to neutral (never red).
- Audio plays only when the child taps the speaker.

## Deletion and retention
- **Archive** hides a learner but keeps history. **Delete** (type the learner code to confirm) removes the learner and all answers, states and notes immediately (cascade). Deleting a class removes all its learners.
- Data is kept until a teacher deletes it. There are no backups beyond Supabase's own.
- Exports (CSV) carry an "Illustrative sample data" note when they come from the demo class.

## Security checklist (status)
- [x] RLS on every table; security-definer functions use a fixed `search_path`
- [x] Zod validation on every server action and API route input
- [x] AI routes rate-limited (10 per minute per teacher)
- [x] No service-role key; `GEMINI_API_KEY` is server-only; `.env*` ignored by git; commits scanned for keys before push
- [x] Learner mode needs an authenticated teacher; exit needs the password
- [x] The only `dangerouslySetInnerHTML` is a fixed, input-free script that applies the saved theme before paint
- [ ] Content-Security-Policy headers (not yet added)
