# The Practice Assistant — LM knowledge + patient context

**Status:** design + Phase-0 build (knowledge side only). Owner decided
2026-11-21 to build an AI assistant that supports patients and
clinician **before, during, and after visits** — questions, check-ins,
data collection, personalized recommendations, report generation,
conversation. This document is the architecture; D-037 logs the
decision; Q-24 holds the counsel questions.

Companion to `experience-layer.md`, whose gates this inherits —
above all: **no PHI-bearing build before the Stage-2 HIPAA
architecture review.**

---

## 1. Two content planes, never mixed in storage

| Plane | What | Lives where | Enters this repo? |
| --- | --- | --- | --- |
| **Knowledge** | Approved medical content: LM board-review book, guidelines, trials, synthesis | `kb/`, exported by `tools/kb_export.py` | Yes — it *is* this repo |
| **Patient** | Chart data, messages, vitals, questionnaires, wearables | EHR/portal and other HIPAA-covered systems, read at runtime | **Never.** No PHI in git, no exceptions — this is a GitHub repository, not a covered system |

The assistant composes the two at runtime: corpus for *what medicine
says*, chart for *who this person is*. The repo only ever supplies the
first.

## 2. The approval gate (knowledge plane)

Being in `kb/` does **not** put a note in the assistant's corpus.
Eligibility is explicit, per note, via one front-matter field:

```yaml
assistant: excluded          # the default when the field is absent
assistant: clinician         # corpus, clinician-facing use only
assistant: patient           # corpus, usable in patient-facing replies
assistant: all               # corpus, both audiences
```

`tools/kb_export.py` builds `kb/export/corpus.jsonl` (gitignored —
derived artifact) and enforces two hard rules on top of the field:

1. **Sources that are `status: unverified` or `superseded` are never
   exported**, whatever their `assistant:` value says. The corpus
   inherits the KB's honesty mechanism: only verified-current medicine
   reaches the assistant.
2. Topic/board notes that cite unverified or superseded sources export
   with a **warning**, so approval sweeps catch them.

Each corpus record carries the note's provenance (org, published,
DOI/PMID, `last-verified`) so the assistant can cite sources and show
their dates in its answers rather than asserting unattributed facts.

Defaults by note kind: `kind: board-review` is exam-oriented teaching —
cap it at `assistant: clinician` (study support), never `patient`;
patient-facing recommendations trace to current guidelines and the
synthesis pages built on them. Personal observations (`kind:
observation`, `teacher`) likewise default to clinician-only.

## 3. What the assistant does (use-case map)

| Phase | Patient-facing | Clinician-facing |
| --- | --- | --- |
| **Before** | Intake and pre-visit questionnaires; agenda-setting ("what do you want to cover?"); data collection (home BP, sleep, activity) | Pre-visit brief: chart summary + relevant KB topics for the problems on the agenda |
| **During** | — | Evidence lookup with citations; LM prescription details (doses, FITT, DASH specifics) |
| **After** | Plain-language visit summary; care-plan reinforcement; structured check-ins between visits; questions answered within scope | Visit report generation; follow-up data monitoring; flags back to the clinician |

This is the experience-layer philosophy made conversational: the
untangling evaluation, visible value (D-023), and panel-mix
instrumentation (Q-20) all gain a data channel from the check-in loop.

## 4. Safety rails (bind the assistant's prompt, not just policy docs)

- **Scope:** education, logistics, data collection, reinforcement of
  the clinician's existing plan. No new diagnoses; no medication
  changes; recommendations beyond the recorded care plan route to the
  clinician for review before reaching the patient.
- **Escalation:** red-flag symptoms → emergency guidance + clinician
  alert, mirroring the practice's written triage taxonomy (D-017).
- **Provenance:** clinically substantive answers cite corpus sources
  and surface their dates; questions the corpus can't answer get "I
  don't have approved content on that" + a flag into `kb/` open
  questions — never an unattributed improvisation.
- **Voice:** patient-facing output follows House Style (plain language,
  no claims that outrun evidence, never disparage other clinicians) —
  encoded in the assistant's prompt; the House Style checklist gates
  the prompt itself as a patient-facing material.

## 5. Phasing

- **Phase 0 — now, no PHI:** build and verify the corpus (board book
  ingestion + verification sweeps + approval marks); draft the
  assistant prompt; test against the owner's **own** health data via
  the Health Data Avatar connector (owner is the only "patient" —
  consented by definition). Everything in this repo stays Phase 0.
- **Phase 1 — clinician-facing with chart access:** requires the
  Stage-2 HIPAA review (experience-layer §6), a BAA with the model
  vendor, and EHR/portal integration chosen in X-03. `NEEDS-COUNSEL`.
- **Phase 2 — patient-facing:** adds consent language in the Patient
  Agreement, the Q-24 counsel answers, and monitoring. Not before
  Phase 1 has run quietly in real use.

## 6. Open questions

**Q-24 `COUNSEL` (logged in open-questions.md):** BAA availability and
terms with the chosen AI vendor; whether the assistant's
recommendation functions cross the FDA clinical-decision-support
device boundary; malpractice coverage for AI-assisted care; patient
consent/disclosure requirements; Texas telemedicine and TMB rules on
automated patient communication. **Unverified until counsel answers —
no assumption here is load-bearing for launch.**

**Owner/`RESEARCH`:** which runtime hosts the assistant (relates to
X-03 EHR selection and the experience-layer build sequence); what the
check-in cadence and data-collection scope are per patient tier;
licensing limits on loading the board-review book's text into a
commercial AI pipeline (the book is copyrighted — personal study use
differs from product use; check before Phase 1/2 reuse of
book-derived notes. `NEEDS-COUNSEL` if it ever faces patients).
