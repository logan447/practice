# Unit Economics

*Each patient relationship is a small, customized clinical contract — scoped,
priced, tracked, periodically reassessed, renewed when appropriate — managed
by one solo physician. Part I is the analytic model. Part II translates it
into a practice you can picture: archetypes, weeks, months, and the ideal
practice target pressure-tested.*

> **Provenance discipline:** numbers marked *illustrative* demonstrate
> structure and are not benchmarks or market data. Cost lines stay visibly
> UNSET until real quotes exist. Reproduce any scenario with
> `tools/practice_model.py`.

---

# Part I — The analytic model

## 1. Capacity and target

- **Capacity:** `weeks worked × clinical hours/week − practice admin` =
  patient-attributable hours available. Not all fill; **utilization** is the
  share that does.
- **Target (D-018):** ~$130–175k, >$100k meaningful minimum, maximization a
  non-goal. Compensation here means income after practice costs, before
  personal taxes; benefits sit in the cost lines, so keep them there when
  comparing to employment.

## 2. The pricing framework (D-002)

```
price = expected physician time × (1 + uncertainty allowance)
        × complexity-adjusted hourly rate
        + direct resources        …then sanity-checked against value
```

**Fixed price outside, time-based logic inside (D-002, confirmed against
the hourly-billing alternative 2026-08-16):** the patient sees a fixed
price for a defined period, with the estimated-hours basis stated so the
derivation is visible. Patients are never billed by the hour. Why: hourly
meters penalize exactly the behaviors the model depends on (messaging
early, asking questions), recreate the unpredictable-bill experience the
practice exists to end, and require timesheet-grade tracking and disputes.
The fixed price transfers estimation risk to the physician — correctly,
since the physician is the better estimator — and that risk is managed by
the **uncertainty allowance** (a bounded loading on estimated hours,
~10–15% illustratively, calibrated from estimate-vs-actual data, R-08)
plus checkpoint re-scoping.

- **Expected time** counts everything attributable: synchronous visits,
  asynchronous work (messaging, results, refills, coordination), home-visit
  travel, per-arrangement admin.
- **The rate is derived, not invented:**
  `required rate = (target income + practice costs) ÷ (available hours × utilization)`.
  This is what makes every price explainable out loud.
- **Complexity** is a bounded multiplier (~0.9–1.3 illustratively) with
  written inputs — calibration open (Q-14).
- **Direct resources** (space sessions, travel hard costs) pass through
  visibly. Labs/imaging/medications sit outside the arrangement price (Q-05).
- **The value check gates downward only:** if the price doesn't make sense
  against what the patient gets, re-scope or decline — never inflate.

The framework prices the *relationship's work*, but what is sold is not
physician time — it is the outcome of the work: a situation understood,
a plan that holds, health that measurably improves (D-023). Time is the
cost driver; value is the product. Every proposal should read that way.

## 3. What determines success (watch in this order)

1. **Estimate accuracy** — proposal hours vs. actuals, per patient, from
   patient one (R-08). The untangling archetype (U below) is where estimates
   will be least reliable and most improvable.
2. **Utilization ramp** — how fast attributable hours fill (D-022 grassroots;
   slow accepted, but measured).
3. **Async/admin creep** — the unscheduled categories that sink estimates
   (R-20 trigger lives here).
4. **Travel economics** — clustering keeps home visits priceable (R-23).
5. **Practice costs** — UNSET; every real quote moves the required rate.

---

# Part II — The operating picture

*The same model, translated into what running the practice would feel like.
All figures illustrative; derivations in the tool.*

## 4. The five patient archetypes

The people the practice serves, with the signature patient last. Hours are
per year (or per engagement where noted); prices use an illustrative
**$210/hr** blended rate (see §6 for why that rate).

| | Archetype | Sync | Async | Travel | Admin | Total hr | Cmplx | Annual price* |
|--|---|---|---|---|---|---|---|---|
| **P** | Prevention & longitudinal guidance — healthy, wants a doctor who knows them | 3.5 | 2.5 | — | 1.0 | 7 | 0.9 | ~$1,300 |
| **S** | Stable chronic — 1–2 controlled conditions | 5 | 4 | — | 1.5 | 10.5 | 1.0 | ~$2,200 |
| **M** | Active metabolic/lifestyle work — medication changes, tight feedback loops | 8 | 6 | — | 2.0 | 16 | 1.1 | ~$3,700 |
| **C** | Complex untangler, medical — needs real diagnostic work + frequent follow-up (first year; usually lightens after) | 10 | 8 | 3 | 2.5 | 23.5 | 1.3 | ~$6,400 |
| **U** | **Whole-life untangler — the signature patient**: scared, frustrated, or overwhelmed; health affecting stress, finances, work, relationships, sleep, behavior at once | 9 | 7 | — | 2.5 | 18.5 | 1.2 | ~$4,700 |
| **E** | Defined-problem episode — one problem solved in ~3 months; no indefinite relationship (per episode, not per year) | 4 | 2.5 | — | 1.0 | 7.5 | 1.0 | ~$1,600/episode |

*\*plus direct resource pass-throughs where applicable; ranges in practice
(±20–30%) as the framework flexes with the individual.*

**What each is being offered — the pitch, honestly stated:**

- **P:** a physician who knows you before something goes wrong; a prevention
  roadmap; unhurried annual deep-dives; someone to call first.
- **S:** conditions genuinely managed, not just refilled; medication burden
  minimized; drift caught early; trends you can see.
- **M:** active change with a partner — frequent adjustments, real feedback
  loops, measurable metabolic improvement you watch happen.
- **C:** someone finally runs the workup to ground — owns the diagnostic
  question, coordinates the specialists, follows through to an answer.
- **U:** someone competent and thoughtful finally looks at the *whole*
  picture — listens carefully, understands the full situation, identifies
  the highest-priority problems, separates urgent from important, builds
  one realistic plan, and works through it with you until it is manageable.

**The core experience across all five** (and the practice's clinical
signature): listen → understand the whole situation → prioritize → urgent
vs. important → realistic plan → work through it together over time.

## 5. An example mature practice

Mix chosen to feel like the practice you describe — anchored in untanglers
and active-change patients, ballasted by stable relationships:

| Archetype | Count | Hours/yr | Revenue/yr @$210 |
|---|---|---|---|
| P · Prevention | 12 | 84 | ~$15,900 |
| S · Stable chronic | 20 | 210 | ~$44,100 |
| M · Metabolic/lifestyle | 10 | 160 | ~$37,000 |
| C · Complex medical | 6 | 141 | ~$38,500 |
| U · Whole-life untangler | 8 | 148 | ~$37,300 |
| E · Defined episodes (6/yr) | 6 | 45 | ~$9,500 |
| **Total** | **62 relationships** | **~788** | **~$182,200** |

Against ~$20k illustrative overhead (UNSET — placeholder): **~$162k
physician income** at the $210 scenario rate — or run the same mix at the
$100k-goal rate (§6). C-archetype patients typically step down to S or M
after their first year — the panel matures toward lighter average
intensity, which is headroom. E episodes fill capacity between
longitudinal arrangements and are a natural on-ramp.

### What a working week looks like (39-week year, ~30 hr, 9:00–4:00)

| Block | Hours | Feel |
|---|---|---|
| Synchronous visits | ~9 | 12–14 encounters, mostly telemedicine, 30–60 min each — unhurried |
| Asynchronous clinical | ~7 | ~1.5 hr/day: messages, results, refills, coordination — the longitudinal glue |
| Per-patient admin | ~2.5 | proposals, notes, renewals, billing |
| Practice admin | ~6.5 | one protected block + daily slivers: operations, learning, content |
| Travel | ~0.5 | clustered — a home-visit day every 2–3 weeks, not daily driving |
| Buffer | ~4.5 | overruns, acute add-ons, new-patient conversations |

A plausible shape: patient mornings, admin early afternoon, done by 4:00.
One weekday could stay visit-free. Evenings and weekends protected by
design (D-017).

### What a month looks like

~50 visits (≈38 telemedicine, ≈8 clustered into one or two rented-space
session days, ≈2–4 home visits on one clustered day) · 2–4 complimentary
first conversations with prospective patients · 3–5 renewal checkpoints
where trends and value get reviewed together · daily message rhythm ·
one deliberate operations block.

### Time away

13 weeks/year off regular scheduling (~3 months — the D-017 envelope),
evenings and weekends protected. Away ≠ absent: periodic review of
messages, active workups, and significant results; triage when truly
necessary. Off-months are why utilization can't be pushed to 100% — slack
absorbs re-entry.

### What it feels like

**For the patient:** you were heard at length before anyone proposed
anything; you hold a written plan with named priorities, what it costs, and
what should improve; your portal shows the trends and the spend; someone
competent is holding the whole picture — and it renews only if it is
working.

**For the physician:** 12–15 real conversations a week instead of 25 visits
a day; each relationship entered deliberately at a price that is defensible
out loud; the roster is ~60 people you actually know; the practice fits
inside 9-to-4 because the proposal stage keeps unsustainable relationships
from ever starting.

## 6. The lifestyle goal, worked backward (after-tax)

**The primary goal (D-018, refined 2026-08-16): ~$100,000/year personal
take-home *after taxes*, ~30 hr/wk, ~39 working weeks (~1,170 total
hours/yr), evenings and weekends protected.**

### The chain, with every assumption labeled

```
$100k after-tax  (Texas: no state income tax — established)
  → pre-tax practice profit needed:      ~$125–145k   [VARIABLE — NEEDS-CPA]
  → + overhead:                          +$20k lean / +$30k moderate  [UNSET lines]
  → + payment friction (~3% processing,
      ~2% cancellations/bad debt):       ÷ ~0.95
  → required arrangement revenue:        ~$152–184k
```

The pre-tax band is driven by variables only a CPA conversation can fix:
filing status; QBI deduction availability; **compensation structure —
sole proprietor vs. S-corp salary+distribution vs. other (explicitly NOT
assumed to be W-2; this is Q-18)**; self-employment tax mechanics;
retirement strategy (and whether savings count inside or on top of the
$100k — a definition to settle); health insurance (sits in overhead).
Mechanically: SE tax ≈ 15.3% on most profit up to the SS wage base, half
deductible; QBI can shelter ~20% of qualified income; an S-corp election
can trim Medicare/SE tax at some payroll cost. These are mechanisms, not
computed advice — the band is the honest resolution.

### What an hour must earn

| Denominator | Hours | Required revenue per hour |
|---|---|---|
| **Total working hours** (39 wk × 30) | 1,170 | **~$130–157** |
| Patient-attributable available (− 250 admin) | 920 | — |
| **Filled patient hours @ 80%** | 736 | **~$207–250** |
| Filled @ 90% (excellent discipline) | 828 | ~$184–222 |
| 44-week variant, filled @ 80% | 856 | ~$178–215 |

### Verdict, honestly

**The after-tax reading lands in the demanding-but-achievable corner** —
roughly the territory of the earlier $150k-pre-tax pressure test, not the
comfortable $140–165/hr of the pre-tax reading. At ~$210/hr the archetypes
price at P ~$105/mo · S ~$185/mo · U ~$390/mo · C ~$6,400 — above the pure
DPC anchors, inside the concierge/functional-medicine bands. Market-
plausible, but rate acceptance returns as the top sensitivity.

**The levers, in order of power:** (1) **weeks** — 44 instead of 39 cuts
the required rate ~15% and partially restores market-anchor pricing;
(2) **CPA optimization** (Q-18) — structure, QBI, deductions can move
required profit by real money; (3) **fill discipline** — 90% vs 80% is
worth ~$25/hr; (4) **overhead leanness** — every $10k adds ~$13/hr at 80%
fill. And one framing lever: during the ramp, >$100k *pre-tax* remains a
legitimate success milestone en route.

Rule of thumb unchanged: **~$25k of income ≈ 8–10 relationships ≈
~$25–30/hr ≈ ~4 working weeks.**

## 7. Open calibration (feeds Q-14)

Complexity inputs and bounds · archetype hours from proposal estimates →
actuals · ramp-year utilization assumptions · payer participation vs. the
derived rate (a reimbursed service's rate is set by the payer — comparing it
to the required rate *is* the participation decision in miniature) ·
reduced-fee mechanics as a reduced rate (X-10) · Q-15 compliance before any
tailored-pricing language is published.

---

## Using the tool

```
python3 tools/practice_model.py                      # defaults = §5 practice
python3 tools/practice_model.py --weeks-worked 39 --utilization 0.8 \
    --hourly-rate 210 --mix 12,20,10,6,8             # ideal-target scenario
python3 tools/practice_model.py --help
```
