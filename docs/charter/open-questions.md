# Open Questions

Questions that must be answered, ordered by how much downstream work they gate.
Each has an owner — several are not mine to answer, and marking them clearly
prevents plausible-sounding guesses from hardening into plans.

**Owner key:** `YOU` — your decision · `COUNSEL` — healthcare attorney ·
`CPA` — accountant · `BROKER` — malpractice/insurance broker ·
`RESEARCH` — I can investigate and bring you sourced options

---

## Phase 0 — Gating. Almost nothing downstream is correct until these are set.

### Q-01 — What is the licensure footprint? `YOU` + `RESEARCH`

**Why it gates everything:** A virtual-primary practice can serve patients only
where the physician holds a license valid for the patient's location at the time
of care. This sets the addressable market, the marketing geography, the
compliance load, the malpractice policy structure, and what happens when a
patient travels or relocates.

Sub-questions:
- Which states are you licensed in today?
- Which states do you intend to add, and is a compact pathway available to you?
- What is the rule when an established patient travels out of state, or moves?
  This needs a written policy — it will happen in year one.
- Does the marketing geography match the licensure geography? Advertising into
  a state you cannot practice in generates unusable leads and a compliance
  problem.

**Blocks:** market sizing, brand geography, website copy, all growth work,
malpractice structure, patient agreement language.

---

### Q-02 — What is the Medicare posture? `YOU` + `COUNSEL`

**Why it gates:** The available postures — opting out, participating,
or not enrolling — carry materially different rules about what a membership fee
may cover, what may be charged to a Medicare-eligible patient, and what
paperwork must exist before the first such patient is seen. Concierge practices
handle this in more than one legitimate way, and the choice is consequential
and not casually reversible.

I am not going to characterize the specific requirements of each posture from
memory. This needs primary sources and a healthcare attorney familiar with
concierge and direct-pay arrangements. I can assemble the sourced comparison
for that conversation.

Sub-questions:
- Do you intend to serve Medicare-eligible patients at all? If yes, this is
  gating and must be resolved before enrollment opens.
- Do you intend to bill any payer for anything, ever?
- What is your intended age/demographic mix? "Healthy aging and long-term care
  planning" in the scope implies older patients, which makes this urgent
  rather than theoretical.

**Blocks:** membership agreement, fee scope definition, enrollment eligibility,
all patient-facing pricing language.

---

### Q-03 — What is the personal financial floor and runway? `YOU` + `CPA`

**Why it gates:** The practice's ramp is the actual startup risk. Revenue is
roughly linear in patient count, and patient count takes time to build. Two
numbers determine whether the plan is feasible or a slow-motion cash crisis:

- **Floor:** minimum annual income the practice must produce for you
- **Runway:** how many months of shortfall you can absorb, from savings, other
  income, or financing

Everything about pacing, marketing spend, in-person model, and whether a
pilot cohort makes sense follows from these.

**Blocks:** roadmap pacing, marketing budget, in-person location model,
target panel size, go/no-go on the whole plan.

---

## Phase 1 — Structural. Needed before the first patient enrolls.

### Q-04 — Where do in-person care blocks physically happen? `YOU`
Owned space / rented sessional space / itinerant across metros. Each differs in
cost structure, licensure implications, malpractice coverage, equipment
logistics, and how far patients must travel. Interacts directly with Q-01.

### Q-05 — What exactly does the $5,000 buy, and what does it not? `COUNSEL`
The boundary between membership services and separately billed or
separately paid services must be explicit, written, and consistent with the
Medicare posture from Q-02. Ambiguity here is both a patient-trust problem and
a compliance problem. Specifically: labs, imaging, medications, procedures,
after-hours contact, in-person visit costs, and anything delivered by a third
party.

### Q-06 — Who covers you when you are unavailable? `YOU` + `COUNSEL`
**Launch-blocking.** A solo physician selling access cannot deliver it 52 weeks
a year. Vacation, illness, and emergencies are certainties, not risks. Patients
paying $5,000 for access will judge the practice on the one week you are
unreachable. Requires an actual arrangement with an actual named clinician,
plus the credentialing, licensure, records access, and liability terms to make
it real.

### Q-07 — What is the access promise, stated precisely? `YOU`
"High-touch" and "substantially more frequent when appropriate" are the right
intent but cannot be sold as-is. The promise needs to be specific enough that a
patient knows what they bought, and bounded enough that it survives a full
panel on a bad week. Response-time commitments, contact channels, hours, and
what constitutes an emergency all need stating.

### Q-08 — Malpractice structure for multi-state virtual care? `BROKER`
Telemedicine across state lines, an itinerant or fixed in-person site, and any
procedural scope each affect coverage. Needs a broker conversation, not an
assumption. Own-occupation disability coverage belongs in the same conversation
— see risk R-07.

---

## Phase 2 — Design. Needed before systems are chosen.

### Q-09 — What outcomes will you measure, specifically? `YOU` + `RESEARCH`
D-009 commits to measurement. Measurement design constrains EHR selection,
intake forms, and consent language, so it must precede Phase 3. Needs: the
actual measures, collection cadence, who collects them, and where they live.

### Q-10 — Quality improvement, or human-subjects research? `COUNSEL` + `RESEARCH`
These are different regulatory categories with different obligations, and the
line is crossed by intent to publish generalizable knowledge. If publication is
a genuine goal (the brief says it may be), the consent and oversight
architecture must be built in from patient one. Retrofitting it is not possible
for the baseline cohort. See risk R-09.

### Q-11 — What is the scope boundary on "financial health"? `YOU` + `COUNSEL`
Education, coordination with the patient's own advisors, and long-term care
*planning literacy* are defensible in a medical practice. Specific financial
advice is a regulated activity. This is a real line, not a semantic one, and it
should be drawn before it appears in marketing copy. See risk R-06.

### Q-12 — What is the target panel size? `YOU`
Should be *derived* from the capacity math and the care-quality ceiling, not
chosen from revenue appetite. See `docs/strategy/unit-economics.md` — the model
produces this number once you supply your own time and cost inputs.

---

## Phase 3+ — Deferred by design

Recorded so they aren't forgotten, but deliberately not worked yet.

- Practice name and brand positioning — depends on Q-01 geography and Q-05 scope
- EHR selection — depends on Q-09 measurement design and Q-02 billing posture
- Website and funnel — depends on brand and on Q-07 access promise
- Paid acquisition — depends on Q-01 geography and Q-03 budget
- Pilot cohort design — depends on Q-03 runway
- Referral and partnership strategy — depends on geography and launch timing
