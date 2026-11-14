# The AI Layer, and where HDA fits

*2026-11-14. Assessment, not a build commitment. Companion to
`experience-layer.md` (2026-08-17), which settled the architecture
question and is NOT superseded by this document: its four rules, its
staging table, and its Stage-2 HIPAA gate all still govern. This
document covers what is new since August: the HDA connector, an LLM as
the intelligence layer, and the insurance-based FCHC model, which the
August document did not address.*

---

## 1. What HDA actually is

Tested directly against the live connector on 2026-11-14, by exercising
every tool it exposes and reading its full FAQ corpus.

**HDA is a patient-held personal health record with an MCP interface.
One account is one person's data, held and controlled by that person.**
Its own words: "sovereign, patient-controlled infrastructure for
complete personal health data."

### The complete tool surface

| Capability | Tool | What it gives |
|---|---|---|
| Document list | `get_files_manifest` | file_id, title, date, tags, processing status |
| Document content | `get_file_transcript` | **plain text**, plus the user's own notes |
| Medications | `get_medications` | name, dosage, dates, source file |
| Questionnaires | `get_questionnaires`, `get_questionnaire_responses` | Basic Information; PHQ-9, GAD-7, AUDIT, WHO-5, MUST, GPAQ |
| Wearables | `describe_wearable_data`, `query_wearable_data`, `get_wearable_records` | Oura/Whoop fields, stats, individual events |
| Write a note | `add_note` | markdown document into the record |
| Write a journal | `add_journal_entry` | the patient's own account, in their voice |
| Draw a timeline | `draw_medical_timeline` | **ephemeral; stores nothing** |
| Skills | `read_skill` | UK PIP, UK DLA, health-history recovery |
| Product help | `search_faq`, `submit_hda_feedback` | |

### What is absent

Not "weak" or "early." Absent from the tool surface and from the FAQ:

- **Any sharing mechanism.** No clinician role, no delegated access, no
  second seat, no permissions model beyond the agent scopes the account
  holder grants to their own AI.
- **Any HIPAA or BAA posture.** The FAQ is thorough on privacy as
  *consumer sovereignty* and silent on HIPAA. That silence is
  consistent: a PHR holding a person's own data, under their own
  control, generally sits outside HIPAA because the patient is not a
  covered entity.
- **Structured labs.** There is no Observation or lab-result object.
  Labs exist only as text inside document transcripts.
- **A problem list, allergy list, or care plan object.** None of the
  three exists as structured data.
- **Any API other than this MCP connector**, and no file upload over
  it: documents go in through the web app only.

### Other facts that bear on the decision

- **Epic/MyChart import is one-off, not a sync.** Records are copied in
  once; the page must stay open while it runs. Ongoing sync is future.
- **`get_medications` is explicitly not a reconciled medication list.**
  HDA's own guidance: it is every medication mentioned anywhere in the
  record, and absence must not be read as "not taking it."
- **Vendor profile:** small, self-funded, independent team; currently
  free with paid tiers planned "after the new platform has been
  released"; mobile apps in beta with invites paused for infrastructure
  work.
- **Centre of gravity is the UK.** PIP, DLA, GDPR Subject Access
  Requests. US support is the Epic import.
- **The account is empty.** No files, no questionnaires, no wearables
  as of this assessment.

### Verdict

**HDA cannot be the shared physician-patient platform, and is not on a
documented path to becoming one.** The vision's load-bearing sentence,
"both the patient and I would have access to this information through a
shared platform, with appropriate permissions," describes the one thing
HDA does not do. Everything else in the vision rests on it.

Tested against `experience-layer.md` §2, HDA fails two of the four
rules outright: it would be a **third home** for data already in the
EMR (rule 1, one home per datum) and a **second front door** owned by
the patient rather than the practice (rule 3). It passes rule 4, since
losing it would lose no medicine.

**What HDA is genuinely good for, today:** a personal tool for the
owner's own records, and a credible thing to *recommend* to patients
who want to hold their own data. Its provenance discipline is better
than most clinical software: `add_note` warns that a confident mistake
outlasts the conversation, `add_journal_entry` insists on the patient's
voice rather than the agent's summary, and `draw_medical_timeline`
forbids filling gaps from general medical knowledge. That is the right
instinct. It is just built for one person, not for a practice.

**The boundary question that decides any further use.** A patient
keeping their own records in HDA is exercising their right to their own
data, outside the practice's regulated perimeter. The moment the
practice directs patients to put records there, or the physician reads
one *as their physician*, that perimeter moves and a BAA is needed that
HDA does not appear to offer. `NEEDS-COUNSEL` — this is a gate, not a
consideration.

---

## 2. What the AI layer changes about the August analysis

Three things, and only three. The rest of `experience-layer.md` stands.

**(a) The authoring cost of the living care plan collapses; the review
cost does not.** August rated P1 as medium complexity, the risk being
"careful workflow so it doesn't become double documentation." An LLM
removes most of the drafting labour. What it cannot remove is the
physician reading and attesting to the plan. The bottleneck moves from
authoring to reviewing, which is the correct place for it. Plan the
workflow around the review step, because that is now the scarce
resource.

**(b) Provenance becomes a first-class data-modeling requirement.**
August's rule 1 governs *where* a datum lives. The new requirement
governs *what kind of claim it is*. Four classes:

| Class | Example | Properties |
|---|---|---|
| **Source** | A cardiology letter, a lab PDF | Immutable, cited to a document |
| **Physician-authored** | Assessment, plan, order | Attributed, dated, versioned, attested |
| **Patient-reported** | Journal, questionnaire, wearable | Timestamped, unverified, labeled as such |
| **AI-derived** | Summary, extraction, suggestion | Always marked, never authoritative |

**The rule that matters: an AI-derived item may never silently become
any other class.** Promotion requires a human act that is recorded as
such. Nearly every clinical-AI failure is a provenance failure: an
inference gets written down, read back next month, and has become "the
record." Build the audit trail around class transitions, not around
page views.

**(c) Using an LLM on identified patient data is itself a BAA
question.** The August HIPAA map says every vendor in the PHI path
needs a BAA, and that BAAs are plan- and product-specific. That applies
to the model provider exactly as it applies to the database.
`NEEDS-COUNSEL` before any identified patient data reaches a model in
the practice's name.

---

## 3. The insurance model is a different animal

`experience-layer.md` is a direct-pay document. The FCHC proposal
(reviewed 2026-11-14) is not, and three constraints there are sharper
than anything in the direct-pay model.

**The platform question is already closed at FCHC.** The proposal
states the work runs "alongside FCHC's existing Epic, malpractice, and
billing systems." An outside AI platform cannot be attached to FCHC's
Epic: that is their BAA, their security review, their decision, not
his. For the insurance model, the realistic AI surface is whatever the
physician may lawfully use on his own side of the work, and nothing
that touches their instance.

**AI minutes are not billable minutes.** This is the most important
line in this document. The proposal's revenue rests on time-based
codes:

- **99491** is chronic care management *provided personally by the
  physician*, at least **30 minutes of physician time per calendar
  month**. At 300 patient-months that is roughly **150 physician-hours
  a year**.
- **99484** is behavioural health integration, at least **20 minutes of
  clinical staff time per month**, directed by the physician.
- **99495** (TCM) requires interactive contact within 2 business days
  and a face-to-face visit within 14 days.
- **G0439** (subsequent AWV) requires a defined element list including
  a **written personalized prevention plan**.

Time a model spends is not time a clinician spent. An AI assistant that
drafts the plan, summarizes the interval and answers the patient's
questions generates **zero** billable CCM time. If the resulting
documentation reads as though a human spent thirty minutes, that is a
false claim, not an efficiency.

*(Code requirements and rates move annually, and overlap rules apply —
CCM against TCM in the same month, AWV against a same-day E/M. Verify
against the current year's rules before any of this is operational.)*

**Under the proposed compensation formula, the audit risk is personal.**
Total annual pay = collections − operating costs − FCHC's 20%. A denial
or a clawback does not reduce a salary; it reduces *his* pay, directly.
That asymmetry argues for being materially more conservative about AI
in the documentation path at FCHC than in the direct-pay practice.

**Where AI is legitimately valuable in the insurance model, then:** not
as the work, but either side of it. It can *prepare* the physician's
thirty minutes so they are spent on judgment rather than chart review,
and it can *capture* what he actually did. The AWV's personalized
prevention plan and CCM's comprehensive care plan are exactly the
artifacts a model drafts well for physician review and signature. That
is the scribe pattern, it is legitimate, and the value is real. It is
simply not time-multiplication.

**Conclusion: the two models do not share a platform in v1.** The
direct-pay practice is where anything can be built. FCHC is where the
work happens inside someone else's EMR. Designing one system for both
is the main architectural trap here.

---

## 4. First principles: the atomic unit is the care plan, not the platform

Strip the vision to its claim: patients should get continuous support
rather than depend on periodic visits.

What actually breaks continuity today is not the absence of a platform.
It is that **the plan exists only in the physician's head and in a
static after-visit summary.** August named this exactly (P1: "after-visit
summaries are static and instantly stale; patients lose the thread").

So the atomic unit is **the care plan as a living, structured, shared
artifact.** If that one object exists and is maintained, most of the
vision follows from it:

| Vision element | Is actually |
|---|---|
| Patient understands their health | The plan, explained |
| Support between visits | The plan, with a conversation attached |
| Pre-visit preparation | What changed, against the plan |
| Clinical documentation | The plan's version history |
| Continuity across visits | The plan persisting |

And if that object does not exist, no platform creates it.

This has a liberating consequence: **the first version is not
software.** A structured care-plan format, maintained with discipline
for five to ten members, using the EMR as the record and a model as the
drafting and explaining tool, tests the entire hypothesis. It was
already item 5 of August's cheap option-preserving decisions: design
the care-plan and checkpoint formats as *structured* documents, because
they become the data model for free.

**The hypothesis worth testing is not "can AI explain a lab result."**
It obviously can. It is: *does structured between-visit support change
what happens at the next visit, and will members stay for it?* That is
answerable with ten patients and no product.

---

## 5. What this changes now

1. **`NEEDS-COUNSEL`, and it gates everything else:** whether patient
   data may reach HDA or a model in the practice's name, and what BAAs
   exist for each. Until answered, no identified patient data goes to
   either.
2. **HDA is a recommendation, not infrastructure.** Useful personally;
   worth knowing about for patients who want to own their records;
   explicitly not the practice's platform. Revisit only if a clinician
   seat and a BAA both appear.
3. **X-03 (EMR selection) remains the decision that gates the future**,
   unchanged from August, and the AI layer raises the value of a real
   FHIR read API rather than lowering it. The Tier-1 criteria in
   `experience-layer.md` §3 stand as written.
4. **Design the care-plan format now.** It is free, it is not software,
   it is the MVP, and it is the data model later.
5. **Keep the FCHC model out of the platform design.** Different EMR,
   different payer rules, different risk-bearer.

**Revisit trigger:** HDA ships a clinician seat with a BAA, or X-03
concludes, or the care-plan experiment runs with ten members.
