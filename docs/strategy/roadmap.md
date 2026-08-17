# Roadmap

Revised 2026-08-16 for the D-029 re-baseline. Two eras: **Era 1 —
Preparation** (now → move; ~12–24 mo horizon; $20k ceiling; paced by
interest, no deadlines) and **Era 2 — Launch runway** (move → first
patient). Tracks advance independently; dependencies are marked inside
tracks. Standing test for any work: does it survive to launch, shorten
the runway, or make the practice more tangible — and does it fit a
$100/month practice (simplicity is now a design requirement, not a
preference).

**The current job is part of the plan** (D-019): clinical skills,
workflow observation, billing exposure — and it blocks Medicare opt-out
until it ends (Q-21).

---

## Era 1 — Preparation tracks

### Track A — Economics and panel model
- ✅ Subscription model rebuilt (`tools/practice_model.py`, unit
  economics): $100/mo × ~140 adults → goal met; break-even ~19;
  mix-sustainability boundary quantified
- Keep current as real quotes land (overhead lines UNSET); Q-03b
  runway-analysis structure for the CPA; Q-18 question list
- **Perishable:** market prices, benchmarks. The model is durable.

### Track B — Patient experience and brand
- Practice name, positioning, messaging — around $100/month, time,
  attention, untangling, visible value (R-13 rules apply from draft one)
- Website prototype: the published price, how it works, the Q-07 triage
  taxonomy, honest FAQs (what's included / what's not — Q-19)
- The onboarding conversation design (D-016): scripts, records request,
  the capacity-check questions (Q-20), the "not me / not yet / let me
  refer you well" language
- Validation (with Track F): would the intended patients pay $100/month
  for this? Do the boundaries read as fair?
- **Perishable:** almost none.

### Track C — Clinical model and measurement
- The untangling evaluation as a designed encounter
- Care building blocks: visit types, engagement shapes, protocols on
  cited guidelines; psychiatric-management threshold; procedural scope
- **Q-19 boundary design** (with Track B): the carve-out list and its
  patient-friendly language — the most load-bearing artifact after the
  price
- Q-07 availability policy + triage taxonomy at panel scale; Q-16
  home-visit operations (kit, safety, clustering, indication criteria)
- Q-09 value dashboard design (D-023) and Q-20 utilization measure —
  both feed X-03 requirements
- **Perishable:** guideline references need a currency check at runway.

### Track D — Operating system
- Requirements doc (after Track C's Q-09/Q-20): EHR core + telemedicine +
  portal trends + **subscription billing (card-on-file, dunning)** +
  utilization tracking + bulk export
- Dated landscape scan of the researched DPC stack (Hint, Atlas.md,
  Elation, etc.); selection at ~6 months pre-launch (X-03)
- Simple front-door website build (cheap stack, D-020)
- **Perishable:** all vendor conclusions.

### Track E — Legal and regulatory preparation
- ✅ **Patient Agreement working draft v1**
  (`docs/agreements/patient-agreement-draft.md`, 2026-08-16): the full
  patient-facing agreement with counsel/carrier/decision flags inline,
  the Q-19 carve-out list v1, and the 10 exposed decisions. Next: your
  per-item decisions, then counsel review at runway
- New from drafting: **sudden-incapacity contingency design** (draft
  §5.5) — who notifies patients, how records flow; runway item + carrier
  conversation
- **Controlled-substances telemedicine policy** — research + counsel
  before launch (rules in flux; draft §8)
- ✅ **Q-21 brief done** (2026-08-17,
  `docs/agreements/medicare-medicaid-membership.md`): Medicare via
  opt-out + private contracts (downstream benefits verified intact);
  Medicaid via private-pay acknowledgment; dual/QMB excluded. Remaining:
  the Part C counsel-confirmation list; form templates (private
  contract, F00072-style acknowledgment, FFS downstream notice)
- Q-17 brief: minimum availability/continuity structure at panel scale
- Q-15 package: DPC-statute fit, GFE mechanics, DTPA/refund terms,
  discount criteria (X-10)
- Broker briefing (X-07); TX licensure process brief (starts when
  settling is decided)
- **Perishable: all of it** — dated, `REFRESH-AT-RUNWAY`.

### Track F — Validation and learning
- The current job as instrumented preparation: workflows, patient needs,
  billing friction — captured in the repo
- Price/boundary validation conversations: $100/month framing, the
  carve-out list, the availability model — on real people
- Conversations with DPC physicians: churn reality, mix management,
  what they'd bound differently; Austin-first market scan (method
  reusable for Houston/Dallas)
- Employer-lane exploration: what small Austin employers pay for DPC
  memberships and what they expect
- **Honest limit:** true utilization mix and churn are measurable only
  in operation — validation narrows, patient one measures.

---

## Era 2 — Launch runway (move decided → first patient)

1. Texas medical license (begins when settling is decided)
2. Counsel engagement: entity; Practice Terms to execution; Q-21
   confirmations + program form templates; Q-15 compliance pass; Q-17
   verification (with carrier)
2a. **Medicare opt-out sequence:** end/restructure Medicare-billed
   moonlighting → sign first private contract → file affidavit with the
   MAC within 10 days (never-enrolled path; quarterly timing only if
   participating) → affidavit-renewal tracking begins
3. Refresh pass on every perishable-tagged artifact
4. Malpractice + disability binding (X-07)
5. EHR + billing platform selection and setup (X-03); end-to-end
   onboarding test (enroll → card → visit → portal trends)
6. Care logistics: rented-space arrangement (X-05), lab relationships
   (client-bill pricing), pharmacy/imaging, referral network
7. Q-03b with the CPA (income floor, entity structure, Q-18)
8. Grassroots + employer activation (D-022)
9. First patients — the north-star workflow runs end to end

Exit criterion: someone you meet who needs help can hear "$100 a month,
here's how it works," enroll in minutes, and receive excellent, bounded,
individualized care — legally, safely, sustainably.

---

## Era 3 — Operate (sketch)

The first ~30–50 patients are the real test bench: measured utilization
mix vs. the §3 boundary (R-26 dashboard), churn vs. the 20% assumption,
net adds vs. the ramp plan, and the value dashboard proving D-023 to
patients. Growth stays grassroots+employer until evidence says otherwise;
insurance participation is revisited (X-04) only if price proves to be
the binding acquisition constraint.

---

## Pacing

No dates in Era 1; the horizon calibrates perishability, not deadlines.
Counsel hours are the scarcest purchased resource — briefs exist to make
each one count. The failure mode to watch is still endless preparation
(R-18) — but the model is now simple enough that "done designing" is
visible.
