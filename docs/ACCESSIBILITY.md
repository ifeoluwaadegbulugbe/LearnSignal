# Accessibility

Target: WCAG 2.2 AA. Checked on 2026-11-20 against the local dev server with the demo class loaded.

## Automated checks

### axe-core (WCAG 2.0/2.1 A and AA rules)

`node scripts/axe.mjs` scans 16 screens in **both light and night themes** (32 scans):
login, signup, landing, privacy, how scoring works, Today, Learners, learner profile, check runner, Groups, Practice, Insights (progress), Ask, School, Settings and child mode.

**Result: 0 violations on all 32 scans** (re-run after redesign v5 with the sidebar shell and new neutrals; two new issues found and fixed: the sidebar account button's name now contains its visible text, and scrollable ladder rows are keyboard-focusable groups).

Fixed during this pass:
| Issue | Fix |
|---|---|
| Status text on its tint (not yet, developing, consistent, not enough evidence) at 3.7–4.4:1 | Darkened the four light status inks to reach ≥ 4.5:1 |
| Muted text `--ink-3` at 3.3:1 | Darkened to `#626A88` (≥ 4.5:1 on canvas, surface and surface-2) |
| Night violet text on violet-soft at 4.49:1 | Night `--violet` raised to `#9C8BFF` |
| White text on tangerine (2.6:1) | Tangerine buttons and pills use dark ink `#2A1300` |
| Decorative avatars inside labelled buttons exposed an empty `role="img"` | `Avatar label=""` now renders `aria-hidden` |
| Ladder rung and learner-dot buttons had names that did not contain their visible text | Names now come from content (visible code and name plus screen-reader-only text) |
| Learner profile `dl` wrapped items in `div > div` | `KeyValue` renders `dt`/`dd` |
| Recharts wrapper was `aria-hidden` but focusable | `accessibilityLayer={false}`; every chart already has a data table alternative |
| Unchecked-learner avatars at 60% opacity | Opacity removed |

### Lighthouse 12.6 (public pages, headless Chromium)

| Page | Accessibility | Best practices | SEO |
|---|---|---|---|
| `/` | 100 | 100 | 91 → 100 after robots.txt |
| `/login` | 98 → 100 after skip-link target | 100 | 91 → 100 |
| `/how-scoring-works` | 100 | 100 | 91 → 100 |
| `/privacy` | 100 | 100 | 91 → 100 |

The remaining "valid source maps" note is a dev-server artefact. Signed-in screens are covered by axe above; Lighthouse cannot sign in on its own.

## Built-in behaviour

- Skip link to `#main` on every layout.
- Visible violet focus rings on every interactive element; no focus traps outside dialogs and drawers, which trap and restore focus.
- Status is always icon + words + colour, never colour alone.
- Touch targets ≥ 44px on phones; child-mode tiles ≥ 88px.
- Charts have a table alternative and text summaries.
- `prefers-reduced-motion` turns off all motion (settle, arc, pulse, lift).
- Theme is set before paint, so there is no flash.
- No horizontal page scroll at 360px (ladders and boards scroll inside their own containers).
- Child mode: large type, audio prompts, no timers, no red.

## Re-running

```powershell
npm run dev
node scripts/axe.mjs
```
