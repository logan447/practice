# Solo Direct-Pay Practice — Preparation Project

Working repository for the design, validation, and preparation of:

> **A solo, adult-focused, direct-pay medical practice charging one flat
> rate of $100/month per patient** — designed around individualized care,
> minimal overhead, physician autonomy, measurable patient value, and a
> sustainable physician lifestyle.

Launch follows relocation to Texas (Austin most likely), on a ~12–24
month horizon. **Standardized price; individualized medicine** (D-014):
the price is the only uniform thing — settings (telemedicine, home
visits, rented space), frequency, focus, and duration are tailored to
each person. The signature skill is untangling: taking someone
overwhelmed — health tangled with stress, money, work, relationships,
sleep — and making it manageable, then showing the value
(Value = Quality ÷ Cost) in their own portal.

**This is a preparation project, not an imminent launch** (D-011). The
organizing question:

> *What can we design, validate, build, and prepare now, so that arrival
> in Texas means local validation, final setup, and execution — not
> starting from zero?*

## The practice at a glance

**Repositioned 2026-11-16 (D-051).** A cash-pay, membership-based
**consulting** practice in preventive medicine, lifestyle medicine and
selected chronic disease management. Not anybody's primary care
physician: named conditions and named services, co-managed with the
patient's own physician where they have one.

$99/month, $1,188 a year · target 200 adults · 30 hr/wk across eight
months open and four closed, in four blocks of about a month · 1,040
physician hours a year, which is **250 clinical minutes per patient**:
two consultations, three care plan reviews, and 40 minutes of messaging
and coordination · no insurance billing · bounded availability, with the
closure dates known before anybody enrols · telemedicine predominant.

The one hard discipline is now arithmetic rather than panel mix: every
patient over the number the package fits takes minutes from everybody
already enrolled. See `docs/systems/consultative-practice-model.md`.

The earlier model below ($100/month, ~140 adults, 39 weeks, primary
care scope) is kept for its reasoning and is superseded where the two
disagree.

The flat rate's one hard discipline: **panel-mix management** — heavy-
utilization patients are sustainable at ~1 in 8–10 of the panel, so
onboarding doubles as the capacity gate and utilization is tracked from
patient one (unit economics §3, risk R-26).

## How this repo is organized

| Path | What lives here |
| --- | --- |
| `docs/charter/` | Working model · decision log · open questions · deferred decisions |
| `docs/strategy/` | Unit economics · risk register · roadmap |
| `docs/agreements/` | Patient Agreement draft · program eligibility brief · payment research |
| `docs/website/` | Website information architecture, patient journey, and (soon) the site itself |
| `docs/acquisition/` | Patient-acquisition workstream: funnel architecture, channel map, measurement system, phased plan, marketing compliance |
| `docs/systems/` | Technology strategy: the experience-layer exploration, EHR interop criteria |
| `docs/outreach/` | Physical outreach packet: architecture, production plan, piece drafts |
| `docs/style/` | **House Style** — the binding writing standard for all materials |
| `docs/archive/` | Superseded concepts, preserved with an index — how we got here |
| `tools/` | `practice_model.py` — the subscription economics model |

## Working agreements

1. **Label every claim.** Facts are sourced; estimates show derivations;
   assumptions are marked with owners. Nothing regulatory, clinical,
   financial, or market-related is asserted without a citation or an
   explicit "unverified."
2. **No invented numbers.** Unset inputs stay visibly UNSET.
3. **Licensed advisors own their domains** — `NEEDS-COUNSEL`,
   `NEEDS-CPA`, `NEEDS-BROKER` tags mark their questions.
4. **Decisions get logged** with reasoning and revisit triggers;
   deliberate deferrals live in their own register.
5. **Nothing is designed in isolation.**
6. **The care model is the product.** Technology and process serve
   physician–patient time.
7. **Documents show the current model; history steps back** (D-025).
   Scanning the decision log headings should give the current practice;
   old thinking lives in `docs/archive/` and git.

## Current status

**Era 1 — Preparation.** Re-baselined 2026-08-16 around the $100/month
model (D-029). The subscription economics are built and honest: the goal
is met at ~140 adults with margin; the binding constraint is panel mix,
not revenue. The near-term design work: the boundary/carve-out design
(Q-19), panel-mix instrumentation (Q-20), the Practice Terms skeleton,
and the Medicare-age question for counsel (Q-21). See
`docs/strategy/roadmap.md`.

## Start here

- `docs/charter/working-model.md` — the practice as currently conceived
- `docs/charter/decision-log.md` — current decisions, scannable by heading
- `docs/strategy/unit-economics.md` — what $100/month actually requires
- `docs/strategy/roadmap.md` — preparation tracks and the launch runway
- `docs/archive/README.md` — how the model evolved to this point
