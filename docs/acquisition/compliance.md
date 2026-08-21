# Acquisition Compliance Map

*2026-08-21. Where marketing law, professional rules, privacy, and
platform policy touch this workstream — flagged early so ordinary
marketing proceeds confidently and the genuinely risky patterns are
designed out. Research is dated and `REFRESH-AT-RUNWAY`; nothing here
is legal advice; items marked `NEEDS-COUNSEL` feed Q-15/Q-23.*

**Posture:** the practice's marketing is inherently low-risk *by
design* — truthful, price-transparent, no outcome claims, no
incentives, no tracking. The compliance work is mostly (a) keeping it
that way under growth pressure and (b) a short counsel confirmation
list.

---

## 1. TMB physician advertising — 22 TAC ch. 164

Researched 2026-08-21 (Texas Administrative Code, Title 22, Part 9,
Chapter 164 — Physician Advertising; via TMA/legal summaries):

- False, deceptive, or misleading advertising prohibited; the physician
  is personally responsible for all ad form/content and is deemed to
  have approved it.
- **Retain a copy of every advertisement for 2 years** from last
  communication (§164.5). → *Operational rule: this repo (plus a dated
  folder for print/audio artifacts) is the ad archive — every packet
  version, ad text, directory blurb, and talk deck gets committed with
  dates. Nearly free given D-010 repo discipline.*
- Testimonials without credential disclaimers are deemed misleading
  (§164.3) — see §4.
- Credential claims: the existing guardrails (website design, standing
  rule 3 — internship not residency, "pursuing" IBLM, no
  board-certification implication) apply to **every channel**, not just
  the site: directories, GBP, packets, talks, press quotes.
- `NEEDS-COUNSEL` (already planned): the TMB-advertising pass before
  publishing wave-one (design doc §10) — extend its scope to the packet
  and directory copy pack, not just the website.

## 2. Claims discipline (R-13) — restated as the operating rule

Until outcomes exist: time, attention, price, structure, philosophy,
process. Never: outcome statistics, "patients improve X%," superiority
claims ("best," "top doctor"), or implied guarantees. When outcomes
*do* exist (D-023), publication of practice-level results is a
deliberate future decision, not a marketing drift.

## 3. Referral arrangements — the bright lines

- **Texas Occupations Code ch. 102 (Solicitation of Patients)** —
  researched 2026-08-21 (statutes.capitol.texas.gov/Docs/OC/htm/OC.102.htm):
  knowingly offering/paying or soliciting/accepting **any remuneration,
  in cash or in kind, directly or indirectly, for securing or
  soliciting patients** for a licensed provider is a criminal offense
  (Class A misdemeanor; felony with priors). It is **all-payer** — it
  does not require federal program involvement. Consequences for this
  workstream:
  - No paying referral sources, no fee-splitting, no per-patient
    anything, either direction.
  - No patient referral rewards, discounts, or gifts (funnel.md §4 —
    also a brand decision).
  - Ordinary truthful advertising to the public is fine; ch. 102
    targets *remunerated steering*, not marketing. `NEEDS-COUNSEL`
    confirmation of that reading plus its edges (see Q-23 list, §8).
- **Federal AKS/CMP inducement rules** attach where federal-program
  business exists — and D-033 means Medicare-opt-out and
  Medicaid-acknowledgment members are on the panel, with downstream
  federal claims (labs, specialists) flowing from the practice's
  orders. Design position: nothing of value to referral sources or
  patients, which moots most exposure; Medicaid *marketing/inducement*
  is already on the Q-21 counsel list.
- **Benefits brokers (Engine C):** brokers customarily expect
  commissions; whether/how a DPC practice may compensate a broker for
  employer-group placement without crossing ch. 102 / insurance-broker
  rules is squarely `NEEDS-COUNSEL` **before** any arrangement
  (Q-23). Until then: broker relationships run unremunerated or not at
  all.
- **Sponsorships** (B12): paying a church/community org for event
  presence is advertising; paying anyone *per patient produced* is not.
  Keep every sponsorship flat-fee and patient-independent.

## 4. Testimonials and reviews

- **TMB:** testimonials require disclaimers as to the attester's
  credentials (§164.3, researched 2026-08-21); the board views
  outcome-implying testimonials as inherently suspect. Current design
  already says **no testimonials at MVP** (design §5); when revisited,
  it is with counsel and D-023-grade honesty.
- **HIPAA:** using a patient's story/name/image in marketing requires
  **written HIPAA authorization** — a specific form, not a casual yes
  (`NEEDS-COUNSEL` template when the day comes).
- **Google reviews (C6):** patients may be *asked* to review; the ask
  must be un-incentivized (Google policy prohibits incentivized
  reviews; FTC endorsement rules and its ban on review suppression/
  gating point the same way — researched 2026-08-21, general knowledge,
  `REFRESH-AT-RUNWAY`). No selective "only ask the happy ones"
  gating systems; the natural-moment personal ask is both compliant and
  on-register.
- **Review responses never confirm care:** responding to any review —
  positive, negative, or fake — without acknowledging the person is or
  was a patient. Template responses drafted once, kept in the ad
  archive. A negative review is answered generically and taken
  offline; HIPAA does not bend for self-defense (enforcement actions
  exist on exactly this pattern — general knowledge, unverified).

## 5. Privacy in marketing

- **The no-PHI architecture already decided** (design §8) is the
  backbone: the marketing site and scheduler collect name/email/phone
  only; nothing clinical outside the EHR. This workstream extends the
  rule to print (no health info captured on packet materials) and to
  the ledger (no clinical content — measurement §3.1).
- **Web tracking:** HHS OCR guidance on online tracking technologies
  treats visitor data flowing from provider sites to third-party
  trackers as a HIPAA risk area (guidance issued 2022, revised 2024;
  portions vacated by litigation in 2024 — status unsettled;
  researched general knowledge, `REFRESH-AT-RUNWAY`). The practice's
  posture — no ad pixels, no remarketing tags, privacy-light
  cookieless analytics — stays *ahead* of wherever that settles.
  Keep it that way when adding any embed.
- **HIPAA marketing rule:** once someone is a patient, using their
  information for marketing requires authorization — but treatment
  communications, appointment/preventive-care reminders, and
  practice-operations communications are not "marketing." The letter:
  patients may subscribe like anyone else; the **letter list is never
  populated from the patient roster** and the two lists are never
  merged (measurement §3.1). Care communications go through the
  EHR/portal channel; the letter is public education.
- **CAN-SPAM (the letter):** truthful subject lines, physical mailing
  address in footer, working unsubscribe honored promptly — any
  reputable newsletter tool handles the mechanics; the obligation is
  the physician's.
- **TCPA (texting):** no marketing texts without prior express written
  consent. Scheduler transactional reminders with consent at booking
  are fine; the practice sends no marketing SMS at all (design
  position).

## 6. Platform rules

- **Google Ads health policies** (researched 2026-08-21,
  support.google.com/adspolicy — healthcare & medicines; health in
  personalized advertising): health conditions are a sensitive
  category — **no remarketing/retargeting or audience targeting on
  health interests**. Keyword-targeted search ads for a medical
  practice are the compliant shape (A12's design). Some healthcare ad
  formats require certification; verify current requirements when the
  A12 test is built (`REFRESH-AT-RUNWAY`).
- **No advertising of controlled substances or specific prescription
  drugs** (platform policy + DEA sensitivity + the R-26 demand-magnet
  problem): the practice never runs ads or content marketing built on
  ADHD medication, controlled insomnia medication, or brand-name GLP-1
  availability. Weight management and ADHD care are described honestly
  on the site as part of full-scope primary care (working model §5) —
  they are not acquisition hooks. *(This is simultaneously a
  compliance, panel-mix, and brand decision.)*
- **GBP:** service-area-business rules for the home-visit model
  (channels §A1, unverified — check at setup); review-solicitation
  policy per §4.

## 7. The DPC-specific disclosure

The Texas DPC statute's framework and consumer-protection logic
require the practice never be presented as insurance or a health plan.
Standing marketing rule: **"This membership is not health insurance"**
appears on the pricing page, the agreement (already), the packet, and
any ad where the price is the message. Exact required wording, if any:
part of the Q-15 compliance pass (`NEEDS-COUNSEL`).

## 8. Q-23 — the counsel list this workstream generates

Assembled here so runway counsel hours are efficient (feeds
`docs/charter/open-questions.md` Q-23; overlaps Q-15's marketing-claims
pass):

1. Confirm the ch. 102 reading: truthful public advertising and
   unremunerated referral relationships are outside it; identify any
   edge in the packet/report-back design.
2. Benefits-broker compensation for employer-group placement: any
   compliant structure, or none (blocks Engine C broker path).
3. Patient-referral thank-yous: confirm the zero-remuneration design;
   is a handwritten note + care the safe ceiling (assumed yes)?
4. Testimonial/review policy for the future: authorization template,
   TMB disclaimer format, response templates.
5. Medicaid/Medicare member marketing: inducement constraints on
   talks/materials at senior- and Medicaid-adjacent venues (extends
   Q-21's inducement item).
6. "Not insurance" disclosure wording under the TX DPC statute (with
   Q-15).
7. TMB advertising pass scope: website + packet + directory copy +
   standard talk deck + ad text (one pass, all artifacts).
8. Newsletter/CAN-SPAM posture sanity check + the patient-list
   separation rule.
