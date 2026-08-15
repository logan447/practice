# Concierge Primary Care Practice — Design & Build

Working repository for the design, launch, and growth of a solo, lifestyle-first
concierge primary care practice.

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

## Current status

Phase 0 — Constraints. Three inputs gate nearly all downstream work:
licensure geography, Medicare posture, and the personal financial floor.
See `docs/charter/open-questions.md`.

## Start here

- `docs/charter/working-model.md` — the practice as currently conceived,
  with every element tagged Decided / Assumption / Open
- `docs/charter/open-questions.md` — what has to be answered, and by whom
- `docs/strategy/unit-economics.md` — whether the model can work, and the
  capacity math that constrains everything else
- `docs/strategy/risk-register.md` — what could break it
- `docs/strategy/roadmap.md` — the order to build in, and why
