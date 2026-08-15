# Roadmap

Sequenced by dependency, not by enthusiasm. The ordering principle: **do the
work that constrains other work first**, and resist the pull toward brand and
website, which feel like progress and are the most likely to be redone.

No dates. Pacing depends on Q-03 (runway), which is unanswered. Once it is
answered, the phases below get durations.

---

## Phase 0 — Constraints

**Goal:** establish the three facts that determine whether everything else is
correctly shaped.

- Q-01 Licensure footprint — where can you practice, virtually and in person
- Q-02 Medicare posture — `NEEDS-COUNSEL`
- Q-03 Financial floor and runway — `NEEDS-CPA`

**Exit criteria:** all three answered in writing in `docs/charter/`.

**Why first:** market geography, entity structure, pricing language,
eligibility, and pacing all derive from these. Work done before they are
settled has a high probability of being thrown away.

**What I can do now:** assemble the sourced comparison of Medicare postures for
your counsel conversation, and structure the runway analysis for your CPA. Both
are research-and-organize tasks, not decisions.

---

## Phase 1 — Legal and structural foundation

**Depends on:** Phase 0

- Entity formation `NEEDS-COUNSEL`
- Malpractice and disability coverage `NEEDS-BROKER` (Q-08, R-05)
- Licensure actions arising from Q-01
- Coverage arrangement for absence and after-hours (Q-06) — **launch-blocking**
- Membership fee scope definition (Q-05) `NEEDS-COUNSEL`
- Reduced-fee policy (R-10) `NEEDS-COUNSEL`

**Exit criteria:** you could legally and safely enroll a patient.

**Note:** Q-06 is here rather than later because it is a genuine launch
blocker and because arranging coverage takes longer than people expect — it
requires another clinician's agreement, not just a decision.

---

## Phase 2 — Care model and measurement design

**Depends on:** Phase 0 · **Must precede:** Phase 3

- Access promise, stated precisely (Q-07, R-07)
- Visit structures: comprehensive in-person, routine virtual, acute
- Preventive, chronic disease, and lifestyle medicine protocols
- Medication, lab, imaging, referral, and follow-up workflows
- Outcome measures — the actual measures, cadence, and collection method (Q-09)
- QI vs. research determination (Q-10) `NEEDS-COUNSEL`
- Async-time instrumentation requirement (R-08)
- Clinical scope boundaries, including Q-11

**Exit criteria:** a care model specific enough to be a systems requirements
document.

**Why before systems:** measurement design and workflow constrain EHR
selection. Choosing the EHR first means discovering in Phase 3 that the
measures you wanted cannot be collected — and the baseline cohort is
unrecoverable once it has passed.

---

## Phase 3 — Systems

**Depends on:** Phase 2 requirements, Phase 0 billing posture

- EHR selection against the Phase 2 requirements
- Payments and membership management
- Patient portal: scheduling, secure messaging, records, results, refills,
  care plans
- Telemedicine workflow
- Vendor register and BAA tracking (R-12)
- Record export verification (R-15)
- Automation and AI only where it returns physician attention to patients

**Exit criteria:** a patient could be onboarded end to end.

**Standing bias (D-007):** integrate before building. Any custom build must
answer what no compliant product does, how it improves care specifically, and
who maintains it in year three.

---

## Phase 4 — Brand, website, and consultation funnel

**Depends on:** Phase 0 geography, Phase 2 access promise and scope

- Practice name, positioning, value proposition
- Website and landing pages
- Two-part consultation structure and materials (D-008)
- The 1/3/5-year preliminary-view framework — the core artifact of the
  consultation, and the thing that makes $5,000 concrete for a specific person
- Fit criteria, including how a poor fit is communicated
- Online scheduling into the consultation
- Marketing claims held to the evidence standard (R-13)

**Exit criteria:** a prospective patient can find you, book, and be enrolled.

**Why this late:** brand work is the most tempting to start and the most
dependent on decisions above it. Naming and positioning a practice whose
geography, scope, and access promise are undefined produces work that gets
redone.

---

## Phase 5 — Pilot cohort

**Depends on:** Phases 1–4 · **Contingent on Q-03 runway**

A deliberately small first cohort, run to learn rather than to scale.

**Primary purpose — measure the two unknowns that determine the model:**
- Asynchronous hours per patient per month (sets the panel ceiling — §3 of
  unit economics)
- Consultation conversion rate (sets the ramp plan)

Also: test workflows under real conditions, find the patient-experience failure
modes the risk register cannot anticipate, and establish the outcome baseline.

**Exit criteria:** the capacity model runs on measured inputs instead of
placeholders, and the panel ceiling is a number rather than a range.

**Judgment call for you:** a pilot costs time-to-revenue, which is exactly what
Q-03 constrains. If runway is short, the alternative is to instrument heavily
and learn while scaling — higher risk, faster revenue. This is a real tradeoff
and it is yours to make; I would recommend the pilot if runway permits, because
the panel-ceiling number is worth more than a few months of ramp.

---

## Phase 6 — Acquisition and growth to target panel

**Depends on:** Phase 5 measurements

- Referral strategy, physician and community partnerships
- Search, social, and paid acquisition within licensed geography
- Collateral
- Acquisition cost, conversion, retention, and referral-source tracking
- Retention design — second-year renewal is a distinct problem from enrollment
  and gets designed separately

**Note from the economics:** during ramp, lead flow is the binding constraint;
at steady state, physician time is. These are opposite problems. Growth
planning should treat them as two phases, not one.

---

## Phase 7 — Evidence, outcomes, and continuous improvement

**Runs continuously from Phase 5; formalizes here.**

- Patient-facing evidence explainers for each major component of the care model
- Outcome reporting and review cadence
- Quality improvement projects
- Research, publication, and presentation, if Q-10 supports it

**Standing principle:** nothing is claimed about results until results exist
(R-13).

---

## Ordering rationale, stated plainly

Three inversions of the intuitive order, and why:

1. **Coverage arrangement (Q-06) sits in Phase 1, not "operations later."**
   It blocks launch and depends on another person's agreement.
2. **Measurement design precedes systems selection.** Otherwise the EHR decides
   what you are able to learn, and the baseline is lost permanently.
3. **Brand and website come after the care model.** They are downstream of
   geography, scope, and the access promise, and redoing them is the most
   common avoidable waste in a launch like this.
