# Decision Log

Current decisions, titled so that **scanning the headings alone gives an
accurate picture of the practice as it now stands** (D-025). Each entry:
what's decided, why, and a one-line history where the decision materially
changed. Full history lives in git; nothing is re-litigated by its absence
here.

Last revised: 2026-08-15

## The architecture at a glance

**Project:** D-011 preparation project · D-012 Texas, city open · D-019
~12–24 mo horizon · D-020 $20k budget ceiling · D-010/D-013/D-025 how this
repo works

**Care model:** D-014 flexible, individualized, relationship-based · D-016
personalized proposal process · D-001 solo, no staff · D-017 bounded
availability, no 24/7 obligation · D-023 value made visible
(Quality ÷ Cost) · D-024 financial-health scope bounded

**Economics:** D-002 individualized pricing within a defensible framework ·
D-018 $130–175k target, slow ramp accepted · D-015 payer participation and
packaging open · D-003 affordability mechanism will exist

**Technology & growth:** D-007 integrate before build · D-021 established
EHR core + custom front door · D-022 grassroots acquisition first

---

## D-001 — Solo physician practice, without staff

One physician, no employed staff at launch. Systems must be operable by one
person; nothing may assume delegation exists.
**Reopen when:** non-clinical work displaces patient contact.

## D-002 — Pricing is individualized within a defensible framework; no fixed fee

Every arrangement is priced from the same explainable structure:
**expected physician time × complexity-adjusted rate + direct resources,
sanity-checked against value.** The base rate is *derived* — what an hour
must earn for the practice to sustainably exist — not invented. Complexity
is a bounded multiplier with written inputs. The value check gates prices
downward, never silently upward. Personalized without being random: the
standard is that every price is **logical, fair, and defensible**, not that
prices are uniform. Mechanics in `docs/strategy/unit-economics.md`;
parameter calibration is open work (Q-14); compliance review before
publication (Q-15).
**History:** originally "annual $5,000 membership"; reopened to a fully
open question later the same day; now resolved to this framework. $5,000
survives only as one point in the framework's space.

## D-003 — An affordability mechanism will exist; its form is deferred

Some sustainable way to care for patients who cannot comfortably afford
standard pricing. Within the D-002 framework this is naturally a reduced
*rate*, not a different formula — but counts, criteria, and structure are
deferred (X-10) until pricing calibration and payer decisions land.

## D-007 — Integrate established systems before building custom software

Custom builds must answer: what does no compliant product do, how does it
improve care, who maintains it in year three. Refined by D-021.

## D-010 — The repository is the project's memory

Decisions, models, and drafts live in version control, not conversation
history. The project spans years; unwritten things get re-litigated or lost.

## D-011 — This is a preparation project; launch follows the move to Texas

The goal is not to launch fast — it is to use the pre-move period so that
arrival means local validation, regulatory implementation, final setup, and
execution. Every piece of work passes one test: does it survive to launch,
shorten the runway, or make the practice more tangible. Perishable research
carries dates and `REFRESH-AT-RUNWAY` tags (R-16).

## D-012 — Texas is the launch state; the city is deliberately open

Austin lean; Houston/Dallas alternatives (X-01). State-level work proceeds;
city-dependent work stays at the requirements level.

## D-013 — Two registers: decisions made here, deliberate deferrals in deferred-decisions.md

Guards both failure modes of a long preparation: silent re-litigation and
silent hardening.

## D-014 — The practice is flexible, individualized, and relationship-based — not a product

The north star. We are building infrastructure that lets one physician
establish thoughtful, evidence-based physician–patient relationships and
tailor the clinical and economic arrangement to each person:

> Meet someone → identify that I can help → one or two structured
> conversations → understand the problem → agreed plan and price → formal
> relationship → care → track whether well-being improves.

No universal visit cadence, no universal in-person requirement, no fixed
virtual/in-person structure, no assumption that everyone needs a membership.
Settings and engagement shapes are chosen per patient: telemedicine, home
visits, rented clinical space; short-term intensive, episodic, longitudinal,
ongoing-with-renewal. Default setting mix: **telemedicine + home visits +
rented space when needed; no permanent office unless economics strongly
justify it.** Guiding principle: the setting, frequency, and duration that
best serve the patient's health without unnecessary structure or overhead.
**History:** absorbs three earlier structural decisions (virtual-primary
with in-person blocks; quarterly contact floor; annual comprehensive
visit — formerly D-004/D-005/D-006, numbers retired).
**Reopen when:** per-arrangement admin exceeds what solo practice sustains
(R-20) — likely response is standard defaults with tailoring at the edges.

## D-015 — Payer participation and packaging remain open research questions

Private pay, commercial insurance, Medicare, Medicaid, and hybrids are all
genuinely open (X-04) — you are actively learning what credentialing and
billing involve. Packaging (memberships, episodic, retainer, packages) is
likewise open (X-09); under D-002 these become *presentations of the same
framework*, not competing price schemes. Evaluation criteria: ease of
selling, admin complexity, regulatory implications, revenue predictability,
affordability, workload, flexibility, value-based alignment, solo
compatibility. Decided jointly with counsel at the runway.

## D-016 — Every patient enters through a personalized proposal

One or two complimentary virtual conversations → records reviewed → needs
clarified (medical, psychological, lifestyle, functional, practical) →
honest assessment of what's achievable → written proposal (problems, goals,
settings, expected frequency and duration, anticipated
diagnostics/medications/monitoring, reassessment checkpoints, cost
structure, tracked outcomes) → meeting of the minds → care begins.
**Dual function:** the sales process *and* the capacity/burnout tool —
time, complexity, and economics are estimated before commitment, so
unsustainable relationships are identified before they exist (R-14).

## D-017 — Availability is bounded and explicit; no 24/7 obligation, no default coverage layer

The working hypothesis, to be pressure-tested rather than assumed away
(Q-17): meaningful longitudinal physician care is compatible with clear
advance boundaries —

- Business-hours availability, Monday–Friday; no routine evenings/weekends
- Substantial personal time; potentially up to ~3 months/year away from
  regular scheduling — *aware, not absent*: periodic review of messages,
  active workups, and significant results, with triage when truly necessary
- Routine matters ~24–72 h; written patient-facing taxonomy of emergency
  (→ ED), urgent (→ urgent care / local evaluation), message-me, can-wait
- Patients may use other physicians, and may keep another PCP where useful
  or required

No second clinician is added merely for coverage. The open question is
framed deliberately: **what is the *minimum* availability and continuity
structure required for safe, ethical, legally compliant, genuinely valuable
longitudinal care** — challenged on medical-legal, ethical, insurance, and
operational grounds (Q-17), not defaulted to convention. If verification
finds a floor higher than this model, the model moves to the floor (X-06
reopens), not to 24/7.

## D-018 — Compensation target ~$130–175k; slow ramp accepted; income maximization is a non-goal

More than $100k is a meaningful minimum. Ease of selling beats revenue per
patient; significantly more income requiring substantially more work is not
interesting. Quantitative consequence: the target sits well inside one
physician's capacity, which is what makes D-014's flexibility and D-017's
boundaries economically affordable.

## D-019 — Launch horizon ~12–24 months; Virginia license now, Texas after settling

The current part-time primary care job is deliberate preparation: skills,
confidence, workflow observation, patient-need patterns, and firsthand
billing exposure (Q-02). Texas licensure starts when settling is decided —
not immediately.

## D-020 — Preparation budget: $20,000 ceiling; grassroots and capital-efficient

A ceiling, not a target. Free or cheap tools where genuinely adequate; every
meaningful expense justified by necessity, absence of cheaper alternative,
and real improvement to care, efficiency, experience, or revenue. Counsel
hours are the scarcest purchased resource — research briefs exist to make
each one count.

## D-021 — Established EHR as clinical core; lightweight custom front door

The EHR carries records, messaging, e-prescribing, telemedicine, results,
scheduling, portal. A simple custom website is the public front door and
onboarding layer. Minimal stack: website · one strong EHR · malpractice ·
labs · pharmacy · imaging · billing only as needed. Vendor selection is
deferred (X-03) behind deep landscape research; requirements must support
per-patient arrangements, flexible billing, and D-023's visible trends.

## D-022 — Acquisition is grassroots and relationship-driven first

Word of mouth, personal and community relationships, physician and patient
referrals, organic presence, educational content. Paid advertising is a
later experiment (X-08). Pre-outcomes marketing speaks to process,
philosophy, time, attention, and personalization — never to results that
don't exist yet (R-13).

## D-023 — The value of care is made visible to patient and physician; publication is not a goal

The organizing framework: **Value = Quality ÷ Cost.** The system makes it
easy to track vitals, lab trends, symptoms, medication burden, function,
lifestyle measures, patient-reported well-being, clinical goals, encounter
counts and types, and approximate cost of care over time. Each patient
should be able to see, as clearly as reasonably possible: what they spent,
what care they received, what changed, and whether their objective and
subjective health improved — e.g., a portal view of BP/A1c/lipid/weight
trends, medication changes, visits, major interventions, total cost, and a
concise progress-and-remaining-goals summary. Purpose: **clinical
transparency, accountability, and proof of value.** No research or IRB
apparatus burdens routine operations; structured case summaries support
internal learning. If the data later makes consent-based research, case
series, QI studies, or publication worthwhile, that is pursued separately —
it is not a launch requirement.
**History:** measurement was originally framed partly around eventual
research/publication; that framing is retired.

## D-024 — Financial health means stress reduction within medical scope, not financial advice

In scope: spending awareness, cash flow, financial stress, money
conversations between partners, spending psychology, and whether financial
instability interferes with medications, nutrition, sleep, or
relationships. Out: investment advice, financial planning — referral
relationships with qualified professionals instead.

## D-025 — Documents show the current model; history steps back

Foundation documents are optimized for fast conceptual scanning: headings
reflect the current architecture, superseded thinking is compressed into
brief history notes or left to git, and no old assumption visually competes
with the current state. Scanning the Decision Log headings or the Working
Model should answer: what have we decided, what remains open, what
assumptions are in use, what changed recently, are we converging.
**History:** the log previously kept superseded entries under their
original titles with supersession notes — exactly the pattern this
decision retires.

---

## Retired numbers

D-004, D-005, D-006 (fixed virtual/in-person structure, quarterly floor,
annual in-person) — absorbed into D-014. D-008 (two-part consultation) —
evolved into D-016. D-009 (measurement as research-capable) — reworked into
D-023. Details in git history.
