# DuBose, M.D. — website prototype

Static Astro site built from the approved design spec
(`../docs/website/sketches/`) in the approved visual language
(`../docs/website/visual-language.md`).

- `npm install && npm run dev` — local preview
- `npm run build` — static output in `dist/`, deploys to Cloudflare Pages

Status: PROTOTYPE for visualization and Track F validation. Publishing
gates: entity, licensure facts, counsel/TMB pass (R-13). Placeholders:
[City], service area, licensure line, agreement PDF link (stub). Fonts
via Google Fonts for the prototype; self-host at launch. Build note:
plain token CSS instead of Tailwind — simpler and more faithful to the
specimen at this size.

Design pass 2 (2026-08-21): one grid (`.container` 1120px + `.split`
editorial columns), consistent section rhythm with deliberate
paper/warm/tint/pine alternation, eyebrow-label hierarchy, dark-pine
closing CTA bands and multi-column footer, cards reserved for
enumerable comparable items (open list/row treatments elsewhere), real
photography (`public/images/`), and a working scheduler mock on /book
(State A -> B; selections and fields drive the confirmation state;
nothing is saved or sent — the live scheduler replaces the internals at
launch). Hero is deliberately typographic; a warm candid photo remains
the launch intent per the sketch spec.
