# Agreement Architecture

*Decided 2026-08-16 (D-026) after pressure-testing alternatives. This
document is the reference for what lives where, so no future document gets
created without a home — or a reason.*

## The four layers

| Layer | Contains | Changes | Owner/authority |
|---|---|---|---|
| **1 · Standard Practice Agreement** | Terms true for every relationship: nature/scope of practice, mutual responsibilities, communication & response expectations, care settings (telemedicine / home / rented space), emergency & urgent-care expectations, availability & vacations (D-017), records/privacy/portal, prescriptions-labs-imaging-referrals workflow, insurance & third-party billing principles, payment policies, refund/proration terms, termination & transition, legal boilerplate | Rarely; version-controlled; every patient signs the current version once | Drafted with Texas counsel at runway (`NEEDS-COUNSEL`); skeleton drafted in preparation |
| **2 · Scope & Fee Schedule** (individualized, 1–2 pages) | *This* relationship: problems & goals in scope, clinical scope agreed to manage, engagement period, checkpoint date(s), expected intensity & setting mix, estimated physician time, price & payment structure, insurance-billing expectations if any, exclusions specific to the relationship | Per engagement period; re-issued at renewal/re-scoping | Template in `scope-fee-schedule.md`; generated per patient from the proposal process (D-016) |
| **3 · EHR Treatment Plan** | The evolving medicine: diagnoses, medications, targets, diagnostics ordered, referrals, follow-up details | Continuously, as medicine requires — **never gated by contract** | Physician, clinically |
| **4 · Internal Economics Model** | Whether a proposed relationship is sustainable: time estimate, rate, complexity, allowance, mix impact | Per proposal; calibrated from actuals | `tools/practice_model.py` + `docs/strategy/patient-archetypes.md` |

**The contractual/clinical boundary, stated precisely:** the Schedule binds
*scope and economics* — what problems we are working on, for how long, at
what intensity, for what price. It never binds *clinical method*. Changing a
medication, ordering a different test, adjusting targets, adding a referral —
all layer-3, no paperwork. What triggers a Schedule conversation is a change
in **scope** (a significant new problem) or **intensity** (sustained care
well beyond the estimate) — normally handled at the scheduled checkpoint,
early only when the change is large and both parties agree.

## Why this beats the alternatives (the pressure test)

**vs. per-archetype agreement templates** (the structure this replaces):
six templates meant six documents to maintain, review with counsel, and
keep consistent — and worse, they presented as six *products*, quietly
undoing D-014. Real patients blend archetypes; a template-per-archetype
forces a classification decision that the Schedule makes unnecessary.
The archetypes survive where they are genuinely useful: as internal
scenario cards (`docs/strategy/patient-archetypes.md`) and as future
website *illustrations* of what arrangements can look like.

**vs. one single document per patient** (agreement + specifics merged):
puts stable legal terms through per-patient variation — counsel review
per patient or silent drift, and the individualized part gets buried in
boilerplate. Rejected.

**vs. no standard agreement** (Schedule only): leaves availability,
emergencies, termination, and payment policy undocumented or repeated
per patient. Rejected.

**Stress cases checked:** a patient spanning archetypes (the normal case —
Schedule handles natively); mid-period scope change (checkpoint or early
re-issue); a pure episode (Schedule with an end date instead of a renewal);
a reduced-fee arrangement (same Schedule, different rate per X-10 policy);
a future hybrid-insurance arrangement (the Schedule's insurance-expectations
section is where per-patient billing posture lives — the standard agreement
states only principles). Nothing found that needs a fifth layer or a second
template.

## Engagement periods and checkpoints (D-016, extended)

Relationships are **defined engagements, not open-ended subscriptions**:

- Initial period sized to the situation: several weeks (E), 3 months, 6
  months, 12 months, or ongoing-with-checkpoints — chosen in the proposal.
- Every Schedule names its checkpoint date(s). The checkpoint agenda is
  standard: what improved (the D-023 trends) · what remains unresolved ·
  how much care was actually required (estimate vs. actual) · whether the
  relationship is still valuable · whether scope or intensity should change
  · what the next period costs · whether both parties want to continue.
- Renewal re-issues the Schedule (often shorter than the first one — a
  known relationship needs less contractual scaffolding). Non-renewal is a
  legitimate, planned-for outcome with records transition per the standard
  agreement.

This is the structural answer to "individualized without constant
renegotiation": terms never renegotiate, scope renegotiates only at
defined moments, medicine never waits for either.

## What was consolidated away (2026-08-16)

`docs/archetypes/` (six patient-facing archetype proposals + README) —
distilled into: this architecture, the Schedule template (with one full
worked example), the internal scenario library, and the two research
documents which moved here (`payment-landscape.md`,
`pricing-conversation.md`). Full text lives in git history.
