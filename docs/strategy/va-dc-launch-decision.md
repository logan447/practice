# Virginia/DC Launch Decision — Can the Practice Start Now?

*Researched and drafted 2026-08-22. Decision-support, not a decision:
D-log entry waits for the owner's call. Sources: four research briefs
(Virginia law, DC licensure, interstate practice from Texas, costs and
channels — primary sources cited inline), the acquisition workstream
(`docs/acquisition/`), the Q-21 Medicare/Medicaid brief, and
`tools/va_launch_model.py` (all money tables reproduce from it).
Labels: `VERIFIED` (primary source), `EST` (derived estimate),
`NEEDS-COUNSEL` / `NEEDS-CPA` / `NEEDS-BROKER`, `OWNER-FACT` (only the
physician can confirm).*

---

## 0. The answer, pressure-tested

**Starting now is financially trivial and legally clean. The real
risks are not money or law — they are (1) three employment facts that
must be confirmed first, (2) the physician's time, and (3) acquisition
evidence, which is exactly what the staged design buys before any real
spending.**

The financial case is unusually strong: worst-case burn at zero
patients is ~$280–590/month, break-even is **3–6 members**, and total
one-time cost is ~$2,700 — all inside the D-020 ceiling. The
move-to-Texas complication is solved, not just tolerable: keeping a
Virginia panel by telemedicine from Texas is legal, cheap, and has
working precedent. The honest counter-arguments, and why they don't
kill the plan, are in §9 — read that section before deciding.

## 1. The three OWNER-FACTS that gate everything

These come before any stage. Nothing else matters until they're known.

1. **Does FCHC bill Medicare for your professional services?**
   Medicare opt-out is all-or-nothing under your NPI (Q-21 brief,
   Ch. 15 §40.5). If FCHC bills Medicare, you cannot opt out while
   employed there — so a Virginia launch **excludes Medicare
   beneficiaries** (private contracts impossible without opt-out).
   That's survivable: the beachhead becomes under-65 adults. If FCHC
   does *not* bill Medicare (many charitable clinics don't), opt-out
   is available now and the D-033 architecture works in Virginia too.
2. **What does your FCHC employment agreement say** about outside
   practice, non-competition, and non-solicitation? A primary-care
   employer 50 miles from your market may or may not care. Related
   ethical bright line regardless of contract: **FCHC patients are
   never recruited.** They are your employer's patients.
3. **Olera obligations** — any conflict-of-interest or time-commitment
   terms touching an outside clinical practice.

Also required before deciding: an honest weekly time budget. A 25-panel
practice plus acquisition needs ~6–10 hr/week on top of Olera and FCHC.
If that number isn't real, stop here.

## 2. The economics (from `tools/va_launch_model.py`)

**Monthly fixed cost** (verified vendor pricing, 2026-08-22):

| Stack | Fixed/mo | What it is |
|---|---|---|
| Lean DIY | **~$282** | MDToolbox eRx+EPCS $45 · Spruce $24 · malpractice ~$200 `EST/NEEDS-BROKER` · SCC, domain, email ~$13 |
| DPC-native | **~$586** | Hint Clinical Launch $290 (EMR+billing+telehealth+eRx; free until launch) · Spruce $24 · malpractice ~$250 · overhead ~$22 |

**One-time:** ~$2,700 (PLLC $100 · counsel ~$2,000 `NEEDS-COUNSEL`,
band $1.5–3.5k · EPCS setup, printing, misc ~$600). DC option adds
~$1,350 (§7). Optional bounded ads test: $300/mo × 3.

**Per member:** ~$96 net/month after payment fees and friction.

| Members | Net/mo (lean) | Net/mo (DPC-native) | Net/yr (native) |
|---|---|---|---|
| 0 | −$282 | −$586 | −$7,026 |
| 5 | +$197 | −$106 | −$1,270 |
| 10 | +$677 | +$374 | +$4,486 |
| 15 | +$1,157 | +$853 | +$10,241 |
| 25 | +$2,116 | +$1,813 | +$21,753 |
| 50 | +$4,514 | +$4,211 | +$50,532 |

**Break-even: 2.9 members (lean) / 6.1 members (DPC-native).**
Everything is monthly-cancellable except malpractice — prefer an
occurrence policy; a claims-made policy adds a tail cost (~1.5–2×
annual premium) at wind-down. `NEEDS-BROKER`.

**Downside case, fully priced:** if acquisition fails (< 5 members by
month 4), total sunk ≈ $2,700 one-time + ~4 months' burn ≈ **$4–6k**,
plus the learning (§8). That is the entire bet.

## 3. Legal ground (all `VERIFIED` unless flagged)

- **Virginia DPC statute — Va. Code §§54.1-2997/2998** (not 38.2-6300;
  that's health-sharing ministries). $100/month periodic-fee agreements
  are expressly not insurance. Requirements: a verbatim disclaimer in
  the agreement *and marketing*, listed-services clarity, a disclosure
  statement, patient signature, **no fees collected before the coverage
  period starts**, never bill a carrier for covered services. No Bureau
  of Insurance filing. The current Patient Agreement is drafted under
  Texas Occ. Code ch. 162 — it needs a **Virginia edition** (structure
  survives; statute citations, disclaimer, and disclosures change).
  `NEEDS-COUNSEL` — this is most of the one-time counsel spend.
- **Telemedicine:** new patients may be established fully by video
  (Board Guidance 85-12), same standard of care as in-person;
  telemedicine consent + identity/location verification documented.
- **The one prescribing wrinkle — §54.1-3303 condition (f):** when the
  bona fide relationship is established *via telemedicine*, one
  statutory condition references being credentialed by the patient's
  health plan — unsettled for out-of-network DPC. **Clean operating
  rule that moots it: every new patient gets an in-person first visit**
  (home or rented room), after which telemedicine prescribing of
  Schedules II–VI within the established relationship is clearly
  permitted. This also permanently satisfies federal Ryan Haight
  per-patient. It fits the practice model as designed.
  `NEEDS-COUNSEL` to confirm the rule.
- **Home visits:** ordinary practice; solo-physician house calls are
  exempt from home-care-organization licensure (§32.1-162.8).
- **Entity:** Virginia PLLC (or plain LLC — both lawful for medicine,
  §13.1-1101.1): $100 formation, $50/yr. File the $10 fictitious-name
  certificate for "DuBose, M.D." `NEEDS-CPA` on entity/tax election
  (S-corp not worth it below ~$50–80k net).
- **Site corrections required before any Virginia use:** the agreement
  page asserts Texas law and an *effective Medicare opt-out* — both
  false in a Virginia launch posture. A VA copy pass (statute, opt-out
  posture per §1 fact 1, [City] → real geography) is a Stage-2 work
  item, plus a **Virginia advertising-rules counsel pass** replacing
  the planned TMB pass.

## 4. The two beachheads (and what got demoted)

Everything in `docs/acquisition/channels.md` still applies; for the
*first patients in this market*, two channels get the hours:

**Beachhead 1 — the warm network + professional referral micro-engine.**
Your position is unusually strong here: a GW internal-medicine network
now attending across the DC metro, the Olera/aging-research community
(caregivers of older adults are prime members: stressed adults, 40–60,
juggling their own health), church/community ties, and co-workers'
networks. The play is the designed announcement (personal notes, not a
blast) plus 5–10 referral-source relationships (specialists,
therapists, pharmacists — the B1–B3 playbook, pointed at NoVa/DC).
Cost ≈ $0. This is the realistic source of patients 1–10.
*Hard exclusion: no recruiting of FCHC patients, ever.*

**Beachhead 2 — Google local intent.** GBP as a service-area business
(home address hidden, NoVa service area declared — verified viable;
follow SAB rules exactly), DPC Frontier mapper (free), NAP citations,
plus the bounded **$300/mo × 3 exact-match ads test** on Tier 2/3
queries ("direct primary care Arlington," "house call doctor Northern
Virginia" — the home-visit wedge is even less contested in NoVa than
the Austin scan assumed). DC-metro CPC ~$4–10; expect ~$50–150/lead.
This catches strangers with felt need while the network engine works.

**Demoted, with reasons:** Zocdoc — verified workable for cash-pay
($60–140/booking) but sells episodic appointments; membership
conversion is unproven. Bounded test *after* 10 members, not a
beachhead (this revises `channels.md` A8 from "unverified assessment"
to "verified mechanics, deferred"). Upwork/consulting — real income
option, **different funnel entirely**; it produces clients, not
patients, and hours spent there are hours not spent on patients 1–10.
Keep it out of the practice plan. Content/SEO — keeps compounding per
the phased plan, but 6–18 month payback disqualifies it as a beachhead.

## 5. The staged design (gates, spending, kill-criteria)

Your five stages survive pressure-testing with two corrections: a
Stage 0 for the owner-facts (nothing else is decidable without them),
and explicit kill/hibernate criteria so slow acquisition has a defined
cost instead of an open-ended drip.

**Stage 0 — Facts and quotes (now; ~$0; 2–3 weeks).**
Confirm the three §1 facts. Get 2–3 malpractice quotes (TDC, Curi,
CM&F, Indigo — part-time/telemedicine-rated, occurrence preferred) and
a counsel quote for the Virginia agreement package. Set the weekly time
budget. *Gate G0: all three facts compatible with practicing; time
budget real.*

**Stage 1 — Demand evidence (~$0–100; 6–8 weeks).**
The smallest credible experiment: the announcement to the warm network
+ 25 real conversations + the site (VA-postured copy, still noindex)
as the demo + founding-list signups. Count only hard evidence:
booked free conversations and named people who say "enroll me when you
open" with a start month.
*Gate G1: ≥10 booked conversations from ≥3 distinct sources AND ≥5
named enrollment intents. Also record: how many are DC residents (feeds
§7).* If G1 fails after honest effort, the market said no for ~$100 —
that is the experiment working.

**Stage 2 — Build (~$2,700 one-time; 4–6 weeks, parallel with late
Stage 1).** PLLC + fictitious name; counsel: Virginia agreement,
disclosure statement, in-person-first-visit rule, ad-copy pass; bind
malpractice; EMR stack (recommend **Hint Clinical Launch** — $0 until
launch makes the decision reversible; the lean stack is the fallback if
$290/mo ever feels heavy); bank + Wave; site VA copy pass; GBP +
directories. DC application starts here *iff* the §7 trigger fired.

**Stage 3 — First patients (patients 1–10; months 1–3).**
Enroll the G1 intents first. Every new patient: in-person first visit
(§3), utilization logged from patient one (Q-20), source ledger row.
Ads test runs its 3 months. Referral-source visits ~2/week.

**Stage 4 — Operating break-even and learning (target 15–25 by month
6).** Break-even (~6) should fall in month 2–3 if G1 was honest.
Benchmarks: solo, marketing-light DPC launches add ~2–10/month; 25 in
3–6 months is evidence-consistent, not optimistic.
*Kill/hibernate criterion: fewer than 5 paying members at the end of
month 4 → hibernate (cancel stack subscriptions, keep entity + license
+ site; burn drops to ~$250/mo malpractice-or-tail decision) and treat
it as $5k tuition.*

**Stage 5 — The Texas fork (~month 6, when move clarity arrives).**
Stay → keep growing toward whatever income tier (70 members ≈ $50k
take-home per the existing model). Move → §6. Either way the Texas
launch inherits a tested funnel, real conversion data, operating
history, and possibly a paying remote panel.

## 6. The move is not a blocker (`VERIFIED`)

- **Legality:** practice occurs where the patient is. A Texas resident
  with an active Virginia license may treat Virginia patients by
  telemedicine. Virginia imposes nothing extra on nonresident
  licensees; Texas imposes nothing on outbound care. Working precedent
  exists (multistate virtual DPC practices).
- **Cost of keeping the option:** VA license $337/biennium + 30 CME
  hours; malpractice rated by patient location (covered, quote it);
  2–4 Virginia trips/year for clustered in-person visits (each trip
  also satisfies standard-of-care and keeps the §54.1-3303 physical-
  location/referral prong via rented exam space or a VA colleague
  arrangement).
- **Controlled substances (the one dated risk):** DEA telemedicine
  flexibilities run through **Dec 31, 2026**; the special-registration
  final rule is expected ~Nov 2026 and may add per-state telemedicine
  registrations. Mitigations already in the model: in-person first
  visits satisfy Ryan Haight per-patient forever; keep a DEA
  registration anchored to a Virginia practice address; time Schedule
  II–V prescribing to in-person visits as the fallback. A mostly
  non-controlled panel is barely touched. `REFRESH before 2027;
  NEEDS-COUNSEL for heavy controlled prescribing.`
- **Scenario table:** stay 3+ years → ordinary growth. Move at 12–18
  months → keep the panel remotely (economics: even 20 remote members
  ≈ $17–20k/yr net for a few trips — worthwhile) or transition. Move
  at 6–12 months → panel is 10–25; both options work; transparency
  (§8) makes either fair. Remote-forever is operationally sane at
  20–60 members and absurd below ~10 — if the panel is tiny at the
  move, transition with the agreement's §10 protections (records free,
  90-day bridging, warm handoffs).

## 7. DC: a triggered gate, not a prerequisite — but watch the clock

You qualify (DC requires one postgraduate year for US grads —
`VERIFIED`), via the DC–MD–VA reciprocity pathway: ~$900–1,100 +
$130 CSR + likely ~$220 foreign-entity registration, **2–4 months
processing**. There is no shortcut: no telehealth registration, no
IMLC path (board certification required), so DC residents are
off-limits until the license issues. Economics: all-in ≈ 1½
member-months of revenue — the cost is noise; the *clock* is the real
variable, and you live in DC, so your closest word-of-mouth circle is
DC-resident.

**Trigger rule: count DC-resident interest during Stage 1. If ≥3 of
the first 10 serious prospects are DC residents (plausible, given
where you live), file the DC application at Stage 2 so the license
lands around month 3–4. Otherwise defer until the evidence appears.**
Until licensed: DC prospects go on the founding list with an honest
"Virginia first; DC pending" answer — never treated.

## 8. Transparency about the move: say it, once, plainly

It will not materially undermine the offer if handled the way the
brand already talks. The practice's differentiator is honesty; a
disclosed possibility with a concrete continuity plan is consistent
with it, and cancel-anytime membership means no one is trapped.

- **Consultation:** one plain statement: "One thing to know: I may
  relocate to Texas in the next year or two. If I do, most members can
  continue by video — I'd keep my Virginia license and return
  regularly for in-person visits — or I'll help you transition to a
  physician you like, with your records and a bridge of your
  prescriptions. You can cancel anytime either way."
- **Agreement (Virginia edition):** one relocation clause added to the
  ending-the-relationship section: continuation-by-telemedicine
  offered where clinically appropriate; otherwise the existing §10
  protections (30-day notice, safe handoff, free records, 90-day
  bridging). `NEEDS-COUNSEL` drafting.
- **Website:** nothing. A hero-level warning would overweight an
  uncertainty; the consultation and agreement are the honest venues.
  (House-style consistent: say it once, where it matters.)
- **Clinical design safeguard:** members whose conditions genuinely
  need frequent hands-on care get that named at the fit conversation —
  they're the ones a move genuinely affects, and the fit gate already
  exists for exactly this kind of honesty.

## 9. The honest case against starting now — and the verdict

1. **Your time is the scarcest input.** Olera CRO + FCHC + a launch is
   three jobs. *Answer:* the staged design spends hours before dollars;
   if Stage 1's ~5 hr/wk doesn't fit, the practice wouldn't have fit
   either — better to learn that for free.
2. **Split focus vs. Texas.** Era-1 logic said build assets, don't do
   perishable local work for a market you'll leave. *Answer:* that
   logic assumed the local work was worthless after the move. The
   research shows otherwise — the panel itself is portable, and the
   conversion data, tested funnel, and operating experience transfer
   at full value. The asymmetry has flipped.
3. **A tiny panel could be a distraction that earns ~$1–2k/mo.**
   *Answer:* true if measured as income. Measured as de-risking the
   Texas launch — real answers to "can I acquire patients?", "what do
   they use?", "does the $100 model retain?" — it's the cheapest
   possible purchase of the exact evidence the Texas launch otherwise
   gambles on.
4. **Medicare exclusion (if FCHC bills Medicare)** narrows the market
   and mutes the senior/caregiver angle. *Answer:* the beachhead is
   under-65 adults anyway; revisit at the FCHC-facts gate.
5. **Regulatory drift:** DEA rules change Jan 2027; Virginia's
   §54.1-3303(f) is unsettled. *Answer:* both have clean operating
   mitigations (§3, §6) and dated re-check triggers.

**Verdict: start Stage 0 now.** The question you asked — "can I turn
the next 6–12 months from waiting into operating, without unreasonable
financial risk or unfair patient commitments?" — has a yes with
numbers on it: ≤$6k worst case, break-even at ~6 members, a legal
continuity path if you move, and gates that stop the spending the
moment the evidence says stop.

## 10. Counsel/CPA/broker package (the professional-confirmation list)

1. Virginia DPC agreement + disclosure statement (§§54.1-2997/2998)
   adapted from the Texas draft; relocation clause. `NEEDS-COUNSEL`
2. The in-person-first-visit operating rule vs. §54.1-3303(f).
   `NEEDS-COUNSEL`
3. Medicare posture given FCHC facts (opt-out timing or
   Medicare-exclusion screening at enrollment). `NEEDS-COUNSEL`
4. Virginia advertising-rules pass on site + collateral (replaces the
   planned TMB pass; credential guardrails unchanged). `NEEDS-COUNSEL`
5. PLLC vs LLC; tax election. `NEEDS-CPA`
6. Malpractice: part-time/telemedicine-rated, occurrence vs
   claims-made + tail, home-visit rider, future multistate (TX
   residence, VA patients). `NEEDS-BROKER`
7. DC (if triggered): foreign-entity registration and any DC-specific
   agreement terms. `NEEDS-COUNSEL`
8. Employment-contract review (FCHC outside-practice terms) — may be a
   self-read plus a one-question counsel confirm. `OWNER-FACT →
   NEEDS-COUNSEL if ambiguous`
