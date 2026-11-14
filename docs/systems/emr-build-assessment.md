# Building the EMR — feasibility, architecture, and the regulatory floor

*2026-11-14. Assessment and recommendation. Companion to
`experience-layer.md` (architecture rules, X-03 criteria, Stage-2 HIPAA
gate) and `ai-layer-and-hda.md` (provenance model, HDA verdict). Facts
checked against primary and secondary sources on 2026-11-14; items
marked VERIFY need a primary-source read before they are relied on.*

---

## 0. The recommendation, stated first

**Own the application layer. Standardize the data layer. Buy the
regulated edges.**

Concretely: build the physician workspace and patient portal yourself,
on an open-source FHIR-native backend you can fork and self-host, with
e-prescribing, lab connectivity, payments and (if ever needed) claims
obtained from vendors who carry the certifications.

**Not** from scratch, and **not** by modifying a legacy open-source EMR.
The reasoning is in §2, and it turns on a distinction worth stating
plainly: you want control of the *application*, not of the *clinical
data model*. Those are separable, and conflating them is what makes
build-from-scratch look more attractive than it is.

**And yes, to the central question:** a small physician-led practice can
lawfully run on a custom-built EMR without ONC certification. §4.

---

## 1. What "full control" actually requires

The stated requirement is full control over codebase, database,
clinical workflows, physician interface, and patient experience. Taken
item by item against the recommended approach:

| You want control of | Do you get it? | How |
|---|---|---|
| Codebase | **Yes** | Apache 2.0 licensed backend; fork it, change it, no vendor permission |
| Database | **Yes** | Your Postgres, your server or your cloud account |
| Clinical workflows | **Yes** | They live in your application code |
| Physician interface | **Yes** | You write it from scratch |
| Patient experience | **Yes** | You write it from scratch, on the same data |
| **Shape of the clinical data model** | **No** | FHIR R4 |

That last row is the only thing given up, and §2 argues it is the row
you should most want to give up.

---

## 2. Build versus adapt

### The three options, honestly

**A. From scratch — everything, including the data model.**

Technically possible. The hidden cost is not the CRUD; it is the
clinical data model and the terminology beneath it.

- **Medications**: RxNorm coding, dose forms, sig structure, active vs
  historical, reconciliation state, prescription vs statement.
- **Problems**: ICD-10-CM *and* SNOMED CT, onset, abatement, clinical
  vs verification status.
- **Allergies**: coded substance, reaction, severity, criticality,
  no-known-allergies as a positive assertion.
- **Results**: LOINC, units, reference ranges by age and sex, abnormal
  flags, panel-to-component structure, preliminary vs final vs
  corrected.

Each of these is a problem someone has already solved carefully, and
each has a failure mode that reaches patients. Terminology alone is
real work: RxNorm, ICD-10-CM, LOINC, CVX, and SNOMED CT (free in the US
through a UMLS licence, but still a licence and still a load-and-update
job).

Then the compounding cost: **every integration partner speaks FHIR or
HL7 v2.** A bespoke schema means writing and maintaining a mapping
layer for the e-prescribing vendor, each lab, the clearinghouse, the
HIE, and any future EMR you migrate to. You pay for schema freedom
once in design and forever in adapters.

And it conflicts with an existing commitment: R-15 requires complete
data export in usable formats. A bespoke schema is the thing that makes
export hard.

**B. Modify a legacy open-source EMR — OpenEMR, OpenMRS.**

- **OpenEMR**: twenty-plus years old, enormous feature surface, large
  install base, PHP. The maturity is real and so is the weight.
  Customising it means working inside twenty years of accumulated
  decisions. You would spend your effort fighting the existing
  application rather than writing yours.
- **OpenMRS**: Java, an elegant concept-dictionary data model, strong
  in global-health deployments. Not built around US billing, US
  e-prescribing, or US lab interfaces.

Both fail the actual requirement for a different reason than A does:
you inherit someone else's application rather than writing your own,
which is precisely what you said you want to avoid.

**C. Your own application on an open clinical backend.** ← recommended

A FHIR-native backend handles storage, search, versioning, access
control, subscriptions and the standards surface. You write everything
above it.

The strongest candidate is **Medplum**: Apache 2.0, FHIR R4 native,
TypeScript/React, built as a developer platform rather than a
ready-to-use EMR, self-hostable or hosted, with both running the same
codebase. (Medplum states ONC certification — VERIFY, though §4 shows
you do not need it. Also VERIFY whether serverless "Bots" are
open-source or hosted-only; sources disagree.)

Alternatives in the same shape: **HAPI FHIR** (Java, open source, a
FHIR server rather than a platform — more to build) and **Aidbox**
(commercial, free tier).

### Why FHIR is the right constraint rather than a compromise

1. **The data model is free and already refined.** Ten years of
   clinical modelling you do not have to redo or debug.
2. **Terminology bindings come with it.**
3. **Every vendor already speaks it.** No adapter layer.
4. **`Provenance` is a first-class resource** — the exact mechanism the
   AI layer needs (§6), already specified rather than invented.
5. **Information blocking compliance is close to free** (§4).
6. **Exit is possible.** You can leave. A bespoke schema is a prison
   you built yourself.

**The honest cost.** FHIR is verbose, and some resources fit real
workflows badly. `CarePlan` in particular is awkward, and the living
care plan is your product's centre. Expect to model that one on your
own terms alongside FHIR rather than contorting it into `CarePlan`.
That is a reasonable trade: use the standard where it is good, which is
most places, and your own structures where it is not.

### Where build-from-scratch would actually be right

If the clinical data were unlike anything FHIR models, or if there were
no integrations, or if the thing were not a medical record. None of
those hold here.

---

## 3. What to build, and what to buy

### Must be bought — regulatory or relationship walls

| Function | Why it cannot be built | Route |
|---|---|---|
| **E-prescribing** | DEA requires the application be certified by a DEA-approved certifying organisation or audited by a qualified third party before transmitting controlled-substance prescriptions (21 CFR 1311.300–305), and re-audited when relevant functionality changes or at least every two years. Separately, pharmacy connectivity runs through Surescripts, which certifies the application. | Embeddable e-rx vendor (DoseSpot, NewCrop, Veradigm are the usual names — VERIFY current terms) |
| **Drug interaction / allergy checking** | Licensed clinical databases (First Databank, Medi-Span, Elsevier) | Usually bundled with the e-rx vendor |
| **Lab orders and results** | Each lab certifies each interface; it is a commercial relationship, not an API you can simply call | Aggregator (Health Gorilla, ELLKAY, Redox) or direct Quest/LabCorp programs |
| **Record retrieval / HIE** | Carequality and TEFCA participation runs through implementers | Health Gorilla, Particle, Metriport, Zus (VERIFY) |
| **Claims, eligibility, remits** *(insurance only)* | X12 clearinghouse relationships | Availity, Office Ally, Claim.MD; or API-first: Candid, Stedi, Apero (VERIFY) |
| **Payments** | PCI DSS scope | Stripe |

### Build yourself — this is the whole point

Physician workspace. Patient portal. The living care plan model and its
workflow. The AI layer. Documentation and note-taking. Scheduling (for
a solo direct-pay panel this is genuinely trivial). Longitudinal views
and trends. The value dashboard.

### The one thing that is buildable and most dangerous

**Results acknowledgement.** The catastrophic failure mode of a
homegrown EMR is not a crash; it is a critical result that arrives,
lands somewhere, and is never seen. Treat the result inbox as
safety-critical: every inbound result gets an explicit acknowledged
state, nothing can be silently cleared, unacknowledged abnormals
escalate on a timer, and the state is visible on a single screen. If
one component gets disproportionate care, this is it.

---

## 4. The regulatory floor, separated

The central question was whether a custom EMR can be used without ONC
certification. **It can.** Here is the separation.

| Requirement | Applies? | What it actually demands |
|---|---|---|
| **HIPAA Privacy & Security Rules** | **Yes. Unavoidable.** | A property of *how you operate*, not of what you bought. Nothing in HIPAA requires certified software. Risk analysis, safeguards, access control, audit controls, BAAs, breach response. A self-built EMR can be fully compliant. |
| **ONC Health IT Certification** | **No. Voluntary.** | Not a licence to practise or to use software. It is a precondition for specific federal payment programs, nothing more. |
| **MIPS Promoting Interoperability (requires CEHRT)** | **Almost certainly no** | Direct-pay bills no Medicare, so it never arises. For 2026 you must exceed **all three** low-volume criteria to be required to report: >$90,000 Part B allowed charges, >200 Part B patients, **and** >200 covered professional services. Falling below any one excludes you. The FCHC proposal's volumes sit near or under this, and in any case that work runs inside FCHC's Epic. |
| **Information blocking (Cures Act)** | **Yes** | Applies to health care providers regardless of what software they use. Practical effect on architecture: you must be able to give patients their EHI promptly in a usable electronic form. FHIR makes this nearly free. |
| **DEA EPCS** | **Yes, if you e-prescribe controlled substances** | Third-party audit or DEA-approved certifier before use; identity proofing; two-factor; logging; re-audit on relevant change or at least every two years. **The hardest wall in this document, and the clearest reason to buy rather than build.** |
| **State e-prescribing mandates** | **Check TX and VA** | Many states mandate electronic prescribing, some for all drugs, some for controlled substances only. `NEEDS-COUNSEL` |
| **Texas Medical Records Privacy Act (HB 300)** | **Yes** | Broader covered-entity definition than federal, training obligations within 90 days, steeper penalties. |
| **FDA device regulation** | **Probably not — but it is a design constraint** | The Cures Act non-device CDS carve-out (FD&C 520(o)(1)(E)) turns on four criteria, including that the clinician can **independently review the basis** of the recommendation rather than relying primarily on it. Design rule: the AI always shows its sources and reasoning. Final guidance Sept 2022, apparently revised Jan 2026 — VERIFY current text. |
| **CLIA** | **Only if you test in-office** | Ordering send-out labs does not require it; the lab holds the certificate. |
| **PCI DSS** | **Yes, for payments** | Offload entirely to Stripe. |

### A note on the pending HIPAA Security Rule overhaul

The January 2025 NPRM would remove the "addressable" designation,
making encryption mandatory and requiring MFA. **As of late October
2026 no final rule has been published**; the current Security Rule
remains in effect and the OMB target has slipped to July 2027, which is
a planning estimate rather than a deadline.

Practical conclusion: **build to the proposal anyway.** Encryption
everywhere and MFA are what you would do regardless, they cost nothing
to adopt now, and retrofitting them later is expensive. But do not
describe them as current law.

---

## 5. Minimum bar before a real patient touches it

Not aspirational. This is the floor.

**Compliance**
1. Documented HIPAA Security Risk Analysis, completed before go-live.
2. Signed BAAs with **every** vendor in the PHI path: hosting, model
   provider, e-rx, labs, email/SMS, error tracking, backups, analytics.
3. Written policies, workforce training (Texas: within 90 days), and a
   documented sanctions policy.
4. Written breach response plan.

**Technical**
5. Encryption at rest and in transit.
6. Unique user identity, MFA, automatic logoff.
7. **Immutable audit log of every PHI access**, retained at least six
   years.
8. Backups with a **tested** restore, and a written RTO/RPO.
9. Complete data export in a usable format (R-15 and information
   blocking).
10. No PHI in logs, error trackers, or analytics. This is where most
    small systems leak.
11. Separate production and development environments; synthetic data
    in development only.

**Clinical safety**
12. Results acknowledgement with escalation (§3).
13. Medication list integrity: no silent drops, full change history.
14. A **downtime plan**: what you do clinically when your system is
    down, written before you need it.
15. Amendment and correction workflow (HIPAA right to amend).

**Operational**
16. Malpractice carrier informed and comfortable with a self-built
    record system. Do not skip this conversation. `NEEDS-BROKER`
17. A named answer to "who fixes it at 9am with patients waiting."

---

## 6. Designing for the AI layer

Carrying forward the four provenance classes from `ai-layer-and-hda.md`
and grounding them in FHIR:

| Class | FHIR representation | Rule |
|---|---|---|
| **Source** | `DocumentReference`, `Binary`, with `Provenance` | Immutable; always cited |
| **Physician-authored** | `Condition`, `MedicationRequest`, `Observation`, care plan, with `Provenance.agent` = the physician | Attributed, versioned, attested |
| **Patient-reported** | `Observation` (patient-reported category), `QuestionnaireResponse` | Timestamped, unverified, labelled |
| **AI-derived** | **Never a clinical resource.** A draft object outside the clinical tables, or a `DocumentReference` whose author is unambiguously the AI | Marked, never authoritative |

**Four design rules.**

1. **AI writes drafts, never records.** A draft becomes a record only
   through a physician action that writes a `Provenance` naming the
   physician as author and the AI as contributor. Promotion is an
   event, and it is logged as one.
2. **Every AI output cites the resource IDs it read.** This is not only
   good practice; it is what keeps you inside the FDA non-device CDS
   carve-out (§4).
3. **The two agents get different read scopes.** The physician-facing
   agent may read drafts and unreleased results. The patient-facing
   agent reads only the signed care plan, released results, and the
   patient's own entries. Conflating these scopes is the most likely
   way to cause real harm.
4. **FHIR `Subscription` drives the between-visit loop** rather than
   polling or cron: a new result, a new patient entry, an overdue plan
   checkpoint.

---

## 7. Development strategy

**Direct-pay first, and it is not close.** Dropping insurance removes
claims, eligibility, coding compliance, clearinghouse integration,
superbills, payer audit exposure, and MIPS/CEHRT questions entirely.
That is roughly half the build and most of the risk. It also matches
the practice being launched.

| Phase | What exists | PHI? | Gate to enter |
|---|---|---|---|
| **0 · Synthetic** | Backend + physician workspace, built entirely against **Synthea-generated synthetic patients** | **None** | Now. Zero compliance exposure. |
| **1 · First patients** | Workspace, notes, problem/med lists, care plan, documents. E-prescribing done in a **separate standalone product**, not integrated | Yes | §5 in full |
| **2 · Patient portal** | Same data, patient-facing; care plan and results | Yes | Phase 1 stable, members asking for it |
| **3 · Integrations** | Labs in, e-rx embedded, record retrieval | Yes | Real usage proving what is needed |
| **4 · Insurance** | Claims, eligibility, coding | Yes | A separate decision, probably never on this stack |

**Phase 0 is the unlock and should start immediately.** Synthetic data
means the entire physician workspace can be designed, built and
iterated with no PHI, no BAA, no risk analysis, and no patient
consequences. Most of the learning happens here.

**Decouple e-prescribing from the build.** You cannot practise without
prescribing, but prescribing does not have to live in your system on
day one. A standalone e-rx product alongside the EMR is normal, removes
the hardest integration from the critical path, and can be folded in
later.

**Start on hosted, keep the option to self-host.** Hosted and
self-hosted run the same codebase, so this is reversible. Hosted buys a
BAA and removes the operational burden — patching, uptime, backups,
being on-call for your own record system — at exactly the moment that
burden is most dangerous. Move to self-hosted when there is a reason,
not on principle.

**The constraint nobody lists in an architecture document:** the
builder is also the physician, also at FCHC, also launching a practice.
Building an EMR is a full-time job for a team; *operating* one is a
second job that never ends. Every recommendation above is shaped by
that: buy the hard parts, start synthetic, keep the surface small.

---

## 8. What this changes

1. **X-03 is partly answered.** The EMR question becomes a backend
   choice (Medplum, hosted first) plus a vendor list, not a search for
   a product with a good API. The Tier-1 interoperability criteria in
   `experience-layer.md` §3 still apply to the *vendors* in §3 above.
2. **The Stage-2 HIPAA gate stands and now has a checklist** (§5).
3. **Phase 0 can start now** with no gate at all, because no PHI is
   involved.
4. `NEEDS-COUNSEL`: state e-prescribing mandates (TX and VA), and a
   review of §5 before go-live.
5. `NEEDS-BROKER`: malpractice carrier's position on a self-built EMR.

**Revisit trigger:** Phase 0 built and judged, or the practice's launch
setting is settled, or a vendor in §3 turns out to be unavailable to a
solo practice.
