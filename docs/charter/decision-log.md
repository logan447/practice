# Decision Log

Decisions that constrain later work. Each entry records what was decided, why,
what it costs to reverse, and what it unblocks.

Format: `D-###`. Superseded decisions are kept, marked, and linked forward —
the history of why something changed is as useful as the current state.

---

## D-001 — Solo physician, no staff initially

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

The practice is one physician with no employed staff at launch.

**Rationale:** Keeps overhead low during ramp, keeps the care relationship
undiluted, and keeps operations simple enough for one person to hold.

**Reversal cost:** Low-to-moderate. Adding help later is straightforward;
the constraint is that systems chosen now must not *assume* staff exists to
work around them.

**Implications:** Every system selected must be operable by one person with no
delegation. Coverage for absence must come from outside the practice (see
`docs/charter/open-questions.md` Q-06).

---

## D-002 — $5,000/year membership

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active — working price

Annual membership fee of $5,000, with monthly and quarterly payment options.

**Rationale:** Working figure from the founding concept.

**Reversal cost:** Low before launch. High after — repricing an existing panel
is a trust event, not a pricing event.

**Open:** Price has not yet been tested against the capacity math. The correct
test is not "what do comparable practices charge" but "what panel size does
this price require, and is care still excellent at that size." See
`docs/strategy/unit-economics.md`.

---

## D-003 — Limited reduced-fee memberships based on financial need

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active — policy undefined

**Rationale:** Access consistent with the practice's purpose.

**Reversal cost:** High once granted to real patients.

**Requires:** A written policy with objective criteria, applied consistently,
before the first reduced-fee membership is offered. Discretionary,
case-by-case fee reduction creates both fairness and regulatory exposure.
`NEEDS-COUNSEL` — see risk R-10.

---

## D-004 — Virtual-primary care with dedicated in-person blocks

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

Most longitudinal care is virtual. Physical examination, preventive
procedures, and hands-on services are clustered into defined in-person periods.

**Rationale:** Concentrates the physician's fixed costs and travel, and matches
delivery mode to what each encounter actually requires.

**Reversal cost:** Moderate. Space commitments and patient expectations both
harden over time.

**Implications:** Creates a direct dependency on licensure geography (Q-01) —
virtual care reaches only where the physician is licensed, and the in-person
block requires patients to be within travel distance of wherever it happens.
These two constraints interact and are addressed together in Q-01 and Q-04.

---

## D-005 — Minimum quarterly physician contact

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

At least four physician contacts per patient per year, with substantially more
when clinically appropriate.

**Rationale:** Continuity is the mechanism by which the model is supposed to
work. Quarterly is the floor that makes longitudinal care real.

**Reversal cost:** High. This is a core promise and a primary differentiator.

**Implications:** Directly sets the per-patient time floor and therefore the
maximum panel size. This is the single largest driver in the capacity model.

---

## D-006 — Annual comprehensive in-person visit

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

Roughly annual comprehensive in-person visit; biennial permitted for highly
stable patients.

**Reversal cost:** Low-to-moderate.

**Open:** The criteria defining "highly stable" must be written down, or the
exception becomes ad hoc and the practice loses the ability to say what it
actually delivers.

---

## D-007 — Integrate before building

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

Where an established EHR, payment platform, or other compliant system already
performs a function well, integrate it rather than building custom software.

**Rationale:** Compliance, security, and maintenance burden of custom
healthcare software is large and permanent. A solo practice cannot carry it.

**Reversal cost:** Low per-decision; the standing bias is what matters.

**Test for any proposed custom build:** What does this do that no compliant
product does, how does it improve care specifically, and who maintains it in
year three?

---

## D-008 — Complimentary two-part consultation as the enrollment path

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

Two ~30-minute meetings, 7–30 days apart, at no charge, before enrollment.

**Rationale:** Mutual fit assessment, and the prospective patient can only
evaluate a $5,000 commitment if they understand what it would specifically mean
for them.

**Reversal cost:** Low before launch.

**Open:** The unpaid physician time per enrolled patient is a real cost that
scales inversely with conversion rate. Quantified in
`docs/strategy/unit-economics.md`; it is significant during ramp and modest at
steady state.

---

## D-009 — Outcome measurement as a first-class design goal

**Date:** 2026-08-15 (carried in from project brief)
**Status:** Active

The practice measures whether the model actually works, potentially developing
into quality improvement, research, and publication.

**Reversal cost:** High if deferred. Measurement design constrains EHR
selection, intake design, and consent language. Retrofitting measurement onto a
running practice loses the baseline permanently.

**Implications:** This decision must be operationalized *before* systems
selection, not after. See roadmap Phase 2 → Phase 3 ordering, and risk R-09 on
the quality-improvement vs. human-subjects-research distinction.

---

## D-010 — Repository is the project's memory

**Date:** 2026-08-15
**Status:** Active

Decisions, assumptions, models, and drafts live in version control rather than
in conversation history.

**Rationale:** The project spans years and many work sessions. Anything not
written down will be re-litigated or silently lost.
