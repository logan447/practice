# Payment Architecture — Comparison and Recommendation

*2026-08-16. The question: are we overcomplicating the economics? Compared:
insurance-first, simple flat-fee direct-pay, hybrid, and ramp architectures —
against the refined goal (D-018: ~$100k after-tax, ~30 hr/wk, ~39 wk/yr,
solo, minimal overhead). Research inputs: `docs/agreements/payment-landscape.md`
(2026-08-16) plus the insurance-operations and DPC-benchmarks research below.
`REFRESH-AT-RUNWAY`.*

---

## 1. The arithmetic that frames everything

Required revenue for the goal: **~$152–184k/yr** (unit economics §6:
$125–145k pre-tax profit + overhead + payment friction). Filled patient
hours available: **~736–828/yr** (920 attributable × 80–90% fill).

**Flat monthly fee, worked backward (center of revenue band, ~780 filled hr):**

| Fee | Panel needed | Hours/patient/yr | What that buys | Vision check |
|---|---|---|---|---|
| $50/mo | ~275 (253–307) | **2.8** | ~2 short visits + minimal messaging | ✗ volume medicine at a lower price — the thing being escaped |
| $75/mo | ~183 (169–204) | **4.3** | ~3 visits + light async | ✗ thin; no room for untangling work |
| $100/mo | ~138 (127–153) | **5.7** | ~4 visits + real async | ~ marginal; only with a light-skewed panel |
| $125/mo | ~110 (101–123) | **7.1** | ~5 visits + solid async | ✓ works for prevention/stable-chronic weighted panels |
| $150/mo | ~92 (84–102) | **8.5** | ~6 visits + full async + coordination | ✓ comfortable for P/S mix |

Sliding scale illustration: $125 nominal with 70% full / 20% at $85 / 10%
at $50 → average $110/mo → panel ~126 at 6.2 hr/patient.

**The confrontation the table forces:** the archetype time needs are
S ≈ 10.5 hr, M ≈ 16 hr, U ≈ 18.5 hr, C ≈ 23.5 hr — and *no flat fee in the
$50–150 range sustains those averages* at the target income and hours. A
single flat price therefore requires one of: (a) a panel deliberately
weighted to light patients, with intensive patients as cross-subsidized
exceptions; (b) a second tier for active/intensive phases; or (c)
abandoning the signature intensive work. (b) is the honest structure —
see the recommendation.

**Lower fee → larger panel → less time each** is not a gentle slope; at
$50–75 it reproduces exactly the volume treadmill this practice exists to
escape, just cash-financed.

## 2. Insurance as the default — the researched reality (2026-08-16)

**The most important finding: almost nothing in insurance-based practice
*forbids* the medicine you want. The constraints are economic and
administrative, not regulatory.**

**What is actually permitted (established, sourced):**
- **Long visits are explicitly billable.** Since the 2021 E/M overhaul,
  office visits code on total time: 99215 = 40–54 min (~$192 Medicare
  2026), prolonged codes beyond (G2212 ~$34/15 min), plus G2211
  longitudinal-care add-on (~$16, billable on nearly every PCP visit). A
  70-minute established visit ≈ **$242 from Medicare**. Commercial pays
  ~117–122% of Medicare for primary care.
- **No rule caps visit frequency or panel smallness** — only per-service
  medical necessity (audit exposure for outlier patterns, not
  prohibition). House calls, 30-hour weeks, and 13 weeks off are not
  prohibited (coverage obligations apply).
- **Non-visit work is partially billable:** CCM (~$66/mo), PCM, TCM
  (~$201–273/discharge), e-visits, RPM — and notably **APCM (G0556–58,
  new 2025): ~$15/$50/$110 per patient per month with no time-tracking
  threshold**, designed for exactly this kind of practice.
- **MIPS: a half-time solo practice is very likely exempt** (must exceed
  ALL of $90k Medicare charges / 200 beneficiaries / 200 services).

**What it costs (established):**
- **Credentialing lag:** Medicare ~30–60 days; commercial 90–150+ days
  each; plan 4–6 months to full in-network revenue. Texas's expedited
  law helps only physicians joining established groups — not a de novo
  solo. Closed panels exist but PCPs in shortage metros usually get in.
- **Unpaid administration is the binding constraint:** realistic no-staff
  model = ~10 of 30 weekly hours on claims/denials, prior auth (AMA 2025:
  ~40 PAs and 13 hr/wk at full volume — scaled, 3–6 hr/wk), and the
  unreimbursed inbox. **Medicare deleted phone-visit codes effective
  2025** — message/phone care is now almost entirely unpaid.
- Billing: ~3–8% of collections or ~$100–400/mo software; denials ~9–12%
  initial (mostly recoverable; net collection ~94–96%); 30–40 days A/R.
- Overhead without staff (micropractice pattern): **~25–35%** vs. 55–65%
  staffed.

**The two arithmetic realities (the decision hinge):**

| Style | Volume | Gross | Net pre-tax | Is it the vision? |
|---|---|---|---|---|
| **Volume-style** (40 visits/wk, 30-min slots, 20 pt-facing hr) | ~1,560 visits/yr | ~$222k | **~$150–165k** ✓ goal | ✗ — a better-lit version of the treadmill; ~500–800 panel, transactional |
| **Relationship-style** (12–15 long visits/wk + heavy unpaid async) | ~470–585 visits/yr | ~$100–140k (incl. APCM upside) | **~$55–85k** ✗ goal | ✓ the medicine, ✗ the economics |

**Insurance pays for encounters, not relationships.** Run at volume, it
hits the income goal by abandoning the model; run as the model, it
halves the income. The micropractice literature (Gordon Moore, ~35%
overhead, ~$123k net in 2007 dollars) proves the lean-solo-insurance
mechanics work — at ~11–12 visits/day, which is still encounter medicine.

## 3. The DPC evidence base (researched 2026-08-16, sourced)

**Panels and capacity.** DPC Alliance survey (n=465, published 2026): full
panels cluster at **400–700 per full-time physician**; part-time physicians
report full panels under 200–300. At your 0.55–0.6 FTE: **~275–360 patient
ceiling** at standard-DPC service intensity (~2–2.5 hr/patient/yr) — which
is the volume-lite version of care, not the archetype vision (5–8+ hr).
National average fee **$98/mo**; Austin average ~$106 with a proven
premium tier ($250–350/mo boutique practices operating today); Houston avg
~$112 across concierge+DPC.

**Ramp reality (the sobering numbers).** Average time to fill a panel:
**20–21 months**; a common rule of thumb is ~1,000 patients acquired to
keep 600 (~40% cumulative attrition); only **~17% of DPC physicians ever
reach their target panel**; annual churn ~**20%** (10–15% for
employer-sponsored members, 30–40% for low-income individual members).
Documented failure causes: underpricing (sub-$75/mo flagged repeatedly),
target population unable to afford fees, cash-flow mismanagement, weak
acquisition. Full-time DPC family physicians who succeed average ~$289k
(AAFP 2024) — the model can pay; the ramp is where it fails.

**The employer channel is now the market's engine:** 58% of all DPC
memberships nationally are employer-sponsored ($50–125 per employee per
month, typically $70–90, lowest churn). Two 30–40-member employer
contracts ≈ half the base-case panel. This belongs in the growth strategy
(D-022 amended by evidence: grassroots *plus* small-employer outreach).

**Texas specifics.** The DPC statute (Occ. Code ch. 162 subch. F) stands;
note its conjunctive definition (acute + chronic + preventive + continuity).
**Texas prohibits physician dispensing** (ban upheld, TX Supreme Court
declined review 2023) — no in-office medication margin; wholesale-lab
pass-through at negotiated rates is routine and permitted with disclosure.

**Two lanes are workable — separated by patient, never by service.** The
documented template (Epiphany Health/Gross): a **separate entity** holds
DPC memberships; the provider entity bills insurance; a given patient is
in exactly one lane, because in-network contracts oblige billing the plan
for covered services to its members and bar collecting beyond cost-share.
DPC Frontier recommends the pure model to minimize FCA/Stark exposure;
hybrid is a recognized, heavier-compliance option. Only **3.9%** of DPC
physicians run a Medicare hybrid; **80.7% opt out**.

**Transitions.** Insurance→membership (leaving a network): established
pattern — 90-day contract notice, patients told they may stay via DPC.
Membership→insurance (you join their plan's network): **no published
guidance found** — mechanically it is "DPC agreement ends (standard
30-day/renewal terms), then bill the plan," because you must not keep a
membership covering covered services once in-network. Needs health-law
review before doing it; disclose the possibility at enrollment.

**The ramp trap specific to you:** a physician who **moonlights cannot
opt out of Medicare** — and you are working part-time clinical jobs
through the preparation period. During ramp, Medicare-age patients must
be excluded, or handled only via the fragile non-covered-fee structure.
This materially shapes X-04 timing: full Medicare opt-out becomes
available only when moonlighting ends.

**Sliding scale:** minority practice in DPC (age-tiering is the norm,
76%); legally simple in a pure cash practice (documented criteria,
consistent application); becomes a compliance question the day an
insurance lane is added. Supports D-003 as a floor tier (e.g., $50 as
sliding-scale floor inside a ~$100 average), not as the headline price.

## 4. The architectures compared

| Criterion | Insurance-first | Flat DPC ($100-ish) | Two-tier membership | Full hybrid (fee + billing same patients) | Ramp: direct-pay now, insurance lane later |
|---|---|---|---|---|---|
| Patient affordability | **Best** (premiums already paid; copays only) | Good at $50–100; second-payment problem is real | Good; sliding floor + episodes help | Good in theory | Good, improves if lane added |
| Ease of explaining/selling | Familiar | **Best** — one number | **Near-best** — two numbers | Worst — "fee plus insurance plus copays" | Good |
| Physician autonomy / practice style | Style permitted but economically punished; PA + network duties | High | **High** | Constrained (fee-inventory limits what fee may cover) | High |
| Admin burden | Heavy (~1/3 of hours unpaid admin) | **Minimal** | **Minimal** | Heaviest (both stacks + segregation) | Minimal now; contained later |
| Regulatory complexity | Moderate (enrollment, audit, FCA) | **Lowest** (TX DPC statute) | **Lowest** | Highest (OIG fee-inventory, hold-harmless) | Low → moderate |
| $100k after-tax @ 30hr/39wk | Only at volume style (✗ vision) or ✗ income | ✓ at ~$100–125/mo × 125–150 | **✓ with margin** (mix below) | Theoretically ✓, practically fragile | ✓ |
| Slow-ramp compatibility | Poor (4–6 mo credentialing lag, A/R lag, then volume pressure) | Good | **Good** | Poor | **Best** |
| Resilience if credentialing fails | None | **Total** (no payers) | **Total** | Low | **Total** (lane is optional) |
| Alignment with the medicine (D-014) | Encounter-shaped | Good but flat fee strains intensive patients | **Best** — tier matches intensity | Fee can't lawfully describe the actual product | Best |
| Precedent | Micropractice (proven, encounter-style) | Mainstream DPC (proven; 17% reach target panel — ramp is the risk) | Premium-DPC/tiered practices proven in Austin | Only 3.9% of DPC docs run Medicare hybrids | Epiphany/Gross template (proven) |

## 5. Recommendation

**Yes — we were overcomplicating the pricing. No — the simplest version
($50–75 flat, or insurance-first) doesn't survive the arithmetic. The
simplest *viable* architecture is:**

### A two-tier membership core, direct-pay, with episodes — insurance as a deliberately deferred, separable lane

1. **Foundation membership — ~$99–129/mo** (calibrate in validation):
   the ongoing physician relationship — visits as needed with real time,
   messaging, results with interpretation, coordination, trend tracking.
   Sustains ~6–8 hr/patient/yr. This is the P/S archetype home, priced at
   the top of the Austin mainstream ($106 avg) where the practice's
   depth-of-relationship story justifies the premium.
2. **Intensive tier — roughly 2× Foundation (~$225–275/mo)**, for active
   phases: the untangling work, active metabolic management, complex
   diagnostic years (M/U/C archetypes, ~15–20 hr/yr). Patients **move
   between tiers at checkpoints** — intensive phases end, and the price
   steps down when they do (the renewal promise kept). Austin precedent:
   $250–350/mo practices operate today.
3. **Defined-problem episodes** (E archetype, flat price) for people who
   need an excellent episode, not a membership.
4. **Sliding-scale floor** (D-003) inside the tiers — e.g., $50–65/mo
   income-based Foundation — rather than a lower headline price.
5. **Employer memberships as a growth lane** (58% of the national DPC
   market; $70–90 PEPM; lowest churn) — two 30-member employers ≈ a
   third of the panel.

**Worked mix at target** (illustrative): 75 Foundation @ $115 avg
($103k) + 20 Intensive @ $250 ($60k) + 8 episodes ($13k) ≈ **$176k
revenue, ~95 concurrent relationships, ~700–780 attributable hours** —
inside the $152–184k requirement at ~80–85% fill, with the intensive
work funded honestly instead of cross-subsidized.

**Why this wins:** it keeps flat-fee simplicity where patients meet it
(two published numbers + a floor — "here's how I can help, here's what
it costs"), funds the signature intensive medicine that a single flat fee
mathematically cannot, runs on the Texas DPC statute with near-zero
billing apparatus, needs ~95 relationships instead of 275, and reaches
the income goal with margin. The individualized Scope & Fee Schedule
survives but **simplifies**: it now names a tier, period, and checkpoint
instead of computing a custom price — the D-002 time framework becomes
the *internal* tool for tier assignment and panel management.

### The insurance decision — deferred, not rejected

The affordability argument for insurance is real and stays on the table.
The posture: **launch pure direct-pay; revisit insurance participation as
an evidence-based decision once real patients reveal whether price is the
actual acquisition constraint.** If it is, the researched path exists: a
**separate lane, separated by patient** (Epiphany template, ideally a
separate entity), added without redesigning the membership practice.
What we will NOT do: charge membership fees to patients whose insurance
we bill (the fee-inventory/hold-harmless trap), or promise insurance
participation before credentialing reality is known.

**Medicare, specifically:** during ramp you cannot opt out (moonlighting
blocks it — established). So at launch: Medicare-age patients either
wait, or are served only under a carefully-drafted non-covered-services
arrangement (`NEEDS-COUNSEL`, fragile). When moonlighting ends, the
opt-out decision unlocks. This is now the sharpest constraint on the
healthy-aging mission and belongs at the top of the counsel agenda
(X-04).

### Ramp design (the credentialing-optionality question answered)

- Launch direct-pay. Disclose in the standard agreement that the practice
  may later participate with some insurers, and what happens then
  (established mechanics: the membership ends at renewal/30-day terms if
  the patient moves to the insurance lane; they may instead choose to
  keep the membership form — but never both for covered services).
- If an insurance lane is ever added: separate cohort, contract-by-
  contract counsel review, entity separation per the researched template.
- **Downside scenario (credentialing fails or proves not worth it): the
  practice is already whole.** Direct-pay is the architecture, not the
  fallback.

### What would change this recommendation

- Validation shows the Austin-band pricing doesn't sell to *your* people
  → revisit price points before revisiting architecture.
- Ramp stalls at a panel far below ~95 despite good process (the 17%
  cautionary statistic) → employer channel first, insurance lane second.
- Moonlighting ends early and the Medicare-age mission dominates →
  opt-out + private contracts becomes newly attractive.
