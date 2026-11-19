# Known limitations

Stated plainly so judges and pilot schools know exactly what this prototype does and does not do.

## Evidence and data
- **No pilot with real children yet.** Every learner shown in screenshots, the demo and the video is synthetic and labelled "Illustrative sample data". We make no claims about learning gains.
- **Not a diagnostic tool.** It shows which skills a child has demonstrated so far. It does not detect or suggest any condition.
- The item bank (108 check items, 14 built-in practice sets) was written for this prototype. It is aligned in spirit to foundational-skills frameworks but **not formally aligned** to the Nigerian curriculum or the Global Proficiency Framework.
- Scoring thresholds (70% recency weight, ≥80% across two sessions for "consistent") are reasoned defaults, not yet validated against real classroom data.

## Language and access
- **English only.** Yoruba, Hausa and Igbo content is planned.
- **Online only.** No offline mode yet; a slow connection makes AI features slow.
- **No speech recognition.** Oral reading is marked by the teacher tapping each word. Audio is never recorded. Text-to-speech uses the browser's built-in voices, which may not sound Nigerian.

## AI
- Uses Google Gemini's **free tier**. Google may use prompts to improve its products; we send only random codes and skill facts. Use a paid, no-training tier before any real pilot.
- **Availability varies.** During testing `gemini-2.5-flash` was retired for new users (404) and `gemini-3.8-flash` was overloaded (503). The model is set by `GEMINI_MODEL`; we currently use `gemini-3.6-flash`. When AI fails, the app shows labelled built-in practice.
- **Slow on the free tier:** practice generation took about 40–45 s and assistant answers 25–55 s in our tests.
- The validator can verify arithmetic, counting, place value, simple one-step word problems and word-bank items exactly. For comprehension and inference items (L5, L6) it checks structure, reading level, names and banned words, but **cannot verify meaning**; teacher approval is the final check.

## Product gaps in this version
- No "Back" button in the check runner (a mis-tapped answer can't be undone; skip is available).
- After a third wrong practice attempt the child is not shown the answer (answers never reach the child's device); the item is recorded for the teacher.
- No class rename, co-teacher invites, account deletion or due dates on assignments.
- School insights have no trend line yet, and practice completion is not shared with admins.
- No Content-Security-Policy headers yet.
- The shared public demo account must be created by the project owner (see README) before "Try the demo" works.
