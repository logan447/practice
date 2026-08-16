# Patient Archetypes — Internal Scenario Library

*Internal modeling reference (D-026). These are **not** products or
agreement templates — every real patient gets one Standard Practice
Agreement plus an individualized Scope & Fee Schedule
(`docs/agreements/`). Archetypes exist to: (1) seed the hours estimate in
new proposals (tailoring is configuration, not invention — R-20), (2) feed
the capacity/economics tool, (3) sanity-check prices against market
anchors, and (4) eventually become website illustrations of what
arrangements can look like.*

*Hours are illustrative priors, to be replaced by proposal estimates →
measured actuals (R-08). Prices shown at the $210/hr scenario rate; see
unit economics §6 for required-rate reality. Full patient-facing worked
proposals for each archetype existed as of commit `b981cc5` (git history);
the surviving worked example is Sarah (U) in
`docs/agreements/scope-fee-schedule.md`.*

| Key | Who / engagement shape | Sync | Async | Travel | Admin | Total hr | Cmplx | @$210 | Market anchor check (researched 2026-08) |
|---|---|---|---|---|---|---|---|---|---|
| **P** | Healthy; prevention & longitudinal guidance; annual deep-dive + 2 check-ins; ongoing-light | 3.5 | 2.5 | — | 1.0 | 7 | 0.9 | ~$1,300/yr (~$108/mo) | Above TX DPC ($79–99/mo verified); near $150/mo HSA cap; must visibly out-deliver volume DPC |
| **S** | 1–2 stable chronic conditions; quarterly rhythm + annual comprehensive; ongoing-moderate | 5 | 4 | — | 1.5 | 10.5 | 1.0 | ~$2,200/yr (~$185/mo) | Between DPC and concierge band; hybrid-insurance most attractive here (and most constrained — payment-landscape §1) |
| **M** | Active metabolic/lifestyle work, medication titration; front-loaded cadence relaxing over 12 mo | 8 | 6 | — | 2.0 | 16 | 1.1 | ~$3,700/yr (~$310/mo) | Bottom of concierge band ($2,400–5,000); strongest measurable-value story (D-023 proof engine) |
| **C** | Complex diagnostic untangler; records deep-dive + heavy eval phase, step-down to S/M in yr 2; often Medicare-age → X-04 design gap | 10 | 8 | 3 | 2.5 | 23.5 | 1.3 | ~$6,400 yr-1 (~$535/mo) | Above concierge band, inside functional-medicine programs ($5–15k); widest estimate risk after U |
| **U** | **Signature**: overwhelmed, whole-life untangling (health × stress × money × work × relationships × sleep); biweekly → monthly | 9 | 7 | — | 2.5 | 18.5 | 1.2 | ~$4,700/yr (~$390/mo) | Mid concierge band, far below functional-medicine programs; widest estimate-vs-actual risk in practice (R-08) |
| **E** | Defined problem solved in ~3 months; no membership; clean ending; natural on-ramp | 4 | 2.5 | — | 1.0 | 7.5/episode | 1.0 | ~$1,600/episode | vs ~$400–600 for 3 cash visits — premium sells the ownership/coordination; competes with the insurance path's friction, not its price |

**Two-sided test results (from the full v1 analysis):** all six passed —
patient value defensible against real comparators, physician contribution
$180–265/attributable-hour at the scenario rate. Watch items: P async
creep, U/C estimate error, E copay-competition, C Medicare structure.

**Step-down dynamic:** C→S/M after year one; some E→P/S/U. The panel
matures toward lighter intensity — capacity headroom appears over time.

**Example mature mix** (tool default, `12,20,10,6,8,6`): 62 relationships,
~788 attributable hr — see unit economics §5–6 for what it earns at which
rates.
