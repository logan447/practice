# Outreach Materials — Production, Preview, and Cost Plan

*Companion to `packet-architecture.md`. Status: approved workflow
proposal + planning-grade cost estimates. Every dollar figure here is
an **ESTIMATE** for planning: web-checked anchors are cited; everything
else is marked (est). All prices get live quotes at order time and are
`REFRESH-AT-RUNWAY`. Nothing is printed until the publishing gates
clear (name/entity/licensure/[City], counsel pass) — this document
exists so design work is print-correct from the first draft.*

---

## 1. The pipeline: content → physical product

One pipeline for every piece, with the repo as the single source of
truth at every step.

| Step | What happens | Artifact |
|---|---|---|
| 1. Content | Copy drafted in `docs/outreach/pieces/`, House Style pass, owner approval | Markdown (as with the brochure) |
| 2. Design | Layout built as HTML/CSS at exact physical size (inches, `@page`), reusing the website's visual tokens (type, color) so print and site look related | `print/<piece>/` in the repo |
| 3. Screen preview | Rendered to true-scale PNGs (front, back, inside spread, fold map showing panel order) via headless Chromium; reviewed on screen | PNGs delivered in-session |
| 4. Paper proof | Same file printed at 100% scale on a home/office printer, trimmed, folded by hand. Checks feel, type size, QR scan, fold logic. This step is not skippable — screens lie about physical scale | Home proof |
| 5. Revision | Copy edits go back to step 1; layout edits to step 2. Every change is a commit; the PDF regenerates deterministically | Git history |
| 6. Print-ready file | Chromium print-to-PDF at trim size + 0.125" bleed, fonts embedded, vector type and QR codes, 300 dpi images. Built to the chosen printer's template specs | `<piece>-print.pdf` |
| 7. Printer proof | First order of each piece: the printer's PDF proof, plus a hard-copy proof or minimum-quantity short run before the real quantity | Vendor proof |
| 8. Product | Full run ordered only after a physical sample is approved | The printed piece |

Why design-as-code instead of Canva/InDesign: the copy already lives in
this repo under version control and approval discipline; HTML/CSS at
fixed physical dimensions renders pixel-identical to the PDF the
printer receives; and previews regenerate in seconds after every edit.
Canva remains a fallback if the owner wants hands-on visual editing,
but it forks the source of truth. (est: no licensing cost either way —
Chromium and Ghostscript are free; Canva print-grade export needs the
paid tier.)

Two honest limitations of the browser pipeline, and their mitigations:

- **Color.** Browsers output RGB; presses print CMYK. Printers convert
  automatically, and saturated colors shift slightly. Mitigations: a
  restrained palette chosen with CMYK-safe values, body text set as
  pure black, and the step-7 hard proof before any full run.
- **WYSIWYG ceiling.** The screen preview is exact for layout and copy;
  paper feel and color are only proven by the home proof (step 4) and
  vendor proof (step 7). "Approve a digital representation that closely
  matches the product" = steps 3–4 together; the first-order hard proof
  closes the last gap.

## 2. Print specifications by piece

Global rules, all commercially printed pieces: 0.125" bleed on every
edge · 3/16" (0.1875") interior safe margin · 300 dpi minimum for
images, vector for type and QR codes · fonts embedded · PDF, one file
per side or per the printer's template · body text pure black (100K) ·
no heavy full-coverage ink fields (uncoated stock prints darker and
softer) · QR codes at least 0.8" square with full quiet zone, verified
by phone scan from a printed proof at arm's length.

| Piece | Trim size | Fold | Sides / color | Stock and finish | Produced by | Test-run qty |
|---|---|---|---|---|---|---|
| Business card | 3.5 × 2" | — | 2 / full color, restrained | 16 pt, matte (uncoated velvet optional) | Online printer | 500 (pricing makes fewer pointless) |
| Patient brochure | 8.5 × 11" flat → ~3.67 × 8.5" | Tri-fold (roll); in-folding panel cut ~1/16" narrow — use the printer's template | 2 / full color, one photo max | 100 lb text, matte/silk | Online printer, scored + folded | 250 |
| Practice one-pager | 8.5 × 11" | — | 2 / light color | 32 lb premium laser paper | **On demand** (home/office laser) | 20 at a time |
| Audience inserts (A–D) | 8.5 × 11" | — | 1 / light color | 32 lb premium laser paper | **On demand** | 10–20 per insert |
| Cover letter | 8.5 × 11" | — | 1 / black + wordmark | 24–28 lb premium letterhead stock | **On demand**, per recipient, hand-signed | Per packet |
| Folder (MVP) | 9 × 12" two-pocket, card slits | — | Unprinted | Plain white or light linen, bought in packs | Purchased, not printed | 25–50 |
| Mailing envelope | 9 × 12" booklet | — | Return address printed or labeled | 28 lb white | Purchased | 50 |

The commercial/on-demand split is deliberate: cards and brochures are
stable, high-volume, and quality-sensitive → commercial print. The
one-pager, inserts, and letters revise often, personalize, or vary by
audience → on-demand laser, so a copy change never strands inventory.

**Matte vs. gloss:** matte/silk throughout. Gloss reads as advertising;
matte reads as stationery, matches the uncoated letter system, and
takes handwriting (a signed letter, a note on a card).

**Color vs. black and white:** restrained color on cards and brochure
(wordmark, accents, one photo); letters essentially black on white.
The system should look calm in a stack.

## 3. Costs

### 3.1 One-time setup (mostly avoided by design)

| Item | Estimate | Basis |
|---|---|---|
| Design labor | $0 | In-repo, this pipeline |
| Proof prints, trials, test scans | $30–60 (est) | Home + one-off copies |
| Color laser printer (optional but recommended — letters, inserts, one-pagers, and general practice use) | $200–400 (est) one-time | Consumer color laser class |
| Premium paper starter (letterhead + 32 lb) | $30–50 (est) | Two reams |

If the owner prefers not to buy a printer, FedEx Office-class retail
printing runs roughly $0.60–0.90/color page (est) — fine for small
batches, poor economics past ~200 pages/year.

### 3.2 Commercial printing at quantity (web-checked anchors, Aug 2026)

| Piece | 100 | 250 | 500 | 1,000 | Basis |
|---|---|---|---|---|---|
| Tri-fold brochure, 100 lb text, 4/4, folded | ~$60 | ~$85–110 | ~$140–160 | ~$170–220 | 55Printing published tiers ($59.94/100, $142.79/500, $171.86/1,000); HelloPrint $107.99/250. Plus shipping (est $10–20) |
| Business cards, 16 pt | — | ~$15–20 | **~$25** | ~$35–45 | GotPrint published $24.85/500 |
| Custom-printed folder (deferred) | ~$250–400 (est) | ~$650–850 | — | — | 4over4 linen folders $844.54/250 (~$3.38 ea); budget lines run lower but still $1.50–3 ea (est) |
| Plain linen/white folders (MVP) | $0.50–1.00 each (est) | | | | Office-supply packs; verify at order |

Per-unit takeaways: brochure ≈ $0.35–0.45 at 250, ≈ $0.30 at 500,
≈ $0.20 at 1,000 · card ≈ $0.05 · on-demand sheet ≈ $0.10–0.15 (est:
paper + toner) · plain folder ≈ $0.75 (est) · custom folder ≈ $3+ —
which is the whole argument for deferring it.

**Local printer vs. online:** online gang-run (GotPrint, 55Printing,
UPrinting class) is the price floor for commodity pieces. A local
Austin shop will run roughly 20–50% more (est) but gives in-person
proofs, fast reprints, and a relationship — worth one quote at runway,
since walking into a local print shop is itself the kind of grassroots
contact this practice runs on. Recommendation: online for cards and
brochures; get a local quote for any future folder; retail copy shops
only for on-demand overflow.

### 3.3 Cost per packet (the acquisition-economics number)

Drop-off packet — plain folder · signed letter · one-pager · 1 insert ·
6 brochures · 4 cards (mid estimates, 250-brochure pricing):

| Component | Cost |
|---|---|
| Folder (plain, est) | $0.75 |
| Letter + one-pager + insert (on demand, est) | $0.35 |
| Brochures × 6 @ ~$0.40 | $2.40 |
| Cards × 4 @ ~$0.05 | $0.20 |
| **Total** | **≈ $3.70** → call it **$2.50–4.00**; falls toward ~$2.50 at 500+ brochure pricing |

Mailed packet — letter · one-pager · insert · 2 brochures · 1 card ·
9 × 12 envelope · postage:

| Component | Cost |
|---|---|
| Contents | ≈ $1.25 |
| Envelope (est) | $0.25 |
| USPS large-envelope postage, ~2–3 oz (est, verify current rates) | $1.75–2.50 |
| **Total** | **≈ $3.25–4.00** |

**Acquisition math:** at ~$3.50/packet, one enrolled patient
($100/month, researched ~2+ year average DPC tenure) pays for ~28
packets in the first month alone. Print cost is negligible in the
acquisition economics; the binding cost is physician time per drop-off
and follow-up. Optimize the packet for conversion and credibility, not
for saving fifty cents.

### 3.4 Ongoing replenishment (est)

- Brochures are the only fast-consuming commercial piece: at 6–8 per
  packet plus refills, 250 supports ~25–30 packets. Reorder at 500
  once copy is stable (~$150/reorder, ≈ 2 months of one member's fee).
- Cards: 500 lasts a long time at 4/packet; reorder ~$25.
- On-demand pieces cost only paper + toner as used; letters are printed
  per recipient by definition.
- Folders/envelopes: repurchase in packs as needed, ~$30–50 per 50.

Steady-state estimate for an active outreach quarter (~30 packets):
**$100–150/quarter** (est).

## 4. The minimum viable outreach system

What to actually produce first — and what not to:

1. **No custom folder.** Confirmed by pricing: $3+/unit at 250 vs.
   ~$0.75 for a clean plain linen folder, and the signed letter on
   letterhead sitting on top brands the packet better than foil ever
   would. Revisit custom folders only if drop-offs prove out and a
   professional audience seems to expect more — the architecture's
   modesty posture says they shouldn't.
2. **Two commercially printed pieces only:** 500 cards (~$25) and 250
   brochures (~$100 with shipping). Everything else on demand.
3. **First production order, all-in:** cards + brochures + 50 plain
   folders + 50 envelopes + paper ≈ **$200–300** (est) — enough to
   assemble ~25–30 packets with refill stock. Add the optional laser
   printer and the full MVP is still ≈ $450–650, inside the $20k
   preparation ceiling's rounding error.
4. **Sequence guard:** print nothing before the publishing gates
   ([City], licensure, entity, counsel pass) — the brochure carries
   placeholders today. Design, preview, and home-proof everything now;
   send files to a printer only at runway.
5. The whole system fits in a car: one box of assembled folders, one
   box of refill brochures, cards in a case. The handoff script it
   serves: *"I run a local primary-care practice. I thought some of
   the people you work with may find it useful. Everything is explained
   here, and I would be happy to talk if you have questions."*

## 5. Open items

1. Buy the color laser printer, or use retail printing for on-demand
   pieces? (Recommend buy, at runway.)
2. Folder stock choice: plain white vs. light linen — decide at the
   home-proof step with samples in hand.
3. USPS postage verified at mailing time; if mailing volume ever
   matters, weigh the packet as designed before printing envelopes.
