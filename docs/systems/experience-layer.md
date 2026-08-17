# The Experience Layer — Custom Software Exploration

*2026-08-17. Decision-support exploration, not a build commitment (per
instruction: nothing implemented, no stack chosen, website MVP
unchanged). The question: if custom software could materially improve
this practice, can we build toward it without complicating the simple
launch? Short answer: **yes — the option is cheap to preserve, and the
one decision that matters now is making interoperability a top-tier EHR
selection criterion (X-03).***

---

## 1. What we could eventually build — the capability inventory

Value = differentiation × clinical/operational usefulness for *this*
model. Complexity includes compliance burden, not just code.
"EHR?" = does a good EHR/portal already do this adequately?

### Patient-facing

| # | Capability | Problem it solves | Value | Complexity | EHR? |
|---|---|---|---|---|---|
| P1 | **Living care plan** — "what are we working on right now, and how are we doing": current priorities, agreed actions, upcoming diagnostics, med changes, next checkpoint | After-visit summaries are static and instantly stale; patients lose the thread between visits | **Very high** — this is D-016's plan made ambient; arguably the product's soul in software form | Med (content model + careful workflow so it doesn't become double documentation) | **No** — portals show documents, not living plans |
| P2 | **Longitudinal health dashboard** — BP, weight, A1c/glucose, lipids, CBC/CMP, meds, symptoms, preventive status as *trends with interpretation and goals*, not result rows | Patients see disconnected lab PDFs; nobody shows them the story | **Very high** — D-023's "value made visible" depends on it | Med-High (data ingestion from EHR/labs; interpretation UX) | **Partly** — portals list results; trend UX is weak; cross-source trends absent |
| P3 | **Whole-person measures** — validated instruments (PHQ-9, GAD-7, PSS, WHO-5, UCLA loneliness, sleep scales) on a schedule, plus informal patient-reported tracking, trended alongside P2 | The whole-life dimensions the practice treats are invisible in every EHR | **High** — unique to this practice's identity; distinguishes validated instruments from informal tracking by design | Med (instrument licensing check for some scales; scoring; cadence engine) | **No** — some EHRs do one-off questionnaires; longitudinal PRO trending is rare |
| P4 | **Lifestyle tracking** — exercise, strength, sleep, diet, alcohol, tobacco, adherence to *agreed* goals | Generic fitness trackers track everything and inform nothing | Med — valuable **only** as agreed-goal tracking tied to P1; a generic tracker would be noise | Low-Med | **No**, but beware: this is the easiest place to build the wrong thing |
| P5 | **Value dashboard** — months enrolled, interactions, interventions, measures improved, goals accomplished, unresolved priorities, amount paid | The practice's core promise (Value = Quality ÷ Cost) needs a surface; also renewal-conversation evidence | **High** — no competitor shows patients what they got for what they paid. Design constraint: descriptive ("what happened"), never attributive ("your $1,200 caused this A1c") — R-13 applies inside the product | Low-Med (mostly aggregates P1–P3 + billing) | **No** — no EHR concept of this exists |
| P6 | **Personalized communications** — questionnaire due, BP check requested, overdue lab, goal checkpoint, result posted, follow-up needed; via portal/SMS/email | Longitudinal care runs on well-timed nudges; doing them by hand caps the panel | High *eventually*; the highest compliance surface (PHI in SMS/email; consent; quiet-hours; the "away" model) | High | **Partly** — EHRs send generic reminders; care-plan-aware personalization no |
| P7 | Onboarding/enrollment experience — conversation → agreement → payment → program forms (D-033) → first-visit prep, as one guided flow | Enrollment friction; program-form correctness (QMB screening!) | Med-High operationally | Med | **No** — spans website, billing, EHR; nobody owns it |
| P8 | Education library, personalized — the evidence-explainer tradition, surfaced per patient's conditions/goals | Generic patient education is ignored | Med (later; content is the hard part, not software) | Low | **Partly** (generic handouts) |

### Physician-facing

| # | Capability | Problem | Value | Complexity | EHR? |
|---|---|---|---|---|---|
| D1 | **Panel dashboard** — utilization per patient vs. budget (Q-20), panel mean vs. the 5.6 hr boundary, heavy-share % (R-26), churn/adds, MRR | The flat-rate model's survival metric lives nowhere today | **Very high — and already committed** (Q-20/R-26); the only question is where it lives | Low-Med (can start as a spreadsheet; pseudonymized IDs keep early versions PHI-light) | **No** — no EHR tracks attention-economics |
| D2 | **Unified day view** — abnormal results to review, unanswered messages, follow-ups due, preventive gaps, med monitoring due, care-plan checkpoints approaching | Solo physician safety = nothing falls through; EHR inboxes are fragmented and not panel-aware | **High** — this is the "aware, not absent" model's instrument panel, especially for away periods | High (needs real EHR API depth) | **Partly** — EHR inboxes exist; panel-level, model-aware triage view no |
| D3 | Pre-visit prep card — one screen: trends since last visit, open plan items, PROs, meds, last conversation's threads | Unhurried visits require prepared physicians; chart review eats the time budget | High | Med (derives from P1–P3) | **No** |
| D4 | Checkpoint/renewal pack — auto-assembled "what improved, what's unresolved, care received, next period" | The renewal conversation (D-016) needs evidence, not memory | High | Low once P1/P2/P5 exist | **No** |
| D5 | Outcome/value roll-up across the panel — the practice-level D-023 story (and someday the website's earned outcome claims) | Proof the model works, for patients and for the practice's own honesty | Med now, high later | Low once P5 exists | **No** |

**The differentiation line, drawn plainly:** records, prescribing,
orders, results delivery, formal clinical messaging, scheduling,
documentation, interoperability plumbing — **the EHR's job, never ours**
(D-021/D-007). Everything scoring "No" in the EHR column above is
*model-specific* — it encodes this practice's philosophy (living plan,
visible value, whole-person trends, attention-economics) and is exactly
where custom software differentiates rather than duplicates.

**The quiet headline:** P1+P2+P5 and D1 are not speculative features —
they are D-023 and Q-20 *commitments* looking for a home. The strategy
question is only when they graduate from spreadsheet/EHR-template to
real software.

## 2. The architecture hypothesis, pressure-tested

**Hypothesis:** established EHR = authoritative clinical system of
record; custom software = experience/intelligence layer around it.
**Verdict: survives, with four rules that keep it honest.**

1. **One home per datum.** The failure mode that kills solo practices is
   double documentation. Clinical facts (notes, meds, orders, results)
   live in the EHR only; the layer *reads* them. The layer *owns* what
   the EHR can't represent: PROs, goals, plan-as-experience, value
   aggregates. Nothing is typed twice — if a feature requires re-entry,
   it's designed wrong.
2. **Formal messaging stays in the EHR** until (if ever) a Stage-4
   integration can write conversations back to the record. The layer
   must never become a shadow channel that fragments the chart.
3. **One front door for patients.** Two portals confuse; the layer (when
   it exists) becomes the patient's home page and *links into* the EHR
   portal for regulated functions — not a parallel world.
4. **The layer is disposable by design.** The EHR holds the record;
   losing the layer must never lose medicine. This also keeps the
   build reversible (D-007's spirit).

**Alternatives considered:** (a) *No custom layer ever* — acceptable;
loses P1/P5/D1 differentiation; the fallback if reality disagrees.
(b) *API-first "headless" EHR as the platform* (build our whole UX on an
EHR's API) — maximal power, maximal lock-in and effort; wrong for solo
scale, revisit only at Stage 5. (c) *Buy a PRO/care-plan vendor* bolted
to the EHR — worth checking in the X-03 scan; likely generic where we
need model-specific. The hypothesis beats all three for this practice.

## 3. Interoperability — what X-03 must now screen for

This exploration's **one material effect on current plans**: the EHR
choice gates the entire experience-layer future. Selection criteria
(added to the Track D requirements):

**Tier 1 — disqualifying if absent:**
- **FHIR R4 read API** for Patient, Observation (labs/vitals),
  MedicationRequest, Condition, DiagnosticReport, DocumentReference —
  note: ONC-certified EHRs are *required* to expose standardized
  patient-access FHIR APIs (21st Century Cures / info-blocking rules),
  but **many DPC-niche EHRs are not ONC-certified** and may offer
  proprietary APIs or none — certification status is therefore itself a
  screening question, to be verified per vendor in the X-03 scan
- **Bulk/complete data export** (already required — R-15) in usable
  formats (FHIR/CCD/CSV, not PDF dumps)
- API terms that don't price a solo practice out (partner-program
  gatekeeping, per-call pricing, "enterprise only" API tiers — verify)

**Tier 2 — strongly weighted:**
- Webhooks / event notifications (new result, new message, appointment)
  — polling-only makes D2/P6 clunky
- Scheduling API; lab-results feed timing; document exchange (CCD in/out)
- **Write-back** scope: notes? questionnaire results? flags? (read-only
  is survivable at Stages 2–3; Stage 4 wants selective write)
- SMART on FHIR app-launch support (embed our surfaces in the EHR)
- OAuth2 auth; developer sandbox; API documentation quality

**Tier 3 — noted:**
- Patient-authorized access as a *bypass lever*: patients can authorize
  data flow via patient-access APIs and aggregation services even where
  vendor APIs are weak (and Medicare members via Blue Button) — verify
  options in the scan; never the primary plan
- Vendor's export posture at contract exit (data hostage-taking is
  disqualifying)

## 4. HIPAA & privacy — the conceptual map (full analysis is a Stage-2 gate)

The bright line: **today our stack holds zero PHI** (marketing site +
name/email scheduling; the EHR and billing platform hold the regulated
data under their BAAs). **The moment our own software stores or
transmits PHI, we become the operator of a regulated system**, and
compliance becomes a property of the whole system and how we run it:

- **Every vendor in the PHI path needs a BAA** — and BAAs are
  plan-tier- and product-specific (a vendor "supporting HIPAA" ≠ our
  configuration being covered). Supabase/Vercel/Twilio/Resend-class
  stacks can be assembled compliantly, but only deliberately.
- **Channel limits:** SMS content is carrier-plaintext — the compliant
  pattern is content-free pings ("you have a new message") with
  substance behind auth; same discipline for email. Consent and
  quiet-hours by design (and TCPA lives here too).
- **The leak surfaces are the boring ones:** logs, error trackers,
  analytics, staging databases, developer laptops, backups. Rules:
  no third-party analytics on authenticated pages; PHI-scrubbing in
  logging; prod/dev separation with synthetic data; encrypted at rest
  and in transit; role-based access (trivial solo — until a
  contractor touches code); audit logging; retention/deletion policy;
  secrets management; a written breach-response plan.
- **Texas adds its own layer:** the Texas Medical Records Privacy Act
  (HB 300 lineage — broader "covered entity" definition, training
  obligations, steeper penalties) and the Texas Data Privacy & Security
  Act; plus the growing state consumer-health-data statute trend for
  anything not covered by HIPAA. `NEEDS-COUNSEL` (privacy/security)
  before Stage 2 — logged as the **Stage-2 gate: a dedicated HIPAA/
  privacy architecture review, done before the first line of PHI-bearing
  code, not after.*

## 5. Progressive staging (refined) — with gates, not dates

| Stage | What exists | PHI in our stack? | Entry gate |
|---|---|---|---|
| **1 · Launch** | Website → scheduler → enrollment (billing platform) → EHR + its portal. D1 starts life as a **pseudonymized spreadsheet/private tool** (IDs, hours, counts — deliberately PHI-light) | **No** | now (unchanged) |
| **2 · Practice layer** | PRO questionnaires on cadence (P3-lite), the living care plan (P1) — *possibly* first as disciplined EHR templates, graduating to a small app; onboarding flow (P7) | **Yes → the HIPAA architecture review is the gate** | ~20–40 patients + validated demand + EHR API reality known |
| **3 · Patient experience** | Dashboards: P2 trends + P3 whole-person + P5 value; D3 prep cards; D4 checkpoint packs | Yes | Stage 2 running + patients actually using it + read-API proven |
| **4 · Care automation** | P6 personalized comms; D2 unified day view; selective write-back | Yes, deepest | Stage 3 evidence + write-API reality + away-model integration designed |
| **5 · Mature platform** | Integrated patient+physician experience; consider only if usage proves clinical/operational value | Yes | earned, not planned |

Principle preserved: **don't build Stage 5 to launch Stage 1 — but no
Stage-1 decision may make Stage 5 unnecessarily hard.**

## 6. The cheap option-preserving decisions (all ~free today)

1. **Interoperability becomes a Tier-1 X-03 criterion** (§3) — *the only
   decision this exploration actually changes now.*
2. Marketing site stays static and PHI-free **forever** (already ruled).
3. Verify export + API surface *before signing* any EHR contract; no
   long-term contracts with closed systems.
4. Q-9 instrument choices favor digitally-administrable validated
   instruments (they become P3's content).
5. Care-plan and checkpoint formats (Track C artifacts) get designed as
   *structured* documents — they become P1's data model for free.
6. D1 starts as the pseudonymized tracking sheet from patient one — the
   data that later powers the real dashboard.
7. Reserve the app subdomain pattern when the domain is bought; keep all
   copy/content in this repo.
8. No PHI-bearing code before the Stage-2 HIPAA architecture review.

## 7. Recommendation

**Proceed with the simple launch exactly as designed — the website
sketching continues unchanged.** This exploration changes one present
thing (X-03 interop screening) and creates one future gate (the Stage-2
HIPAA review). The capability map says the eventual prize is real:
P1/P2/P5 + D1 would make this practice's philosophy *tangible in
software* in a way no EHR portal or competitor offers — and three of
those four are already commitments (D-023, Q-20) waiting for better
housing. But the sequence is: patients first, EHR reality second,
custom software third — built on demonstrated demand, not architectural
enthusiasm.
