# Deferred Decisions

Decisions we are deliberately **not** making yet (D-013). Each entry records
why deferral is correct, what we do in the meantime, and the trigger that will
force the decision. The point of this register is to keep these genuinely open
— to stop working assumptions from quietly hardening into commitments, and to
stop the same "shouldn't we just decide this?" conversation from recurring.

A deferred decision is not an ignored one. Every entry has active
in-the-meantime work.

Revised 2026-08-15: X-09 (pricing/packaging) and X-10 (reduced-fee mechanism)
added; X-04 broadened to full payer strategy; X-06 superseded by D-017.

---

## X-09 — Packaging: how the pricing framework is presented

**RESOLVED by D-028 (2026-08-16):** two published tiers (Foundation
~$99–129/mo, Intensive ~2×, stepping down at checkpoints) + flat-price
episodes + sliding-scale floor. Remaining openness is *calibration*, not
architecture: exact price points validated in Track F before any
patient-facing material carries them. Reopens only if validation shows
Austin-band pricing doesn't sell to the intended patients. Full comparison:
`docs/strategy/payment-architecture.md`.

---

## X-01 — Which Texas city

**Working lean:** Austin. Live alternatives: Houston, Dallas.

**Why deferred:** Depends on where you actually settle — a life decision the
practice follows, not the reverse.

**Meanwhile:** State-level work proceeds. City-dependent work — rentable
clinical space options, home-visit geography, local referral relationships —
is designed as requirements and criteria. Austin-first market research, method
reusable.

**Decide when:** The move destination is settled.

---

## X-02 — Launch date

**Why deferred:** Horizon is now ~12–24 months (D-019), but a *date* still
depends on the move, Texas licensure timing, and establishment. A fictional
date creates exactly the pressure this project is designed to avoid.

**Meanwhile:** Maintain the launch-runway checklist with lead-time estimates
so that when a date becomes real, the path is already mapped.

**Decide when:** Move is settled and Era 2 begins.

---

## X-03 — EHR and platform vendor selection

**Why deferred:** The vendor landscape shifts meaningfully on a 12–24 month
horizon, and subscriptions started early burn the D-020 budget for nothing.

**Meanwhile:** The architecture is now decided (D-021: established EHR core +
custom front-door website), which sharpens this from "what stack" to "which
EHR." Deep landscape research is explicitly commissioned before any
recommendation: subscription cost, long-term usage friction, integrated
telemedicine and portal quality, e-prescribing, results handling, document
intake, scheduling, per-patient billing flexibility (D-014/D-015), portal
outcome trends (D-023), bulk export (R-15). Research is a dated snapshot,
`REFRESH-AT-RUNWAY`.

**Decide when:** ~6 months before intended launch.

---

## X-04 — Payer participation strategy

**Broadened 2026-08-15** from "Medicare posture" to the full payer question
(D-015): private pay, commercial insurance, Medicare, Medicaid, hybrid
models, and billing some services while charging privately for others where
legally permissible.

**Sharpened by D-028 (2026-08-16):** launch is pure direct-pay; insurance
participation is a *contingent later lane*, added only if real patients
show price is the binding acquisition constraint — and then as a separate
patient cohort (Epiphany template, entity separation, contract-by-contract
counsel review). **Medicare:** opt-out is blocked while moonlighting
(established), so during ramp Medicare-age patients wait or use a
carefully-drafted non-covered-services arrangement (`NEEDS-COUNSEL`); the
real opt-out decision unlocks when moonlighting ends. Decide the lane
post-launch on evidence; decide Medicare opt-out when moonlighting ends;
both with counsel.

**Meanwhile:** inside-the-job billing/credentialing learning (Q-02);
disclosure language for possible future participation in the standard
agreement draft. Research base (all dated, `REFRESH-AT-RUNWAY`):
`docs/agreements/payment-landscape.md` and
`docs/strategy/payment-architecture.md`.

---

## X-05 — Clinical space arrangement

**Why deferred:** Depends on city (X-01), patient geography, and procedural
scope. Space is the fixed cost most worth avoiding entirely.

**Working default (D-014):** telemedicine + home visits + **rented clinical
space when needed** — a periodic exam room with clustered in-person visits if
patients are geographically concentrated. **No permanent brick-and-mortar
office unless future economics strongly justify it.**

**Meanwhile:** Requirements for rentable space (what an exam/procedure
session needs); the home-visit kit and operations design (Q-16); drive-time
economics in the capacity model.

**Decide when:** Era 2, per city and actual patient geography — and note this
may never become a large decision at all if the default holds.

---

## X-06 — Coverage clinician

**Status: SUPERSEDED** 2026-08-15 by D-017. The practice does not plan a
clinician coverage layer; transparent availability expectations replace it.
Retained here because one contingency keeps it alive: if counsel or the
malpractice carrier verification (Q-17) finds that some absence-coverage
arrangement is required, this entry reopens. Until then, no meanwhile-work.

---

## X-07 — Malpractice and disability carriers

**Why deferred:** Policies are bound against an actual practice in an actual
place; Texas-specific quotes belong near launch.

**Meanwhile:** Historical **Virginia quotes are available from you as
reference points** — useful as order-of-magnitude inputs for the economics
model, clearly labeled as VA-historical, not TX-predictive. The broker
briefing document (practice description, telemedicine + home-visit + rented-
space pattern, procedural scope, the D-017 availability model) is durable
prep; the availability-model question (Q-17) goes to the carrier
conversation.

**Decide when:** Era 2, binding before the first patient.

---

## X-08 — Paid acquisition

**Why deferred:** D-022 decides the *initial* strategy — grassroots and
relationship-driven; paid advertising is a later experiment, contingent on
what organic growth delivers against the (deliberately patient) D-018 ramp
expectations.

**Meanwhile:** The durable groundwork: positioning, messaging, educational
content, referral-relationship strategy, and measurement design for
acquisition sources and conversion.

**Decide when:** Post-launch, only if grassroots growth undershoots the slow
ramp the income floor can tolerate.

---

## X-10 — Reduced-fee / charity care mechanism

**Why deferred:** The number of reduced-fee patients, sliding-scale formulas,
charity percentages, and discount structures all depend on the final pricing
model (X-09), payer participation (X-04 — discounting rules differ sharply
with payer involvement, a Q-15 counsel item), demand, economics, and
available time.

**The affirmed value (D-003 revised):** the practice should have *some*
sustainable mechanism for helping patients who cannot comfortably afford
standard pricing.

**Meanwhile:** Nothing to build. When X-09 candidates are compared, each
carries a sketch of what its natural reduced-fee mechanism would be.

**Decide when:** With X-09/X-04, checked by counsel.

---

## Explicitly NOT deferred

The decided spine that preparation work builds on (see decision log):

- Solo, no staff, no coverage layer — bounded, explicit availability
  (D-001, D-017)
- The north star: flexible, individualized, relationship-based care; no
  pre-designed product (D-014)
- The pricing *framework*: individualized, derived-rate, defensible —
  time × complexity + resources, value-checked (D-002); only its
  calibration (Q-14) and presentation (X-09) remain open
- The personalized proposal process as the path into the practice (D-016)
- Compensation target ~$130–175k; slow ramp accepted; income maximization is
  a non-goal (D-018)
- Launch horizon ~12–24 months; Texas after settling; VA-licensed now (D-019)
- $20k preparation budget ceiling; grassroots default (D-020)
- Technology architecture: established EHR core + custom front door,
  integrate-before-build (D-007, D-021)
- Grassroots-first acquisition (D-022)
- Visible value: Value = Quality ÷ Cost, tracked and shown to each patient;
  publication is not a goal (D-023)
- Financial-health scope: stress reduction, not financial advice (D-024)

All revisable — the working model lists revisit triggers — but decided enough
to design against.
