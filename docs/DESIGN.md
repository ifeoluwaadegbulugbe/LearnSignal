# LearnSignal design (redesign v6)

**Promise:** understand every learner, identify what matters, and know what to teach next.

**One hue family plus one accent, both taken from the logo.**
- **Violet** carries the brand and every primary action.
- **Tangerine** appears only where the teacher's attention is needed: the Next Step tab, "Working here", re-check rings and tags, and the logo dot. It is never a button colour.
- The four skill-state colours appear only inside status pills and progress bars.
- Everything else is neutral: ground, white cards and lines.

Every component and state is shown at `/dev/ui` (with width and Night switches). Every screen is captured at 390, 820 and 1440px in [`screenshots/`](screenshots/). The logo rules are in [`BRAND.md`](BRAND.md) and the audit results in [`ACCESSIBILITY.md`](ACCESSIBILITY.md).

---

## 1. Rules
1. **One dominant primary action per screen, always violet.** Other buttons are outlined, ghost or links.
2. **60-30-10.** Neutral surfaces 60, white cards 30, violet and tangerine accents 10.
3. **Status is never colour alone.** Every state has an icon and a word.
4. **Never dark text on mid-tone violet.** Surfaces are either light tints with dark text, or solid violet with white text.
5. **Remove anything that does not help the teacher decide or act.**
6. **Copy:** short plain sentences, no em dashes, no "unlock" or "seamless".

## 2. Tokens (`app/globals.css`, CSS variables plus the Tailwind theme)
No component uses a hard-coded hex. The only exception is the logo artwork, whose colours are fixed by [`BRAND.md`](BRAND.md).

| Token | Light | Night | Use |
|---|---|---|---|
| `--ground` | `#F4F2FB` | `#14131F` | Page background |
| `--surface` | `#FFFFFF` | `#1D1C2B` | Cards |
| `--inset` | `#F7F5FD` | `#242336` | Inner blocks |
| `--ink` | `#1A1635` | `#F2F0FA` | Text |
| `--muted` | `#5F5A7A` | `#B2AFC8` | Secondary text (minimum for readable text) |
| `--line` / `--line-strong` | `#E3DEF3` / `#D2C9F0` | `#2E2C42` / `#3D3A58` | Borders |
| `--violet-50 / 100 / 500 / 700` | `#F1EEFF` / `#E4DCFF` / `#5B3FE0` / `#4529C4` | `#24213D` / `#2F2A55` / `#8B7DFF` / `#B7ADFF` | Tints, primary, hover and links |
| `--tangerine` (+ tint, line, ink) | `#FF7A2F` (`#FFF6EF`, `#FFD9BF`, `#9A3D06`) | `#FF8F4F` | Next step, working here, re-check |
| Skill states | amber `#8A5600`, blue `#1F5FA0`, green `#146B41`, grey `#5A5770` on their tints | lightened for night | Pills and bars only |

Primary buttons use white text in light mode and dark text on `#8B7DFF` in night mode. Aqua, sky, sunshine and rose are retired: their old class names resolve to the violet family, so nothing breaks.

## 3. Type and shape
- **Two families.** **Sora** for headings and the wordmark; **DM Sans** for everything else, with tabular figures for counts and learner codes. There is no mono font.
- **Sizes.** Page title 36 (28 on phones), card heading 20, body 16, supporting 14, caption 13. Big numbers are 32 in Sora. Line height is 1.15 for headings and 1.5 for body.
- **Radii.** 16 for cards, 12 for buttons, inputs and inner blocks, 999 for pills.
- **Depth.** One faint card shadow, `0 4px 16px rgba(31,25,70,.05)`. A stronger shadow appears only on menus and dialogs.
- **Buttons** are 44px high everywhere, and every touch target is at least 44px.
- **Spacing** is on an 8 point grid. Cards are padded 24; page padding is 40, 24 or 16.
- **Focus** is a 2px violet outline with a 2px offset.
- **Motion** is 150 to 220ms fades and presses only, and turns off under reduced motion.

## 4. Responsive shell (`components/layout/app-shell.tsx`, container queries on the app root)
- **Desktop (1100px and up).**
  - A fixed 232px sidebar: logo and live wordmark, then a class box (class, name, learner count; it switches classes).
  - Plain icon and label nav: Today, Learners, Checks, Groups, Practice, Ask, Insights, plus School for admins.
  - The account sits at the bottom. Its menu holds Appearance, Settings, Help and Sign out.
  - The active item is a violet-100 tint with violet-700 text.
  - A search pill, Ask and the bell sit top-right of the content. Content width is capped near 1160.
- **Tablet (760 to 1099px).** A 72px icon rail with aria-labels and hover or focus tooltips. The search, Ask and bell row sits above the page. The summary strip becomes 2×2, and the plan and AI cards sit side by side below the ladder.
- **Phone (under 760px).**
  - Top bar: mark, class chip, search, Ask and bell.
  - Bottom bar: Today, Learners, a raised violet **Check** button (white check-in-circle, no logo), Groups and More.
  - Every page reserves bottom padding plus the safe-area inset, so the bar never covers content. The Ask composer sticks just above the bar.
- **Sample data.** One slim banner at the top of the content replaces every per-page "sample data" pill.

## 5. Signature components
- **Class Ladder** (`components/learner/class-ladder.tsx`).
  - A staircase of six steps. Each learner is an initials circle standing on the step they are working on.
  - Only the busiest (working) step is solid violet with white text, under a tangerine "Working here" chip. The other steps are violet-50 with dark text.
  - A dashed tangerine ring means re-check suggested.
  - Click a step or learner to open the Focus panel: names, codes, status, confidence, Start check and View profile.
  - When the card is narrower than 520px it switches to stacked rows, N6 down to N1, with the working row in solid violet.
- **Skill Ladder** (`components/learner/skill-ladder.tsx`).
  - The same staircase turned on its side: six steps that widen from 1 to 6.
  - Each step shows code, name, status pill and confidence tiles. The working step is solid violet with "Working here".
  - Selecting a step opens the evidence drawer: status, confidence, weighted score, evidence, sessions and a plain "How is this calculated?".
- **NextStepCard** (`components/ui/cards.tsx`): a tangerine-tint banner with a NEXT STEP tab, one headline, one sentence, one violet button, a quiet "Not now" link and the logo tiles as a 140px illustration (hidden on phones).
- **StatStrip** (`components/ui/primitives.tsx`): one card with four figures separated by hairlines, each with a number, a line and a thin violet bar.
- **ConfidenceTiles / StepTiles** (`components/ui/signal.tsx`): three small stepped tiles, with one, two or three filled. A dashed outline means provisional. The same tiles light in sequence for "AI working". The three-arc glyph is retired everywhere.
- **Kept and restyled:** Avatar (a white circle with a violet hairline, no colour coding), StatusPill, Segmented and Text tabs, Dialog (side panel, or bottom sheet on phones), EmptyState, Skeleton, Toast, ErrorPanel and LogoLoader.

## 6. Screens
| Screen | Layout |
|---|---|
| **Today** | Greeting with one chalk underline under the teacher's name. Next Step banner from the real re-check logic (then first checks, then grouping). Summary strip: Learners (assessed), Numeracy and Literacy (share of skill results demonstrated consistently), Practice done (sets active). Class ladder card with Practice in progress under it. A side column with **Today's plan**, a numbered list of real next actions with one tag each (no clock times: the app stores no schedule), and the **AI card** (violet-100 tint, suggested question, input that opens Ask). |
| **Learners** | Header with count, Add learner and Import. Filter pills: All, Literacy not yet, Numeracy not yet, Needs review, Not checked, Archived. Search, plus level and check-date filters. A sortable table with avatar, code, Literacy and Numeracy status, last checked and row actions (Check, menu), 20 per page. Phones get cards with both statuses plus View and Start check. |
| **Learner profile** | Header card with name, code, date added, age band, class, last checked, Start check and Assign practice, and a one-line learning summary. Tabs: Overview, History, Practice, Notes. Two skill ladders. |
| **Checks** | Three large radio cards (Literacy, Numeracy, Both) with a 2px ink border and a check mark when selected. A calm neutral "Before you start" panel. Start is full width and sticky on phones. |
| **Groups** | A grid of three columns on desktop, two on tablet and one on phones, with no sideways scrolling. Each card has a 4px violet top rule, rung code, skill, learners with Move (drag or keyboard), the 15 minute activity as a collapsible section, and Accept group. Regroup and merge suggestions are outlined actions. |
| **Practice** | Library cards with a skill chip, strand and level, an "AI drafted" tag, validation and review status. Views: All, Literacy, Numeracy, Drafts, Validated, Needs review, plus filters. Generate shows stepping-stone progress (Drafting, Checking answers, Ready to review). |
| **Ask** | The first message is a plain bubble. Grouped suggestion chips (Gaps, Progress, Planning) sit directly above the composer, which is anchored to the bottom (sticky above the bar on phones). The counter is 14px muted inside the input. |
| **Insights** | Movement figures, skill distribution, first-check and latest ladders, a before/after chart (violet shades and ink) with a table view, and a change table. CSV and print. |
| **School** | Classrooms, learners, coverage, school ladder bars, common gaps and classroom comparison. Counts under 3 show "—". |
| **Settings** | Left sub-navigation on desktop and a scrolling row on phones. Destructive actions need type-to-confirm. |
| **Child mode** | Max width 640. "Hi, Learner A", the logo tiles as the one illustration, large white practice cards, five day dots with letters, big answer tiles and kind feedback. No scores, timers or rankings. Teacher exit sits top left with a lock. |
| **Landing** | Alternating light and white bands: a hero with a real crop of the Today screen (`public/brand/today-hero.png`, made by `scripts/landing-hero.mjs`), a five-step timeline, one worked example, four classroom benefits, a privacy band, an accessible FAQ (buttons with aria-expanded) and a violet closing call to action with the mono mark. |
| **How scoring works** | A 680px reading column with numbered sections, the two ladders in columns, the app's status pills, and "One bad day cannot define a child" as a pulled statement. |
| **Auth** | Split panel. The violet side has the mono mark, a live white wordmark and a quiet tile watermark. |

## 7. Not changed, and why
- **Today's plan has no clock times.** The app stores no schedule, and invented times would be fabricated data.
- **The Learners filters read "Literacy not yet" and "Numeracy not yet"** rather than a bare "Literacy" or "Numeracy", because the filter shows learners with a gap in that strand.
- **The Archived filter stays**, because archiving is a working feature.
- **The notifications bell stays beside Ask.** It lists real re-checks and sets to approve.
- **Deadlines on practice and a Previous button in the check runner** need data or rule changes and stay out of scope.
