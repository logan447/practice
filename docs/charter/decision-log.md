# Decision Log

Current decisions, titled so that **scanning the headings alone gives an
accurate picture of the practice as it now stands** (D-025). Superseded
thinking is compressed to history one-liners; the fuller story lives in
`docs/archive/` and git history.

Last revised: 2026-08-16 — **project re-baselined around D-029.**

## The architecture at a glance

**The practice:** D-029 **$100/month per patient, flat, direct-pay** ·
D-030 adults only, one price, no tiers · D-033 insurance status is not
an eligibility bar (Medicare via opt-out; Medicaid via private-pay
acknowledgment; only dual/QMB excluded) · D-014 standardized price,
individualized medicine · D-001 solo, no staff · D-017 bounded
availability, no 24/7 obligation · D-016 structured onboarding as the
enrollment and capacity gate · D-023 value made visible · D-024
financial-health scope bounded · D-032 the ten agreement terms

**Business:** D-018 goal ~$100k after-tax at 30 hr/wk × 39 wk — met at
~140 adults · D-031 insurance never required for core economics · D-022
grassroots + employer-membership growth · D-003 an affordability
mechanism will exist (form deferred)

**Operations & technology:** D-026 one Practice Terms document + EHR care
plan · D-027 cancel-anytime monthly; no outcomes guarantee · D-021
established EHR core + simple front-door website · D-007 integrate before
build

**Project:** D-034 named: **DuBose, M.D.** · D-011 preparation project · D-012 Texas, Austin lean · D-019
~12–24 mo horizon; VA license now, TX after settling · D-020 $20k prep
ceiling · D-010/D-013/D-025 how this repo works

---

## D-034 — The practice is named: DuBose, M.D.

**Date:** 2026-08-18 — resolves Q-22.

The practice name is **DuBose, M.D.** — the physician's shingle as the
brand, in its most classic form. Header lockup: "DuBose, M.D. · direct
primary care." Rationale: the practice's entire differentiation is a
person accountable to you; the site is written in the first person; in
grassroots referral the sentence is "you should call Dr. DuBose" — the
name and the promise are the same thing. Runner-up considered: DuBose
Medicine; concept names (Whole Picture Medicine, Steady Medicine)
screened and set aside — "whole picture," "unhurried," and "plain"
remain working vocabulary, not trademarks.

**Domains (DNS-screened likely available 2026-08-18 — verify and buy
promptly):** dubosemd.com, dubose.md, dubosemedicine.com (defensive).
**Still required before public use:** trademark screen; Texas
assumed-name (DBA) registration under the future PLLC; TMB
advertising-rule check on the name — all on the existing counsel list.

## D-029 — Standard direct-pay price: $100/month per patient

**Date:** 2026-08-16 — the foundational business-model decision; the
project is re-baselined around it.

One flat rate: **$100/month per adult patient ($1,200/year)**, direct-pay,
published. No tiers, no complexity surcharges, no individualized
contracts, no couple/household/family rates. The practice must be able to
function entirely on this rate.

**Rationale:** simple to say, simple to buy, genuinely affordable against
the researched market (national DPC average $98, Austin ~$106 — this
price is already market-validated); supports a ~140-adult panel at ~5–6
hours of attention per patient — half the volume-DPC capacity ceiling —
which is where the depth of the relationship comes from.

**What it demands (unit economics §3):** flat pricing makes **panel-mix
management** the load-bearing discipline — heavy-utilization patients are
sustainable at roughly 1 in 8–10 of the panel, protected by the
enrollment gate, per-patient utilization tracking, renewal re-scoping,
and the Q-19 carve-outs. The price is fixed; the mix is managed.

**Revisit when:** real-world evidence (validation, ramp, utilization
data) gives a strong reason — not casually.
**History:** succeeded, in order: $5,000/yr membership (D-002 original) →
fully open pricing → individualized time×complexity framework → two-tier
membership (D-028). See `docs/archive/`.

## D-030 — Adults only; each adult is their own patient at the same price

**Date:** 2026-08-16

No pediatric care. Enrollment is per-adult: an individual, each member of
a couple, or several adults in a family each establish their own
physician-patient relationship at $100/month (couple = $200, three adults
= $300). No dependent, household, or family pricing exists, and
couple/family workflows are deliberately not built until there is a real
reason.

## D-031 — Insurance is never required for the core economics

**Date:** 2026-08-16 · updated 2026-08-17 by D-033

The practice launches and can operate indefinitely as pure direct-pay on
the Texas DPC statute (Occ. Code ch. 162 subch. F). Insurance
participation as a *billing* matter remains a research track (X-04) —
never a launch dependency. **Patients' own coverage, however, is
embraced, not excluded** (D-033): members keep and use Medicare,
Medicaid, or commercial insurance for everything outside the membership,
and the practice's opt-out/private-pay architecture is designed to keep
their downstream benefits working for the care it orders.
**History:** distilled from the researched architecture comparison
(archive: `payment-architecture.md`); the earlier note that "Medicaid is
effectively incompatible with membership fees" was refined by the Q-21
research — incompatibility applies to *enrolled providers* and
*dual/QMB patients*, not to voluntary private-pay with a non-enrolled
physician.

## D-032 — Agreement operational terms (the ten drafting decisions), approved

**Date:** 2026-08-17 — approving the recommendations exposed by the
Patient Agreement draft:

1. Q-19 carve-outs as drafted — **amended 2026-08-17: paperwork
   (disability/FMLA/insurance forms, letters, prior authorizations,
   medicolegal documentation) is INCLUDED and advertised as a service,
   not a fee**. Remaining outside the fee: out-of-area travel (out of
   scope, not surcharged) and procedure supplies at disclosed cost.
   Unchanged: **high-intensity episodes are a fit conversation, never a
   fee**; **no no-show fees**. Watch-item: formal litigation support
   (depositions, expert-witness record review) is hours-heavy — tracked
   under utilization (Q-20/R-26) rather than fee-gated, revisit only on
   evidence
2. No separately-charged convenience home-visit tier
3. Card-on-file required as a condition of membership; annual prepay at
   the same price
4. No enrollment fee (founding-cohort policy)
5. Re-enrollment: no fee; normal enrollment conversation + capacity
6. Fee changes: 60 days' written notice, effective at a future renewal
7. Prescription bridge at termination: up to 90 days where clinically
   safe; electronic records copy always free
8. Home-visit service area: set with the launch city (placeholder stands)
9. Sudden-incapacity contingency: to be designed (runway + carrier item)
10. Controlled-substances telemedicine policy: to be drafted with
    research + counsel before launch

**Eligibility (§1.4) is deliberately NOT settled here** — under revision
per the Medicare/Medicaid research (Q-21).

## D-033 — Insurance status is not an eligibility bar; Medicare via opt-out at launch

**Date:** 2026-08-17 — replaces the blanket Medicare/Medicaid exclusion,
which the Q-21 research showed was a premature design-around
(`docs/agreements/medicare-medicaid-membership.md`).

**The principle, now verified as achievable:** insurance is a financing
mechanism for healthcare elsewhere in the patient's life; it does not
determine whether the relationship can exist. Any adult joins at
$100/month; program rules are handled underneath with at most one extra
signature:

- **Original Medicare: joinable via formal opt-out + §405.415 private
  contracts.** Verified: the member's Medicare stays fully intact for
  everything else — Part B pays for what the opted-out physician orders
  and refers (valid affidavit + NPI on file), Part D fills his
  prescriptions, hospital coverage unchanged. **Opt-out is a
  launch-runway act, timed with ending Medicare-billed moonlighting**
  (all-or-nothing under the NPI; never-enrolled physicians can opt out
  any time).
- **Medicare Advantage:** joinable under private contract; **HMO members
  get a plan-specific conversation first** (no rule guarantees MA
  coverage of an opted-out physician's orders).
- **Texas Medicaid: joinable** as voluntary private-pay with a signed
  pre-service acknowledgment (F00072-style, per membership term).
  FFS-Medicaid members get a written downstream warning (orders/
  prescriptions denied unless ORP-only enrollment resolves it — pivotal
  counsel question); MCO members are exempt from the state ORP edit.
- **The one exclusion that survives: QMB/dual-eligible patients** —
  private-pay and private contracts are barred/high-risk; excluded
  pending a written counsel opinion.

Intake screens coverage status and re-checks periodically. Counsel
confirmation list in the brief, Part C.
**History:** the agreement's v1 provision excluded all Medicare/Medicaid
enrollees; researched and replaced 2026-08-17.

## D-001 — Solo physician practice, without staff

One physician, no employed staff at launch. Systems must be operable by
one person. **Reopen when:** non-clinical work displaces patient contact.

## D-003 — An affordability mechanism will exist; its form is deferred

At $100/month the price is already near the affordability frontier;
what remains of this commitment is likely **a small number of discounted
or free memberships** for genuine need (X-10) — bounded, criteria-based,
decided when the panel is real. Sliding-scale architecture is retired.

## D-007 — Integrate established systems before building custom software

Custom builds must answer: what does no compliant product do, how does it
improve care, who maintains it in year three. Refined by D-021.

## D-010 — The repository is the project's memory

Decisions, models, and drafts live in version control, not conversation
history.

## D-011 — This is a preparation project; launch follows the move to Texas

Work is judged by durability, leverage on the launch runway, and
tangibility. Perishable research carries dates and `REFRESH-AT-RUNWAY`
tags (R-16).

## D-012 — Texas is the launch state; the city is deliberately open

Austin lean; Houston/Dallas alternatives (X-01).

## D-013 — Two registers: decisions made here, deliberate deferrals in deferred-decisions.md

## D-014 — Standardized price, individualized medicine

The north star, restated for the re-baselined model: we are not building
a pre-designed care program patients are fitted into. **The price is the
only standardized thing.** The medicine — settings (telemedicine, home
visits, rented space), frequency, focus, and duration — is tailored to
each person:

> Meet someone → identify that I can help → one or two structured
> conversations → understand the whole situation → agree on how we'll
> work → provide care → track whether their well-being improves.

**The signature clinical skill** remains untangling: listening to a
person who is scared, frustrated, or overwhelmed — health tangled with
stress, money, work, relationships, sleep — naming the priority problems,
separating urgent from important, and working one realistic plan over
time. **The economic caveat is now explicit** (unit economics §3): at a
flat rate this work is carried by the panel's balance, so untangling
depth is protected by managing the mix, not by pricing it.
**History:** absorbs the former per-patient economic tailoring; clinical
individualization is unchanged.

## D-016 — Structured onboarding: the enrollment and capacity gate

One or two complimentary conversations → records reviewed → needs
understood (medical, psychological, lifestyle, functional, practical) →
priorities triaged → honest mutual decision. **Its economic function
changed:** with one published price there is nothing to quote; onboarding
is now the practice's **capacity and mix gate** — can this person be
served well within the model at the panel's current mix? "Not yet," "not
me," and "let me refer you well" are legitimate outcomes. Clinically it
remains the first act of care.
**History:** formerly produced a priced individualized proposal
(archive: `scope-fee-schedule.md`).

## D-017 — Availability is bounded and explicit; no 24/7 obligation, no default coverage layer

Business hours M–F; no routine evenings/weekends; up to ~3 months/year
away from regular scheduling — *aware, not absent* (periodic review of
messages, workups, significant results; triage when truly necessary);
routine matters ~24–72h; written patient-facing taxonomy (emergency → ED;
urgent → urgent care; message-me; can-wait). Patients may keep other
physicians. The Q-17 minimum-structure verification (counsel + carrier)
still gates launch wording. **Scale note:** these expectations must now
hold across a ~140-patient panel — the triage taxonomy and portal design
carry more load than they did at boutique scale.

## D-018 — Goal: ~$100k after-tax at ~30 hr/wk, 39 wk/yr — met at ~140 adults

Autonomy, flexibility, relationships, and time away rank above income
maximization. Under D-029 the goal is met at **~129–146 adults** with
~5–6 hr/patient — the sweet spot of the architecture (unit economics §2).
$150k would require ~200 patients at near-volume intensity; explicitly
not the plan. Tax translation is a CPA band (Q-18).

## D-019 — Launch horizon ~12–24 months; Virginia license now, Texas after settling

The current part-time clinical work is deliberate preparation — skills,
workflow observation, billing exposure — and (per researched Medicare
rules) it blocks opt-out until it ends.

## D-020 — Preparation budget: $20,000 ceiling; grassroots and capital-efficient

A ceiling, not a target. Counsel hours are the scarcest purchased
resource; research briefs exist to make each one count.

## D-021 — Established EHR as clinical core; simple front-door website

EHR carries records, messaging, e-prescribing, telemedicine, results,
scheduling, portal trends (D-023); a lightweight site is the public front
door. Membership billing needs a card-on-file subscription platform (the
researched DPC stack). Minimal vendor count (R-12).

## D-022 — Growth: grassroots relationships + employer memberships

Word of mouth, community, physician referrals, organic content — plus
**employer-sponsored memberships** (researched: 58% of the national DPC
market, lowest churn; two 30-member employers ≈ 40% of the panel).
Pre-outcomes marketing speaks to process, time, attention, and
personalization — never to results that don't exist yet (R-13).

## D-023 — The value of care is made visible; publication is not a goal

**Value = Quality ÷ Cost.** Portal-visible trends (vitals, labs, symptoms,
function, medication burden, well-being, encounters) plus what the
patient spent — at $100/month, the cost side is trivially transparent,
which strengthens the value story. Internal case summaries for learning;
research/publication only if deliberately revisited later.

## D-024 — Financial health means stress reduction within medical scope, not financial advice

In scope: financial-stress-as-health-determinant work. Out: investment
advice and financial planning — referral relationships instead.

## D-025 — Documents show the current model; history steps back

Headings reflect the current architecture; superseded thinking compresses
to history notes, the archive, and git.

## D-026 — One Practice Terms document + the EHR care plan

The agreement architecture, simplified by D-029: **(1) Practice Terms** —
the single standard agreement every patient signs (scope, mutual
responsibilities, availability and triage, care settings, boundaries and
resource-intensive carve-outs (Q-19), payment/cancellation, records,
termination; counsel-drafted at runway); **(2) the EHR care plan** — the
evolving individualized medicine, never gated by contract; **(3) the
internal panel model** (`tools/practice_model.py`). No per-patient priced
schedules exist. An optional un-priced one-page care summary may be used
for complex patients as a communication aid, not a contract.
**History:** formerly a four-layer architecture with an individualized
Scope & Fee Schedule (archive).

## D-027 — Cancel anytime; no outcomes guarantee

Monthly billing with cancel-anytime (standard ~30-day terms) *is* the
risk-sharing: nobody ever pays for months of care they don't want.
The researched rejection of outcomes/value guarantees stands (archive:
`risk-sharing.md`). A bounded entry courtesy ("if the first month isn't
right, it's on me") remains an option to decide with the Terms —
`NEEDS-COUNSEL`.
**History:** the pro-rata engagement-refund architecture collapsed into
monthly billing's inherent fairness.

## D-035 — Website and collateral baseline locked (2026-08-21)

The website (site/) and the print outreach collateral are the approved
baseline. No further discretionary redesign or copy changes; future
changes come from actual use, patient feedback, analytics, or launch
needs. Two source-of-truth documents are binding on all patient-facing
and outreach materials, web and print:
`docs/website/design-house-style.md` and
`docs/website/writing-house-style.md`. The writing standard includes
the referral-safety rule: nothing may imply a patient's current
doctors lack time, don't listen, or provide inadequate care. The
approved hero line is "Unhurried primary care from a doctor who knows
you." Mobile sticky CTA behavior: appears after the hero or page title
scrolls away, persists, hides when the closing CTA band or footer is
in view (supersedes the after-the-price trigger; the price now
appears in the hero, so the seen-the-number principle still holds).
**Revisit triggers:** launch-city facts landing ([City], service
area, licensure), counsel/TMB review outcomes, scheduler and portal
vendor selection, first real conversion data.

## D-036 — FCHC salaried role, start 1 June 2028 (2026-10-25)

The ask to FCHC is a **salaried position at 0.75 FTE, 30 hours per week
annualized, $41,500 a year**, schedule given quarterly, about 83 ten-hour
clinic days placed only on the weekdays Jamie is already home. Sixteen
patients a day base case, twenty as upside. Twelve weeks off. No paid
childcare. Full model in `docs/fchc/the-plan.md`; the document that goes
to the clinic is `docs/fchc/FCHC-proposal.docx`.

**Start date is 1 June 2028, not January 2027.** The schedule is built
for the years with young children at home, which begin in 2029, and a
quarter of runway before that lets the problems surface first. January
2027 through May 2028 continues the current hourly arrangement while two
UNSET inputs get tracked: the clinic's actual collection per encounter,
and whether demand supports sixteen patients in a ten-hour day.

The wording of the contract is the part that carries the PSLF outcome. A
day rate or an hourly rate puts about 16 hours a week on a timesheet and
fails the 30-hour test. 0.75 FTE at 30 hours per week annualized reports
30 directly, counting leave as the form instructs.

**Known cost of the later start:** the interim hourly months are under
30 hours a week and so are unlikely to produce qualifying payments, which
moves forgiveness from roughly spring 2035 to roughly September 2036
(EST). Accepted in exchange for a schedule that holds once the children
are home.

**Revisit triggers:** the October 2027 check on collections and volume;
any FCHC counter on salary, FTE wording or schedule control; a change in
Jamie's work pattern that moves the 83 free weekdays; confirmation of the
payment count with the servicer; a sourced figure for physician pay as a
share of collections, which is currently paywalled and therefore absent
from the document.

**Amended 2026-10-25 (iteration 8):** the document that goes to the
clinic is **one page plus the appendix calendar**, in three sections:
the proposal, what this earns the clinic, and my compensation and
schedule. 284 words. The structure answers the three things Dr. Stinar
has to decide: does this cost or make the clinic money, what exactly am
I agreeing to, and what do I have to do now. Everything that was
sourcing or explanation moved into footnotes. The timeline is a Gantt
chart rather than prose or a table. Owner test for any further change:
is this the easiest way to present it to him, and what is the least we
can present and still be effective.

**Amended 2026-10-25 (iteration 9):** the clinic economics are presented
as a **break-even per visit** rather than as outcomes at assumed
collection rates. $57 a visit at sixteen patients a day, $45 at twenty,
both at 40 percent marginal overhead and a $45,235 loaded cost
(`tools/fchc_roi.py`). This is the honest form of the argument while the
collection rate is UNSET, and it gives Dr. Stinar one number he can
check himself. Revisit when the actual collection per encounter lands.

**Amended 2026-10-25 (iteration 10):** the clinic economics come **out
of the document entirely**. Reasoning: we do not know FCHC's cost
structure, so presenting marginal-overhead modelling to the person who
runs their books is a guess dressed as analysis, and it invites an
argument we cannot win on their turf. The modelling was for us, to reach
a defensible number. It stays in `tools/fchc_roi.py` and in this repo
for the negotiating table, and is volunteered only if asked. The
document now carries the ask, the timeline, the schedule, and one market
comparison. **Revisit trigger:** FCHC asks how $41,500 was arrived at,
or counters on salary.

**Amended 2026-10-25 (iteration 11):** the proposal is **one page, one
section, two figures**. The timeline and the now/then table merged into
a single figure, since the attributes belong to the two phases the
timeline already draws. The vacation strip came out as redundant with
the example year calendar, which now sits on the same page rather than
as an appendix. 49 words of prose. The governing test remains: the least
we can present and still be effective.


---

## D-037 — Start the FCHC contract in January 2027 at $40 an hour

**Decided 2026-10-25.**

The contract begins **January 2027**, not June 2028, at **$40 an hour**.
Everything else is unchanged: 35 Service Weeks, 70 clinic days, two a
week, 15 clocked hours, 16 patients a day, $42,000 a year.

**Reasoning.** Owner, 2026-10-25: "in 2027, I could strike this deal
with Dr. Steiner... If I did that, regardless of what I do with my off
time (be it for Olera now over the next 20 months or in the future when
I have kids), it would be the same. I could start that now, start
counting for PSLF." The contract is the same contract whatever fills the
other days, so the proving period was buying nothing. It cost 17 months
of qualifying payments: forgiveness moves from about September 2036 to
about April 2035 at no extra cash cost, because he is already in
repayment and the payments happen either way.

$40 rather than $45 is the owner's own offer to the clinic
(2026-10-25), on the reasoning that volume is free to him and a $10
rate cut buys the clinic what four more patients a day would. At $40
and 16 patients the clinic keeps $21,420 a year on a $100 blended rate,
a 47 percent return on a $45,780 loaded cost
(`tools/fchc_roi_2027.py`).

**Consequences for the document.** The Gantt chart and the now/then
columns came out, because with no waiting period a timeline has nothing
to draw. They are replaced by a strip of four numbers: 70 clinic days,
1,050 clocked hours, 1,120 visits, $42,000. The example year is now
2027 rather than 2029. 25 words of prose, one page.

**Revisit trigger:** FCHC counters on rate, or counsel finds the
8-month provision does not reach a clinic.

## D-038 — Day picks differ in 2027, and the second car comes out

**Decided 2026-10-25.**

In 2027, with no children, clinic days go where **Jamie is already
working**, so their off time lines up. From 2029 they go where she is
**home**, so somebody is already doing childcare. The contract shape
does not change; only the weekdays do.
(`tools/fchc_schedule_2027.py`, `tools/fchc_schedule_2029.py`.)

The 2027 picks also choose for **one car**. Owner, 2026-10-25: "I
probably wouldn't even have to get a car at first because there are
always two days where I can either ride with Jamie to work, or she's
off and I can take the car." The model now prefers her post-call days
and her 12s, which are days she is working and the car is home: 70 of
70 clinic days on her working days, 46 of them car-safe. The 24
remaining are weeks with two 24s, where only one weekday is both hers
and car-safe. The cost is six weeks with the two clinic days back to
back.

**This is what makes the savings floor work at $40.** Two cars saves
$17,649 against a $25,000 floor. One car clears it, by $99 if he drives
and $1,613 if he rides in (`tools/fchc_one_car.py`). The second car was
$8,964 a year, $7,450 of it fixed.

**Revisit trigger:** `NEEDS-CONFIRMING` that riding in together is
geographically possible at all, which nobody has checked. If Jamie's
hospital and the clinic are not a shared trip, only her days off give a
free car and both the day picks and the floor change. Revisit again
from 2029, when three children and car seats are in the picture.

---

## D-039 — Reposition as Direct Lifestyle Medicine, $99/month

**Decided 2026-11-12, owner direction.** Supersedes D-035's copy lock
for the site, which was locked against *discretionary* change; this is
a requested repositioning.

**The practice is now Direct Lifestyle Medicine**: a physician-led,
membership-based practice combining prevention and lifestyle medicine,
medical treatment, and care coordination. Not "DuBose, M.D. · direct
primary care."

**Three integrated services, not tiers:** prevention and lifestyle
medicine (the foundation, every member), medical care and treatment
within scope, and care coordination. The site states in several places
that lifestyle medicine is the clinical approach, not a restriction
against prescribing, testing, or treating.

**Patients do not need an existing primary care physician.** This was
the single largest message change. The old site assumed one and
positioned the practice as an added layer. The new site says both
arrangements work and that nobody is asked to choose.

**Price $100 to $99**, plus two new membership levels: sliding scale
(reduced fee by financial circumstance) and pro bono (a limited number,
free). The site states at every mention that the clinical care is
identical at every fee level.

**Two claims were walked back, not just reworded:**

1. *"I have formally opted out of Medicare."* This appeared on
   /questions and in the membership agreement as settled fact. Owner
   direction is that the legal and billing arrangements are **not
   finalized**. All Medicare and Medicaid copy is now provisional and
   says so plainly, and the agreement carries a bracketed note that the
   clause is unfinished and under counsel review. The QMB exclusion,
   the Medicare private contract, the Medicare Advantage HMO
   discussion, and the Texas Medicaid private-pay form all came out,
   because each asserted an arrangement that does not yet exist.
   `NEEDS-COUNSEL`
2. *HSA and FSA eligibility*, which was argued from direct-primary-care
   status. Now provisional, because the final structure is unsettled.
   `NEEDS-CPA`

**Scope language tightened.** "Membership covers the full range of
adult primary care" and "full-scope adult primary care" are gone. The
site now says the practice treats within scope and refers when
something is outside it, and /help carries an explicit "this membership
is not a promise to manage every medical condition you have."

**Voice kept in first person.** The brief's core description is written
in "we." Writing House Style rule 10 binds the site to "I" for a solo
physician, and the brief's own tone section asks for "a thoughtful
physician explaining." The site stays in "I."

**"Direct primary care" as a term is gone from patient-facing copy**,
but the membership agreement still cites Texas Occupations Code ch.
162, subch. F. Whether that statute still governs once the practice is
not positioned as DPC is a question for counsel, not for the copy.
`NEEDS-COUNSEL`

**Design untouched.** No new components, dependencies, pages, or
routes. Navigation, URLs, forms, the booking mock, and the visual
language are as they were. Band rhythm preserved; one paper section was
added to /how-it-works and the section after it moved to tint to keep
the alternation.

**Not reconciled:** `print/`, `docs/outreach/`, `docs/acquisition/`,
`docs/agreements/`, and most of `docs/charter/` still carry the
$100 direct-primary-care model. The duplication rule is currently
broken between site and print. **Revisit trigger:** before any print
run or outreach packet goes out.

### D-039 addendum — print and outreach brought into line (2026-11-12)

The brochure (`docs/outreach/pieces/01-patient-brochure.md` and
`print/brochure/build.py`), the one-pager
(`docs/outreach/pieces/02-practice-one-pager.md`), the packet
architecture and the production economics now carry the same model as
the site. The duplication rule is closed between site and print.

**The brochure's §5 debt is paid at the root.** Open item 3 on the
brochure, queued 2026-08-21, held three debts: em dashes, reading
level, and a physician-respect problem on panel 2. Panel 2 carried
"results nobody fully explained," "no one is looking at the whole of
it, with you," and "The problem usually isn't a lack of healthcare.
It's that nobody has time to think it through with you." Those are
banned patterns in House Style §5, in the one piece designed to be
handed to a patient **by their own physician**. They are deleted, not
softened. The panel now describes what this practice does and says
nothing about what anyone else fails to do. Em dashes are gone from
every panel; the register is short plain sentences.

**Insert D lost two lines for the same reason.** "A doctor with time to
listen" is a time-contrast pattern aimed at organizations whose people
already have doctors. "For seniors: you keep Medicare" is an assurance
the practice cannot currently give.

**Panel 3 is now the three services** and states "You do not need
another doctor to join" in bold, because the brochure travels inside
clinician packets and that sentence is what stops the piece reading as
a bid for their patients.

**Nothing in print states how Medicare or Medicaid work with a
membership.** Print says the fee is not billed to them and invites the
question. Guardrail 4b in the packet architecture now forbids more
until counsel settles it. `NEEDS-COUNSEL`

**Build note.** `print/brochure/build.py` could not run: its Chromium
glob expected `chrome-linux/`, and the bundled browser is now at
`chrome-linux64/`. The lookup tries the stable `/opt/pw-browsers/chromium`
symlink first and falls back across both layouts. Panels 2, 3 and 4
gained foot-anchored closing blocks (`margin-top:auto`) so short panels
read as composed rather than unfilled, and the flap is set a shade
more open. Proof renders: 2 pages, exact 11 x 8.5 in trim.

**Still not reconciled:** `docs/acquisition/`, `docs/agreements/`, and
most of `docs/charter/` carry the $100 direct-primary-care model.
`docs/agreements/medicare-medicaid-membership.md` is the one to read
first, since D-039 unsettles its conclusions.

---

## D-040 — The prototype's working year is bound to D-017 and D-018

**Decided 2026-11-15, during the EMR prototype build.**

The prototype's scheduling now runs on the decided working year rather
than on free-floating appointments: 30 hours a week for 39 weeks
(D-018), Monday to Friday business hours (D-017), up to about three
months a year away (D-017), home visits at 150 minutes including
travel (working-model.md §4), and a panel target of about 140 adults
at 5 to 6 hours each (D-018). Booking refuses what does not fit and
says why. The model and its tags live in `app/src/domain/schedule.ts`.

**Two inputs are assumptions, not decisions, and are marked as such on
screen:** 90 minutes of admin per clinic day, and 180 minutes a week
of messaging and results to cover the 24 to 72 hour response
commitment in D-017 with no coverage clinician.

**The arithmetic does not agree with D-018 and the gap is being kept.**
1,170 hours minus the messaging assumption, divided by 5 to 6 hours
per patient, gives a carrying capacity of 175 to 210 adults. D-018
targets about 140. The difference is roughly 213 hours a year, about
5.5 hours a week. Three readings are possible: the messaging
assumption is too small, the sourced per-patient hours already include
work this model double counts, or D-018 held back capacity for a
reason nobody wrote down. The prototype displays the gap rather than
tuning an assumption until the two agree, because that would destroy
the evidence that something is unaccounted for.

**Revisit when:** three months of real messaging and admin time exist.
`REFRESH-AT-RUNWAY`

---

## D-041 — What the record can produce, and the information-blocking posture

**Decided 2026-11-15, during the EMR prototype build.**

The prototype generates five documents from the record: a visit
summary, a referral letter, a work or school note, a prior
authorization request, and the whole record as a FHIR R4 Bundle with a
readable copy beside it. Generated rather than typed, so none of them
can disagree with the chart. Patient-facing documents follow the House
Style; clinician-facing ones do not, because a referral letter written
at a fifth-grade level wastes a colleague's time.

**The work note withholds the diagnosis by default.** An employer
needs to know the person was seen and what they can do. Whether to say
why is the patient's decision, not a template's. Including it is a
checkbox that is off.

**The prior authorization says nothing about the membership.** It
argues the clinical case only. Guardrail 4b of the D-039 addendum
forbids stating how Medicare or Medicaid work with a membership until
counsel settles it, and the same restraint applies to a form that goes
to any plan over the practice's name. `NEEDS-COUNSEL`

**The export is FHIR R4, not C-CDA.** Hand-rolling C-CDA without a
toolkit and a validator would produce something that looks exportable
and fails at the receiving end. C-CDA stays on the list as real work.

**Information-blocking posture.** The patient can take the whole
record from their own portal: no request, no delay, no fee. The rule
is 45 CFR Part 171; provider disincentives came from the final rule of
1 July 2024 (89 FR 54718) and run through Medicare programs. Whether
and how that reaches a direct-pay practice that is not Medicare
enrolled is **unsettled**, and the prototype says so rather than
asserting either way. Not being reachable by a disincentive is not the
same as being outside the prohibition. `NEEDS-COUNSEL`

**Revisit when:** counsel settles the payer posture, or a real C-CDA
requirement appears from a receiving system.

---

## D-042 — The chart is one workspace, and its summary is generated

**Decided 2026-11-15, owner direction, during the EMR prototype build.**

The patient chart moves from a header plus eight tabs to a single
clinical workspace: a minimal header, a longitudinal SOAP care plan,
and a narrow right column for the next visit and pending orders.
Everything else moves into slide-out drawers.

**Two structured fields now carry the header sentence.** Each
condition records whether the practice actively manages it, and each
patient has two independent service switches, preventative and
lifestyle medicine. The line under the name is composed from those,
never typed. Past medical history and what this practice is doing are
different lists; conflating them is the thing this change fixes.

**The master care plan is a document, not a note.** One per patient,
updated as visits happen. Signing a visit note prepends a dated line
per problem into the standing plan; the note is kept exactly as
signed. Prose in each section is the physician's; the structured
content beside it is composed from the record at read time rather than
copied, so the longitudinal document cannot drift out of date with
what it describes.

**Removed from the header:** membership, sign-in-as-patient, the
reconciliation indicator, Start Visit, contact details, date of birth,
pronouns, and the avatar. All of it is one drawer away. The pinned
clinical reminder stays as a line.

**Sharon White** (`app/src/data/sharon.ts`) is the worked example: 60F,
three managed problems, two carried as history, four years of
measurements, overdue prevention, and a populated master plan.

**Revisit when:** the design has been used for a week. The open
questions are whether prose that saves on blur is right for a document
this long, and whether a single plan per patient holds up for someone
with ten problems rather than three.

---

## D-043 — The summary is living, and billing records are kept apart from it

**Decided 2026-11-15, owner direction, during the EMR prototype build.**

The chart's central document becomes a living longitudinal summary
that stays current with the record, rather than a care plan somebody
edits by hand. Research into documentation requirements came first,
because it changed the data model: see
`docs/systems/documentation-and-billing.md`.

**A longitudinal summary cannot carry billing documentation.** The
summary answers where the patient is now. Office E/M asks what
happened on a date; care management asks what was done in a calendar
month. Neither survives a document that is continuously rewritten. The
prototype therefore keeps the signed encounter note, a per-encounter
record of the elements a level rests on, and a per-month care
management time log with its own consent records, as three separate
things. The summary does exactly one piece of double duty: it
satisfies the care plan element those programmes require, because it
is dated, organised by coded problem, reassessed per problem, and
exportable.

**The assistant proposes and never writes.** Every proposal carries
the record ids it was built from, and is labelled as either something
the chart documents or something the assistant read into it.
Acceptance is an event with a name and a date. There is a proposal
type for what the record does *not* say, because rendering silence as
normal is the dangerous failure mode for a summariser, not getting a
number wrong.

**Time spent by software is not clinical staff time.** Care log
entries carry a stored `countable` judgement and automated entries are
excluded with the reason shown. Counting a model's minutes toward a
care management threshold would build an overpayment one month at a
time.

**Assessment becomes a gauge per problem** (improving, stable,
worsening, not assessed) from which the plan's intent is derived.
Lifestyle interventions are coded to one of six domains with a
prescription, target problems, status and barrier, so they can be
tracked and reported like any other treatment.

**Export is a complete packet**, not a cover page: summary, then every
signed note, then specialist letters, labs as resulted, imaging,
prevention, and every file received including the ones that could not
be read. The cover states that the notes are the record if the two
disagree.

**Revisit when:** the design has been used for a week, or counsel
settles the payer posture. The open questions are whether a single
living summary holds up for a patient with ten problems rather than
three, and whether the proposal review stays read rather than
becoming a button people click through.

## D-044 The chart is one living document, built from three sources

**Decided 2026-11-15.** The main chart view is a longitudinal
document, not a visit note and not a tab set. Its subjective describes
each problem from three sources that are kept visibly apart: a
physician-authored chart review of the notes on file, measures
composed from the structured record at read time, and the patient's
own words from a check-in sent before each visit. A specialist comment
appears against the problem its specialty looks after and nowhere
else, and what is outstanding for a problem sits with that problem.

**Reasoning.** A longitudinal subjective written only from visit notes
is a clinician's account of a patient's account, filtered twice and
updated only on the days we see them. The second source is what makes
the document worth maintaining, and merging the two into one paragraph
is how the disagreement between them disappears. The disagreement is
the useful part: a problem the chart calls improving and the patient
calls worse is a problem we have misunderstood, and the synthesis step
now names those clashes rather than leaving them to be noticed.

**What follows from it.** A new record type for the patient's per
problem answers, kept verbatim and never edited by the practice. The
opening statement replaces the three labelled subsections that were
there before. Notices moved out of the path between the header and the
first line of the subjective. The examination moved above the labs in
the objective, because that is the order it is read in.

**Revisit when:** the structure has been used on a ten problem chart,
or when it is clear how often the pre-visit check-in actually gets
answered. If it is rarely answered the third source is decoration and
the design has to say so.

## D-045 The demo panel is generated with deliberate depth

**Decided 2026-11-15.** The generated panel draws a depth tier per
patient rather than one flat tenure: new members with one visit and no
series, through to members of five years with twenty visits, eight lab
draws, two specialists and years of examinations. Every number for a
patient follows one arc, so the gauge on a problem and the series
under it cannot disagree. BMI is computed from a height and a weight
rather than asserted.

**Reasoning.** A prototype that only shows the deep chart hides every
empty state, and one that only shows the shallow chart hides whether
the longitudinal view earns its place. Both have to be in the panel to
judge the structure. The arc constraint came from watching a chart say
"improving" over a weight series that wandered upward, which is the
fastest way to stop trusting a demo.

**Assumptions owned.** The share of each depth tier, the uptake of
home monitoring and care management, and the proportion of charts
whose last examination predates the last visit are guesses in the
right order of magnitude. They are not measured rates and nothing
should be derived from them. All of it is fictional.

**Revisit when:** real panel data exists, or when the generator is
being used for anything other than looking at the screen.

## D-046 The demo carries three fill states, and one summariser writes them all

**Decided 2026-11-15.** The example set is three charts rather than a
crowd: Sharon White complete, Marcus Reyes half written, Nina Alvarado
on her first day. The opening statement of the subjective is composed
by one function, `composeStatement`, which the demo data and the live
review step both call. Every section on an empty chart states what it
does not have; none of them renders blank.

**Reasoning.** A structure can only be judged against all three fill
states, and the middle one is the one that actually occurs and is
almost never designed for: half the problems reviewed, one patient
answer of four, vitals but no labs, a plan written for one problem and
not the rest. Two summarisers, one for the demo and one for the
product, would mean the thing being evaluated is not the thing that
would ship.

**What follows from it.** A blank space in a clinical document reads
as a normal finding, so the empty cases are written out: no
examination documented is not the same as a normal examination, an
empty preventative schedule is not up to date, a problem with no plan
says so. A `three-states` suite pins all of it.

**Revisit when:** the structure is tried on a ten problem chart, which
is the fill state none of the three covers.

## D-047 The subjective is derived, and the review queue is removed

**Decided 2026-11-15.** The subjective is computed from the record at
read time and stored nowhere. The summary-document model, in which a
synthesis step proposed edits that a physician accepted into a saved
summary, is removed from the chart along with its review drawer and
its proposal records. `MasterPlan` no longer has a subjective at all.

**Reasoning.** The value of a living summary is that it maintains
itself. A stored summary with a review queue in front of it is another
record to keep current, which is the thing the design was meant to
abolish, and in use the queue read as the primary call to action on
the chart. Deriving removes the drift problem completely: the summary
cannot disagree with the record because it is a reading of it.

**What follows from it.** An encounter is now any dated, attributable
contact: visits, health updates the patient submits, messages, letters
and results. Three new record types carry that (`UpdateRequest`,
`PatientUpdate`, `Message`), medicines carry a reported adherence
status rather than an assumed one, and the rail's first section is
Encounters rather than Next visit. The Encounters drawer holds every
source record with its original text, and carries three demo buttons
that add a record of each kind so the derivation can be watched
working.

**What is still open.** What physician review should mean for a
derived summary. The current answer is that it is read rather than
approved, and that every sentence is traceable. That is adequate for a
prototype and is not a position on what a real practice should do.

**Revisit when:** the derivation has been read against a real week of
records, or when the review question has to be answered for anything
that leaves the building.

## D-048 One status vocabulary, and less of everything else

**Decided 2026-11-15.** Two status systems across the whole chart. A
category, whether a chronic condition, a preventative service or
lifestyle medicine, is **at goal** or **needs improvement**. An
intervention, whether a drug, a lab, a referral, a vaccine or a
lifestyle prescription, is **active**, **needs attention** or
**complete**. The four-point improving/stable/worsening/not-assessed
scale is gone, as are the per-category status words it sat beside.

**Reasoning.** The question a reader asks when scanning a chart is
whether something needs them. Scales with more points answer a
question nobody asked while making the page slower to read, and five
category-specific vocabularies ("taking as prescribed", "struggling",
"up to date") meant the eye had to learn a new scale in every
section. The nuance did not disappear: it moved into the sentence
underneath, where it can be qualified, and into the record behind it.

**What else went.** Citations moved from a line under every paragraph
to a small mark that opens the records on click. The subjective's
opening is three sentences in the same shape as a problem summary.
The objective shows the latest vitals with home readings behind a
button, and lost its narrative field. The assessment opens with the
clinical one-liner, composed, and lost its free-text conclusion. The
plan lost its intent line and its counting badges.

**Also decided.** Every patient gets a baseline history, so the
intake form now takes what the patient says in their own words and
writes it as a signed initial history and physical plus their first
overall answer. The living summary should never open by saying nobody
has asked them anything; where the intake has genuinely not happened
it says so and gives the date it is booked for.

**Revisit when:** the chart has been read in a real week, which is
the only way to find out whether two statuses is too few.

## D-049 The living chart is versioned and physician-approved

**Decided 2026-11-15.** The living summary is a snapshot of
structured state, approved at a moment by a named person, and the
chart renders the snapshot. It does not change when records arrive.
It changes when an encounter is signed. D-047's read-time derivation
is reversed for the chart and kept for the draft: the synthesis
engine still reads everything, but it now produces the working copy
inside an encounter rather than the page.

**Reasoning.** Deriving at read time made drift impossible, which was
the point, but it also meant the chart could change because a patient
sent a message at eleven at night. A clinical summary that moves
without a clinician is a feed, not a record, and it cannot be
attributed to anybody. Putting a person between new information and
the record is what makes the document a document.

**What follows.** `ChartVersion` is immutable and holds the approved
subjective, the problem statuses and the plan. An encounter, of which
there are now three kinds (clinical visit, CCM review, BHI review),
opens on the approved version with everything that has arrived since
beside it, and signing does the rest in one act: freezes the next
version, preserves the note, sends the information requests, records
the time. `InfoRequest` is the structured ask; the patient answers in
the portal and the answer closes it without touching the chart.

**What a version knows is new** is membership, not a date. Dates here
are days, and an answer that arrives an hour after an approval has
the same date as the approval; comparing dates swallowed it. Each
version stores the ids it was approved over.

**The cost, stated.** An approved document can go stale, and the
people most likely to go a long time without an encounter are the
ones it matters most for. The count of unincorporated records is on
the chart and is not optional. The draft is also load-bearing in a
way it was not before, because a physician reviewing a draft will
accept more than they would write: it stays conservative, conflicts
are named rather than resolved, and nothing is pre-accepted.

**Open.** The old visit screen with ambient capture is still a second
path into an encounter. It should fold into this workflow. See
`docs/systems/encounter-cycle.md` for the full evaluation and the
questions it answers.

**Revisit when:** the cycle has been run on a real week, or when the
ambient visit path is folded in.

---

## D-050. Bill 99491 first, hold 99484 and APCM, and never build a workflow around a code

**Date.** 2026-11-15.

**Decision.** The billing architecture is built on chronic care
management personally performed by the physician (99491 and +99437),
the wellness visit (G0438 and G0439), office visits with the
complexity add-on (99212 to 99215 with G2211), and nothing else.
Behavioural health integration (99484) is encoded and blocked on a
written answer from the MAC. Advanced primary care management
(G0556 to G0558) is encoded and blocked on counsel and on two
capabilities this practice does not have. No staff-dependent workflow
exists anywhere in the prototype.

**Reasoning.** The research question was whether a solo physician with
no clinical staff can compliantly deliver each of these. The answers
are not uniform, and the differences are the whole decision.

99491 exists for exactly this fact pattern. CMS created it "to
describe situations when the billing practitioner is doing the care
coordination work that is attributed to clinical staff in CPT code
99490" (83 FR 59576), and states without qualification that only the
billing practitioner's own time counts and that the work cannot be
delegated. There is no staffing question to resolve.

99484 probably works and is not quite provable. CMS says general BHI
"may be provided solely by the billing practitioner" (BHI FAQ #14,
5 December 2023; MLN909432, January 2026, p. 11), but has never
written that the practitioner's own minutes satisfy the twenty-minute
threshold for that code, which it has written for CCM. Two readings
survive the published text. A code that depends on which one is right
is not a code to build a practice's revenue on before asking.

APCM is the opposite shape: no minute counting, which is attractive,
and a descriptor that says "provided by clinical staff" on all three
levels, which is not. CMS declined to relax the capabilities for small
practices and pointed them back to CCM in terms (89 FR 97876). It also
makes reporting the Value in Primary Care MVP a condition of billing,
and a practice under the low-volume threshold is left with CMS saying
it "technically could" bill but "would be unlikely to" (89 FR 97892).
It pays less for this pattern as well. `REFRESH-AT-RUNWAY`.

**The instruction that shaped the code.** The brief said not to build
a staff-dependent workflow into the prototype to accommodate a billing
code. That turned out to settle more than it looked like it would:
every code the research rejected is one that needs staff, and every
code it kept is one a physician furnishes personally. The constraint
and the compliance answer pointed the same way.

**What follows in the chart.** Billing hangs off two objects and
neither is the living chart: an encounter for a date, a month for a
calendar month. Both stop short of a conclusion. A month reaches
"requirements met" and waits for a person to attest. A visit computes
what the recorded elements imply and does not choose a code.

**Three requirements never pass, by design.** Certified EHR technology
for CCM, the clinical-staff descriptor for APCM, and the performance
measurement for APCM are shown as failing mandatory checks rather than
omitted. They are true facts about a one-physician practice running
software it wrote itself. A chart that hid them would be the more
dangerous object, and the certified-record finding in particular is a
material constraint on this whole project that was not known before
this research.

**Two numbers stay UNSET.** CMS publishes the 99215 and 99212 time
thresholds and not the 99213 or 99214 ones, which are the American
Medical Association's property. The chart says it cannot settle a
visit on time in that range rather than inventing a number. They go in
with a CPT licence.

**Still gated.** Whether this practice enrols in Medicare or opts out
is unsettled (D-039), and a membership that covers what Medicare
already covers raises beneficiary inducement exposure. Both are
`NEEDS-COUNSEL` and both sit upstream of everything above. D-039
guardrail 4b stands: no print or patient-facing piece states how
Medicare works with the membership until counsel settles it.

**Revisit when:** counsel answers the participation and membership
questions; the MAC answers on 99484; CMS acts on the CY2026 request
for information about APCM and prevention; or the practice licenses
CPT. See `docs/systems/billing-architecture.md` for the full matrix
and citations.

---

## D-051. A consulting practice, an annual package, and four closures

**Date.** 2026-11-16.

**Decision.** The practice stops being anybody's primary care
physician and becomes a consulting physician for named conditions and
named services. The membership is an annual package of five physician
contacts totalling 250 clinical minutes, delivered inside four
service periods, at a target panel of 200. Eight months open and four
closed, in four blocks of about a month rather than one block of
four. Insurance billing comes off the development path.

**Reasoning.** The repositioning and the arithmetic are the same
decision. 30 hours a week across 35 working weeks is 1,040 physician
hours a year. At 200 patients that is 5.2 hours each, and after a
fifth for administration, 250 clinical minutes per patient per year.
A primary care scope does not fit in 250 minutes. A consulting scope
does.

**The number that did not survive.** D-049 and the work after it
scheduled a sixty minute care plan review per patient per month. That
is 720 minutes a patient a year, which at 200 patients is 2,400
physician hours against the 1,040 available: over by a factor of 2.3,
before a single consultation is booked. It was the right design at a
140-patient panel with 39 weeks worked and a primary care scope, and
it does not survive either change. Two consultations and three
reviews a year replace it, which is a contact roughly every seven
weeks while the practice is open.

**Four closures rather than one.** The total time away is the same
and the clinical consequence is not. A single four-month closure is
longer than a ninety day prescription and longer than almost any
monitoring interval, so a problem found in the last week before it
closes has nowhere to go. A month is shorter than both. The system
consequence is a screen: before a closure begins, what is left
hanging, patient by patient.

**The exposure that is not solved by an agreement.** A patient
agreement can define what the practice will do. It cannot define away
the standard of care for what was actually done, and it cannot make a
patient who has no other physician into somebody who has one. So "no
primary care physician" is not a blank field in this record. It is
the first line in their chart, it is marked urgent on every closure
check, and establishing primary care is carried as a plan item with a
status like any other. If they never establish, that is visible and
somebody decided it.

**Ownership, not a boolean.** `Condition.managed` could say this
practice had taken a problem on. It could not say that the patient's
own physician has it, which is the commonest case and the one that
matters when something goes wrong with it. Every managed problem now
carries an owner: ours, shared, or theirs. An absent owner is shown
as a question rather than a default.

**Billing, demoted not deleted.** CCM, BHI, the wellness visit and
the office visit levels come off the daily path. The research, the
rules and the citations stay where they are, because they were
expensive to establish and the question may come back. The drawer is
reachable and is called what it is.

**What did not change.** The living care plan, the versioning, the
approval cycle, the reconciliation tray, the inbox and its three
answers, the two encounter types, and the demo data. All of it
survived the repositioning untouched, which is the main evidence that
the workflow was built around the clinical work rather than around
the billing.

**Still gated, and upstream of everything.** Whether this physician
can opt out of Medicare while employed elsewhere, which is a decision
about the physician and not about the practice. Whether a membership
covering Medicare-covered services can be sold to a beneficiary who
has not privately contracted. What a Texas board expects of a
practice with planned month-long closures. All `NEEDS-COUNSEL`;
D-039 guardrail 4b stands.

**Revisit when:** counsel answers the three questions above; the
panel passes the size the package fits; or the first real year
produces actual minutes per patient to replace the planning averages.
See `docs/systems/consultative-practice-model.md`.

---

## D-052. The schedule is a week, the chart is tabs, and the rail is five blocks

**Date.** 2026-11-21.

**Decision.** Four interface changes, taken together because they are
one argument about where a physician's attention goes.

**The way in is a week, not a day.** The schedule opens on the week
and carries day and month views beside it. A week is the unit a solo
practice plans in: whether Thursday has room, whether the reviews got
pushed into Friday again, whether the run-up to a closure is as empty
as it looks. A day cannot answer any of those and a month is too
coarse. The day view keeps what only it can carry, which is the
reconciliation count and the version number for each activity.

**One menu instead of a bar of tabs.** The top bar had seven
buttons, a keyboard hint, a theme toggle, a sign-in control and a
reset. Every one was reachable and none was findable. It is now the
logo, the clock, and an avatar menu. The clock stays out because it
is not navigation: it is the control that changes what every screen
says, and in a prototype about a longitudinal record it is used
constantly.

**The chart is a tab strip.** The care plan is still one document
written in one place; the first four tabs are a reading position
inside it rather than four records, and the rest are the source
material it was built from. This replaced a drawer that slid over the
chart. Drawers were cheaper to build and worse to use: the thing you
were reading vanished under the thing you opened, and coming back
meant finding a Close button. A physician comparing a lab against the
plan wants both reachable in one move.

**The right column is five blocks and nothing else.** Problem list,
vitals, diagnostics, their team, medicines. The problem list carries
its own evidence: the drugs for that problem, the measure it is
followed by, and whether it is controlled. A problem list that is
only names makes you go and find all three somewhere else, which is
the work the column exists to remove.

What came out of it: the reconciliation notice, the membership
ledger, the encounter history, pending orders and follow-up. All real,
none of them what a physician looks right while reading a chart. They
are tabs now, except the ledger, which went to the details tab
because it is commercial before it is clinical and does not belong
between the problem list and the vitals.

**Controlled, not at goal, in one place.** The rest of the chart says
"At goal" and "Needs improvement", because those also have to cover
preventative services and lifestyle prescriptions, where "controlled"
means nothing. A problem list is only ever about diagnoses, and for a
diagnosis the word a physician reads fastest is the clinical one. Same
status underneath, read aloud differently in the one place where the
subject is always a disease.

**Two bugs this surfaced.** Opening an encounter from a chart minted
a row every time, so clicking "Care plan review" three times left
three unfinished identical encounters on the day; an encounter of the
same kind, for the same patient, on the same day, that nobody has
approved, is now the same encounter. And the rail was sticky with no
height limit, so on a long chart the page looked like it had stopped
scrolling until the bottom of the rail went past. It is capped to the
viewport and scrolls inside.

**Revisit when:** the week view has been used for a real week, or the
tab strip grows past what fits without scrolling sideways.

---

## D-053. Cash per visit, priced against the membership, with the per-visit price still UNSET

**Decided 2026-11-22, owner direction, for the prototype.** Asked for
in these words: "i want to see what this would look like if i was
just straight up cash pay, did intial assessments probono and the
quote a year at a time and the next annual and then keep quoting
thigns each year at the annual where a full review is done", then
"once we have an idea of how we do this system ... we can quote the
savings for them if they just did a annual membership".

**This is a second model, not a replacement for D-039.** D-039 says
the practice is membership-based at $99 a month, and that is still
what the site, the brochure and the charter say. What the prototype
now also shows is a straight cash practice: nothing charged for a
first assessment, the year planned at that visit and quoted visit by
visit, every planned visit the same price, and the next year quoted
again at each annual when the full review is done. Nothing about
D-039 has been changed and no patient-facing piece carries any of
this.

**The membership is quoted against it rather than instead of it.**
The note prices the year both ways at the two visits where a year is
being priced: the first assessment, and each annual. It prints the
break-even in visits, and at an annual it prints what the year just
gone actually cost next to what a membership would have cost. It does
not print the comparison at a visit in the middle of a year, because
three months of visits set against twelve months of membership makes
paying per visit look cheap for the arithmetic reason that the year
is not over.

**The comparison is allowed to lose.** On the worked case the first
visit quotes three visits, and the note says a membership would cost
$138 more than that. The patient then has one unplanned illness, the
year holds four visits, and the annual says paying by the visit cost
$212 more than a membership would have. A comparison that always
favours the thing being sold is not a comparison, and the honest
version is the one that makes the case when the case is real.

**The per-visit price is UNSET.** Everything above is arithmetic on
one number nobody has decided. The code carries $350 because a
prototype cannot render a comparison against a blank; it is a
placeholder standing in for a decision, it is labelled as one in
`app/src/lib/billing.ts`, and every saving figure on every note moves
with it. It must not reach a patient, a print piece, or the site
until it has been decided and logged here. Until then the only
decided price in this practice is still $99 a month.

**Revisit when:** a per-visit price is decided, or the owner decides
the cash model is not being offered at all, in which case the
comparison comes off the note rather than being left to argue from a
number nobody chose.


### D-053 addendum — priced off the code, and the membership made personal (2026-11-23)

The flat $350 a visit is gone. It was a placeholder and it had the
flaw every placeholder has: it could not answer "why that number".

**Every visit is now benchmarked to the code its own documentation
supports.** A first assessment is ninety minutes, a new patient, four
diagnoses made on the day and four drugs started or stopped, which is
99205 plus the preventive assessment in G0438 and is worth $411.16; it
is still given away. A planned review runs forty-five minutes across
five chronic problems with labs and drug changes, which is 99215 and
$192.39. An annual is 99215 and G0439, $330.00. An acute visit is one
new problem with a dangerous differential and a prescription, which is
99214 and $135.61. The rates come from the 2026 fee schedule at
$33.4009 per relative value unit, in `app/src/lib/fees.ts`, with the
source named against each code.

**The sourcing is weaker than it looks and the file says so.** The
RVUs are from third-party references read on 2026-11-23, not from the
CMS file, and the two references name different 2026 releases with no
code appearing on both, so they could not be checked against each
other. 99202 carries no rate at all, because no source read stated
one, and it is UNSET rather than filled with a plausible number.
REFRESH-AT-RUNWAY and check against CMS before any of it is quoted.

**The membership is now personal and derived rather than flat.** At
the first assessment the year is projected: the visits booked, each at
its own price, plus the visits nobody books but everybody should
expect, which is one plus one for every four problems off target,
capped at three. That total, less a discount, divided by twelve. The
worked case comes to $986.00 and $69.84 a month, and at his annual a
year later, with two problems off target instead of six, to $60.24.

**The discount is UNSET and is the lever that decides whether this
survives.** It sits at 15 per cent as a placeholder. The membership
covers unlimited acute and follow-up visits, so the practice carries
the whole of the utilisation risk, and a discount set generously
against a projection set optimistically is how a practice like this
fails about fourteen months in.

**The projection was not tuned to make the membership win.** On the
worked year it loses: four charged visits came to $850.39 against the
$838.08 he was quoted, so paying per visit cost him $12.31 more. An
earlier rule projected three unbooked visits for him and he had one;
it was changed because three was not defensible for that patient, not
because of which way the comparison came out.

**What the note says about the fee schedule.** The billing section
names it as the basis of the price and states that no claim is filed
and no insurance is billed. It says nothing about how Medicare or
Medicaid work with a membership, and the case-series test asserts
those words appear nowhere in any note (D-039 guardrail 4b). If
counsel would rather the schedule not be named on patient-facing
paper, it is one string in `app/src/lib/faxNote.ts`.

**Revisit when:** the discount is decided, the RVUs are checked
against CMS, or a real patient's year is available to test the
projection against.
