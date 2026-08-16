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
price = expected physician time × complexity-adjusted hourly rate
        + direct resources        …then sanity-checked against value
```

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

## 6. The lifestyle goal, worked backward

**The primary goal (D-018, clarified 2026-08-16): ~$100,000/year take-home
at ~30 hours/week would be a major success.** Autonomy, flexibility,
relationships, and time away rank above income maximization.

*Definitional flag (`NEEDS-CPA`):* "take-home" is modeled here as practice
income after overhead, before personal taxes. If it means after-tax,
roughly $125–140k pre-tax is needed (self-employment taxes; no Texas state
income tax) — that reading is shown as its own row below.

**Verdict: comfortably achievable — and it buys something better than
margin: prices that match what the market already charges.**

At $100k + $20k illustrative overhead:

| Schedule | Available hrs | Required rate @80% fill |
|---|---|---|
| 44 wk (10 mo) × 30 hr | 1,070 | **~$140/hr** |
| 39 wk (9 mo) × 30 hr | 920 | **~$163/hr** |

**The market-anchor finding** (rates this low reprice every archetype into
familiar territory — `payment-landscape.md` §3):

| Archetype | @$150/hr | Market comparator (researched) |
|---|---|---|
| P · Prevention | **~$945/yr ≈ $79/mo** | **Exactly the verified Texas DPC price point ($79–99/mo)** |
| S · Stable chronic | ~$1,575/yr ≈ $131/mo | Premium DPC; **under the $150/mo HSA cap** (2026) |
| M · Active metabolic | ~$2,640/yr ≈ $220/mo | Bottom of concierge band ($2,400–5,000) |
| U · Whole-life untangler | ~$3,330/yr ≈ $278/mo | Mid concierge band; far below functional-medicine programs ($5–15k) |
| C · Complex diagnostic | ~$4,580 yr-1 | Top of concierge band |
| E · Defined episode | ~$1,125 | vs ~$400–600 for 3 cash visits — premium must sell the coordination |

This is the ease-of-selling priority (D-015/D-018) made concrete: **at the
$100k goal, the price list stops asking patients to accept unusual numbers.**
The verified mix (tool: 44 wk, `--hourly-rate 150`): 62 relationships,
~788 hours, 74% utilization → ~$130k gross → **~$110k after illustrative
overhead. Goal met with slack** — at 39 weeks the same mix runs 86%
utilization (tight but inside capacity).

**The frontier — income vs. freedom vs. pricing courage:**

| Variant | Weeks | Hr/wk | ~Relationships | Required rate | Character |
|---|---|---|---|---|---|
| **Primary: $100k pre-tax** | 44 | 30 | ~55–62 | **~$140–150** | market-anchor prices; easiest to sell |
| $100k pre-tax, 9 months | 39 | 30 | ~55–62 | ~$165 | modest premium over DPC/concierge anchors |
| **$100k after-tax reading** | 44 | 30 | ~60 | ~$175–185 | prices drift above anchors; validation matters more |
| $150k, 9 months (prior ideal) | 39 | 30 | ~56 | ~$205–230 | demanding: premium pricing must hold everywhere |
| $175k | 44 | 30–33 | ~65–70 | ~$210–230 | maximum-ish; every assumption load-bearing |

Rule of thumb: **~$25k of income ≈ 8–10 relationships ≈ ~$25–30/hr on the
rate ≈ ~4 working weeks.** The $100k goal sits far from the frontier's
demanding corner — which is what makes the slow ramp, reduced-fee care
(D-003), estimate overruns, and pricing softness all absorbable.

**What still carries even the comfortable version:** fill (~55–62
relationships sustained via grassroots), estimate accuracy (R-08), and
overhead staying lean — every $10k of overhead adds ~$12–14/hr to the
required rate. Rate acceptance, the dominant risk at $150k+, becomes a
minor one at $100k because the prices match what patients already see in
the market.

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
