# LearnSignal design

**Concept: "the teacher's field notebook meets a signal."** Warm paper, dark ink and one confident teal, with sun-yellow used sparingly as the *signal* that says "look here". Cards behave like notebook index cards. Progress is drawn as **rungs on a ladder**, because the product's core idea is teaching each child at the right level, and confidence is drawn as **signal arcs**, the logo motif.

The feeling we aim for: warm, trustworthy, calm and capable. A primary teacher in Lagos or Kano with 50 children and a phone should feel helped, not managed.

See every component and state live at `/dev/ui` (with width and Night switches) and every screen at 390, 768 and 1440px in [`docs/screenshots/`](screenshots/).

---

## 1. Principles

1. **One clear idea per page, then detail.** Each screen has a single hero element (the Class Ladder on Today, the skill ladders on a profile, the prompt card in a check).
2. **Status at a glance, by shape and colour, never colour alone.** Every state has a colour, an icon and words.
3. **Every card has one obvious action.**
4. **Explain, don't judge.** Words describe evidence ("not yet demonstrated"), never the child.
5. **Quiet by default, loud only for the next step.** Sun-yellow appears at most once or twice a page.
6. **Designed empty states.** Illustrations and index cards make "nothing yet" feel intentional, with one action to move forward.
7. **Honest UI.** AI content is badged, fallbacks are labelled, sample data is labelled, and features not built are named as such rather than shown as dead buttons.

## 2. Colour

### Paper and ink
| Token | Light | Night | Use |
|---|---|---|---|
| `--paper` | `#FBF8F2` | `#0F1519` | Page background (warm, never pure white) |
| `--paper-2` | `#F3EEE4` | `#151D22` | Rail, tracks, inset areas |
| `--card` | `#FFFFFF` | `#1A242B` | Cards |
| `--ink` | `#16222B` | `#F2EFE8` | Text |
| `--ink-2` | `#4F5B66` | `#B8C0C6` | Secondary text |
| `--ink-3` | `#7B8791` | `#8C98A1` | Placeholders, large or non-essential text only |
| `--line` / `--line-strong` | `#E7E0D2` / `#D4CAB6` | `#2A353D` / `#38454F` | Hairlines, borders |

### Brand
| Token | Value | Role |
|---|---|---|
| **Teal** `--teal` | `#0D5C63` (soft `#DCEEEC`) | The one brand colour: primary buttons, active navigation, the ladder rails |
| **Sun** `--sun` | `#FFB627` (soft `#FFF0CC`) | The "signal": the single most important action, "Working here", the chalk underline, Next step |
| Clay | `#C8643C` | Decorative warmth (note tabs, activity cards). Never for errors |
| Sky / Leaf / Stone | `#3B82C4` / `#2E9D63` / `#6E7780` | Supporting tints for tiles, answer tiles, oral-reading marks |

### Status (always icon + label)
| State | Colour | Icon | Plain-language tooltip |
|---|---|---|---|
| Not yet demonstrated | amber `#A86A0C` on `#FFEFD2` | dashed circle | "Hasn't shown this skill in recent practice or checks." |
| Developing | blue `#2B6FB3` on `#E1EEF9` | rising line | "Getting there. Some correct, some not yet." |
| Demonstrated consistently | green `#1F8A55` on `#DDF3E8` | check | "Showed this skill across more than one session." |
| Not enough evidence yet | stone `#6E7780` on `#ECEAE4` | question mark | "A few more questions are needed." |

**There is no red anywhere in learner-related UI.** "Not yet" is amber, and destructive actions use an amber "quiet warning" style.

## 3. Typography
| Role | Font | Size / line | Weight |
|---|---|---|---|
| Greeting / display | **Bricolage Grotesque** | 40/46 (mobile 30/36) | 700, −0.02em |
| Page title | Bricolage Grotesque | 30/38 (mobile 24/32) | 700 |
| Section title | Bricolage Grotesque | 20/28 | 600 |
| Body / UI | **Inter** | 15/24 | 400–600 |
| Labels | Inter | 12/16 | 500, sentence case |
| Big numbers | Bricolage Grotesque | 28–36 | 700, tabular figures |
| Learner codes | **JetBrains Mono** | 12 | 500, in a sand chip with copy button |
| Child prompts | **Nunito** | 36–44/48–56 | 800 |

Bricolage gives headings a friendly, slightly hand-made character; Inter keeps dense teacher screens readable; Nunito's rounded letters suit young readers; mono makes codes like `LS-3F9A2C` unambiguous.

## 4. Shape, space and depth
- **4px grid.** Page padding 16 / 24 (≥768px) / 40 (≥1280px). Content max width 1240px.
- **Radii:** cards 18px, tiles 12px, inputs 10px, pills fully round; child mode uses 24–28px.
- **Depth:** a 1px warm border plus a soft shadow (`0 6px 18px rgba(22,34,43,.06)`); overlays use a stronger shadow. No heavy drop shadows.
- **Tap targets:** at least 44px; 64px in child mode.

## 5. Signature elements
These carry the identity. They are original to LearnSignal.

1. **The Class Ladder.** The Today centrepiece. Six rungs per strand (L1–L6 or N1–N6), drawn top-down between two teal rails. Each learner is a small initials dot on the rung they are working on now; a dashed amber outline marks "re-check suggested". Above the ladder: learners with no gap flagged; below: learners not checked yet. Tap a rung or a dot to open the Focus Panel (who's there, their status and confidence, Start check, View profile). On phones the rungs become stacked rows with scrollable dots.
2. **Signal arcs.** Three concentric arcs above a dot. Used in the logo, as the **confidence indicator** (1, 2 or 3 arcs lit for low, medium, high; a dashed outline when the result is provisional), in loading states, and on the mobile Check button.
3. **Index-card tabs.** Cards carry a small folded tab at the top-left with a label: GROUP, NEXT STEP, NOTE, ANSWER, SET, a skill code. Teal for normal, sun for next steps, clay for notes and activities, sky for AI items, stone for neutral.
4. **Ruled paper and margin line.** Notes, activities and timelines sit on faint ruled lines with a thin clay margin line, like an exercise book.
5. **Chalk underline.** A hand-drawn sun stroke under one word per page at most (the teacher's name in the greeting; "exact skill" on the landing page).
6. **Stepping stones.** Progress is shown as oval stones: the onboarding steps, the check runner's question progress, child-mode progress and effort, and the loop on the landing and sign-in pages.

## 6. Components
All live in `components/ui/` and are shown in every state at `/dev/ui`.

| Component | What it is |
|---|---|
| **Button** | Primary (teal), secondary (white, strong border), ghost, **sun** (the one key action), quiet-warn (amber, destructive), link. 36/44/52px; child size 64px pill with a "press edge" that compresses on tap. Loading shows a spinner. |
| **IndexCard** | The base card, with optional tab, ruled paper, margin line and tints. |
| **StatusPill** | The four states, icon + label + tooltip. One implementation everywhere. |
| **SignalMark / ConfidenceSignal** | The arcs motif and the confidence indicator. |
| **ClassLadder** | Class view of learners on rungs, plus the Focus Panel. |
| **SkillLadder** | One learner, one strand: vertical on desktop (horizontal snap-scroll on phones), node colour by status, connector filled up to the working skill, a sun "Working here" tab, confidence arcs; tap a node for the evidence drawer. |
| **EvidenceDrawer** | "Why?" panel: status, confidence, weighted score, evidence weight, a session timeline (correct/total), retest notice, and "How is this calculated?". |
| **NextStepCard** | One rules-based next action with a sun tab and a "Not now" link. Replaces banners. |
| **SummaryStrip** | Three quiet figures separated by hairlines (no icon tiles). |
| **MeterRing / SegmentedRing / StateBar** | Practice completion ring; slim stacked bar of states with an inline legend. |
| **WorkRow / Timeline** | 64px compact list rows; a vertical timeline with round nodes. |
| **SegmentedTabs / TextTabs** | Filters on a rounded track with a teal-soft thumb; in-page sections with a 3px sun indicator. |
| **Avatar (learner dot)** | Initials only, never photos; colour from the learner code; screen readers hear "Ada, learner code LS-7K3Q". |
| **CodeChip** | Monospace code with copy button. |
| **Dialog** | Centred on desktop, bottom sheet with a drag handle on phones; the side variant is the Focus Panel. |
| **Toast, Skeleton, EmptyState, ErrorPanel** | Toasts with a tinted icon tile; shimmering skeletons shaped like the final layout; empty states with an illustration and one action; amber error panel with "Try again" and "Copy error details". |
| **Badges** | AI-drafted (sparkle), Validated (shield), Illustrative sample data (flask). |
| **Charts** | Before/after area chart and state bars, each with a text summary and a "View as table" toggle. |
| **Illustrations** | Original inline SVG: a stack of index cards, three stepping stones, an open notebook, a ladder with a lamp, a tangled pencil line, a cloud, a sun rising over a ladder, and the landing ladder with arcs. No faces. Counting pictures (mangoes, oranges, stars, balls) are drawn as SVG too. |

## 7. App shell
- **Desktop (≥1024px):** a light 92px rail on `--paper-2` (not dark, not floating). Icon above an 11px label: Today, Learners, Checks, Groups, Practice, Ask, Insights, (School for admins), Settings. Active item: teal-soft square behind a teal icon, plus a 3px teal bar on the rail's inner edge. Night toggle and account avatar at the bottom.
- **Context bar** (64px, sticky, translucent paper): class switcher pill (name + learner count), command search "Find a learner, skill or practice set" (⌘K), **Ask** (opens the assistant in a side drawer), notifications bell with a sun dot only when something needs action (re-checks due, sets to review).
- **Tablet:** the rail shows icons only (72px).
- **Phone:** top bar with the class switcher, Ask and avatar; bottom bar with Today, Learners, a **raised round teal Check button** with the signal arcs (starts a check for the last learner viewed, or opens a learner picker), Groups and More.
- **Command palette:** learners (by name or code), skills, screens and actions ("Start a check for Ada"), with recent items and full keyboard control.

## 8. Screens, briefly
| Screen | The design idea |
|---|---|
| **Landing** | "Find the **exact skill** each child is missing" with the chalk underline; a live sample Class Ladder on a torn-edge paper card; the loop as stepping stones; a worked scoring example; feature rows built from real components; privacy cards; FAQ; a teal closing band with a sun button. |
| **Sign-in / sign-up** | Teal story panel with dotted rules and the loop as stones; the form on paper with password show/hide, a strength meter and a consent checkbox. |
| **Onboarding** | Three stones (School → Class → Learners); the form card beside a live preview whose dots appear as names are typed. |
| **Today** | Greeting with chalk underline, summary strip, one Next step card, the Class Ladder, groups as index cards (practice ring, state bar, member dots), and a "Recent changes" timeline from real history. |
| **Learners** | Segmented filters (All, Literacy not yet, Numeracy not yet, Not checked, Archived), search, a sortable table with codes and working-skill pills, bulk actions; cards on phones. Adding a learner ends with a sun "code reveal" card. |
| **Learner profile** | Header index card; tabs (Overview, History, Practice, Notes) with the sun indicator; two vertical skill ladders with Next step cards; gaps as expandable cards with evidence chips and "Why?"; notes on ruled paper. |
| **Checks** | Choose Literacy / Numeracy / Both (Baseline or Re-check tab), a sun "Before you start" card; a distraction-free runner with question stones, a big Nunito prompt card, a sun speaker button, flat colour answer tiles, a 3×4 keypad, and oral reading where each word chip cycles Correct → Omitted → Substituted → Self-corrected. The child sees only "Thanks, next one"; the teacher can show a small corner indicator. |
| **Results** | "Check complete", a plain summary, the skill ladder, three cards by state, a provisional note, the recommended 15-minute activity. |
| **Groups** | One board per rung (tab = skill code), draggable learner chips with a keyboard "Move" alternative and Undo, a ruled 15-minute activity card under each board, merge suggestions in the Focus Panel. |
| **Practice** | Sets as index cards (AI-drafted + Validated badges, review status), a Generate sheet with stepwise progress (Drafting · Checking answers · Ready to review) and the validator report, a child-style preview with the answer key for the teacher. |
| **Child mode** | Warm paper with soft colour blobs, "Hi, Ada", oversized practice cards with plain names ("Taking away numbers"), stepping-stone progress, effort stones on finishing. |
| **Insights** | "How the dots moved": first-check vs latest Class Ladders, a before/after chart with labelled deltas, practice completion bars, a change table (moved up / held / retest suggested), CSV and print. |
| **Ask** | Answers as index cards with an ANSWER tab, questions as teal-soft bubbles, learner codes turned into name chips locally, general guidance in a separate sun card, a "Reading your class data…" line with the arcs while it works. |
| **School insights** | Quiet summary strip, a school ladder drawn as stacked bars per rung, most common gaps, classroom comparison; any count under 3 shows "—" ("Hidden to protect privacy"). |
| **Settings** | Section list (Profile, Classes, Language, AI and privacy, Appearance, Data); the Night switch; an amber danger zone with type-to-confirm deletion. |

## 9. Child mode rules
- Nunito 700–800, at least 24px text, 36–44px prompts, 64px pill buttons with a press edge.
- Flat soft answer tiles (teal, sun, sky, clay) with a white inner border; a correct choice gets a teal ring and check; a wrong one fades to neutral. **Never red.**
- Feedback phrases rotate ("Nice!", "Good thinking!", "Let's try again!"), always with an icon and announced to screen readers. A hint appears after the second try.
- **No points, streaks, badges, leaderboards, timers or loss states.** Effort stones only, based on finishing, never on score. Audio plays only when the child taps the speaker. Exit needs the teacher's password.

## 10. Motion
160–220ms with a gentle ease. Cards lift 2px on hover; content fades up 8px in a short stagger; learner dots settle onto rungs with a small spring; signal arcs light one after another; rings draw on first view; skeletons shimmer. **All motion turns off when the device asks for reduced motion.**

## 11. Night theme
Deep blue-grey paper (`#0F1519`), soft ivory ink, a lighter teal (`#5CC3C8`) and sun, with every status colour re-tuned for contrast. Set before the page paints (no flash), defaults to the device setting, and is saved per device. Toggle in the rail, the account menu and Settings.

## 12. Accessibility
- WCAG 2.2 AA contrast targets for text tokens in both themes; `--ink-3` reserved for large or non-essential text.
- A visible 3px teal focus ring; skip link; landmarks; headings in order; labelled icon buttons.
- Status never by colour alone; charts have text summaries and table views; toasts and feedback use live regions.
- Full keyboard use, including alternatives to drag (Move menu in Groups) and keys 1–4 / digits / Enter in the check runner.
- 44px targets (64px for children), no horizontal scroll at 360px, reduced-motion respected, avatars announced with name and code.
- Not yet done: a formal axe / Lighthouse audit.

## 13. Words
Sentence case. Short, kind, specific. No exclamation marks in teacher screens. Only these state words: *not yet demonstrated, developing, demonstrated consistently, not enough evidence yet.* Never "weak", "failing", "behind" or "slow". Every result page ends: "This shows which skills a child has demonstrated so far. It is not a diagnosis." Dates read "12 Nov" this year.

## 14. Originality
The founder shared two dashboards as inspiration for **quality only** (polish, hierarchy, whitespace, friendly roundness). We deliberately avoided their patterns: no dark floating sidebar with a neon active pill, no top navigation with underlined tabs, no lime or indigo palette, no pastel gradient stat cards with mini bar charts, no "New feature" banner, no points/streak/leaderboard widgets, no course rows with thumbnails, no photo-in-an-arch hero. The identity rests on LearnSignal's own elements: paper and ink, the teal and sun signal, index cards, the Class Ladder, signal arcs and stepping stones.
