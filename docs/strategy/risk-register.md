# Risk Register

Revised 2026-08-16 for the D-029 re-baseline ($100/month flat, adults
only, direct-pay). Severity: `HIGH` — can end or reshape the practice ·
`MED` — costly · `LOW` — manageable, cheaper handled early. Risk numbers
are stable; retired risks compress to one line at the bottom.

---

## The risks that are live right now (preparation phase)

### R-16 · HIGH · Prepared work decays before launch
Regulatory research, vendor scans, quotes, and market prices are dated
snapshots. **Mitigation:** `REFRESH-AT-RUNWAY` tags; mandatory refresh
pass in Era 2; prefer durable work when choosing what to build next.

### R-17 · MED · Working assumptions harden into premature commitments
"Austin, probably" becomes "Austin"; a scenario overhead becomes a
budget. **Mitigation:** the deferred-decisions register with named
triggers; nothing not in the decision log is decided.

### R-18 · MED · Endless preparation
**Mitigation:** the model is now simple enough to finish designing —
launch-ready has a concrete meaning (Terms + EHR + billing + first
patients); the Era 2 checklist defines it; the standing three-part test
filters decoration.

### R-19 · MED · Momentum and sustainability
Parallel tracks sized to sessions; tangibility work is first-class; the
repo holds state. Overwhelm → reduce active tracks.

## The model's structural risks (designed for now, managed from patient one)

### R-26 · HIGH · Adverse selection: the flat rate attracts the heaviest patients
**New with D-029 — the central economic risk of the model.** The
signature marketing (untangling, time, attention) at an affordable flat
price selectively attracts high-need patients; the rate sustains heavy
users at ~1 in 8–10 of the panel (unit economics §3), and the pull is
strongest during ramp, when every enrollee is welcome and saying "not
yet" feels expensive. A panel that fills 25% heavy runs ~135% of
capacity — the failure is gradual, invisible in revenue, and shows up as
burnout and service decay.
**Mitigation:** onboarding as an explicit capacity/mix gate (D-016);
per-patient utilization tracked from patient one (Q-20); renewal
re-scoping for sustained outliers; Q-19 carve-outs; mix-aware growth
(employer members as lighter-utilization ballast); a standing dashboard
number — heavy-share of panel — reviewed monthly.

### R-03 · MED-HIGH · Ramp underperformance
Researched base rates: average fill 20–21 months, ~20% churn (30–40% for
price-sensitive individual members), only ~17% of DPC physicians reach
target panel. Mitigating structure: the target is ~140 adults (not 600),
break-even is ~19, fixed costs near zero, moonlighting income continues,
and $100/mo is the market's validated center price. Still: ~28
replacements/yr at steady state — **acquisition is a permanent function.**
**Mitigation:** measured monthly net-adds against the ramp plan; employer
lane; Q-03b affordability floor with the CPA.

### R-02 · HIGH · The bounded-availability model's floor is unknown at panel scale
D-017's aware-not-absent structure must now hold across ~140 patients and
~13 weeks/year away, and carriers/standard-of-care norms may require more
— unverified in either direction. Unplanned absence (your own illness)
still has no backstop and needs an explicit contingency in the Terms.
**Mitigation:** Q-17 brief → counsel + carrier verification; triage
taxonomy and portal design built for scale; X-06 reopens only if a
higher floor is found.

### R-01 · MED · Geography still binds inside Texas
Home visits and rented-space sessions keep the real catchment at the
chosen metro + driving range; telemedicine-only patients can be
state-wide. Travel/relocation policy for enrolled patients still needed.

### R-04 · MED · Payment/compliance failures in a simple model
**Updated 2026-08-17 (D-033):** the Medicare-age edge is now a designed
architecture rather than an exclusion — which moves the risk from "can't
serve them" to "must execute correctly." The failure modes: an invalid or
lapsed opt-out affidavit (voids every private contract for the period,
45-day cure); a private contract signed late, missing §405.415 elements,
or not refreshed at the 2-year cycle; a member turning 65 without a
contract; a QMB/dual slipping through intake screening (charging them is
sanctionable under both programs); a Medicaid member enrolled without the
signed pre-service acknowledgment (forfeits the right to collect at
all); an FFS-Medicaid member surprised by denied downstream orders; an
MA-HMO member's plan blocking coverage of ordered care. Plus the
standing items: DPC-statute fit, GFE duty, discount criteria.
**Mitigation:** the Q-21 brief's counsel list; intake coverage screening
with periodic re-verification and QMB detection; the age-65 calendar;
form templates (private contract, private-pay acknowledgment,
FFS-downstream notice) drafted with counsel before any such member
enrolls; opt-out affidavit renewal tracking.

### R-05 · MED · Own-occupation disability unaddressed
The practice is the physician; 140 patients depend on one person.
**Mitigation:** disability coverage in the X-07 broker conversation;
Terms address what happens to memberships if practice ends.

## Operational

### R-08 · MED · Utilization is unmeasured until it's a problem
The per-patient hours that determine everything are invisible without
instrumentation. **Mitigation:** Q-20 utilization tracking as a hard
X-03 requirement; monthly review of panel mean and heavy-share.

### R-11 · MED · Malpractice fit for telemedicine + home visits
Bring the broker the actual model (X-07), including the availability
structure. VA historicals are references, not predictions.

### R-12 · MED · Vendor sprawl
Minimal stack (D-021): EHR + billing platform + website. Every vendor is
a BAA and a recurring obligation. **Mitigation:** vendor register;
prefer fewer/broader platforms.

### R-13 · MED · Marketing claims outrun evidence
No outcome claims until outcomes exist; process/time/attention claims
only. Applies to the website from draft one.

### R-14 · MED · Burnout
At ~140 patients the protections are: the mix gate (R-26 mitigations),
bounded availability (D-017), the modest income target (D-018), and
utilization visibility (Q-20). Panel ceiling is set by what is
sustainable indefinitely.

### R-15 · LOW-MED · Record portability
Bulk export is a hard X-03 requirement.

### R-24 · LOW · Prepaid balances
Monthly billing keeps float minimal; any prepaid annual option creates
deferred-revenue liability — decide with the CPA (Q-18).

---

## Compressed history

R-06 (financial-health scope) resolved by D-024 · R-07 (unbounded promise)
resolved by D-017 · R-09 (research consent) resolved by D-023 · R-10
merged into R-04 · R-20/R-21 (per-patient contract complexity, pricing
drift) retired with individualized pricing (archive) · R-22 (payer admin
burden) dormant unless X-04 reopens · R-23 (home-visit economics) absorbed
into Q-16/Q-19 design work · R-25 never assigned.
