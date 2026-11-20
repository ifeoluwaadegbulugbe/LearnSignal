# LearnSignal design (redesign v5)

**Promise:** understand every learner, identify what matters, and know what to teach next.

The look is a calm, structured SaaS workspace with a violet-led identity. **Violet** is the brand. **Tangerine** marks the one next step. **Aqua** means practice and completion, and **sky** means AI and information. **Sunshine** and **rose** appear only in illustrations. Most surfaces stay neutral, so these colours carry meaning when they appear.

It should feel intelligent, approachable and actionable. It is not a school management system, an analytics console or a game.

You can see every component and state at `/dev/ui` (with width and Night switches). Every screen is captured at 390, 768 and 1440px in [`screenshots/`](screenshots/). The logo rules are in [`BRAND.md`](BRAND.md) and the audit results in [`ACCESSIBILITY.md`](ACCESSIBILITY.md).

---

## 1. Principles

1. **One clear idea per page.** Today leads with the next step and the Class Ladder; a profile leads with the two skill ladders; a check leads with the prompt.
2. **Status by icon, words and colour together.** Never by colour alone.
3. **Tangerine once or twice per page.** It marks the recommended next action, "Working here" and re-checks.
4. **Explain, don't judge.** Words describe evidence, never the child.
5. **Honest UI.** AI items are labelled, sample data is labelled, and nothing is a dead button.
6. **Designed empty, loading and error states,** each with one clear action.

## 2. Colour

### Brand (six colours, fixed)
| Colour | Hex | Soft tint | Role |
|---|---|---|---|
| Violet | `#5B3FE0` | `#ECE8FF` | Primary buttons, active nav, focus rings, ladder rails, links |
| Tangerine | `#FF7A2F` | `#FFEBDD` | Next step, "Working here", re-check cues (dark text `#2A1300` on it) |
| Aqua | `#12B3A8` | `#DDF6F3` | Practice, completion |
| Sky | `#3D9BFF` | `#E2F1FF` | AI items, Ask, information |
| Sunshine | `#FFC83D` | `#FFF5D6` | Illustrations (and the "sample data" flag) |
| Rose | `#F06A9B` | `#FFE6F0` | Illustrations |

### Neutrals
| Token | Light | Night | Use |
|---|---|---|---|
| `--canvas` | `#F8F8FC` | `#0E0D17` | Page background |
| `--surface` | `#FFFFFF` | `#17162A` | Cards, panels, sidebar |
| `--surface-2` | `#F3F3F8` | `#1E1D33` | Inset areas, tracks |
| `--ink` | `#171625` | `#F2F1FA` | Text |
| `--ink-2` | `#626273` | `#B9B8CC` | Secondary text |
| `--ink-3` | `#6B6B7C` | `#9C9BB2` | Metadata (kept ≥ 4.5:1) |
| `--placeholder` | `#9292A1` | `#7D7C93` | Input placeholders only |
| `--line` / `--line-strong` | `#E9E8F0` / `#DAD8E5` | `#2A2942` / `#393854` | Borders, dividers |
| `--disabled` | `#B7B5C4` | `#4A4960` | Disabled controls |

The spec's muted grey `#9292A1` is below 4.5:1 on white, so it is used only for placeholders. Metadata text uses `--ink-3`.

### Learner status (always with icon and words)
| State | Ink / tint (light) | Icon |
|---|---|---|
| Not yet demonstrated | `#87540A` on `#FFEFD2` | dashed circle |
| Developing | `#235F9C` on `#E1EEF9` | rising line |
| Demonstrated consistently | `#176E44` on `#DDF3E8` | check |
| Not enough evidence yet | `#59607C` on `#ECEEF6` | question mark |

The inks were darkened from the first proposal to pass 4.5:1 on their tints. Status colours are kept separate from aqua (practice), so "practice done" never reads as "skill demonstrated".

## 3. Typography
| Role | Font | Size | Weight |
|---|---|---|---|
| Greeting | **Manrope** | 38/46 (phone 30/38) | 700 |
| Page title | Manrope | 30/38 (phone 24/32) | 700 |
| Section title | Manrope | 20/28 | 600 |
| Card title | Inter | 16/24 | 600 |
| Body | **Inter** | 15/24 | 400 |
| Supporting | Inter | 13–14 | 400 |
| Labels | Inter | 11–12 | 500 (tabs uppercase, +0.06em) |
| Big numbers | Manrope | 30–32 | 700, tabular figures |
| Learner codes | **JetBrains Mono** | 12 | 500 |
| Child prompts | **Nunito** | 36–44 | 800 |
| Wordmark only | **Sora** | 20 | 700, −0.03em |

Text is in sentence case throughout.

## 4. Space, shape and depth
- **Spacing:** a 4px grid with steps 4, 8, 12, 16, 20, 24, 32, 40 and 48.
- **Page padding:** 16px on phones, 24px on tablets, 40px on desktop. Content max width is 1280px inside the shell.
- **Radii:**
  - controls 8–10px
  - inputs 12px
  - small cards 12px
  - cards 16px
  - major panels 18–20px
  - pills fully round
  - child mode 24–28px
- **Depth:** borders do the separating. Cards get `0 4px 16px rgba(31,25,70,.05)`. Menus, dialogs and drawers get a stronger pop shadow.
- **Gradients:** two only, both quiet: a faint violet wash behind the Today greeting and the violet auth and landing panels. Gradients never stand in for hierarchy.

## 5. Signature elements
1. **Class Ladder.**
   - Six rungs per strand between two violet rails.
   - Learner markers are initials dots on the rung each learner is working on. A dashed amber outline means "re-check suggested".
   - Above the rungs is a row for "No gap flagged"; below them is a row for "Not checked yet".
   - Clicking a rung or a dot opens the Focus Panel: names, codes, state, confidence, Start check, View profile.
   - On phones the rungs stack and each row of dots scrolls (and is keyboard-focusable).
2. **Signal Arcs.**
   - Three arcs over a dot. As **ConfidenceSignal**, one, two or three arcs are lit, and the outline is dashed when evidence is provisional.
   - The same motif marks "AI working" in Ask and the phone Check action.
   - It is no longer the logo.
3. **Index-card tabs.** Small uppercase labels at the top of a card (GROUP, NEXT STEP, NOTE, SET, AI-DRAFTED, a skill code).
   - Violet: general
   - Tangerine: next step
   - Aqua: practice
   - Sky: AI
   - Neutral: supporting
4. **Stepping stones.** Used for sequences: onboarding, question progress in a check, and child-mode progress.
5. **Chalk underline.** One hand-drawn violet stroke under one word per screen, such as the teacher's name in the greeting. It draws in once.
6. **Ruled areas.** Faint 28px lines, only on notes and the session timeline.
7. **The logo.** Steps with a learner at the top (see [`BRAND.md`](BRAND.md)). `LogoLoader` replays it for page loading.

## 6. App shell
- **Desktop (≥1024px).** A 240px white sidebar.
  - Top: logo and live wordmark, then a small class context card (name, learner count, sample flag).
  - Main nav: Today, Learners, Checks, Groups, Practice, Ask, Insights, plus School for admins.
  - Below a divider: Settings and Help.
  - Bottom: the Appearance toggle and an account button (avatar, name, role) that opens the account menu.
  - The active item has a violet-soft background with violet text. It is a quiet highlight, not a large pill.
- **Tablet (768–1023px).** A 76px icon sidebar with hover and focus tooltips and screen-reader labels.
- **Context bar** (68px, sticky):
  - the class selector (name plus learner count)
  - command search ("Find a learner, skill or practice set", Ctrl K)
  - **Ask**, a sky-tinted button that opens the assistant drawer
  - notifications, with a tangerine dot only when something needs action
- **Phone.**
  - Top bar: mark, class selector, search, Ask, notifications and avatar.
  - Bottom bar: Today, Learners, a raised violet **Check** button with the arcs, Groups and More.
  - Check starts a check for the last learner viewed, or opens a learner picker.
  - More lists the remaining screens, Help, Appearance and Sign out.

## 7. Screens
| Screen | What v5 changed |
|---|---|
| **Today** | Date, greeting with chalk underline and supporting line. Four white metric cards: Learners, Learners checked, Skills demonstrated, Need attention, each with a small tinted icon and a hint. One tangerine **Next step** card. The **Class Ladder** beside **Learning progress**, which shows Literacy and Numeracy state bars from real skill results (click through to Insights) with **Recent activity** below. **Practice in progress** rows (set, strand, items, done/total, Continue or Review). **New practice sets** as small art cards. **Groups** as index cards. |
| **Learners** | Summary row: Learners, Checked, Not checked, Re-check suggested. Filters: All, Literacy not yet, Numeracy not yet, Needs review, Not checked, Archived. Search. A table with sortable Learner and Last checked, plus Code, **Literacy status**, **Numeracy status**, and actions (Check, menu). Bulk selection and 20-per-page pagination. Phones get cards with both strand statuses. |
| **Learner profile** | A header card with code, age band, class, last checked, Start check and Assign practice. Tabs: Overview, History, Practice, Notes. Two vertical skill ladders with violet connectors and a tangerine "Working here". Gap cards with evidence and "Why?". |
| **Checks** | Choose Literacy, Numeracy or Both (Baseline or Re-check). A "Before you start" card. A distraction-free runner with question stones, a large Nunito prompt, audio, soft tiles, a keypad, and oral reading word chips (Correct, Omitted, Substituted, Self-corrected). Results end with the not-a-diagnosis line. |
| **Groups** | A board per rung with a skill art band, draggable chips with a keyboard Move menu and Undo, and an activity card per group. |
| **Practice** | Set cards with skill art, AI-drafted (sky) and Validated badges, and review status. A Generate sheet with Drafting, Checking answers and Ready to review steps. A teacher preview with answers. |
| **Child mode** | Nunito, soft colour blocks, big tiles, stepping-stone progress, kind feedback, no scores or timers, teacher-controlled exit. |
| **Insights** | Class ladders at first and latest check, a before/after chart with a table view, practice completion, and a change table. CSV and print. |
| **Ask** | A sky-accented assistant. Answers are labelled and grounded in class data, general guidance is kept separate, and learner codes become name chips locally. |
| **School** | Summary, school ladder as stacked bars, common gaps, and classroom comparison. Counts under 3 show "—". |
| **Settings** | Profile, Classes, Language, AI and privacy, Appearance, Data. Destructive actions need type-to-confirm. |
| **Auth and landing** | Violet story panel with the mono mark. The landing page keeps its live ladder hero and loop cards and closes on a violet band. |

## 8. Components (all in `components/ui/`, shown at `/dev/ui`)
- **Button:** primary (violet), secondary, ghost, tangerine (next step), quiet-warn, link. Sizes 36, 44 and 52px, plus 64px for children. Default, hover, focus, active, disabled and loading states.
- **SummaryTiles (MetricCard):** white card, label, big tabular number, tinted icon chip, optional hint.
- **IndexCard:** the base card, with optional uppercase tab, tint, art band and ruled body. **Card** is the plain version.
- **NextStepCard:** tangerine-soft panel with an arrow chip, a "Next step" label, one action and "Not now".
- **StatusPill, SignalMark / ConfidenceSignal, ClassLadder, SkillLadder, EvidenceDrawer.**
- **MeterRing, SegmentedRing, StateBar, LinearProgress** and stepping stones.
- **SegmentedTabs, TextTabs, Breadcrumb, Avatar** (initials only), **CodeChip, Dialog** (centred, side drawer or bottom sheet).
- **Toast, Skeleton, EmptyState, ErrorPanel, LogoLoader.**
- **SkillArt:** deterministic geometric art for each skill and loop step. There are no stock images or photos anywhere.

## 9. Motion
Most motion runs 160–220ms with a gentle ease:
- cards lift 2px
- content fades up in a short stagger
- learner dots settle onto rungs
- arcs light one after another
- rings and the chalk underline draw once
- the logo loader steps in

Everything turns off under `prefers-reduced-motion`.

## 10. Night theme
- Blue-black canvas (`#0E0D17`) with slightly lighter surfaces.
- Soft neutral text.
- A lighter violet (`#9C8BFF`), and every brand and status colour re-tuned for contrast.
- Set before paint, so there is no flash. It follows the device by default.
- Switch it from the sidebar, the account menu, the phone More sheet or Settings.

## 11. Accessibility
axe reports zero WCAG A/AA violations on 16 screens in both themes, and Lighthouse scores 100 for accessibility on the public pages (see [`ACCESSIBILITY.md`](ACCESSIBILITY.md)). There is:
- a skip link
- a visible violet focus ring
- labelled icon buttons
- a keyboard alternative to dragging
- table views for every chart
- live regions for feedback
- 44px targets (88px child tiles)
- no horizontal page scroll at 360px

## 12. Words
Only these state words are used: *not yet demonstrated, developing, demonstrated consistently, not enough evidence yet*. Never "weak", "failing", "behind" or "slow". Every result page ends with: "This shows which skills a child has demonstrated so far. It is not a diagnosis."

## 13. Not built in v5 (would need new data or features)
- **Deadlines on practice:** assignments have no due date in the schema.
- **Date added on the profile, and date filters on Learners:** not shown yet.
- **Previous question in the check runner:** answers are scored as they are given.
- **Comparing chosen assessment periods in Insights:** Insights compares first and latest only.
- **A separate help centre:** Help opens "How scoring works".

## 14. Originality
The reference dashboard was used for **quality only**: hierarchy, density and polish. LearnSignal does not copy its layout, navigation, colours, type or cards. The identity rests on its own elements: the step logo, the Class Ladder, Signal Arcs, index-card tabs, stepping stones and the violet/tangerine signal.
