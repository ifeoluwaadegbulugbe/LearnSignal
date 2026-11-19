# AI behaviour: real inputs, outputs and failures

Everything below was captured from the running app on 19 November 2026 (model `gemini-3.6-flash`, free tier) with the synthetic demo class. Raw JSON is in [`docs/ai-runs/`](ai-runs/) and can be reproduced with `node scripts/ai-smoke.mjs` (and `gen2` for the harder batch). Nothing here is invented.

LearnSignal uses AI in exactly two places. **It never scores a child, sets a level, forms a group or assigns work.**

| Feature | Where | What the model sees | What code does after |
|---|---|---|---|
| Practice drafting | `POST /api/generate-exercises` → `lib/ai/generate.ts`, `lib/ai/validate.ts` | Skill objective, level, item format rules. **No learner data.** | Schema check, then per-skill checks; failing items dropped and replaced with labelled built-in items; set saved as *pending* until a teacher approves |
| Ask (assistant) | `POST /api/assistant` → `lib/ai/assistant.ts`, `lib/ai/tools.ts` | The question, plus results of 5 fixed tools run under the teacher's own database permissions. Learner **codes only**, never names | Post-check: any code not returned by a tool, any diagnosis term, or a data claim without a tool call is replaced with a refusal |

## 1. Practice drafting

### Input → output pair A (all items kept)
**Input:** `{ "skillId": "N4", "difficulty": 2, "count": 5 }` — subtraction within 20, level 2.
**Output (44.5 s):** validator **5 kept, 0 dropped**, saved as pending review.

| Item | Answer | Validator |
|---|---|---|
| 14 − 6 = ? | 8 | arithmetic recomputed = 8 ✓ |
| 17 − 9 = ? | 8 | ✓ |
| 15 − 8 = ? | 7 | ✓ |
| 12 − 5 = ? | 7 | ✓ |
| 16 − 7 = ? | 9 | ✓ |

### Input → output pair B (items dropped and replaced)
**Input:** `{ "skillId": "N6", "difficulty": 2, "count": 5 }` — one-step word problems, level 2.
**Output (17.2 s):** validator **3 kept, 2 dropped**; notice shown to the teacher: *"2 AI item(s) failed validation — filled with 2 built-in item(s)."*

| Item (shortened) | Model answer | Result |
|---|---|---|
| Ada has 15 mangoes. She gives away 6… How many does Ada have left? | 9 | kept (15 − 6 = 9) |
| Aisha has 18 pencils… She lost 5… | 13 | kept |
| Ngozi had 12 bus tickets. She gives away 4… | 8 | kept |
| Musa bought 8 oranges… His mother **gave** him 7 **more**… | 15 | **dropped:** "N6 operation is ambiguous (cannot verify)" |
| Emeka harvested 9 yams… Tolu **gave** him 4 **more**… | 13 | **dropped:** same reason |
| Ada has 4 mangoes. She gets 3 more… | 7 | built-in replacement, labelled |
| Musa has 9 marbles. He gives 4 away… | 5 | built-in replacement, labelled |

Other runs in the same batch: N6 level 3, N3 level 3, N2 level 2 (counting: answer checked against the number of objects in the stem), L3 level 2 and L5 level 2 all kept 5/5. N5 level 2 dropped 1 of 5 (see failure 2).

## 2. Ask (assistant)

### Input → output pair A (grounded answer)
**Input:** "Who needs subtraction support?"
**Tool called:** `learners_by_skill_state(skillId: "N4", state: "needs_support")`
**Output (54.1 s):** "The following 9 learners currently need support with Subtraction (N4): **Not yet demonstrated:** LS-1254D6, LS-7308AA, LS-85427B, LS-946620, LS-A25249, LS-B85FDE. **Developing:** LS-208055, LS-7F2901, LS-C18A90."
Every code appears in the tool result, so the post-check passed. On screen, each code becomes a chip with the learner's first name, resolved in the browser.

### Input → output pair B (refusal when there is no data)
**Input:** "Which learners have the best handwriting?"
**Tool called:** `class_summary()`
**Output (25.8 s):** "I don't have data for that. You may wish to assess handwriting or letter formation separately."
Shown as a neutral "I don't have data for that yet." card.

### Extra pair (general guidance kept separate)
**Input:** "Give me a 15-minute blending activity."
**Tool called:** `learners_by_skill_state` (L2). The answer listed the learners working on L2, then a section starting "General guidance (not from your class data):" with a three-part activity. The UI splits this so the guidance appears in a separate sun-coloured card labelled "General guidance, not from your class data".

## 3. Failures we actually observed, and how each was handled

| # | What happened | How it was caught / handled | How it is tested |
|---|---|---|---|
| 1 | **Ambiguous word problems.** The model wrote "His mother gave him 7 more oranges". The checker sees both an add word ("more") and a take-away word ("gave"), so it can't verify the answer. | Item dropped and replaced with a labelled built-in item. Note: these two items were in fact correct, so this is a **false rejection**. We accept that; an unverifiable item never reaches a child. | Live run above; unit tests in `tests/unit/validate.test.ts` cover verified word problems |
| 2 | **Unverifiable place-value wording.** "Emeka saw 42 buses. What does the digit 4 mean in 42?" didn't match a pattern the checker can verify. | Dropped: "N5 stem pattern not recognised (cannot verify answer)"; replaced with a built-in item. | Live run (`gen2` batch) |
| 3 | **Model retired.** `gemini-2.5-flash` returned HTTP 404: "no longer available to new users". | Route caught it; the teacher saw "AI unavailable — showing built-in practice" with the approved built-in set. We changed `GEMINI_MODEL`. | Server log line `[learnsignal] model call failed (status 404)`; `runGeneration` fallback unit tests |
| 4 | **Model overloaded.** `gemini-3.8-flash` returned HTTP 503 "high demand" on repeated tries. | 3 retries with exponential backoff, then labelled built-in fallback. | Server log `(status 503)`; unit test "labels the rate-limit fallback" |
| 5 | **Network resets** to Google (ECONNRESET) during testing. | Same retry + fallback path; the app never breaks. | Probe script output; fallback unit tests |
| 6 | **Answers formatted in Markdown** (`**bold**`) showed raw asterisks, and a mixed answer styled general guidance as class data. | Found in the real answers above; fixed in `components/assistant/chat.tsx` (bold rendering, guidance split into its own card). | Visual check against the saved runs |

### Failure cases covered by tests (not seen live)
These are exercised with scripted model output in `tests/unit/`, because the live model did not produce them in our runs:
- **Wrong arithmetic** (e.g. "9 + 4 = ?" answered 12) → dropped with reason "wrong answer: 9 + 4 = 13, model said 12".
- **Malformed JSON** → full fallback to built-in practice.
- **Invented learner code** in an assistant answer (e.g. `LS-ZZZZZ9`) → replaced with "I don't have data for that."
- **Diagnosis language** (e.g. "may have dyscalculia") → replaced with a neutral refusal.
- **Data claim without a tool call** → replaced with "I don't have data for that."
- Banned words, real brands, unexpected names, non-bank words, sentences too long for the level → dropped.

## 4. Known gaps
- For comprehension and inference items (L5, L6), code checks structure, reading level, names and banned words but **cannot check meaning**. In the L5 run all five answers were correct on review, but teacher approval remains the real safeguard.
- Latency on the free tier was 13–45 s for practice and 25–55 s for Ask.
- Validation is deliberately conservative: it drops some correct items (failure 1) rather than risk a wrong one.
