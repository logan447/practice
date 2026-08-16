# Practice Terms — Design Document

*The agreement architecture under the D-029 re-baseline (D-026). One
standard document, signed once, plus the evolving EHR care plan. No
per-patient priced schedules exist. Drafts here are design work — patient
use only after Texas counsel review at the runway (`NEEDS-COUNSEL`).*

## The architecture (three pieces, only one of them a contract)

| Piece | Contains | Changes |
|---|---|---|
| **Practice Terms** (this document's target) | Everything every patient agrees to — see outline below | Rarely; versioned; every patient signs the current version once |
| **EHR care plan** | The individualized medicine: diagnoses, medications, targets, diagnostics, referrals, follow-up | Continuously, as medicine requires — never gated by contract |
| **Internal panel model** | Whether the panel can sustain each enrollment (`tools/practice_model.py`, Q-20 utilization tracking) | Per enrollment and monthly review |

An optional **one-page care summary** (un-priced, non-contractual) may be
used for complex patients as a communication aid — what we're working on,
priorities, checkpoints. It is a courtesy, not a schedule.

## Practice Terms — outline to draft (Track E)

1. **The relationship and the price.** $100/month per adult patient
   (D-029/D-030); what membership is (an ongoing direct physician
   relationship) and is not (insurance, a guarantee of outcomes, unlimited
   on-demand service). The practice does not bill insurance for its
   services (D-031); patients keep and use their own insurance for
   everything outside the membership — labs, imaging, medications,
   specialists, urgent/emergency care.
2. **Scope of care.** Broad-scope adult primary care + lifestyle medicine,
   individualized per patient; the whole-person dimensions within D-024
   bounds; what triggers referral.
3. **Availability and communication** (D-017, Q-07). Business hours M–F;
   routine responses ~24–72h; the triage taxonomy (emergency → 911/ED;
   urgent → urgent care/local evaluation; message-me; can-wait); the
   away-period model (aware-not-absent, up to ~3 months/year) stated
   plainly; unplanned-absence contingency.
4. **Care settings.** Telemedicine-predominant; home visits when
   clinically appropriate at physician judgment, clustered by geography;
   rented-space visits for exams/procedures as needed.
5. **Boundaries — what sits outside the membership** (Q-19, the
   load-bearing section): the short, patient-friendly carve-out list
   (extensive medico-legal paperwork/forms, convenience visits beyond
   clinical indication, sustained near-daily-contact phases, travel
   beyond a stated radius, etc.), and whether any carry separate
   published charges. Designed so boundaries never arrive as surprises.
6. **Payment mechanics** (researched defaults, `payment-landscape.md`):
   monthly card-on-file auto-pay with disclosed charge triggers; cancel
   anytime with ~30-day effect (D-027); no long-term commitment; the
   published price satisfies self-pay Good Faith Estimate duties (🟥 45
   CFR 149.610) — mechanics confirmed with counsel; discounted-slot
   criteria referenced (X-10) once written.
7. **Records, privacy, portal.** Access, portability (R-15), the value
   dashboard (D-023).
8. **Prescriptions, labs, imaging, referrals.** How ordering and
   pass-through costs work (Texas: no physician dispensing; client-bill
   labs passed at/near cost with disclosure).
9. **Enrollment and fit.** The onboarding conversations (D-016); the
   practice's right to decline or defer enrollment based on capacity and
   fit; Medicare-eligibility screening (Q-21) until counsel resolves what
   can be offered.
10. **Termination and transition.** Either party, with notice; records
    transition; non-abandonment obligations (TMB norms — counsel).

## What was simplified away (2026-08-16)

The four-layer architecture with an individualized **Scope & Fee
Schedule** (priced per engagement period) is archived — incompatible with
one published price. The risk-sharing analysis's conclusions survive in
D-027 (cancel-anytime; no outcomes guarantee; optional bounded entry
courtesy). See `docs/archive/`.
