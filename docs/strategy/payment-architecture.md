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

## 3. The two-lane and ramp questions

*(Research findings inserted below — see §3a.)*

Structural answers from prior research: a practice may run direct-pay
members alongside insurance-billed patients, but in-network contracts may
constrain offering memberships to members of plans the practice
participates in — contract-by-contract review (`NEEDS-COUNSEL`). Medicare
lane is governed by mandatory-claims/opt-out rules regardless of design.

## 4. Comparison against the ten criteria

*(Completed after research integration — §6.)*

## 5. Recommendation

*(Stated after research integration — §6.)*
