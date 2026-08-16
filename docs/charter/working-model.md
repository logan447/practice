# Working Model

The practice as currently conceived. This is a working model, not a
specification — it is expected to change. Every element is tagged:

- **[D]** Decided — treat as fixed until explicitly revisited
- **[A]** Assumption / working lean — proceeding on it, not yet tested
- **[O]** Open — genuinely undecided, blocking or shaping downstream work

Last revised: 2026-08-15. This document describes what we currently believe
the practice is becoming (D-025) — the flexible, individualized,
relationship-based model. History lives in git and in the decision log's
history notes, not here.

---

## 0. Project frame — read this first

**[D]** **This is a preparation project, not an imminent launch** (D-011).
The practice launches after relocation to Texas — Austin most likely, Houston
or Dallas alternatives (D-012). Likely launch horizon: **~12–24 months**
(D-019). The current period is itself preparation: part-time primary care
work building skills, confidence, and firsthand knowledge of what traditional
systems do well and poorly.

**[D]** Preparation budget: **$20,000 ceiling, not a target** (D-020).
Grassroots and capital-efficient by default.

The organizing question for everything in this repository:

> *What can we thoughtfully design, validate, build, and prepare now, so that
> arrival in Texas means local validation, regulatory implementation, final
> system setup, and execution — not starting from zero?*

Work is prioritized by durability, leverage on the launch runway, and
tangibility. Decisions that should stay open are protected in
`deferred-decisions.md`; perishable research carries its date and a
`REFRESH-AT-RUNWAY` tag (R-16).

## 1. North star

**[D]** (D-014) We are not building a pre-designed healthcare product that
patients are fitted into. We are building the infrastructure that lets one
physician establish thoughtful, flexible, evidence-based physician–patient
relationships and tailor the clinical and economic arrangement to what will
genuinely help each person.

The workflow the entire infrastructure must enable:

> Meet someone → identify that I can help → schedule one or two structured
> conversations → understand the problem → create an agreed plan and price →
> formally establish the relationship → provide care → track whether their
> well-being improves.

**The person at the center** is often not someone with one neatly defined
problem. They may be scared, frustrated, or overwhelmed — health concerns
bleeding into stress, finances, work, relationships, sleep, and behavior all
at once, and unable to make sense of what is happening. The practice exists
to step into that complexity and help untangle it.

**The core experience, every time:**

> Listen carefully → understand the whole situation → identify the
> highest-priority problems → separate what is urgent from what is
> important → create a realistic plan → work through it together over time.

The patient should feel that somebody competent and thoughtful has finally
looked at the whole picture and helped make it manageable. The economics
reinforce the care (D-002, D-023): the patient understands what is proposed,
why it is worth doing, what it costs, and what should improve — the goal is
not to charge for physician time but to make the value added understandable
and visible.

Guiding principle for every care decision: **use the setting, frequency, and
duration of care that best serves the patient's health needs without creating
unnecessary structure or overhead.**

This purpose is the tiebreaker for every downstream decision.

## 2. Structure

| Element | Status | Detail |
| --- | --- | --- |
| Solo physician | **[D]** | D-001. The practice is the physician |
| No staff initially | **[D]** | D-001. Revisit trigger: admin load displaces clinical time |
| No clinician coverage layer | **[D]** | D-017. Transparent availability expectations instead; verify with counsel/carrier at runway (Q-17) |
| Launch state: Texas | **[D]** | D-012. City open — Austin lean (X-01) |
| Current licensure | **[D]** | Virginia. Texas licensure later, tied to settling (D-019) |
| Compensation target | **[D]** | D-018. ~$130–175k long-term; >$100k meaningful minimum; slow ramp accepted; income maximization is a non-goal |
| Legal entity | **[O]** | `NEEDS-COUNSEL` — Texas entity law; research now, form at runway |

## 3. Economic model

| Element | Status | Detail |
| --- | --- | --- |
| Pricing framework | **[D]** | D-002: individualized within a defensible structure — **expected time × complexity-adjusted derived rate + direct resources, value-checked**. Logical, fair, defensible — not uniform, not random |
| Framework calibration | **[O]** | Q-14: complexity inputs and bounds, utilization assumptions, worked pricing examples |
| Packaging / presentation | **[O]** | X-09: whether arrangements are presented as memberships, episodic fees, retainers, or packages — presentations of the same framework, not competing schemes |
| Payer participation | **[O]** | D-015 / X-04. Private pay, commercial, Medicare, Medicaid, hybrid — all genuinely open. `NEEDS-COUNSEL` before any election |
| Individualized-pricing compliance | **[O]** | Q-15 — gates publishing any tailored-pricing language. `NEEDS-COUNSEL` |
| Billing/coding capability | **[O]** | Never personally operated end-to-end; research + practical learning during preparation (Q-02) |
| Reduced-fee mechanism | **[O]** | D-003: will exist; within the framework it is a reduced *rate*; structure deferred (X-10) |
| Economics engine | **[D]** | Arrangement-based: each relationship is a small, scoped, priced, tracked, reassessed, renewable clinical contract — see `docs/strategy/unit-economics.md` and worked examples in `docs/archetypes/` |
| Payment mechanics | **[A]** | Working default (researched, familiar-to-patients): monthly card-on-file auto-pay with disclosed triggers; staged payments for front-loaded engagements; proposals built to satisfy the self-pay Good Faith Estimate duty (🟥); superbills on request; travel included in home-visit prices — `docs/archetypes/payment-landscape.md` §4 |

## 4. Care delivery

**[D]** (D-014) No rigid rules on visit frequency, in-person cadence,
virtual-vs-in-person mix, engagement length, or whether every patient needs a
membership. Each arrangement is set in the patient's proposal.

| Element | Status | Detail |
| --- | --- | --- |
| Default setting mix | **[A]** | **Telemedicine + home visits + rented clinical space when needed.** Comfortable driving to patients' homes when sensible; periodic rented exam room with clustered visits if patients are geographically concentrated |
| Permanent office | **[D]** | Not unless future economics strongly justify it (D-014) |
| Engagement shapes | **[A]** | Short-term intensive · extended · longitudinal · acute episodic · ongoing with periodic renewal checkpoints — chosen per patient |
| Availability | **[D]** | D-017: bounded and explicit — business hours M–F; no routine evenings/weekends; up to ~3 months/year away from regular scheduling, *aware not absent* (periodic review of messages, workups, significant results; triage when truly necessary); routine ~24–72h. No 24/7 obligation, no default coverage clinician |
| Patient expectations | **[D]** | Set in advance: emergencies → ED; urgent problems → urgent care / local evaluation; other physicians may be involved; another PCP may be kept where useful or required |
| Minimum safe structure | **[O]** | Q-17 — the deliberately framed question: the *minimum* availability/continuity structure for safe, ethical, legally compliant, genuinely valuable care — challenged on medical-legal, ethical, insurance, and operational grounds, not defaulted to convention |
| Triage taxonomy | **[O]** | Written definitions of emergency / urgent-local / message-me / can-wait — patient-facing, drafted during preparation (Q-07) |
| Home-visit operations | **[O]** | Logistics, safety, equipment, drive-time economics, malpractice implications (Q-16) |

## 5. Clinical scope

**[D]** Broad-scope primary care combined with lifestyle medicine: prevention
and screening, chronic disease management, acute primary care, medications,
diagnostics, mental well-being, relationships and social health, financial
health (bounded — below), healthy aging and long-term care planning.

**[D]** (D-024) Financial health scope: financial-stress-as-health-determinant
work — cash-flow awareness, money conversations, spending psychology, whether
financial instability interferes with health behaviors. **Not** investment
advice or financial planning; beyond scope → referral to qualified financial
professionals.

**[D]** The signature clinical competency is the untangling evaluation: a
structured way to take a person whose problems span domains, hear the whole
situation, name the priority problems, separate urgent from important, and
produce one realistic plan. This is a designed encounter (roadmap Track C),
not an improvised one.

**[O]** Remaining scope edges to define during preparation: psychiatric
medication management threshold and referral criteria; procedural scope (which
now also shapes the home-visit kit and rented-space requirements).

## 6. The relationship: from meeting to care

**[D]** (D-016) Every patient enters through the personalized proposal
process:

1. One or two complimentary virtual conversations — why are they seeking help
2. Records obtained and reviewed
3. Needs clarified: medical, psychological, lifestyle, functional, practical
4. Honest determination of what can realistically be accomplished
5. **Personalized proposal**: problems to manage, goals, settings, expected
   frequency and duration, anticipated diagnostics/medications/monitoring,
   reassessment checkpoints, cost structure, outcomes to track
6. Meeting of the minds → formal relationship begins

**[D]** The proposal doubles as the capacity and burnout management tool: time,
complexity, and economics are estimated *before* commitment, and a
relationship that would be unsustainable is identified before it exists.

**[O]** Boundary between the complimentary conversations and unpaid medical
advice; proposal-stage documentation and consent. `NEEDS-COUNSEL` at runway;
draft during preparation.

## 7. Outcomes and value

**[D]** (D-023) The value of care is made visible to patient and physician:
**Value = Quality ÷ Cost**. Purpose: clinical transparency, accountability,
and proof of value — publication is not a goal.

- Easy tracking of: vitals, laboratory trends, symptoms, medication burden,
  function, lifestyle measures, patient-reported well-being, clinical goals,
  encounter counts and types, approximate cost of care over time
- Each patient can see, as clearly as reasonably possible: what they spent,
  what care they received, what changed, whether objective and subjective
  health improved — e.g., BP/A1c/lipid/weight trends, medication changes,
  visits, major interventions, total cost, and a concise
  progress-and-remaining-goals summary
- Managed cases → internal structured case summaries for learning
- If the data later makes consent-based research, case series, or QI studies
  worthwhile, that is pursued separately; it is not a launch requirement

## 8. Technology

**[D]** (D-021, refining D-007) Established EHR as clinical system of record;
lightweight custom website as public front door and onboarding layer, handing
established patients into the EHR portal for clinical functions.

Target minimal stack: website/hosting · one strong EHR (integrated
telemedicine + portal) · malpractice insurer · labs · pharmacy/e-prescribing ·
imaging relationships · payment/billing infrastructure only as needed.

**[O]** EHR vendor — deep landscape research before recommendation (X-03):
subscription cost *and* long-term friction, plus support for per-patient
arrangements, flexible billing, portal outcome trends, and record
portability (R-15).

## 9. Acquisition

**[D]** (D-022) Grassroots and relationship-driven first: word of mouth,
personal relationships, community connections, physician and patient
referrals, organic presence, educational content, local reputation. Paid
advertising is a later experiment (X-08).

**[D]** Pre-outcomes marketing speaks to process, philosophy, convenience,
time and attention, evidence-based approach, and personalized planning —
never to results that don't yet exist (R-13). As the practice accumulates
cases and outcomes, it increasingly communicates its own evidence.

## 10. Revisit triggers

| Decision | Reopen when |
| --- | --- |
| No staff (D-001) | Non-clinical work displaces patient contact |
| Solo, no coverage layer (D-017) | Counsel/carrier verification fails (Q-17), or absence model proves clinically unsafe or unsellable |
| Flexible per-patient economics (D-014/D-015) | Administrative load of heterogeneous arrangements exceeds what solo practice sustains (R-20) — likely response is standard *defaults* with tailoring at the edges, not a return to one rigid product |
| No permanent office (D-014) | Patient concentration and economics strongly justify one |
| Grassroots-only acquisition (D-022) | Growth stalls below the income floor past the accepted slow-ramp window |
| Documentation-first outcomes (D-023) | Publication or formal QI becomes a real goal → revisit consent architecture first |

## 11. What success looks like

**[D]** Directionally defined by D-018 and D-023:

- Patients whose measured well-being and clinical trends improve, visible to
  them in their own portal
- Compensation reaching ~$130–175k sustainably, on a workload that leaves the
  practice enjoyable — reached slowly is fine
- Relationships that both sides renew at checkpoints because they are
  genuinely useful
- A practice one person can run without burnout, protected by proposal-stage
  capacity decisions rather than arbitrary limits
