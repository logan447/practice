# Design House Style — DuBose, M.D.

*Source of truth for how the site looks and lays out. Documents the
system as implemented in `site/src/styles/global.css` as of 2026-08-21.
Companion to `writing-house-style.md`. When adding pages or materials,
match these values; do not invent new ones.*

## Grid

- **Container:** max-width **1360px**, centered;
  `padding-inline: clamp(22px, 4vw, 56px)`. Everything aligns to it,
  including the navigation. The container edge is the alignment
  reference for all content.
- **Split layout** (the workhorse): heading in a left column, content
  right. `grid-template-columns: 4fr 8fr`,
  `gap: clamp(36px, 5vw, 96px)`. Even variant (`.split.even`): 1fr 1fr,
  used where both sides carry equal weight (price card + text,
  contact form).
- **Document sections** (`.doc-sec`, agreement and CV): same 4fr/8fr
  grid per section, hairline top border, left heading sticky at
  `top: 100px` on desktop.
- **Text width inside columns:** none — the column is the measure.
  Text fills to the container edge (~80ch at these widths). A global
  75ch cap applies only to stray paragraphs in full-width sections.
- **Breakpoints:** 920px (navigation collapses to drawer), 860–900px
  (splits and grids stack), 680px (card grids to one column), 560–640px
  (small grids and strips stack).

## Type

- **Faces:** Source Serif 4 (display, headings, wordmark; fallback
  Georgia). Source Sans 3 (body, UI, buttons; fallback system-ui).
  Google Fonts in the prototype; self-host at launch.
- **Sizes:** body 17px / 1.7. h1 `clamp(32px, 3.6vw, 46px)` on interior
  pages, up to 62px in the home hero. h2 `clamp(26px, 3.4vw, 34px)`.
  h3 20px. h4 18.5px. Small text 14.5px. Never below 13px.
- **Hierarchy:** serif carries meaning (headings, pull lines); sans
  carries mechanics (body, nav, buttons, forms, labels). One or two
  heading levels per section — a heading, plus a one-line lede only
  when it adds information. The eyebrow label survives only in the
  home hero.

## Color

| Token | Value | Use |
|---|---|---|
| paper | #FAF7F1 | page background |
| ink | #202826 | text |
| soft | #5B6461 | secondary text, dates |
| accent | #2A6B5F | buttons, links, marks (juniper) |
| accent-deep | #1F5348 | hover |
| pine | #1E3B34 | closing CTA bands |
| pine-deep | #16302A | footer |
| band-warm | #F1EBDF | alternating section band |
| band-tint | #E5EFE9 | highlight band (price, goals) |
| hairline | #DCD4C5 | rules, borders |
| card line | #E4DED1 | card borders |
| emergency | #A6392F | emergency labels only |
| urgent | #96691E | urgent labels only |

One accent, used sparingly. Reds and ambers appear only in emergency
content. All pairings meet WCAG AA.

## Sections and rhythm

- Section padding: `clamp(64px, 9vw, 112px)`; tight variant
  `clamp(48px, 6vw, 72px)`. Page-title block:
  `clamp(40px, 5vw, 60px)`.
- Backgrounds alternate deliberately — paper, warm, tint — never two
  identical bands adjacent. Every page ends with a pine CTA band, then
  the footer.
- Interior pages open with the standard page title: h1 + optional
  one-line lede, left-aligned, same vertical position on every page.
  Exceptions by design: home hero, About (photo intro), booking and
  login (functional layouts).

## Shape, depth, imagery

- Radius: 8px (buttons, inputs), 14px (cards, photos).
- Hairline 1px rules are the structural motif. No shadows except the
  price card and scheduler (`0 2px 14px rgb(32 40 38 / .07)`).
- Photography: real people, real settings only; portraits at 4:5 or
  1:1, 14px radius, on a tinted offset frame (`.photo-frame`).
- Icons: thin-stroke 1.5px line icons (Lucide-derived), accent color,
  in 46px round tinted chips. Never emoji, anywhere.
- Diagrams over paragraphs where a process is being explained (the
  care loop). Keep them CSS/SVG, self-contained.

## Components

- **Primary button:** solid accent, paper text, 600 weight 15.5px,
  `padding: 15px 30px`, min-height 50px, flex-centered label, radius
  8px; hover accent-deep, active 1px press. Inverse variant (paper on
  pine) for dark bands. Nav variant 44px. One primary action per
  view: Book a free conversation.
- **Secondary action:** quiet accent link with arrow (`.quiet`), never
  a second button style.
- **Cards** only for enumerable, comparable items (situations, care
  settings). Everything else uses open treatments: numbered steps with
  accent overlines, definition rows (240px label + text, hairline
  separators), checklists with accent checkmarks.
- **FAQ:** native details/summary, serif questions, +/− marker,
  answers fill the column with a right gutter.
- **Forms:** paper inputs, hairline borders, 8px radius, 14px padding;
  labels as uppercase 12.5px letterspaced; selected states solid
  accent.
- **Footer:** pine-deep, four utility columns (brand, Explore, For
  patients, Newsletter), single-line legal bar. No essays.
- **Emergency strip:** three bordered rows, color-coded left edges
  (emergency / urgent / routine). Identical wherever it appears.

## Accessibility

- Focus: 2px accent outline, 2px offset, always visible;
  paper-colored on dark bands. Skip-to-content link. 44px+ touch
  targets. `prefers-reduced-motion` kills transitions. Body text
  never below 16px equivalent for reading content.

## Principles learned through iteration

1. Use the full site grid. The container edge is the law; content
   aligns to it, including text columns.
2. Never create a narrow container inside a wide one. If text sits in
   a column, the column is the measure.
3. Avoid centered text except the closing CTA bands.
4. No floating or right-aligned copy blocks.
5. One or two heading levels per section. No label + heading +
   subheading stacks.
6. Once a block has made its point, stop. No closing summaries,
   restatements, or explanatory subtext.
7. Not every section needs a card; never stack white box after white
   box. Alternate open layouts, bands, rows, and diagrams.
8. Visual variation is intentional: paper → warm → tint → pine, prose
   → diagram → list → band.
9. Keep interfaces simple; one primary CTA, quiet secondaries.
10. Generous but disciplined spacing; the whitespace is the message.
11. Remove anything not doing useful work.
