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

## 2. Insurance as the default — the operational reality

*(Research findings inserted below — see §2a.)*

Prior research already established the structural facts
(`payment-landscape.md`): participation brings claims/coding/audit
apparatus, FCA exposure on E/M levels, hold-harmless limits on extra
fees, mandatory claims for Medicare patients, and commercial primary care
reimbursement around 110–130% of Medicare (99214 ≈ $136 national).

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

## 4. Comparison against the ten criteria

*(Completed after research integration — §6.)*

## 5. Recommendation

*(Stated after research integration — §6.)*
