# Working Model

The practice as currently conceived. This is a working model, not a
specification — it is expected to change. Every element is tagged:

- **[D]** Decided — treat as fixed until explicitly revisited
- **[A]** Assumption — a working choice we are proceeding on, not yet tested
- **[O]** Open — genuinely undecided, blocking or shaping downstream work

Last revised: 2026-08-15

---

## 0. Project frame — read this first

**[D]** **This is a preparation project, not an imminent launch.** (D-011)
The practice launches after relocation to Texas — Austin most likely, Houston
or Dallas as alternatives (D-012) — once you are established there and the
Texas medical and business infrastructure is in place.

The organizing question for everything in this repository:

> *What can we thoughtfully design, validate, build, and prepare now, so that
> arrival in Texas means local validation, regulatory implementation, final
> system setup, and execution — not starting from zero?*

Three consequences:

1. **Urgency is redefined.** Nothing is launch-blocking today, because launch
   is not today. Work is prioritized by durability (does it survive until
   launch?), leverage (does it shorten or de-risk the runway?), and
   tangibility (does it make the future practice concrete and the project
   sustaining to work on?).
2. **Some decisions are deliberately open.** City, launch date, vendors,
   carriers, and the final Medicare election are deferred on purpose, each
   with meanwhile-work and a decision trigger — see `deferred-decisions.md`.
3. **Prepared ≠ current.** Regulatory research, vendor landscapes, and quotes
   are dated snapshots that decay. Perishable artifacts are tagged and get a
   refresh pass during the launch runway (risk R-16).

**[O]** Rough launch horizon — even a range would calibrate pacing and how we
handle perishable research (Q-13).

## 1. Purpose

Provide patients with enough physician time, attention, continuity, and
evidence-based support to meaningfully improve their health and quality of life
over time — creating real value rather than increasing healthcare utilization.

**[D]** This purpose is the tiebreaker for every downstream decision. When a
proposal is defensible on revenue, convenience, or novelty but not on this
sentence, it loses.

## 2. Structure

| Element | Status | Detail |
| --- | --- | --- |
| Solo physician | **[D]** | One clinician; the practice is the physician |
| No staff initially | **[D]** | Revisit trigger: administrative load displaces clinical time (see §8) |
| Intentionally small | **[D]** | Panel capped by care intensity, not revenue appetite |
| Target panel size | **[O]** | Derived from capacity math, not chosen. See `docs/strategy/unit-economics.md` |
| Launch state | **[D]** | Texas (D-012). City open: Austin lean, Houston/Dallas alternatives (X-01) |
| Legal entity | **[O]** | `NEEDS-COUNSEL` — Texas entity law; research now, form during runway |
| Licensure | **[O]** | Texas license status and acquisition timing (Q-01). Texas alone is the market; multi-state is not needed for viability |
| Medicare posture | **[O]** | Research now, elect at runway with counsel (Q-02, X-04). `NEEDS-COUNSEL` |

## 3. Economic model

| Element | Status | Detail |
| --- | --- | --- |
| $5,000 / year membership | **[D]** | Working price; revisit only against capacity math, not competitor pricing |
| Monthly and quarterly payment options | **[D]** | Cash-flow accommodation for patients |
| Limited reduced-fee memberships | **[D]** | Financial-need based; requires a written, consistently applied policy (`NEEDS-COUNSEL`) |
| Reduced-fee share of panel | **[O]** | How many, at what discount, on what criteria |
| What the fee does and does not buy | **[O]** | **Critical.** Boundary between membership services and separately billed/paid services. `NEEDS-COUNSEL` |
| Insurance billing | **[O]** | Whether the practice bills any payer for anything |
| Labs, imaging, medications, procedures | **[O]** | In-fee, at-cost pass-through, or patient's own coverage |

## 4. Care delivery

| Element | Status | Detail |
| --- | --- | --- |
| Virtual-primary | **[D]** | Most longitudinal care delivered virtually |
| Dedicated in-person care blocks | **[D]** | Physical exam, preventive procedures, and hands-on services clustered into defined periods |
| Annual comprehensive in-person visit | **[D]** | Biennial permitted for highly stable patients |
| Minimum quarterly physician contact | **[D]** | Floor, not target; substantially more when clinically appropriate |
| In-person location model | **[O]** | Sessional lean; depends on city and procedural scope (X-05). Design requirements now, commit at runway |
| After-hours access | **[O]** | Blocks launch, not preparation — design the promise now (Q-07), secure the coverage at runway |
| Absence coverage | **[O]** | Blocks launch, not preparation — design the arrangement now, name the clinician at runway (X-06) |
| Access promise wording | **[O]** | The membership's access commitment must be specific enough to honor and bounded enough to survive a full panel |

## 5. Clinical scope

**[D]** Broad-scope primary care combined with lifestyle medicine:

- Prevention and screening
- Chronic disease management
- Acute primary care
- Medications
- Diagnostics
- Mental well-being
- Relationships and social health
- Financial health
- Healthy aging and long-term care planning

**[O]** Scope boundaries requiring definition before launch:

- Which conditions and presentations are explicitly *out* of scope, and what
  happens when a patient presents with one
- Whether "financial health" means education and coordination with the
  patient's own advisors, or something closer to advice — the latter is a
  regulated activity and a real boundary, not a semantic one (see risk R-06)
- Whether "mental well-being" includes ongoing psychiatric medication
  management, and the referral threshold
- Procedural scope during in-person blocks, which drives equipment, space,
  and malpractice coverage

## 6. Enrollment path

| Element | Status | Detail |
| --- | --- | --- |
| Complimentary two-part consultation | **[D]** | Two ~30-minute meetings, 7–30 days apart |
| Purpose | **[D]** | Understand the person's situation, assess fit, answer questions, and give a preliminary view of what could be worked toward over 1/3/5 years |
| Framing principle | **[D]** | Show what $5,000/year could specifically mean for *this person* — not a service menu |
| Conversion rate | **[O]** | Unknown. Drives acquisition time cost materially (see unit economics) |
| Fit criteria | **[O]** | What makes someone a poor fit, and how that's said kindly and clearly |
| What the consultation is *not* | **[O]** | Boundary between a fit conversation and unpaid medical advice. `NEEDS-COUNSEL` |

## 7. Technology posture

**[D]** Integrate established, compliant systems wherever they already perform
a function well. Build custom software only where no adequate option exists and
the gap materially affects care.

**[D]** Technology supports the care model; it is not the product.

**[O]** Every vendor requires a HIPAA Business Associate Agreement. The vendor
list is a compliance surface, not just a cost line.

**[O]** Where AI is used, the standard is: does it return physician attention to
the patient, or does it insert itself between them?

## 8. Revisit triggers

Explicit conditions under which a **[D]** decision gets reopened. Naming these
now prevents both premature churn and stubborn adherence.

| Decision | Reopen when |
| --- | --- |
| No staff | Non-clinical work exceeds a defined share of working hours, or administrative load begins displacing patient contact |
| $5,000 price | Capacity math shows the panel required for financial viability exceeds the panel size at which care quality degrades |
| Solo | Coverage obligations cannot be met by external arrangement, or demand sustainably exceeds one physician's capacity |
| Virtual-primary | Patient outcomes or satisfaction data show in-person frequency is the binding constraint on results |
| Two-part free consultation | Acquisition time cost exceeds a defined share of clinical capacity at steady state |

## 9. What success looks like

**[O]** — needs definition, and it should be defined before systems are chosen,
because measurement design constrains EHR and tooling selection.

Candidate dimensions, to be narrowed and operationalized in `docs/clinical/`:

- Patient-reported outcomes and quality of life
- Clinical measures appropriate to each patient's goals
- Continuity and access actually delivered vs. promised
- Retention and referral behavior
- Physician sustainability — hours, load, and whether the work remains
  enjoyable to do
