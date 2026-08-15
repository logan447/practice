# Roadmap

Reframed 2026-08-15 under D-011: this is a **preparation project**. The
practice launches after the move to Texas. The roadmap therefore has two eras
with fundamentally different logic:

- **Era 1 — Preparation** (now → move): parallel tracks, no deadlines, paced
  by interest and preparation budget. Success is measured by what survives to
  launch, not by speed.
- **Era 2 — Launch runway** (move decision → first patient): a sequenced
  checklist with real lead times, most of it pre-designed during Era 1.

A brief Era 3 (operate and grow) is sketched at the end.

**Why tracks, not phases.** The previous roadmap sequenced phases toward an
implied near-term launch. Under the preparation frame that creates false
urgency, buries the motivating work behind legal work that cannot be finished
from a distance anyway, and makes the project feel like an obstacle course.
Tracks advance independently; you can pick up whichever one has energy behind
it. Dependencies still exist and are marked *inside* tracks — the discipline
lives there now, not in a global ordering.

**The standing test for any piece of work** (from D-011): does it survive
until launch, does it shorten or de-risk the runway, or does it make the
future practice more tangible? Work that does none of the three waits.

---

## Era 1 — Preparation tracks

The six tracks mirror the activities you identified as most useful. Each
lists its durable deliverables, its internal ordering constraints, and its
perishables — artifacts that decay and must be tagged with their date and
refreshed at the runway (R-16).

### Track A — Economics and capacity

*Understand what a mature solo practice can realistically support.*

- ✅ v1 capacity model built (`tools/practice_model.py`) — panel ceiling,
  sensitivity, ramp structure
- Refine as design decisions land: the access promise (Q-07) bounds the
  async-hours input; procedural scope shapes visit time
- Populate cost lines from indicative quotes as they arrive (X-07 meanwhile
  work); model vacation/coverage economics; model the reduced-fee mix
- Build the Q-03b runway-analysis structure so the eventual CPA conversation
  is short
- **Perishable:** indicative quotes, processing rates. The model itself is
  durable.

### Track B — Patient experience and brand

*Make the future practice tangible — for prospective patients eventually, and
for you now.*

- Practice name candidates, positioning, messaging, value proposition
- Website prototype and landing pages (draft-marked; no claims that require
  regulatory confirmation — R-13 applies to drafts too, because drafts have a
  way of shipping)
- The two-part consultation design (D-008) and the **1/3/5-year
  preliminary-view framework** — the artifact that makes $5,000 concrete for
  a specific person
- Membership materials, onboarding experience, patient education look/feel
- **Ordering note:** honest reversal from the previous roadmap, which put
  brand in Phase 4 pending geography and scope. Geography is now resolved
  (Texas), and under the preparation frame this work is a tangibility and
  validation asset that is cheap to revise — it belongs early. What still
  holds: copy touching fee scope (Q-05) or financial-health scope (Q-11)
  stays draft until those lines are drawn.
- **Perishable:** almost none — this is among the most durable work available.

### Track C — Clinical model and measurement

*The care model, specific enough to operate from.*

- Access promise, stated precisely (Q-07) — early, feeds Track A and B
- Visit structures: comprehensive in-person, routine virtual, acute
- Preventive, chronic disease, and lifestyle medicine protocols, built on
  cited guidelines
- Clinical scope boundaries, including the financial-health line (Q-11) and
  the "highly stable" criteria for biennial in-person (D-006)
- Outcome measurement design (Q-09) and the QI-vs-research architecture
  (Q-10) — **must precede Track D's requirements document**
- Patient-facing evidence explainers for each major component (durable, and
  exactly the "unusually rigorous about why" material the practice stands on)
- **Perishable:** protocols referencing specific guidelines need a
  guideline-currency check at runway; the structure is durable.

### Track D — Operating system design and build-versus-buy

*Design the ideal workflows, then decide build / buy / integrate per
capability — without committing to vendors years early (X-03).*

- Workflow designs: scheduling, telemedicine, messaging, billing/membership,
  care plans, results, refills, education, practice management
- Requirements document driven by Track C's measurement design — the async
  time instrumentation requirement (R-08) is non-negotiable in it
- Per-capability build/buy/integrate evaluation using the D-007 test: what
  does a custom build do that no compliant product does, how does it improve
  care, who maintains it in year three?
- Vendor landscape scans as **dated snapshots**
- Prototypes where they teach something — a patient dashboard mock, a care
  plan format — built to learn, not to keep
- **Perishable:** all vendor conclusions and pricing. Requirements and
  workflow designs are durable.

### Track E — Legal and regulatory research

*Portable research, prepared as briefs for the eventual Texas counsel — never
asserted as current law at launch.*

- Medicare posture comparison brief (Q-02, X-04) — primary sources only
- Texas landscape briefs: medical board licensure process and timeline
  (Q-01), telemedicine rules, entity options for physicians
- Draft skeletons for counsel: membership agreement, consent, telemedicine
  agreement, privacy policy, reduced-fee policy, coverage-arrangement terms
- Broker briefing package (X-07 meanwhile work)
- **Perishable: all of it.** Every document in this track carries its date
  and a runway-refresh tag. That is the cost of doing regulatory work early,
  and it is still worth it — the refresh is far cheaper than the first pass.

### Track F — Validation and experiments

*Test assumptions before they harden. The cheapest time to be wrong is now.*

- Conversations with concierge and DPC physicians about what actually
  consumed their time (attacks the async-hours unknown, R-08, years before
  patients can)
- Messaging and positioning tests on real people; does the 1/3/5-year framing
  land?
- Austin-first market scan: who already serves this population, at what
  price, with what model — method built to be reusable for Houston/Dallas
- Prospect-style conversations to pressure-test the two-part consultation
  design and the fit criteria
- **Honest limit:** conversion rate and true panel intensity cannot be
  measured until near-launch. Validation narrows the range; the pilot cohort
  (Era 3) measures it. Do not let early anecdotes masquerade as data in the
  model.

---

## Era 2 — Launch runway

Triggered by a settled move. Sequenced, with lead times attached when known.
Most items should already have their thinking done in Era 1 — the runway is
where designs become commitments.

Longest-lead items first:

1. **Texas medical license** (Q-01) — may reasonably start *before* the move,
   during late Era 1; the application does not wait for residency
2. **Coverage clinician** (X-06) — local relationship-building; start
   immediately on arrival
3. **Counsel engagement** — entity formation, Medicare election (X-04), all
   Era 1 draft documents to execution versions
4. **Refresh pass** — every perishable-tagged artifact from Era 1 re-verified
5. **Insurance binding** (X-07) — malpractice, own-occupation disability
6. **Vendor selection and setup** (X-03) — against the Track D requirements,
   from the then-current market; end-to-end onboarding test
7. **Space arrangement** (X-05) — per city and procedural scope
8. **Q-03b with CPA** — runway and floor, using the Track A structure
9. **Local activation** — partnerships, referral relationships, marketing
   within the validated messaging
10. **Enrollment opens**

Exit criterion: a patient can be found, consulted, enrolled, and cared for —
legally, safely, and end to end.

---

## Era 3 — Operate and grow (sketch)

Carried forward from the previous roadmap, unchanged in substance:

- **Pilot cohort first if runway permits** — deliberately small, run to
  measure the two numbers that set everything: async hours per patient per
  month and consultation conversion. The capacity model switches from
  placeholders to measured inputs.
- **Growth to target panel** — remembering the economics finding: during ramp
  the constraint is lead flow; at steady state it is physician time. Two
  different problems, planned separately.
- **Evidence and outcomes** — reporting cadence, QI projects, and publication
  if Q-10 supports it. Nothing claimed about results until results exist
  (R-13).

---

## Pacing and sustainability

- **No dates in Era 1.** Pacing follows your interest and the preparation
  budget (Q-03). The rough horizon (Q-13), once known, calibrates only the
  perishability handling and when late-Era-1 items (license application,
  indicative quotes) become worth starting.
- **Small units.** Each track advances in deliverables sized to a work
  session, not a season. The repo holds state between sessions (D-010), so
  nothing depends on momentum.
- **Tangibility is a feature.** Track B exists partly to keep the future
  practice vivid. That is a legitimate reason to work on it (D-011), and it
  is also the track most useful for validation conversations in Track F.
- **The failure mode to watch** is not moving too slowly — it is endless
  preparation (R-18). The guard: every track has "done enough for launch"
  criteria, and Era 2 defines what launch-ready actually means. Preparation
  that no runway item consumes is decoration.
