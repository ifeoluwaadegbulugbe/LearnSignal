# LearnSignal

**Find the exact skill each child is missing, group children who need the same help, and check whether it worked.**

LearnSignal is a teacher-first web app for primary schools (first market: Nigeria). A short, teacher-administered check finds the first foundational reading or number skill each child hasn't demonstrated yet. Children who need the same help are grouped, each group gets a 15-minute activity and teacher-approved practice, and a re-check shows who moved up.

Loop: **Assess → Identify → Group → Intervene → Reassess.**

> All learners in the demo, screenshots and video are **synthetic, illustrative sample data**. LearnSignal is **not a diagnostic tool**.

## What's inside
- **Today:** the Class Ladder (every learner as a dot on the rung they're working on), next step, groups, recent changes.
- **Checks:** distraction-free runner for literacy and numeracy, including oral reading where the teacher taps each word (accuracy and words correct per minute). Adaptive placement, server-side scoring, skip / pause / end early.
- **Transparent scoring:** deterministic and unit-tested (`lib/scoring`). Recency-weighted evidence, a confidence signal, "provisional" after one session, and a safeguard so one bad day can't pull a child down. Every state has a "Why?" panel.
- **Groups:** suggested by working skill, editable (drag or keyboard), with rule-based 15-minute activities.
- **Practice:** AI drafts; code re-checks every item; failing items are dropped and replaced with labelled built-in items; nothing is assigned until the teacher approves.
- **Child mode:** one question per screen, tap-to-hear, kind feedback, no scores, no red, effort stones. Exit needs the teacher's password.
- **Ask:** a grounded assistant that answers only from the class data (learner codes, never names) and says "I don't have data for that" otherwise.
- **Insights and school view:** before/after ladders; admin view with totals only and small groups hidden.

See [docs/screenshots/](docs/screenshots/) for every screen at 390, 768 and 1440px.

## Run it locally
Requirements: Node 22+, a Supabase project, a Google AI Studio API key.

1. Install: `npm install`
2. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Where it comes from |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → the **anon / publishable** key (never the service-role key) |
   | `GEMINI_API_KEY` | Google AI Studio → Get API key (server-only) |
   | `GEMINI_MODEL` | A current Flash model your key can use, e.g. `gemini-3.6-flash` |
   | `AI_ENABLED` | `true` or `false` (false = built-in practice only, Ask off) |
   | `DEMO_EMAIL`, `DEMO_PASSWORD` | Optional: the shared demo account behind "Try the demo" |

3. In the Supabase SQL editor, run in order:
   1. `supabase/migrations/0001_init.sql` (tables, row-level security, functions)
   2. `supabase/migrations/0002_profile_ai_switch.sql` (only needed for databases created before it existed; safe to re-run)
   3. `supabase/seed.sql` (skills, 108 check items without answers, 14 built-in practice sets). Regenerate with `npm run seed:gen`.
4. Optional: Authentication → Email → turn off "Confirm email" for faster local testing.
5. Start: `npm run dev`, open http://localhost:3000, sign up, and choose **Load the demo class** in onboarding.

### Public demo account ("Try the demo")
1. Set `DEMO_EMAIL` and `DEMO_PASSWORD` in `.env.local`, start the app, then run `node scripts/setup-demo-account.mjs` (creates the account, a demo school and the sample class).
2. In the SQL editor: `insert into demo_accounts(user_id) select id from auth.users where email = '<DEMO_EMAIL>' on conflict do nothing;` (this skips the password prompt on learner-mode exit for that account only).
3. Set `DEMO_EMAIL` and `DEMO_PASSWORD` in Vercel. Judges can then click **Try the demo**. Use **Settings → Reset demo class** to restore it.

## Tests
| Command | What it checks |
|---|---|
| `npm test` | 54 unit tests: skill states, recency and safeguard, placement, grouping, validator, generation fallback, assistant golden tests |
| `npm run test:rls` | 12 integration checks against your Supabase with two real teachers (needs `.env.test.local`, see below): teacher B cannot read or change teacher A's data, admin functions return totals only, unapproved practice can't be assigned, consent is required |
| `npm run build` | Type-check, lint and production build |
| `node scripts/ai-smoke.mjs [gen\|gen2\|ask]` | Calls the live AI routes and saves raw results to `docs/ai-runs/` |
| `node scripts/screenshots.mjs [screen…]` | Captures screens at 390/768/1440 into `docs/screenshots/` |

`.env.test.local` (git-ignored) holds two throwaway test accounts:
```
TEST_TEACHER_A_EMAIL=teacher.a@example.com
TEST_TEACHER_A_PASSWORD=...
TEST_TEACHER_B_EMAIL=teacher.b@example.com
TEST_TEACHER_B_PASSWORD=...
```

## Deploy (Vercel)
Import the GitHub repo, add the environment variables above (Production and Preview), deploy. The app needs no other services.

## Documentation
- [docs/AI_BEHAVIOR.md](docs/AI_BEHAVIOR.md): real AI inputs, outputs and observed failures
- [docs/SAFETY.md](docs/SAFETY.md): privacy, RLS, AI boundaries, child-mode rules
- [docs/LIMITATIONS.md](docs/LIMITATIONS.md): what this prototype does not do
- [docs/DESIGN.md](docs/DESIGN.md): the visual identity, components, screens and accessibility
- [docs/BRAND.md](docs/BRAND.md): the logo, wordmark, icons and how to use them
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md): axe and Lighthouse results, and how to re-run them
- [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md): decisions and deviations from the build spec
- [docs/DEMO.md](docs/DEMO.md): 4-minute demo script and sample-data disclosure
- [docs/CREDITS.md](docs/CREDITS.md): stack, AI assistance, what was built during the event
- [docs/SUBMISSIONS/](docs/SUBMISSIONS/): text for each hackathon

## Known limitations
English only · synthetic demo data, no pilot with real children yet · no speech recognition (teacher taps words) · Gemini free tier (slow, availability varies) · not a diagnosis. Full list: [docs/LIMITATIONS.md](docs/LIMITATIONS.md).
