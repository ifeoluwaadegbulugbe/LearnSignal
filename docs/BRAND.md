# LearnSignal brand

## The mark: "steps with a learner at the top"

Five rounded tiles form a small staircase, the product's core idea of teaching each child at the right level. The tangerine circle on the top step is the child, the *signal*. Tiles go from light to deep violet to suggest progress.

| File | Use |
|---|---|
| `public/brand/mark-steps.svg` | Primary mark, full colour, on light backgrounds |
| `public/brand/mark-mono.svg` | One colour (`currentColor`): dark and violet surfaces, print, watermarks |
| `public/brand/app-icon.svg` | Violet gradient tile with white steps and the tangerine dot: favicon, PWA, social avatar |
| `public/brand/lockup-horizontal.svg` | Mark and wordmark, for static use only |

In the app the mark is the `LogoMark` component (`mono` prop for the one-colour version) and the wordmark is live text (`Wordmark`), both in `components/layout/logo.tsx`.

Generated files (re-run `node scripts/brand-assets.mjs` after changing the SVGs):
`app/icon.svg`, `app/favicon.ico` (32px), `app/apple-icon.png` (180px), `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (20% safe padding), `app/opengraph-image.png` (1200×630). `app/manifest.ts` declares the PWA icons, and the theme colour is `#5B3FE0`.

## Wordmark

"LearnSignal" as one word in **Sora 700**, letter-spacing −0.03em. "Learn" is in `--ink` and "Signal" in `--violet`. On dark or violet surfaces, "Learn" is white and "Signal" is `#C9BEFF`. Sora is used only for the wordmark; headings use Manrope.

## Colours

| Part | Hex |
|---|---|
| Tile 1 (lightest) | `#B9A8FF` |
| Tiles 2 and 4 | `#8B73F5` |
| Tiles 3 and 5 | `#5B3FE0` |
| Learner dot | `#FF7A2F` (the only orange in the logo) |

## Clear space and size

- **Clear space:** at least one tile's width (28 of the 100-unit grid) on every side.
- **Minimum size:** the mark at 16px tall; the lockup at 96px wide. Below 24px, prefer the mono mark or the app icon.
- **In the app:** sidebar uses a 28px mark plus a 20px wordmark; the phone top bar uses the mark only (28px); the auth panel uses the mono mark in white.

## Backgrounds

- Use the full-colour mark on white, `--canvas` and light tints.
- Use the mono mark in white on `--grad-violet`, photos or the Night theme. The dot stays tangerine where contrast allows.

## Never

- Rotate, stretch, outline or add shadows to the mark.
- Change the tile order or recolour the dot to violet in full-colour use.
- Put the full-colour mark on violet.
- Animate the tiles apart, except in `LogoLoader`, where tiles pop in 90ms apart and the dot drops onto the top step. Under reduced motion it shows the static mark.
- Use a book, graduation cap, light bulb or Wi-Fi-style arcs as the logo.

## The arcs

The three-arc signal glyph is no longer the logo. It remains only as:

- the **ConfidenceSignal** (one to three arcs for low, medium and high; dashed when provisional)
- the "AI working" indicator in Ask
- the phone **Check** action, which redesign v5 asks to carry the Signal Arcs motif. Where the logo brief and v5 disagree, v5 is the later instruction.
