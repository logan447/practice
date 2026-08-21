# Visual Design Language — DuBose, M.D.

*Drafted 2026-08-18 for review via the rendered specimen
(`specimen.html`). The organizing idea: **space is the brand.** The
practice sells time and attention; the design expresses it as room —
generous whitespace, one calm accent, quiet typography, nothing
competing for attention. Everything a luxury-concierge, wellness, or
corporate-health site would add is deliberately absent.*

## The one-line brief

Looks like a well-set book about medicine, feels like a calm
conversation — warm paper, serious serif, one deep green, real
photography, and air.

## Tokens

### Color

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FAF8F4` | Page background — warm ivory, not clinical white |
| `ink` | `#232B2A` | Text, wordmark, footer background — green-tinged charcoal |
| `soft` | `#5A6360` | Secondary text, captions, descriptors |
| `accent` | `#2E6E64` | The single accent: buttons, links, marks — deep juniper green |
| `accent-deep` | `#245A52` | Hover/active states |
| `band-warm` | `#F3F0E9` | Alternating section band (warm gray-ivory) |
| `band-tint` | `#EDF3EF` | Highlight band (green-tinted) — price card, summary boxes |
| `hairline` | `#DDD8CE` | Rules and card borders |
| `alert-emergency` | `#A6392F` | Emergency label only — restrained brick, never decorative |
| `alert-urgent` | `#96691E` | Urgent label only |

Rules: one accent, used sparingly (buttons, links, small marks — never
large fills except the closing CTA band at `band-tint`); reds/ambers
appear exclusively in the emergency strip; footer is `ink` with paper
text. All pairings meet WCAG AA (accent on paper ≈ 5.2:1; ink on paper
≈ 13:1).

### Typography

| Role | Face | Notes |
|---|---|---|
| Display, headings, wordmark | **Source Serif 4** | Credible, contemporary old-style serif — editorial medicine, not stuffy; self-hosted at build |
| Body, UI, buttons | **Source Sans 3** | Humanist warmth, natively paired; never below 16px |
| Fallbacks | Georgia / system-ui | Real stacks, no FOIT drama |

Scale (1.25 ratio): body 17.5px / 1.68 line-height · h3 22 · h2 28 ·
h1 35 · display 44–56 (hero). Text measure capped at ~66ch. Serif
carries meaning; sans carries mechanics — headlines and pull-lines in
serif, everything operational (nav, buttons, forms, tables) in sans.

### The wordmark

**DuBose, M.D.** set in Source Serif 4 Semibold, ink, with true small
punctuation — the comma and periods *are* the identity: a physician's
shingle, typeset. Descriptor "direct primary care" in 11px letterspaced
sans, `soft`. No symbol, no monogram at MVP — the name is the mark.
(A "DB" monogram remains a later option for favicons/avatars; favicon
at MVP: serif "D" on `paper`.)

### Shape, space, depth

- Corner radius **8px** (buttons, cards) — composed, not playful; never
  pill, never square.
- Hairline rules (`hairline`, 1px) are the structural motif — headers,
  cards, tables — echoing the agreement PDF.
- **No shadows** except one soft ambient on the price card
  (`0 1px 3px rgb(0 0 0 / 0.06)`). Depth comes from bands, not
  elevation.
- Section rhythm: 96–128px vertical padding desktop, 64 mobile —
  the whitespace *is* the message.
- Buttons: solid `accent`, paper text, 8px radius, 15px semibold sans,
  generous padding; hover `accent-deep`; secondary action is always a
  quiet arrow-link, never a second button style.
- Focus states: 2px `accent` outline, 2px offset, always visible.

### Imagery & iconography

- **Photography only, and only real:** natural light, warm tones, the
  actual physician, actual settings. Candid over posed. No stock, no
  white-coat-crossed-arms, no exam-glove closeups.
- Icons: thin-stroke (1.5px) geometric line icons, `accent` or `ink`,
  drawn set (Lucide as the base library, curated) — used only where
  the sketches specify `[icon]`. Never emoji (design rule 1).
- Illustration: none at MVP.

### Motion

Almost none: 150ms ease on hover/focus, accordion height ease, and an
optional 300ms fade-rise on section entry — all removed under
`prefers-reduced-motion`. Calm is static confidence.

## Anti-patterns (the negative space of the brand)

Navy + gold, smallcaps luxury signaling · sage/terracotta wellness
palettes, leaves, lotus anything · black + neon longevity-tech ·
corporate-health bright blue, gradient blobs, rounded mascot sans ·
carousels, parallax, video heroes · badge walls and award logos.

## Variations offered for review (in the specimen)

- Accent alternates: **slate blue** `#3D5F78` (more traditional-medical,
  cooler) and **warm bronze** `#8C5A2E` (bookish, riskier).
- Serif alternate: **Lora** (rounder, warmer, slightly less editorial).
- Recommendation stands: juniper green + Source Serif 4.
