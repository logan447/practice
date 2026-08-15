# Risk Register

Risks I can see from the working model. Severity reflects impact × likelihood ×
how hard it is to recover from if it lands.

This is a first pass and is expected to be wrong in both directions — some of
these will prove trivial, and the register is certainly missing risks that only
become visible once real patients are enrolled.

**Severity:** `HIGH` — can end or fundamentally reshape the practice ·
`MED` — costly to absorb · `LOW` — manageable, but cheaper to handle early

**Timing note (D-011 reframe):** the project is now explicitly a preparation
project. The launch-window risks below (R-01 – R-05) remain real but are
*runway* risks — their mitigations are designed during Era 1 and executed
during Era 2. The active risks *today* are the preparation-phase risks
(R-16 – R-19), which is a new section.

---

## Preparation-phase — the risks that are live right now

### R-16 · HIGH · Prepared work decays before launch
Regulatory research, vendor evaluations, quotes, and guideline-based protocols
are snapshots of a moving world. Work done years before launch and trusted at
launch as if current is worse than no work — it carries false confidence.
**Mitigation:** every perishable artifact carries its date and a
`REFRESH-AT-RUNWAY` tag; the runway (Era 2, step 4) includes a mandatory
refresh pass; nothing from Era 1 research is asserted as current at launch
without re-verification. Durable work (economics model, workflow designs,
brand, education materials) is preferred when choosing what to build next.

### R-17 · MED · Working assumptions harden into premature commitments
Over a long preparation, "Austin, probably" becomes "Austin," a vendor scan
becomes a vendor choice, and a draft price becomes a published one — without
anyone deciding. Texas reality at launch (regulations, market, city, available
technology) may then invalidate quietly-made commitments.
**Mitigation:** the deferred-decisions register (`deferred-decisions.md`,
D-013). Each intentionally-open decision has a named trigger; anything not in
the decision log is not decided. Review the register when Era 2 begins.

### R-18 · MED · Endless preparation
A preparation project with no launch pressure can become a comfortable
substitute for launching. The signature: ever-finer polishing of artifacts no
runway item consumes.
**Mitigation:** every Era 1 track has "done enough for launch" criteria; the
Era 2 checklist defines launch-ready concretely; the standing test for new
work (survives to launch / shortens the runway / builds tangibility) filters
out decoration. The launch horizon (Q-13), once known, gives the preparation
a shape without imposing a deadline.

### R-19 · MED · Momentum and sustainability
This project must stay exciting across years, worked in the gaps of a life
that includes a major relocation. If it becomes overwhelming or joyless, it
stalls — and a stalled preparation project delivers nothing.
**Mitigation:** deliberate, not incidental: parallel tracks so there is always
a workable thread with energy behind it; deliverables sized to a session; the
tangibility track (B) treated as first-class work; the repo as memory (D-010)
so no session depends on remembering the last one. Overwhelm is a signal to
reduce active tracks, not to push harder.

---

## Launch-window — designed in Era 1, executed in Era 2

### R-01 · MED · Geography still binds within Texas
Largely resolved by D-012: Texas is a single large market and multi-state
practice is unnecessary. What remains: patients must be within reasonable
travel of wherever in-person blocks happen (D-004), so the practice's real
catchment is the chosen metro plus its surroundings, not "Texas." And enrolled
patients who travel or relocate out of state still need a written policy.
**Mitigation:** market sizing in Track F uses the metro catchment, not the
state. Draft the travel/relocation policy during preparation (Q-01 residual).

### R-02 · HIGH · No coverage arrangement makes the access promise undeliverable
A solo physician selling access cannot provide it 52 weeks a year. Vacation,
illness, and emergencies are certainties. Patients paying $5,000 for access
will judge the practice on the week you were unreachable, and concierge
patients talk to each other.
**Mitigation:** design the arrangement during preparation (X-06 meanwhile
work); secure the named clinician early in the runway — it is among the
longest-lead Era 2 items because it depends on local relationships. Gates
launch, not preparation.

### R-03 · HIGH · Ramp cash flow
Revenue is linear in patients; fixed costs are not. The gap between launch and
a viable panel is measured in years. This is the most likely way the practice
fails, and it fails quietly — by forcing decisions (accepting poor-fit
patients, over-enrolling, cutting the care model) that undermine the thing
being built.
**Mitigation:** build the runway-analysis structure during preparation
(Track A) and run it with the CPA at Era 2 (Q-03b). Keep fixed costs variable
during ramp (favors sessional space over owned). Treat the required growth
rate as a hard planning input rather than a hope. One advantage of the
preparation frame: arriving in Texas with prepared infrastructure and
validated messaging shortens the costliest stretch of the ramp.

### R-04 · HIGH · Membership fee scope is ambiguous or non-compliant
What the $5,000 does and does not cover must be explicit, written, and
consistent with the Medicare posture. Getting this wrong is simultaneously a
patient-trust failure and a regulatory one.
**Mitigation:** Q-02 and Q-05, both `NEEDS-COUNSEL`, before any pricing
language is published.

### R-05 · MED · Own-occupation disability is unaddressed
The practice *is* the physician. An injury or illness that ends clinical
practice ends the revenue, while membership obligations to patients who have
already paid remain. This risk is specific to solo practice and is routinely
under-planned.
**Mitigation:** own-occupation disability coverage in the Q-08 broker
conversation. Membership agreement should address what happens to prepaid
memberships if the physician cannot practice.

## Design and scope

### R-06 · MED · "Financial health" crosses into regulated advice
Financial education, coordination with a patient's own advisors, and long-term
care planning literacy sit comfortably in a medical practice. Specific
financial advice does not — it is a regulated activity, and it also sits
outside malpractice coverage.
**Mitigation:** Q-11. Draw the line explicitly, in writing, before it appears
in marketing copy. Marketing tends to make scope promises that clinical
documents never intended.

### R-07 · MED · The access promise is unbounded
"High-touch," "substantially more frequent when appropriate," and similar
phrasing is right as intent and unsellable as commitment. Unbounded language
attracts the patients most likely to consume it without limit, and a promise
that cannot survive a full panel becomes a broken promise precisely when the
practice is most exposed.
**Mitigation:** Q-07. Specific, bounded, honorable. Then instrument
asynchronous time per patient and check the promise against reality quarterly.

### R-08 · MED · Panel intensity is measured too late
The asynchronous time figure that determines panel ceiling (see unit economics
§3) is unknown, and by the time it is obvious, patients are enrolled and the
practice is committed.
**Mitigation:** measure from patient one. Make async-time reporting a
requirement in EHR selection, not a nice-to-have.

### R-09 · MED · Outcome measurement drifts into human-subjects research
D-009 contemplates publication. Quality improvement and generalizable-knowledge
research are different regulatory categories with different oversight and
consent obligations. The line is crossed by *intent to publish*, which the
brief already states as a possibility.
**Mitigation:** Q-10, before enrollment. If publication is a genuine goal, the
consent and oversight architecture has to exist from patient one — the baseline
cohort cannot be retrofitted.

### R-10 · MED · Reduced-fee memberships applied inconsistently
Case-by-case discretion on fees creates fairness problems within the panel and
potential regulatory exposure depending on the Q-02 posture and who is
receiving the reduction.
**Mitigation:** written policy with objective criteria, applied uniformly,
before the first reduced-fee membership is offered. `NEEDS-COUNSEL`.

## Operational

### R-11 · MED · Malpractice coverage gaps
Multi-state telemedicine, an itinerant or fixed in-person site, and procedural
scope each affect coverage differently. A gap is not discovered until it
matters.
**Mitigation:** Q-08. Bring the broker the actual model, including the
in-person block structure and intended procedures — not a generic description.

### R-12 · MED · Vendor sprawl is a compliance surface
Every vendor touching patient data needs a Business Associate Agreement, and a
solo practice with no staff carries that administration personally. Each added
tool is a recurring obligation, not a one-time setup.
**Mitigation:** D-007's integrate-over-build bias helps. Maintain a vendor
register with BAA status. Bias toward fewer, broader platforms over many narrow
ones, even at some feature cost.

### R-13 · MED · Marketing claims outrun the evidence
The practice intends to be unusually rigorous about evidence. That standard
applies to its own advertising, where the pressure to overstate is highest and
the review process is weakest. Outcome claims made before outcomes are measured
are both a credibility risk and a regulatory one.
**Mitigation:** hold marketing copy to the same sourcing standard as patient
education. Nothing claimed about results until results exist.

### R-14 · MED · Physician burnout
The practice has no redundancy, and the care model is deliberately demanding.
Burnout in a solo concierge practice is not a personal setback — it is a
business continuity event affecting every patient.
**Mitigation:** treat physician sustainability as a tracked outcome measure
(working model §9), not an afterthought. Panel ceiling should be set by what is
sustainable indefinitely, not by what is survivable for a year.

### R-15 · LOW-MED · Patient record portability
Patients leave. Records must go with them, and the practice must retain what it
is obligated to retain. Export capability is easy to verify during EHR
selection and expensive to discover missing later.
**Mitigation:** make bulk export a hard requirement in the Track D
requirements document, verified at vendor selection (X-03).

## Risks I expect to be missing

Recorded honestly: this register is written before any patient exists. The
categories most likely to hide unknown risks are patient-experience failure
modes, the operational reality of in-person blocks, and second-year retention
dynamics. Revisit after the first cohort.
