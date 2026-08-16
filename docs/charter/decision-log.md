# Decision Log

Current decisions, titled so that **scanning the headings alone gives an
accurate picture of the practice as it now stands** (D-025). Superseded
thinking is compressed to history one-liners; the fuller story lives in
`docs/archive/` and git history.

Last revised: 2026-08-16 — **project re-baselined around D-029.**

## The architecture at a glance

**The practice:** D-029 **$100/month per patient, flat, direct-pay** ·
D-030 adults only, one price, no tiers · D-014 standardized price,
individualized medicine · D-001 solo, no staff · D-017 bounded
availability, no 24/7 obligation · D-016 structured onboarding as the
enrollment and capacity gate · D-023 value made visible · D-024
financial-health scope bounded

**Business:** D-018 goal ~$100k after-tax at 30 hr/wk × 39 wk — met at
~140 adults · D-031 insurance never required for core economics · D-022
grassroots + employer-membership growth · D-003 an affordability
mechanism will exist (form deferred)

**Operations & technology:** D-026 one Practice Terms document + EHR care
plan · D-027 cancel-anytime monthly; no outcomes guarantee · D-021
established EHR core + simple front-door website · D-007 integrate before
build

**Project:** D-011 preparation project · D-012 Texas, Austin lean · D-019
~12–24 mo horizon; VA license now, TX after settling · D-020 $20k prep
ceiling · D-010/D-013/D-025 how this repo works

---

## D-029 — Standard direct-pay price: $100/month per patient

**Date:** 2026-08-16 — the foundational business-model decision; the
project is re-baselined around it.

One flat rate: **$100/month per adult patient ($1,200/year)**, direct-pay,
published. No tiers, no complexity surcharges, no individualized
contracts, no couple/household/family rates. The practice must be able to
function entirely on this rate.

**Rationale:** simple to say, simple to buy, genuinely affordable against
the researched market (national DPC average $98, Austin ~$106 — this
price is already market-validated); supports a ~140-adult panel at ~5–6
hours of attention per patient — half the volume-DPC capacity ceiling —
which is where the depth of the relationship comes from.

**What it demands (unit economics §3):** flat pricing makes **panel-mix
management** the load-bearing discipline — heavy-utilization patients are
sustainable at roughly 1 in 8–10 of the panel, protected by the
enrollment gate, per-patient utilization tracking, renewal re-scoping,
and the Q-19 carve-outs. The price is fixed; the mix is managed.

**Revisit when:** real-world evidence (validation, ramp, utilization
data) gives a strong reason — not casually.
**History:** succeeded, in order: $5,000/yr membership (D-002 original) →
fully open pricing → individualized time×complexity framework → two-tier
membership (D-028). See `docs/archive/`.

## D-030 — Adults only; each adult is their own patient at the same price

**Date:** 2026-08-16

No pediatric care. Enrollment is per-adult: an individual, each member of
a couple, or several adults in a family each establish their own
physician-patient relationship at $100/month (couple = $200, three adults
= $300). No dependent, household, or family pricing exists, and
couple/family workflows are deliberately not built until there is a real
reason.

## D-031 — Insurance is never required for the core economics

**Date:** 2026-08-16

The practice launches and can operate indefinitely as pure direct-pay on
the Texas DPC statute (Occ. Code ch. 162 subch. F). Insurance
participation (commercial, Medicare, Medicaid, hybrid) remains a research
track (X-04) that may later *complement* the model — never a launch
dependency. Researched constraints stand: any future lane is separated by
patient (never membership + billing for the same covered services);
Medicare opt-out stays blocked while moonlighting; Medicaid is effectively
incompatible with membership fees.
**History:** distilled from the researched architecture comparison
(archive: `payment-architecture.md`) and payment-landscape findings.

## D-001 — Solo physician practice, without staff

One physician, no employed staff at launch. Systems must be operable by
one person. **Reopen when:** non-clinical work displaces patient contact.

## D-003 — An affordability mechanism will exist; its form is deferred

At $100/month the price is already near the affordability frontier;
what remains of this commitment is likely **a small number of discounted
or free memberships** for genuine need (X-10) — bounded, criteria-based,
decided when the panel is real. Sliding-scale architecture is retired.

## D-007 — Integrate established systems before building custom software

Custom builds must answer: what does no compliant product do, how does it
improve care, who maintains it in year three. Refined by D-021.

## D-010 — The repository is the project's memory

Decisions, models, and drafts live in version control, not conversation
history.

## D-011 — This is a preparation project; launch follows the move to Texas

Work is judged by durability, leverage on the launch runway, and
tangibility. Perishable research carries dates and `REFRESH-AT-RUNWAY`
tags (R-16).

## D-012 — Texas is the launch state; the city is deliberately open

Austin lean; Houston/Dallas alternatives (X-01).

## D-013 — Two registers: decisions made here, deliberate deferrals in deferred-decisions.md

## D-014 — Standardized price, individualized medicine

The north star, restated for the re-baselined model: we are not building
a pre-designed care program patients are fitted into. **The price is the
only standardized thing.** The medicine — settings (telemedicine, home
visits, rented space), frequency, focus, and duration — is tailored to
each person:

> Meet someone → identify that I can help → one or two structured
> conversations → understand the whole situation → agree on how we'll
> work → provide care → track whether their well-being improves.

**The signature clinical skill** remains untangling: listening to a
person who is scared, frustrated, or overwhelmed — health tangled with
stress, money, work, relationships, sleep — naming the priority problems,
separating urgent from important, and working one realistic plan over
time. **The economic caveat is now explicit** (unit economics §3): at a
flat rate this work is carried by the panel's balance, so untangling
depth is protected by managing the mix, not by pricing it.
**History:** absorbs the former per-patient economic tailoring; clinical
individualization is unchanged.

## D-016 — Structured onboarding: the enrollment and capacity gate

One or two complimentary conversations → records reviewed → needs
understood (medical, psychological, lifestyle, functional, practical) →
priorities triaged → honest mutual decision. **Its economic function
changed:** with one published price there is nothing to quote; onboarding
is now the practice's **capacity and mix gate** — can this person be
served well within the model at the panel's current mix? "Not yet," "not
me," and "let me refer you well" are legitimate outcomes. Clinically it
remains the first act of care.
**History:** formerly produced a priced individualized proposal
(archive: `scope-fee-schedule.md`).

## D-017 — Availability is bounded and explicit; no 24/7 obligation, no default coverage layer

Business hours M–F; no routine evenings/weekends; up to ~3 months/year
away from regular scheduling — *aware, not absent* (periodic review of
messages, workups, significant results; triage when truly necessary);
routine matters ~24–72h; written patient-facing taxonomy (emergency → ED;
urgent → urgent care; message-me; can-wait). Patients may keep other
physicians. The Q-17 minimum-structure verification (counsel + carrier)
still gates launch wording. **Scale note:** these expectations must now
hold across a ~140-patient panel — the triage taxonomy and portal design
carry more load than they did at boutique scale.

## D-018 — Goal: ~$100k after-tax at ~30 hr/wk, 39 wk/yr — met at ~140 adults

Autonomy, flexibility, relationships, and time away rank above income
maximization. Under D-029 the goal is met at **~129–146 adults** with
~5–6 hr/patient — the sweet spot of the architecture (unit economics §2).
$150k would require ~200 patients at near-volume intensity; explicitly
not the plan. Tax translation is a CPA band (Q-18).

## D-019 — Launch horizon ~12–24 months; Virginia license now, Texas after settling

The current part-time clinical work is deliberate preparation — skills,
workflow observation, billing exposure — and (per researched Medicare
rules) it blocks opt-out until it ends.

## D-020 — Preparation budget: $20,000 ceiling; grassroots and capital-efficient

A ceiling, not a target. Counsel hours are the scarcest purchased
resource; research briefs exist to make each one count.

## D-021 — Established EHR as clinical core; simple front-door website

EHR carries records, messaging, e-prescribing, telemedicine, results,
scheduling, portal trends (D-023); a lightweight site is the public front
door. Membership billing needs a card-on-file subscription platform (the
researched DPC stack). Minimal vendor count (R-12).

## D-022 — Growth: grassroots relationships + employer memberships

Word of mouth, community, physician referrals, organic content — plus
**employer-sponsored memberships** (researched: 58% of the national DPC
market, lowest churn; two 30-member employers ≈ 40% of the panel).
Pre-outcomes marketing speaks to process, time, attention, and
personalization — never to results that don't exist yet (R-13).

## D-023 — The value of care is made visible; publication is not a goal

**Value = Quality ÷ Cost.** Portal-visible trends (vitals, labs, symptoms,
function, medication burden, well-being, encounters) plus what the
patient spent — at $100/month, the cost side is trivially transparent,
which strengthens the value story. Internal case summaries for learning;
research/publication only if deliberately revisited later.

## D-024 — Financial health means stress reduction within medical scope, not financial advice

In scope: financial-stress-as-health-determinant work. Out: investment
advice and financial planning — referral relationships instead.

## D-025 — Documents show the current model; history steps back

Headings reflect the current architecture; superseded thinking compresses
to history notes, the archive, and git.

## D-026 — One Practice Terms document + the EHR care plan

The agreement architecture, simplified by D-029: **(1) Practice Terms** —
the single standard agreement every patient signs (scope, mutual
responsibilities, availability and triage, care settings, boundaries and
resource-intensive carve-outs (Q-19), payment/cancellation, records,
termination; counsel-drafted at runway); **(2) the EHR care plan** — the
evolving individualized medicine, never gated by contract; **(3) the
internal panel model** (`tools/practice_model.py`). No per-patient priced
schedules exist. An optional un-priced one-page care summary may be used
for complex patients as a communication aid, not a contract.
**History:** formerly a four-layer architecture with an individualized
Scope & Fee Schedule (archive).

## D-027 — Cancel anytime; no outcomes guarantee

Monthly billing with cancel-anytime (standard ~30-day terms) *is* the
risk-sharing: nobody ever pays for months of care they don't want.
The researched rejection of outcomes/value guarantees stands (archive:
`risk-sharing.md`). A bounded entry courtesy ("if the first month isn't
right, it's on me") remains an option to decide with the Terms —
`NEEDS-COUNSEL`.
**History:** the pro-rata engagement-refund architecture collapsed into
monthly billing's inherent fairness.
