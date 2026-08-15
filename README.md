# Solo Primary Care Practice — Preparation Project

Working repository for the design, validation, and preparation of a solo,
lifestyle-first primary care practice built on **flexible, individualized,
relationship-based care** — to be launched in Texas (Austin most likely)
after relocation, on a ~12–24 month horizon.

**The north star (D-014):** we are not building a pre-designed healthcare
product that patients are fitted into. We are building the infrastructure
that lets one physician establish thoughtful, flexible, evidence-based
physician–patient relationships and tailor the clinical and economic
arrangement to what will genuinely help each person:

> Meet someone → identify that I can help → one or two structured
> conversations → understand the problem → an agreed plan and price →
> formally establish the relationship → provide care → track whether their
> well-being improves.

Each patient relationship functions as a small, customized clinical contract
— scoped, priced, tracked, periodically reassessed, renewed when
appropriate. **Pricing is individualized within a defensible framework**
(D-002: expected time × complexity-adjusted derived rate + resources,
value-checked) — personalized without being random. Payer participation and
packaging remain **open research questions** (D-015).

**This is a preparation project, not an imminent launch** (D-011). The
organizing question for everything here:

> *What can we thoughtfully design, validate, build, and prepare now, so that
> arrival in Texas means local validation, regulatory implementation, final
> system setup, and execution — not starting from zero?*

Work is prioritized by durability (survives until launch), leverage (shortens
or de-risks the launch runway), and tangibility (makes the future practice
concrete and the project sustaining to work on) — not by launch urgency.

This repo is the durable memory of the project. Conversations are ephemeral;
decisions, assumptions, models, and drafts live here.

## How this repo is organized

| Path | What lives here |
| --- | --- |
| `docs/charter/` | What we've decided, what we're assuming, what's still open |
| `docs/strategy/` | Economics, risk, sequencing |
| `docs/clinical/` | Care model spec, protocols, visit structures, measurement |
| `docs/legal/` | Entity, licensure, insurance, agreements, policies |
| `docs/systems/` | EHR, payments, portal, telehealth, automation |
| `docs/brand/` | Name, positioning, messaging, website, collateral |
| `docs/growth/` | Acquisition, consultation funnel, referral, retention |
| `docs/evidence/` | Patient-facing evidence explainers, outcome measures, QI/research |
| `tools/` | Runnable models and utilities |

Directories beyond `charter/` and `strategy/` are created as work begins in
them, so an empty directory never implies work that doesn't exist.

## Working agreements

These are the rules this project runs on. They exist because the failure mode
of a project like this is confident-sounding fabrication.

1. **Label every claim.** Facts are sourced. Estimates are marked as estimates
   with their derivation shown. Assumptions are marked as assumptions with an
   owner and a plan to resolve them. Nothing regulatory, clinical, financial,
   or market-related is asserted without a citation or an explicit "unverified."
2. **No invented numbers.** Cost figures, conversion rates, market sizes, and
   panel benchmarks are inputs *you* supply or sources we cite — never
   placeholders quietly hardened into facts. Unset inputs stay visibly unset.
3. **Counsel and licensed advisors own their domains.** This project drafts,
   organizes, researches, and pressure-tests. It does not replace a healthcare
   attorney, a CPA, a malpractice broker, or a compliance officer. Items
   requiring them are tagged `NEEDS-COUNSEL`, `NEEDS-CPA`, `NEEDS-BROKER`.
4. **Decisions get logged.** Anything that constrains later work goes in
   `docs/charter/decision-log.md` with its date, rationale, and reversal cost.
5. **Nothing is designed in isolation.** Every deliverable states what it
   depends on and what depends on it.
6. **The care model is the product.** Technology, brand, and process exist to
   serve physician–patient time. Any proposal that adds surface area without
   defending its effect on care gets challenged.
7. **Documents show the current model; history steps back** (D-025).
   Headings reflect the current architecture. When a decision materially
   changes, its title changes — superseded thinking compresses to a brief
   history note or lives in git. Foundation docs are optimized for fast
   conceptual scanning: what's decided, what's open, what changed, whether
   we're converging.

## Current status

**Era 1 — Preparation** (~12–24 months to launch; $20k budget ceiling,
grassroots by default). Six parallel tracks — economics/pricing/payer
strategy, patient experience, clinical model, operating system, legal
research, validation — advance independently; see `docs/strategy/roadmap.md`.
The current part-time clinical job is itself an instrumented part of the
preparation (D-019).

The economics are arrangement-based: the tool derives the required blended
hourly rate from the income target, prices arrangement archetypes, and
evaluates mixes — illustratively, the $130–175k target is reached at 50–75%
of one physician's capacity, and that structural slack is what makes the
individualized model affordable.

The research core of the preparation: framework calibration and packaging
(Q-14), payer participation (Q-02), pricing compliance (Q-15), and the
minimum-availability question (Q-17). Decisions intentionally left open —
packaging, payer participation, city, launch date, vendors, carriers,
reduced-fee mechanism — are tracked with triggers in
`docs/charter/deferred-decisions.md`.

## Start here

- `docs/charter/working-model.md` — the project frame and the practice as
  currently conceived, every element tagged Decided / Assumption / Open
- `docs/charter/decision-log.md` — decisions made, with reasoning
- `docs/charter/deferred-decisions.md` — decisions deliberately kept open
- `docs/charter/open-questions.md` — what needs answering, and when
- `docs/strategy/roadmap.md` — the two eras: preparation tracks, then the
  launch runway
- `docs/strategy/unit-economics.md` — the capacity math that constrains
  everything else
- `docs/strategy/risk-register.md` — live preparation risks and designed-for
  launch risks
