# Decision Log

Decisions that constrain later work. Each entry records what was decided, why,
what it costs to reverse, and what it unblocks.

Format: `D-###`. Superseded decisions are kept, marked, and linked forward —
the history of why something changed is as useful as the current state.

---

## D-001 — Solo physician, no staff initially

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

The practice is one physician with no employed staff at launch.

**Rationale:** Keeps overhead low during ramp, keeps the care relationship
undiluted, and keeps operations simple enough for one person to hold.

**Reversal cost:** Low-to-moderate. Adding help later is straightforward;
the constraint is that systems chosen now must not *assume* staff exists to
work around them.

**Implications:** Every system selected must be operable by one person with no
delegation. Coverage for absence must come from outside the practice (see
`docs/charter/open-questions.md` Q-06).

---

## D-002 — $5,000/year membership

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **SUPERSEDED** 2026-08-15 by D-015 — pricing and packaging are an
open research question (X-09). $5,000/year survives only as one scenario input
in the economics model, not as a decision.

Annual membership fee of $5,000, with monthly and quarterly payment options.

**Rationale:** Working figure from the founding concept.

**Reversal cost:** Low before launch. High after — repricing an existing panel
is a trust event, not a pricing event.

**Open:** Price has not yet been tested against the capacity math. The correct
test is not "what do comparable practices charge" but "what panel size does
this price require, and is care still excellent at that size." See
`docs/strategy/unit-economics.md`.

---

## D-003 — Limited reduced-fee memberships based on financial need

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **REVISED** 2026-08-15 — the underlying value (some mechanism for
helping patients who cannot comfortably afford standard pricing, when
financially sustainable) is affirmed. The mechanism — counts, formulas,
discounts — is deferred (X-10) pending the pricing model, payer participation,
demand, and practice economics.

**Rationale:** Access consistent with the practice's purpose.

**Reversal cost:** High once granted to real patients.

**Requires:** A written policy with objective criteria, applied consistently,
before the first reduced-fee membership is offered. Discretionary,
case-by-case fee reduction creates both fairness and regulatory exposure.
`NEEDS-COUNSEL` — see risk R-10.

---

## D-004 — Virtual-primary care with dedicated in-person blocks

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **SUPERSEDED** 2026-08-15 by D-014 — no fixed virtual/in-person
structure. The working default is telemedicine + home visits + rented clinical
space when needed; the mix is set per patient in the personalized proposal.
No permanent brick-and-mortar office unless future economics strongly justify
it.

Most longitudinal care is virtual. Physical examination, preventive
procedures, and hands-on services are clustered into defined in-person periods.

**Rationale:** Concentrates the physician's fixed costs and travel, and matches
delivery mode to what each encounter actually requires.

**Reversal cost:** Moderate. Space commitments and patient expectations both
harden over time.

**Implications:** Creates a direct dependency on licensure geography (Q-01) —
virtual care reaches only where the physician is licensed, and the in-person
block requires patients to be within travel distance of wherever it happens.
These two constraints interact and are addressed together in Q-01 and Q-04.

---

## D-005 — Minimum quarterly physician contact

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **SUPERSEDED** 2026-08-15 by D-014 — no universal
contact-frequency floor. Expected frequency is set per patient in the
proposal, with renewal checkpoints for reassessing whether the arrangement
still serves them.

At least four physician contacts per patient per year, with substantially more
when clinically appropriate.

**Rationale:** Continuity is the mechanism by which the model is supposed to
work. Quarterly is the floor that makes longitudinal care real.

**Reversal cost:** High. This is a core promise and a primary differentiator.

**Implications:** Directly sets the per-patient time floor and therefore the
maximum panel size. This is the single largest driver in the capacity model.

---

## D-006 — Annual comprehensive in-person visit

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **SUPERSEDED** 2026-08-15 by D-014 — no universal annual in-person
requirement. In-person examination happens when clinically indicated, per the
patient's individual plan.

Roughly annual comprehensive in-person visit; biennial permitted for highly
stable patients.

**Reversal cost:** Low-to-moderate.

**Open:** The criteria defining "highly stable" must be written down, or the
exception becomes ad hoc and the practice loses the ability to say what it
actually delivers.

---

## D-007 — Integrate before building

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

Where an established EHR, payment platform, or other compliant system already
performs a function well, integrate it rather than building custom software.

**Rationale:** Compliance, security, and maintenance burden of custom
healthcare software is large and permanent. A solo practice cannot carry it.

**Reversal cost:** Low per-decision; the standing bias is what matters.

**Test for any proposed custom build:** What does this do that no compliant
product does, how does it improve care specifically, and who maintains it in
year three?

---

## D-008 — Complimentary two-part consultation as the enrollment path

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **EVOLVED** 2026-08-15 into D-016 — the complimentary-conversation
structure survives; its output is now a personalized clinical and economic
proposal rather than enrollment into a standard membership.

Two ~30-minute meetings, 7–30 days apart, at no charge, before enrollment.

**Rationale:** Mutual fit assessment, and the prospective patient can only
evaluate a $5,000 commitment if they understand what it would specifically mean
for them.

**Reversal cost:** Low before launch.

**Open:** The unpaid physician time per enrolled patient is a real cost that
scales inversely with conversion rate. Quantified in
`docs/strategy/unit-economics.md`; it is significant during ramp and modest at
steady state.

---

## D-009 — Outcome measurement as a first-class design goal

**Date:** 2026-08-15 (carried in from project brief)
**Status:** **REVISED** 2026-08-15 by D-023 — measurement remains first-class,
but as excellent longitudinal documentation and value tracking in routine
care, not as research infrastructure. Formal research/IRB oversight is
explicitly *not* a requirement of early operations.

The practice measures whether the model actually works, potentially developing
into quality improvement, research, and publication.

**Reversal cost:** High if deferred. Measurement design constrains EHR
selection, intake design, and consent language. Retrofitting measurement onto a
running practice loses the baseline permanently.

**Implications:** This decision must be operationalized *before* systems
selection, not after. See the Track C → Track D ordering in the roadmap, and risk R-09 on
the quality-improvement vs. human-subjects-research distinction.

---

## D-010 — Repository is the project's memory

**Date:** 2026-08-15
**Status:** Active

Decisions, assumptions, models, and drafts live in version control rather than
in conversation history.

**Rationale:** The project spans years and many work sessions. Anything not
written down will be re-litigated or silently lost.

---

## D-011 — This is a preparation project, launching after relocation to Texas

**Date:** 2026-08-15
**Status:** Active — the organizing frame for the whole project

The practice launches once you have moved to Texas, are established there, and
the necessary Texas medical and business infrastructure is in place. Until
then, this project's job is preparation: design, validate, build, and
pre-position everything that can be done well from a distance, so that the
remaining work at arrival is primarily local validation, regulatory
implementation, final system setup, and execution.

**Rationale:** Set directly by you. The goal is not to launch as quickly as
possible; it is to use the time before the move intelligently.

**Reversal cost:** Low — accelerating is always available.

**Implications:**
- Every piece of work is now evaluated by one test: *does it survive until
  launch and make the launch runway shorter or safer?*
- Urgency reorders. "Launch-blocking" items (coverage arrangements, entity
  formation, binding insurance) stop being urgent; they become runway items
  with known lead times. Design, modeling, and validation work moves forward.
- Perishability becomes a first-class property: some prep work decays
  (vendor landscapes, quotes, regulatory snapshots) and must be tagged for
  refresh at the runway. See risk R-16.
- The project must stay sustainable and motivating across a long horizon —
  making the future practice increasingly tangible is a legitimate
  prioritization criterion, not a vanity one. See risk R-19.

---

## D-012 — Texas is the launch state; the city is intentionally open

**Date:** 2026-08-15
**Status:** Active

The practice launches in Texas. Austin is the most likely location, with
Houston and Dallas as live alternatives. The city choice is deliberately
deferred — see `deferred-decisions.md`.

**Rationale:** Your relocation plan. A single large state materially
simplifies what was previously the biggest open question (licensure
footprint, Q-01): Texas alone is a large enough market that multi-state
virtual practice is unnecessary for viability, and the in-person block
geography collapses into "wherever in Texas we settle."

**Reversal cost:** Moderate. Texas-specific regulatory research would need
redoing for another state; the portable majority of the work (economics,
clinical model, patient experience, systems requirements) would survive.

**Implications:** Regulatory research anchors on Texas (medical board,
telemedicine rules, entity law) plus federal (Medicare). Work that depends on
the *city* — space, local partnerships, local marketing — stays open. Work
that depends only on the *state* can proceed as research, clearly dated,
with a refresh pass at the runway.

---

## D-013 — Two decision registers: made, and intentionally open

**Date:** 2026-08-15
**Status:** Active

Decisions we make are logged here with reasoning. Decisions we are
deliberately *not* making yet are logged in `deferred-decisions.md`, each with
the reason deferral is correct, what we do in the meantime, and the trigger
that will eventually force the decision.

**Rationale:** Over a multi-year preparation, the failure modes are symmetric:
decisions silently re-litigated because nobody wrote them down, and decisions
silently hardened because a working assumption calcified. Two registers guard
both flanks.

**Reversal cost:** None — this is process.

---

## D-014 — Relationship-first, individualized care: the north star

**Date:** 2026-08-15
**Status:** Active — supersedes the rigid elements of D-004, D-005, D-006;
reframes D-002

We are not building a pre-designed healthcare product that patients are fitted
into. We are building the infrastructure that allows one physician to
establish thoughtful, flexible, evidence-based physician–patient relationships
and tailor the clinical and economic arrangement to what will genuinely help
each person.

The concrete test the whole practice must pass:

> Meet someone in ordinary life → recognize I could meaningfully help →
> schedule one or two structured conversations → understand the problem →
> create an agreed plan and price → formally establish the relationship →
> provide care → track whether their well-being improves.

**What this removes:** universal visit-cadence floors, universal annual
in-person requirements, a fixed virtual/in-person structure, and the
assumption that every patient needs a membership. Setting, frequency,
duration, and engagement length are chosen per patient: telemedicine, home
visits, rented clinical space, short-term intensive management, longitudinal
care, acute episodic care, or an ongoing relationship with periodic renewal
checkpoints.

**What this keeps:** the guiding principle — use the setting, frequency, and
duration of care that best serves the patient's health without creating
unnecessary structure or overhead.

**Rationale:** Flexibility until economics, regulation, demand, and operations
are understood more deeply; and the relationship model matches how the
practice will actually acquire patients (D-022).

**Reversal cost:** Low now. Standardized packages can always be reintroduced
later as *defaults within* this model — the reverse migration (rigid product →
flexible relationships) would be much harder with enrolled patients.

**Implications:** The economics model shifts from "panel × price" to a mix of
heterogeneous arrangements (see unit economics reframe). The proposal process
(D-016) becomes the practice's central artifact. Administrative complexity
per patient rises — a named risk (R-20).

---

## D-015 — Pricing, packaging, and payer participation are open research questions

**Date:** 2026-08-15
**Status:** Active — supersedes D-002; broadens X-04 into full payer strategy

No pricing model is decided: not $5,000/year, not membership-at-all, not
private-pay-only. Candidate structures to research and compare include annual
or monthly memberships, episodic private-pay care, retainers, customized care
packages, insurance-based reimbursement, hybrid private-pay/insurance models,
Medicare/Medicaid/commercial participation, reduced-fee mechanisms, and
individually tailored proposals.

Evaluation criteria, in rough priority order from your stated preferences:
ease of selling, administrative complexity, regulatory implications, revenue
predictability, patient affordability, physician workload, preservation of
flexibility, alignment with value-based care, and compatibility with a solo
practice.

**Context that shapes the answer (D-018):** the practice does not need to
maximize income, a slow ramp is acceptable, and the compensation target is
modest relative to what concierge economics can produce. This materially
widens the set of viable models.

**Insurance participation is genuinely open** — you are learning through
current clinical work that credentialing with commercial insurers, Medicare,
and Medicaid may be practical. Neither the direct-pay assumption nor the
insurance assumption is made. The complete billing/coding workflow is
something you have not personally operated; research plus practical learning
during the preparation period is part of the work (see open questions Q-02).

**Reversal cost:** None — this reopens rather than closes.

---

## D-016 — The personalized proposal process

**Date:** 2026-08-15
**Status:** Active — evolution of D-008

The path into the practice, for every patient:

1. One or two complimentary virtual conversations to understand why they are
   seeking help
2. Obtain and review relevant medical records
3. Clarify medical, psychological, lifestyle, functional, and practical needs
4. Determine what can realistically be accomplished
5. Present a **personalized proposal**: the problems to be managed, the
   goals, the care settings (virtual / home / rented space / combination),
   expected initial frequency, expected duration (short-term, extended,
   ongoing), anticipated medications/diagnostics/labs/referrals/monitoring,
   checkpoints for reassessing whether the relationship remains useful, the
   cost structure, and the outcomes to be tracked
6. Reach a clear meeting of the minds before the formal relationship begins

**Dual function:** this is simultaneously the sales process and the
capacity-management tool. Estimating each prospective patient's time,
complexity, and economics *before* committing is the practice's primary
burnout protection (see D-017 context and R-14) — unsustainable relationships
are identified before they exist, not after.

**Reversal cost:** Low; the process can be tuned per experience.

---

## D-017 — Solo, without a clinician coverage layer; transparent availability instead

**Date:** 2026-08-15
**Status:** Active — supersedes the direction of X-06 (coverage clinician)

The practice remains solo. No second physician or advanced practice clinician
is added merely to provide coverage. In place of a coverage layer:
transparent, explicit availability expectations, approximately —

- Normal availability during business hours, Monday–Friday
- No expectation of routine evening or weekend availability
- Substantial vacation and personal time — potentially up to ~3 months away
  from regular clinical scheduling per year, with continued periodic review
  of messages, labs, and active workups while away, and triage of genuinely
  important issues
- Routine matters addressed within ~24–72 hours depending on urgency

Patients must clearly understand what constitutes an emergency, what needs
urgent local evaluation, what is appropriate to message about, and what can
reasonably wait — a written triage taxonomy in the patient agreement and
portal.

**Open verification (Q-17):** whether this model satisfies malpractice
carrier expectations and standard-of-care norms for absence coverage needs
checking with Texas counsel and the carrier during the runway — designed now,
verified then. `NEEDS-COUNSEL` `NEEDS-BROKER`

**Rationale:** The hypothesis worth testing is how much continuity and value
can be provided *without* a 24/7 concierge expectation or a coverage layer.
Bounded availability, honestly sold, may be a feature rather than a
compromise — but it must be verified, priced into proposals, and written down.

**Reversal cost:** Moderate — adding coverage later is possible; retracting a
24/7 expectation once sold would be a trust event. This is a reason to *start*
bounded.

---

## D-018 — Compensation target and growth philosophy

**Date:** 2026-08-15
**Status:** Active

- Long-term target compensation: **~$130,000–$175,000/year** in today's
  dollars; more than $100,000 is a meaningful minimum goal
- Slow ramp toward that income is explicitly acceptable
- Income maximization is a non-goal: if significantly higher income requires
  substantially more work, it is generally not interesting
- Ease of selling matters more than revenue per patient

**Implications:** This is quantitatively liberating — see the unit-economics
reframe. The income target is reachable at a fraction of a solo physician's
clinical capacity under a wide range of pricing models, which is what makes
D-014's flexibility affordable and D-015's research question genuinely open
rather than forced toward premium pricing. It also derisks R-03 (ramp cash
flow): the practice does not need to reach a large panel quickly.

**Reversal cost:** None — a target, revisable.

---

## D-019 — Launch horizon ~12–24 months; licensure sequencing

**Date:** 2026-08-15
**Status:** Active — answers Q-13; updates Q-01

Likely launch horizon: **12–24 months**. The current period is deliberate
preparation: part-time primary care work to build clinical skills and
confidence, observe how practices operate, learn workflows and common patient
needs, and identify what infrastructure independent practice requires — the
richest validation channel the project has (Track F).

Licensure: currently licensed in **Virginia**. Texas licensure comes later
and depends on where you settle (Austin lean; Houston/Dallas alternatives).
**Texas licensure does not begin immediately** — the earlier roadmap
suggestion to start it early is withdrawn.

**Implications:** Perishability handling is calibrated: research done now
needs at most one refresh pass. The preparation period has a shape without
having a deadline.

---

## D-020 — Preparation budget: $20,000 ceiling, grassroots by default

**Date:** 2026-08-15
**Status:** Active — answers Q-03 (preparation half)

Maximum preparation/startup capital: **~$20,000 — a ceiling, not a target.**
Free or inexpensive tools wherever genuinely adequate. Every meaningful
expense is evaluated against: is it actually necessary; does a cheaper
alternative exist; does it meaningfully improve clinical quality, efficiency,
patient experience, or revenue potential.

**Implication worth watching:** professional fees (healthcare counsel
especially) are the likeliest category to consume a large share of this
budget. Era 1 research briefs exist partly to make every purchased counsel
hour efficient.

---

## D-021 — Technology: established EHR core, custom front door

**Date:** 2026-08-15
**Status:** Active — refines D-007

Working hypothesis: use an **established EHR as the clinical system of
record** — records, secure messaging, e-prescribing, refills, telemedicine,
results, document intake, patient access, scheduling, treatment plans — and
build a **lightweight custom website** as the public front door and
onboarding layer, directing established patients into the EHR's secure portal
for clinical functions.

Target minimal stack: website/hosting · one strong EHR with integrated
telemedicine and portal · malpractice insurer · laboratory relationships ·
pharmacy/e-prescribing · imaging/diagnostics relationships · payment or
billing infrastructure only as needed. A small, reliable network — not vendor
sprawl (R-12).

**Commitment made here:** the architecture (EHR core + custom front door).
**Not made here:** the vendor (X-03). The EHR landscape gets deep research —
subscription cost *and* long-term usage friction — before any recommendation.
EHR requirements must now also support D-014/D-015: per-patient arrangements,
flexible billing, and longitudinal outcome trends in the portal (D-023).

---

## D-022 — Grassroots, relationship-driven acquisition first

**Date:** 2026-08-15
**Status:** Active

No large paid-acquisition strategy at launch. Early growth comes from word of
mouth, personal relationships, community connections, physician and patient
referrals, organic online presence, educational content, and local
reputation. Paid advertising remains a later experiment.

The infrastructure requirement this creates: when you meet someone who could
benefit, the path from that encounter into the practice must be professional
and ready (D-014's north star, D-016's process).

**Marketing content rule:** before the practice has outcomes data, marketing
speaks to the care process, philosophy, convenience, time and attention, the
evidence-based approach, and personalized planning. As cases and outcomes
accumulate, the practice increasingly communicates evidence it generated
itself. R-13 (claims must not outrun evidence) stands.

---

## D-023 — Outcomes: longitudinal documentation and value tracking, not research infrastructure

**Date:** 2026-08-15
**Status:** Active — revises D-009; resolves the direction of Q-10

Routine operations are **not** burdened with formal research or IRB
oversight. Instead: excellent longitudinal documentation that lets patient
and physician clearly see whether care is working.

Portal-visible trends where appropriate: weight, blood pressure, A1c,
glucose, lipids, relevant labs, symptoms, functional measures, medication
burden, patient-reported well-being, visit counts and types, major
interventions.

The organizing concept: **value = health improvement relative to cost of
care** — what did the patient spend, how much physician time and care did
they receive, what objective and subjective outcomes improved.

Successfully managed cases may become internal structured case summaries for
learning and improvement. Research, publication, or formal QI may evolve
later *if appropriate* — with the consent/oversight question revisited at
that point, before any such use of patient data, not retroactively assumed.

---

## D-024 — Financial health scope: stress reduction, not financial advice

**Date:** 2026-08-15
**Status:** Active — resolves Q-11

The practice does not provide investment advice or act as a financial
advisor. It treats financial stress as a determinant of health. In scope:
income and spending awareness, household cash flow, recurring expenses,
financial stress, money conversations between partners, psychological
relationships with spending, and whether financial instability is interfering
with medications, nutrition, sleep, relationships, or other health behaviors.
The goal is enough financial clarity and stability that money is not
constantly generating avoidable physiological and psychological stress.

Beyond that scope: referral relationships with qualified financial
professionals — part of the referral network the practice builds anyway.

**Remaining counsel check:** patient-facing language describing this should
still get a review pass at the runway (R-06 shrinks but does not vanish).
