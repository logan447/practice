# Billing and documentation architecture

Researched 2026-11-15 against CMS primary text. Every rule below cites
the document and page or Federal Register page it came from. Where a
conclusion is inferential rather than quoted, it says so.

Two things to settle before any of this matters.

**`NEEDS-COUNSEL`, and it comes first.** This practice is direct-pay
(D-031) and whether it enrols in or opts out of Medicare is unsettled
(D-039). If the physician opts out, none of these codes exist for this
practice. If the physician enrols, the $99 membership must not cover
items or services Medicare already covers, or there is exposure under
the beneficiary inducement CMP (42 U.S.C. 1320a-7a(a)(5)) and the
OIG's direct primary care guidance. Care management is exactly the
overlap zone: "systematic assessment, care planning and continuity
with a designated practitioner" is close to what the membership
already promises. Counsel settles that before a line of billing code
ships to patients.

**D-039 guardrail 4b still holds.** No print or patient-facing piece
may state how Medicare or Medicaid work with the membership until
counsel settles it. Nothing here changes that.

---

## Part 1. Behavioural health integration, 99484

### Can a solo physician with no clinical staff bill it?

**Yes, on CMS's own current guidance, with one documented gap.**

The descriptor says "at least 20 minutes of clinical staff time,
directed by a physician", which reads as excluding the physician's own
time. CMS says otherwise, twice, in currently posted guidance:

> "In contrast, services included in the General BHI code may be
> provided solely by the billing practitioner. Alternatively, the
> practitioner billing General BHI may (but is not required to) use
> other qualified individuals termed 'clinical staff'..."
>
> — CMS, *FAQs about Billing Medicare for BHI Services*, FAQ #14,
> 5 December 2023

> "May deliver general BHI services in their entirety"
>
> — MLN909432, *Behavioral Health Integration Services*, **January
> 2026**, p. 11, under Treating (Billing) Practitioner

The governing regulation agrees:

> "Services reported under G0507 may be provided directly by the
> treating physician or other qualified health care professional, or
> provided by clinical staff under his or her direction, during a
> calendar month service period."
>
> — CY2017 PFS final rule, 81 FR 80242. G0507 became 99484 unchanged
> at 82 FR 53171.

**The gap.** CMS has never written, for 99484 specifically, that the
billing practitioner's own minutes count toward the 20-minute
threshold. It has written exactly that for the structurally identical
CCM code 99490:

> "Time spent by the billing practitioner may also count toward the
> time threshold if not used to report 99491."
>
> — MLN909188, *Chronic Care Management Services*, June 2025, p. 13

and said in CY2017 that it would "apply the same definition of the
term 'clinical staff' that we have applied for CCM" to BHI (81 FR
80237). The two statements "may be provided solely by the billing
practitioner" and "requires at least 20 minutes" can only be
reconciled one way. But it is a reading, not a quote.

Counter-evidence, stated rather than buried: CPT's own definition of
clinical staff excludes anyone who "individually reports that
professional service" (quoted by CMS at 90 FR 49322), and the January
2026 MLN coding table lists a 20-minute staff threshold and a separate
15-minute assumed practitioner time, which read literally means both.

**`NEEDS-MAC`.** Get written confirmation from the MAC that a solo
physician's own 20 minutes satisfies 99484, citing FAQ #14 and
MLN909432 (January 2026) pp. 9 and 11. There is no MAC article, LCD or
Claims Processing Manual provision on BHI at all, which cuts both
ways.

### The build consequence

**99491 first, 99484 second.** CCM personally performed by the
physician has an unqualified CMS statement that only the billing
practitioner's personal time counts, no staffing question at all, and
is the better-trodden path for a solo practice. 99484 can be billed in
the same month (BHI FAQ #2) once the MAC letter exists. The prototype
therefore implements both, and marks 99484 as blocked on the MAC
answer rather than hiding the question.

### 99484 requirements

| Requirement | Rule | Source |
|---|---|---|
| Initiating visit | Required only for new patients or those not seen within a year. AWV, IPPE, comprehensive E/M or TCM face-to-face qualify; 99202–99205 and 99212–99215 all qualify; 99211 does not. BHI must be discussed at that visit. | FAQ #18; 81 FR 80239, 80242 |
| Consent | In advance, verbal sufficient, documented in the record. Must include permission to consult relevant specialists including a psychiatric consultant, and must state that cost sharing applies. New consent only on change of billing practitioner. | FAQ #16, #17; 81 FR 80242 |
| Validated rating scale | "Initial assessment or follow-up monitoring, including the use of applicable validated rating scales", when applicable to the conditions treated. | 81 FR 80237; MLN909432 Jan 2026 p. 10 |
| Care plan | Behavioural health care planning, "including revision for patients who are not progressing or whose status changes". Format flexible; may be separate from the CCM plan. | 81 FR 80238 |
| Time | At least 20 minutes in the calendar month. | CPT descriptor |
| With CCM | Permitted in the same month if both sets of requirements are met and "time and effort are not counted more than once". | FAQ #2 |
| With CoCM | Not permitted. One or the other in a given month. | FAQ #3; 81 FR 80242 |
| CEHRT | Not required for BHI, unlike CCM. | 82 FR 53180 |
| Telehealth | Not on the telehealth list and does not need to be. "The patient need not be present for the services to be furnished in its entirety." | 89 FR 97752 |
| Cost sharing | Part B deductible and coinsurance apply and cannot be routinely waived. | FAQ #19 |

### Newer and simpler, from 1 January 2026

**G0570** is a general BHI add-on to Advanced Primary Care Management
with **no time threshold in its descriptor** (90 FR 49470). CMS's
stated intent was that "removing the time-based requirements and
reducing the documentation requirements may make primary care
practitioners more likely to offer BHI and CoCM services" (90 FR
49795). If this practice ends up meeting the APCM service elements,
that is the better destination because it removes minute-counting
entirely.

**G0560**, safety planning for patients in suicidal crisis, "would
need to be personally performed by the billing practitioner" (89 FR
97920). Unambiguous for a solo physician, but a narrow indication.


---

## Part 2. Chronic care management, and the code that is not for us

### 99491 and +99437

The descriptor, quoted by CMS at 83 FR 59576:

> "Chronic care management services, provided personally by a
> physician or other qualified health care professional, at least 30
> minutes of physician or other qualified health care professional
> time, per calendar month, with the following required elements:
> Multiple (two or more) chronic conditions expected to last at least
> 12 months, or until the death of the patient, chronic conditions
> place the patient at significant risk of death, acute
> exacerbation/decompensation, or functional decline; comprehensive
> care plan established, implemented, revised, or monitored"

CMS created it, in its own words, "to describe situations when the
billing practitioner is doing the care coordination work that is
attributed to clinical staff in CPT code 99490" (83 FR 59576). That is
this practice exactly. There is no staffing question to resolve, and
CMS states the time rule without qualification:

> "CPT codes 99491 and 99437 include only time that's spent personally
> by the billing practitioner. Clinical staff time doesn't count
> toward the required reporting time threshold code."
>
> — MLN909188, *Chronic Care Management Services*, June 2025, p. 10

> "The CCM service codes for reporting services furnished directly by
> the billing practitioner (CPT code 99491, 99437) cannot be delegated
> or subcontracted to auxiliary personnel; the work must be personally
> furnished by the practitioner to be reported."
>
> — CMS, *FAQs About Practitioner Billing for CCM*, p. 2

| Requirement | Rule | Source |
|---|---|---|
| Eligibility | Two or more chronic conditions expected to last 12 months or until death, placing the patient at significant risk. | 83 FR 59576 |
| Consent | Verbal sufficient. Five items must be documented: availability of the service, cost sharing, that only one practitioner may bill it in a month, the right to stop effective at month end, and whether the patient accepted or declined. Once only, unless the CCM practitioner changes. | MLN909188 p. 6 |
| Initiating visit | Required for new patients or those not seen within the previous year. Must be an E/M, AWV or IPPE at which CCM was discussed. Separately billable. | MLN909188 p. 5 |
| Care plan | Electronic, patient-centred, comprehensive, available inside and outside the practice, copy to the patient. The twelve listed elements are "typical" and not strict requirements. | MLN909188 p. 6; CCM FAQ p. 3 |
| Time | 30 minutes of the physician's own time in the calendar month. +99437 for each additional 30. | MLN909188 p. 10 |
| What counts | Record and test-result review, telephone contact, coordination with other practitioners, care-plan work, patient education. Face-to-face delivery counts if the activity is within the CCM scope. | CCM FAQ p. 6 |
| What does not | Anything outside the CCM scope; anything already counted toward another billed code, including a same-day E/M; TCM minutes; the full interval of an activity that benefited several patients. | CCM FAQ pp. 3, 6; MLN909188 p. 8 |
| 24/7 access | Required, with a named person for routine appointments. CMS publishes no standard for acceptable call-sharing. | MLN909188 p. 7 |
| CEHRT | **Required.** Demographics, problems, medications and allergies must be recorded in certified EHR technology. | MLN909188 p. 6; 89 FR 97891 |
| Concurrency | Not with 99487, 99489, 99490, 99439 in the same month. Not with APCM. Billable within a TCM service period. | MLN909188 p. 8; 89 FR 97894 |
| Date of service | The day the threshold is met, or month end. The claim need not be held. | CCM FAQ p. 4 |

**Not from CMS:** whether +99437 needs a full additional 30 minutes.
The MLN table says "each additional 30 minutes" without the "must meet
or exceed" phrasing CMS does attach to other codes in the same table.
Treat the full-30 rule as CPT-sourced. `NEEDS-MAC` before it becomes a
hard gate.

**CMS contradicts itself on eligibility** between p. 3 of MLN909188
("and" logic: conditions last 12 months *and* place the patient at
risk) and p. 5 ("or" logic). The CPT descriptor is conjunctive. The
prototype uses the stricter reading.

### Advanced primary care management: not for this practice

G0556, G0557 and G0558 are payable in 2026, carry no minute threshold,
and are the obvious answer to a practice that hates counting minutes.
They are also the wrong answer here, for reasons that are not close:

1. **The descriptors say "provided by clinical staff and directed by a
   physician"** (89 FR 97871 to 97875). This practice has none. CMS
   never addressed whether a staffless practitioner qualifies. That is
   an open exposure on every claim, every month, for the life of the
   practice.
2. **CMS pointed practices like this one back to CCM.** Asked to relax
   the capabilities for small practices, CMS declined and wrote: "We
   also encourage practitioners who may not meet all of the
   requirements to bill for APCM services to consider whether the care
   coordination and management services they are delivering would meet
   the requirements to bill for other care management services such as
   TCM, CCM, PCM, CHI, PIN, or certain CTBS" (89 FR 97876).
3. **Performance measurement is a condition of billing.** A MIPS
   eligible clinician must register for and report the Value in
   Primary Care MVP (89 FR 97893). A practice below the low-volume
   threshold is not MIPS eligible, which CMS said means it
   "technically could" bill but "would be unlikely to" (89 FR 97892).
   Neither branch is comfortable.
4. **Population-level risk stratification and care-gap analysis across
   the panel are required** (89 FR 97878). That is build work and
   ongoing operational work with no revenue attached.
5. **It pays less** for the pattern this practice describes. Derived
   from the CY2026 relative value file at the non-qualifying APM
   conversion factor of $33.4009: G0557 is about $53.78 a month
   whatever the work, against about $89.18 for a single 99491 and
   about $152.31 for 99491 plus one add-on. `REFRESH-AT-RUNWAY`, and
   these are national unadjusted figures derived rather than quoted.

The prototype models APCM anyway, with its three blockers shown as
failing requirements rather than omitted. A code the practice decided
against for stated reasons is worth more on the screen than a code
nobody looked at.

**The honest caveat on all of it.** 99491 pays nothing in a month
under 30 minutes. If the monthly review is really a ten-minute chart
pass, neither code applies, and the answer is not to round up.

---

## Part 3. The visit, which is where a solo practice actually works

### Wellness visits, G0438 and G0439

**No physical examination is required or implied.** 42 CFR 410.15
contains no examination element. The only hands-on requirement is
measurement. A routine annual physical is separately **not covered**
at all (42 CFR 411.15(a)(1), with the wellness visit as an express
carve-out), and CMS instructs: "Do not bill for AWV services using CPT
codes 99381-99397" (Claims Processing Manual Ch. 12 §30.6.1.1(F)(2)).

**The subsequent visit is a shorter list, not a copy.** G0439 drops
height, body mass index, the depression risk review and the functional
ability and safety review, and it updates a screening schedule rather
than establishing one against a five-to-ten-year checklist. Building
the two as one form over-documents the visit that is paid less.

**G0438 is once per lifetime across all physicians.** A patient who
had one elsewhere gets G0439 here, forever (Ch. 12 §30.6.1.1(F)(2)).

**The health risk assessment is defined in the regulation and the
definition is more demanding than the CMS web page.** It must take no
more than twenty minutes, be usable by the patient alone, be tailored
for limited English proficiency and health literacy, and cover
demographics, self-assessed health and frailty, psychosocial risks,
behavioural risks, activities of daily living and instrumental
activities (42 CFR 410.15(a)). Build the instrument from the
regulation.

**Frequency is contested inside CMS's own sources.** The regulation,
Claims Processing Manual Ch. 18 §140.6 and the beneficiary notice all
say twelve months. CMS's Recovery Audit approved issue 0077 says
"eleven whole months". `NEEDS-MAC`. The prototype uses twelve months
from the date, which cannot cause a denial, and says on screen that it
made that choice.

**Both the deductible and the coinsurance are waived** for the
wellness visit itself (Ch. 18 §140.5). They are **not** waived for a
problem visit billed the same day, nor for G2211. This is the single
most common patient complaint about the visit and the chart should
warn before it happens, not after.

### Office visits, 99212 to 99215

Level is chosen by medical decision making **or** by total time, and
"history and physical exam must be performed in accordance with code
descriptors, but history and exam no longer impact visit level
selection" (Ch. 12 §30.6.1(B), Rev. 13753, effective 1 January 2026).

**The MDM grid and the two-of-three rule are AMA CPT content.** CMS
adopts them by reference and does not reproduce them: "The CPT E/M
Guidelines for MDM apply", and "review the AMA's E/M Services
Guidelines for a detailed breakdown of the elements of MDM"
(MLN006764, May 2026, p. 25). The practice needs a CPT licence.

**Two of the four time thresholds are UNSET and stay UNSET.** CMS
publishes 99215 at 40 to 54 minutes (Ch. 12 §30.6.15.2) and quotes the
99212 descriptor as ten minutes met or exceeded (91 FR 71118). It does
not publish 99213 or 99214. The prototype therefore cannot tell you
that 32 minutes is a 99214, and says so rather than inventing a
number. Only the reporting practitioner's time counts, only on the
date of the encounter, and there is no rounding at the midpoint.

### G2211, and the modifier 25 exception that matters here

The restriction people remember is that G2211 is not payable when the
base visit carries modifier 25. The exception is the one this practice
will live in:

> "HCPCS code G2211 is not payable when the O/O E/M visit or home or
> residence E/M is reported with modifier -25, **except when the
> same-day service is an annual wellness visit, vaccine
> administration, or another Medicare Part B preventive service,
> including the Initial Preventive Physical Examination**, furnished
> in the office or outpatient or home or residence setting. We are not
> revising this policy in this final rule."
>
> — CY2027 PFS final rule, 91 FR 71103, restating 89 FR 97856–97858
> and 90 FR 49462–49464

So a wellness visit, a problem visit and the complexity add-on on the
same day is a payable combination, with modifier 25 on the office
visit and **not** on the add-on (Novitas JH modifier 25 fact sheet).
No specific diagnosis is required, no additional documentation is
specified, and the relationship, not the complexity, is what the code
describes (G2211 FAQ Q1, Q7, Q8).

**It disappears on 1 January 2027**, replaced by modifiers B1 and B2
billed in the same circumstances (91 FR 71097). CMS explicitly asks
vendors to support five or more modifiers using modifier 99 overflow.
Build the claim line for that now.

### Telehealth

Geographic and originating-site limits are lifted through **31
December 2027** (CAA 2026 §6209, quoted at 91 FR 71024). Place of
service 02 or 10, no modifier 95 on professional claims. Audio-only is
permitted but **modifier 93 is mandatory** and attests three facts:
the patient was at home, this practice was capable of video, and the
patient was not capable of or did not consent to video (42 CFR
410.78(a)(3)). From 1 January 2028 audio-only narrows to behavioural
health. From 1 January 2027 modifiers BB and BC become mandatory and
the guidance for them was not published as of 15 November 2026.

---

## Part 4. The requirements matrix

Three columns, and the middle one is where most EMRs quietly cheat by
promoting good practice into a hard gate, or demoting a condition of
payment into a nudge.

| Item | Mandatory for payment | Recommended clinical documentation | Optional usability |
|---|---|---|---|
| Consent before the service, with the enumerated disclosures | CCM, BHI, APCM | | |
| Initiating visit, by programme-specific lookback | CCM (1 yr), BHI (1 yr), APCM (3 yr) | | |
| Comprehensive care plan | CCM, BHI, APCM | The twelve "typical" CCM elements | Plan version history |
| Minutes in the calendar month | CCM 30 physician, BHI 20 | Per-activity attribution | A running timer in the encounter |
| Physician's own time only | CCM 99491/99437 | | |
| Certified EHR technology | CCM | | |
| 24/7 access for urgent needs | CCM, APCM | A recorded call arrangement | |
| Validated rating scale | BHI | Score trend over time | |
| Performance measurement, Value in Primary Care MVP | APCM | | |
| Panel risk stratification and care-gap analysis | APCM | | |
| All wellness visit elements present | G0438, G0439 | Which were derived and which attested | |
| Health risk assessment to the regulation's definition | G0438, G0439 | | |
| Measurements, by visit type | G0438, G0439 | | |
| Level by MDM or time, documented which | 99212–99215 | Start and stop times | Element-level reasoning |
| Medical necessity of the base visit | 99212–99215, G2211 | | |
| Modifier 25 on the E/M, not the add-on | Same-day preventive plus problem visit | | |
| Continuing-relationship judgement | G2211 | A sentence saying why | |
| Modifier 93, place of service 02 or 10 | Audio-only telehealth | The reason video was not used | |
| No minutes counted twice | All timed codes | Naming the other service | |
| Physical examination | **Nothing here requires one** | Where the problems warrant it | |

The last row is worth its own sentence. No code in this architecture
requires a physical examination. Examine what the patient's problems
warrant and bill that on its own merits.

---

## Part 5. What the prototype was missing

Measured against the above, before this work:

1. **No versioned record of what was billable when.** Fixed: a month
   is a `MonthlyService` with its checks and its evidence frozen at
   evaluation.
2. **Time treated as the test.** Fixed: the ladder has four rungs and
   time moves a month to the second of them.
3. **Consent with no disclosures.** Fixed: `ServiceConsent.disclosures`
   is a list, and the check names the ones that are missing.
4. **No instrument scores.** Fixed: `InstrumentScore`, with a safety
   flag on item 9.
5. **No Medicare status.** Fixed: `Patient.medicare`, which is what
   the wellness visit arithmetic runs on.
6. **No wellness visit model at all.** Fixed: `lib/awv.ts`, with the
   initial and subsequent element lists kept separate and each element
   marked derived or attested.
7. **Invented E/M time thresholds.** Fixed by deletion: 99213 and
   99214 are UNSET and the screen says why.
8. **No claim record.** Fixed: `Claim`, prepared only from an attested
   month or a signed encounter.

Still missing, deliberately:

- **Nothing staff-dependent.** No clinical-staff time entry, no
  incident-to supervision model, no care-manager role. The brief said
  not to build a workflow around a code and the research says the
  codes that need one are the wrong codes.
- **No submission.** Claims are prepared and stop there.
- **No CPT content.** The MDM grid and the 99213/99214 time ranges go
  in when the licence does.

---

## Part 6. The architecture, in one paragraph

Billing hangs off two objects and neither of them is the chart.
An **encounter** carries what happened on a date: the E/M record, the
wellness-visit element list, the add-on judgement, the telehealth
facts. A **month** carries what happened across a calendar month: the
time entries, the requirement checks, the attestation. The living
chart is neither, and nothing in it is a billing artefact. That
separation is the whole design, and it exists because the summary is
continuously rewritten and a claim must never be.

Both objects stop short of a conclusion. The month reaches
"requirements met" and waits for a person. The visit computes what
the elements imply and does not choose a code. A chart that assigns
99214 on its own has made a billing decision on somebody else's
licence, and the fact that it would usually be right is not a defence.

---

## Part 7. Implementation order

1. **99491 and +99437.** Done in this change. The only unmet mandatory
   requirements are certified EHR technology and a recorded call
   arrangement, and both are true facts about the practice today
   rather than defects in the chart.
2. **Wellness visits.** Element lists and eligibility done. The
   encounter type that walks the list is next.
3. **99212 to 99215 with G2211.** Computation done. The same-day
   wellness plus problem visit flow is next, and it is the flow worth
   getting right because it is what a prevention-first practice
   actually does.
4. **99484.** Rules encoded, blocked on the MAC letter, visible as
   blocked.
5. **APCM.** Rules encoded, blocked on counsel and on two capabilities
   the practice does not have. Revisit if CMS acts on the CY2026
   request for information about APCM and prevention, which could
   remove cost sharing and change the comparison.

Everything above is gated on the two `NEEDS-COUNSEL` questions at the
top of this document. None of it reaches a patient-facing surface
while D-039 guardrail 4b stands.
