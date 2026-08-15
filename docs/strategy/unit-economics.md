# Unit Economics

*Rewritten 2026-08-15 around the current model: each patient relationship is a
small, customized clinical contract — scoped, priced, tracked, periodically
reassessed, and renewed when appropriate — managed by one solo physician.
The economics are built from the arrangement level up, not from a membership
price down.*

> **Provenance discipline (unchanged):** numbers marked *illustrative*
> demonstrate the structure of the model and are not benchmarks, market data,
> or recommendations. Cost lines stay visibly UNSET until real quotes exist.
> Run scenarios with `tools/practice_model.py`.

---

## 1. The constraint is physician time; the goal is the target, not the maximum

Two fixed points anchor everything:

- **Capacity** — one physician's deliverable hours:
  `weeks worked × clinical hours/week − fixed admin`. Illustratively,
  46 × 30 − 250 = **~1,130 hours/year** available for patient-attributable
  work. (The D-017 availability model — substantial vacation, bounded hours —
  is already inside these numbers; generosity to yourself is a model input,
  not a leak.)
- **The target (D-018)** — ~$130–175k, >$100k meaningful minimum, income
  maximization a non-goal.

The governing question: **what set of patient arrangements reaches the target
within the workload envelope — and what must each arrangement be priced at
for the whole to be fair and sustainable?**

## 2. The pricing framework: individualized, not arbitrary

(D-002, current form.) Every arrangement is priced from the same defensible
structure:

```
price = (expected physician time × complexity-adjusted hourly rate)
        + direct resources
        …then sanity-checked against value
```

**Expected physician time** — estimated per patient at the proposal stage
(D-016), summing *all* attributable time:

| Component | Notes |
| --- | --- |
| Synchronous visits | telemedicine, home, rented space |
| Asynchronous work | messaging, results review, refills, coordination |
| Home-visit travel | windshield time is real capacity (R-23) |
| Administrative burden | per-arrangement admin is attributable time (R-20) |

**Complexity-adjusted hourly rate** — the anchor that makes every price
explainable rather than arbitrary:

1. **The base rate is derived, not invented.** It is what one hour of
   physician time must earn for the practice to sustainably exist:

   ```
   required blended rate = (target income + practice costs)
                           ÷ (available hours × expected utilization)
   ```

   Utilization matters: not every available hour fills with patient work,
   especially early. Illustratively, before costs (UNSET):

   | Utilization | Hours filled | >$100k floor | $130k | $175k |
   | --- | --- | --- | --- | --- |
   | 100% | ~1,130 | ~$88/hr | ~$115/hr | ~$155/hr |
   | 75% | ~850 | ~$118/hr | ~$153/hr | ~$207/hr |
   | 50% | ~565 | ~$177/hr | ~$230/hr | ~$310/hr |

   Real practice costs shift these upward once quoted. The honest
   *illustrative* anchor zone is roughly **$150–250 per attributable hour**
   at moderate utilization — a range, and a mechanism for replacing it with
   your own number, not a recommendation.

2. **Complexity is a bounded multiplier with defined inputs** — disease
   complexity, clinical scope, coordination load, cognitive intensity —
   applied to the rate (illustratively ~0.9× to ~1.4×), with the inputs
   written down so two similar patients land in similar places. Calibration
   of these parameters is open work (Q-14).

**Direct resources** — passed through visibly, not buried in the rate:
rented clinical space sessions, home-visit hard costs, supplies. (Labs,
imaging, and medications sit outside the arrangement price per the proposal
template — Q-05.)

**The value check comes last and gates downward, not upward.** Before a
proposal goes out: does this price make sense against what the patient
actually gets — time received, problems addressed, outcomes targeted,
realistic alternatives? If not, adjust the scope or decline the engagement;
the check never silently inflates a price. This is the `value` term of
*time + complexity + resources + value*: it disciplines the formula against
the patient's reality.

**Why this is enough:** you are not concerned with patients comparing prices;
you care that every price is logical, fair, and defensible. This framework
gives every number a derivation you can say out loud: *"my time must earn
roughly $X/hour for the practice to exist; your situation needs about N hours
of it this year; complexity and resources adjust it; here is what that buys
you."*

## 3. Arrangement archetypes — worked examples

Illustrative archetypes showing the framework in motion. All hours invented
for demonstration; the real library gets built from proposal-stage estimates
and then corrected by measured actuals (R-08).

| Archetype | Sync | Async | Travel | Admin | Total hr | Cmplx | @$150/hr | @$200/hr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A · Episodic, focused (~3 mo) | 4 | 2 | — | 1 | 7 | 1.0 | ~$1,050 | ~$1,400 |
| B · Stable longitudinal (1 yr) | 5 | 4 | — | 1.5 | 10.5 | 1.0 | ~$1,575 | ~$2,100 |
| C · Complex chronic + home visits (1 yr) | 8 | 6 | 4 | 2 | 20 | 1.25 | ~$3,750 | ~$5,000 |
| D · Intensive short-term (~4 mo) | 8 | 5 | — | 1.5 | 14.5 | 1.15 | ~$2,500 | ~$3,335 |

(Plus direct resource pass-throughs — space sessions, travel costs — where
applicable.)

Three things worth noticing:

- **The old $5,000 membership reappears as one point in this space** —
  roughly archetype C at the upper rate — rather than as the product. The
  framework contains the concierge price without requiring it of anyone.
- **Renewal checkpoints are where prices self-correct.** An arrangement
  priced on a 10-hour estimate that actually consumes 18 gets re-scoped at
  its checkpoint with data, not resentment — estimate vs. actual per patient
  is the practice's core operational metric.
- **Short engagements are economically legitimate here.** Episodic and
  intensive arrangements earn their hours at the same rate as longitudinal
  ones — the model does not need every patient to become a permanent member.

## 4. Practice-level: mixes, not panels

A practice is a portfolio of concurrent arrangements. Illustrative mix —
10×A + 15×B + 8×C + 5×D — consumes ~460 attributable hours and grosses
~$77k at the $150 rate. Scaling that mix toward ~850 filled hours (75%
utilization) grosses **~$140k** — inside the target band before costs.

The finding that survives from every prior version of this document, now
rate-based: **the income target sits comfortably inside one physician's
capacity.** At illustrative rates, the target is reached at 50–75%
utilization, leaving structural slack for reduced-fee arrangements (D-003),
estimate overruns, unfilled hours during the slow ramp, and the substantial
time off the availability model promises. The individualized model is
economically affordable *because* the target is modest.

## 5. What actually determines success

In priority order, the operational variables the model says to watch:

1. **Estimate accuracy** — proposal-stage hours vs. actuals, per patient,
   from patient one. The framework stands or falls here (R-08).
2. **Utilization ramp** — how fast attributable hours fill. Grassroots
   acquisition (D-022) makes this the binding constraint early; slow is
   accepted (D-018), but it should be *measured* slow.
3. **Async and admin creep** — the unscheduled categories that historically
   sink the estimate. Per-arrangement admin is attributable time; if
   heterogeneity makes admin grow superlinearly, that is the R-20 trigger.
4. **Travel economics** — home-visit clustering keeps archetype-C
   arrangements priceable; scattered geography quietly converts paid hours
   into windshield time (R-23, Q-16).
5. **Practice costs** — still UNSET. Every real quote (VA historicals as
   labeled references, then TX quotes) moves the required rate; the tool
   recomputes the whole chain when they land.

## 6. Open calibration work (feeds Q-14)

- Complexity multiplier: inputs, bounds, and worked examples
- Utilization assumptions for ramp years vs. steady state
- How payer participation (X-04) coexists with the framework — a
  reimbursed service's effective rate is set by the payer; the comparison
  of that rate against the derived required rate *is* the participation
  decision in miniature
- Reduced-fee mechanics (X-10) expressed inside the framework (a reduced
  rate, not a different formula)
- Q-15 compliance review before any tailored-pricing language is published

---

## Using the tool

```
python3 tools/practice_model.py              # capacity, required rate, archetypes, mix
python3 tools/practice_model.py --hourly-rate 200 --mix 10,15,8,5
python3 tools/practice_model.py --help       # all inputs
```

The tool derives the required blended rate from the income target, prices
the archetype library at any rate, and evaluates arrangement mixes against
capacity and the target. All cost inputs default to UNSET and are named
loudly; provenance of every key input prints on every run.
