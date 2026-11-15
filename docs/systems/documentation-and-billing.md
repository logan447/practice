# Documentation and billing: what the chart has to hold

Researched 2026-11-15 for the EMR prototype. Every figure below is
tagged. **Sourced** means a named published source, listed at the
bottom. **Derived** means arithmetic on a sourced figure. **Assumed**
means a design decision I made and own.

Two warnings before anything else.

**The sources are mostly secondary.** Searches surfaced coding-education
sites and billing-vendor blogs rather than the CPT book, the CMS MLN
booklets, or the CY 2026 Physician Fee Schedule final rule. Several of
them disagreed with each other on rates, and at least two described
codes incorrectly. Nothing here is safe to bill against until it has
been checked against primary text. `NEEDS-COUNSEL` `NEEDS-CPA`

**This practice may never bill any of it.** Direct Lifestyle Medicine
is direct-pay (D-031), and whether it opts out of Medicare is unsettled
(D-039). Care management and E/M codes may be entirely academic here.
They are researched anyway for three reasons: the documentation
discipline is good regardless of who pays, the data model has to
support it if the answer ever changes, and a membership that *looks*
like chronic care management without being billed as one has its own
questions that counsel will want to ask.

---

## The finding that shaped the architecture

**A longitudinal summary cannot carry billing documentation.**

The living SOAP summary answers "where is this patient now". Billing
asks two different questions:

1. What happened on a particular date? (office E/M)
2. What was done in a particular calendar month? (care management)

Neither survives a document that is continuously rewritten. If the
summary is the only record, then last March's visit is whatever the
summary says today, which is not a record of last March.

So the prototype keeps three things apart:

| Record | Answers | Lives in |
|---|---|---|
| Signed encounter note | what happened on a date | `Encounter.note`, never edited after signing |
| `EmRecord` | what the level rests on | per encounter: problems, data, risk, time |
| `CareLogEntry` + `ServiceConsent` | what was done this month, and whether consent exists | per patient, per month |

The living summary does one piece of double duty, and only one: it
satisfies the **care plan** element that care management programmes
require, because it is dated, organised by problem, reviewed, and
exportable. That is argued below.

---

## Office/outpatient E/M, 99212–99215

**Sourced.** The 2026 framework is unchanged from the AMA's 2021
revision. History and examination are no longer scored for level
selection. The level is chosen by **either** medical decision making
**or** total time on the date of the encounter.

**Sourced.** MDM has three elements: problems addressed, data reviewed
and analysed, and risk of management. A level is met when **two of the
three** meet or exceed it. Straightforward → 99212, low → 99213,
moderate → 99214, high → 99215.

**Sourced.** Established-patient time thresholds: 99212 ≥ 10 min,
99213 ≥ 20, 99214 ≥ 30, 99215 ≥ 40. Time is total time on the date,
not face-to-face only.

**Sourced.** Billing the same level for nearly every established
patient is a described audit flag.

### What the chart therefore stores

`EmRecord` holds the **elements**, not the conclusion:

- `problemsAddressed` — condition ids addressed *at that visit*, which
  is not the problem list
- `dataReviewed` — each item counted once
- `problemsLevel`, `dataLevel`, `riskLevel`
- `totalMinutes`
- `selectedBy` and `code` — set by the physician, never computed

`lib/billing.ts` computes what the elements imply by each route and
shows both. It does not pick. A chart that silently assigns 99214 has
made a billing decision on someone else's licence.

**Derived.** Because two of three must meet the level, the MDM level is
the second-highest of the three element levels. That is the whole
calculation.

---

## Chronic care management

**Sourced.** 99490 is 20 minutes of clinical staff time per calendar
month under general supervision. 99439 adds each further 20 minutes.
99491 requires 30 minutes performed personally by the billing
practitioner; clinical staff time does not count toward it.

**Sourced.** Requirements beyond time: an initiating visit before
billing; patient consent, verbal or written, **documented in the
record**; a comprehensive care plan that is documented and shared with
the patient; 24/7 access for urgent needs; management of care
transitions. The plan should follow an assessment covering physical,
mental, cognitive, psychosocial, functional and environmental factors.

**Sources conflict** on 2026 payment (roughly $62–$66 for 99490,
$86–$89 for 99491) and at least one described 99491 as "complex CCM",
which it is not. Rates were not used anywhere in the prototype.

---

## Behavioural health integration, 99484

**Sourced.** At least 20 minutes of clinical staff time per calendar
month, directed by a qualified practitioner. A behavioural health
diagnosis. A validated assessment tool such as PHQ-9 or GAD-7. A
patient-specific care plan with the condition, goals, interventions, an
assigned team member and a follow-up schedule. Consent before services
begin, verbal acceptable if documented, re-obtained if the billing
practitioner changes.

**Sourced.** 99484 and the collaborative care codes 99492–99494 are
mutually exclusive for the same patient in the same month.

---

## Advanced primary care management, G0556/G0557/G0558

The most interesting one for this practice, because it is **not a timed
service**.

**Sourced.** Three tiers: G0556 for one or no chronic condition, G0557
for two or more, G0558 for Qualified Medicare Beneficiaries with two or
more. Built on 13 service elements that must be available each month
rather than on minutes counted. Consent documented before starting,
including that only one practitioner may furnish and be paid for APCM
in a calendar month. A care plan is required at **every** tier,
including the lowest, with elements medically appropriate to the
patient. Practices billing APCM report on the Value in Primary Care
MIPS Value Pathway.

**Sourced.** One guide lists required care plan components as patient
demographics and risk level, an active problem list with ICD-10 codes,
and documented periodic review and update.

**Sources conflict badly** on rates (one gives ~$16/$54/$117 per month,
another ~$46–50/$90–95/$130–140). Unusable without the final rule.

**Assumed, and worth flagging to counsel:** a membership practice that
provides 24/7 access, care coordination and a maintained care plan is
describing the APCM service elements in everything but the billing. If
the practice ever enrols Medicare patients, the question of whether it
is furnishing APCM without billing it, or billing it, is not a
technicality.

---

## Preventative and lifestyle medicine

**Sourced.** Individual preventive counselling is time-banded:
99401 (~15 min), 99402 (~30), 99403 (~45), 99404 (~60). 99411 and
99412 are the **group** codes; two sources got this wrong.

**Sourced.** G0447 is Medicare's obesity behavioural counselling code,
15 minutes, requiring documented BMI ≥ 30, delivery by a primary care
practitioner in a primary care setting, and documented **behavioural**
counselling rather than dietary advice alone. Commercial payers more
often recognise 99401–99404.

**Gap.** Searches returned nothing usable on annual wellness visit
documentation (G0438/G0439) or on bundling between an AWV and
99401–99404. One vendor flagged a bundling risk; unverified.

### What the chart therefore stores

Lifestyle interventions are **coded**, not prose: a domain from the six
(nutrition, physical activity, sleep, stress, social connection,
substances), the specific prescription, the problems it targets, a
status, and the barrier when there is one. "Discussed diet and
exercise" is not a plan and is not billable as one.

---

## The rule that matters most

**Time spent by software is not clinical staff time.**

`CareLogEntry.countable` is a stored judgement, not a calculation, and
an entry with `role: 'automated'` carries `countable: false` and a
reason. A care management programme that counts the minutes a model
spent drafting a summary is building an overpayment one month at a
time, and it would be an easy one to find.

---

## Where the living summary legitimately does double duty

Every programme above requires a care plan that is documented, shared
with the patient, and reviewed. The living summary is that plan:

- it is dated and carries who updated it
- it is organised by problem, each with an ICD-10 code
- `trend` records a periodic reassessment per problem, with a date
- it exports as a complete packet

What the chart **cannot** infer is whether the plan was actually given
to the patient. That is a fact about an event, so the export records
one when it produces a packet. Nothing else does.

---

## Sources

Read 2026-11-15. All secondary; none is CMS or AMA primary text.

- [2026 MDM Table & E/M Coding Guidelines](https://www.spryhealth.ai/blog/e-m-coding-and-documentation-2026)
- [E/M MDM Table 2026: Full Chart, Time Rules & 99214](https://rcmaxis.com/blog/em-coding-2026/)
- [Evaluation and Management Guidelines for 2026](https://codingclarified.com/em-coding-guidelines-2026/)
- [AAFP, Chronic Care Management](https://www.aafp.org/practice-operations/billing-and-coding/chronic-care-management)
- [CodingIntel, Chronic Care Management](https://codingintel.com/chronic-care-management/)
- [Chronic Care Management Billing Under Audit](https://www.healthlawalliance.com/blog/chronic-care-management-billing-under-audit)
- [HCCI, Advanced Primary Care Management requirements (PDF)](https://www.hccinstitute.org/wp-content/uploads/2026/01/Advanced-Primary-Care-Management-APCM-Requirements_012226.pdf)
- [APCM 2026 billing guide](https://nsightcare.com/blog/advanced-primary-care-management-apcm-2026-billing-codes-reimbursement-guide/)
- [CPT 99484 billing and documentation guide](https://www.medcloudmd.com/post/cpt-99484-behavioral-health-integration-billing-2026)
- [Behavioral Health Integration CPT codes 2026](https://nsightcare.com/blog/behavioral-health-integration-bhi-cpt-codes-2026-billing-reimbursement-guide/)
- [Billing and coding for lifestyle counselling (PDF)](https://culinarymedicine.org/moodle/upload/HmFHandouts/Codes4LifestyleCounseling.pdf)
- [Optum, obesity screening and counselling reimbursement policy (PDF)](https://www.myoptumhealthphysicalhealth.com/public/document/?documentType=ReimbursementPolicies&documentName=0064_ObesityScreeningandCounselingReimbursementPolicy.pdf)

**Before any of this supports a claim:** check the CPT 2026 E/M
guidelines, the CMS MLN booklets for CCM and BHI, and the CY 2026
Physician Fee Schedule final rule. `NEEDS-COUNSEL` `NEEDS-CPA`
`REFRESH-AT-RUNWAY`
