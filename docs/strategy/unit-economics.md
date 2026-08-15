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
| **Total** | **56** | **~743** | **~$172,700** |

Against ~$20k illustrative overhead (UNSET — placeholder): **~$153k
physician income.** 56 concurrent relationships. Note C-archetype patients
typically step down to S or M after their first year — the panel matures
toward lighter average intensity, which is headroom.

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

**For the physician:** 12–14 real conversations a week instead of 25 visits
a day; each relationship entered deliberately at a price that is defensible
out loud; the roster is 56 people you actually know; the practice fits
inside 9-to-4 because the proposal stage keeps unsustainable relationships
from ever starting.

## 6. The ideal practice target, pressure-tested

Target: **~$150k income · ~30 hr/wk · ~9 working months (~39 wk) ·
9:00–4:00 · evenings/weekends protected.**

**Verdict: achievable on paper, at the demanding end of the framework.**
Not forced — derived:

- 39 wk × 30 hr = 1,170 hr − 250 practice admin = **920 available hr**
- Required blended rate at $150k + $20k illustrative overhead:

| Utilization | Filled hrs | Required rate |
|---|---|---|
| 70% | ~645 | ~$265/hr |
| **80%** | **~735** | **~$230/hr** |
| 90% | ~830 | ~$205/hr |

- The §5 mix delivers ~$210/hr blended at 81% utilization → ~$153k. So the
  target needs **roughly the §5 practice**: ~55–60 concurrent arrangements
  at archetype prices of ~$1.3k–$6.4k/yr, lean overhead, disciplined
  estimates.

**The five assumptions that carry it, most sensitive first:**

1. **Rate acceptance** (~$200–230/hr realized) — entirely untested. The U
   and C archetypes at ~$4.7k–$6.4k are the load-bearing prices; Track F
   validation should probe exactly these.
2. **Fill** — 55–60 arrangements sustained. At ~15% annual non-renewal,
   grassroots must produce ~8–10 new relationships/year at maturity
   (~25–30 first conversations). Feasible-looking; unproven.
3. **Estimate accuracy** — a 20% systematic underestimate of hours turns
   $210/hr into $175/hr silently. Renewal checkpoints are the correction.
4. **Overhead ≤ ~$20–25k** — pure placeholder until quotes land. Every $10k
   of overhead ≈ +$14/hr on the required rate at 80% utilization.
5. **The 9-month structure holds** — clinically (Q-17), and commercially
   (patients accept "aware, not absent" months at these prices).

**If it doesn't all hold — the frontier, priced honestly:**

| Variant | Weeks | Hr/wk | ~Patients | Required rate | Trade |
|---|---|---|---|---|---|
| **Ideal: $150k** | 39 | 30 | ~56 | ~$205–230 | the demanding version |
| $120k, same freedom | 39 | 30 | ~46–50 | ~$170–190 | ~$30k buys a much easier rate & fill |
| $150k, +3–4 hr/wk | 39 | 33–34 | ~62 | ~$185–205 | one longer day, easier pricing |
| $150k, 10 months | 44 | 30 | ~63 | ~$180–200 | one month of freedom funds the rate cushion |
| $175k | 44 | 30–33 | ~65–70 | ~$210–230 | more panel *and* premium pricing — closest to a compromise-free max |

Rule of thumb from the model: **~$25k of income ≈ 8–10 patients ≈ ~$25–30/hr
on the rate ≈ ~4 working weeks.** That's the exchange rate between money,
panel size, pricing courage, and freedom. The frontier is gentle — nothing
about the ideal target is structurally impossible; it is simply the corner
where all five assumptions must hold at once.

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
