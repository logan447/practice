# Unit Economics

*Rebuilt 2026-08-16 around the re-baselined model (D-029/D-030): a solo,
adult-focused, direct-pay practice at **one flat rate of $100/month per
patient** — standardized price, individualized medicine. Run any scenario
with `tools/practice_model.py`; every number here reproduces from it.*

> **Provenance discipline:** researched benchmarks are cited and dated;
> tax translation is a CPA-variable band (Q-18); cost lines are UNSET
> until real quotes exist (a $22k scenario overhead stands in, from the
> researched no-staff micropractice band of ~$20–30k); utilization and
> intensity figures are illustrative priors to be replaced by measured
> actuals from patient one.

---

## 1. The practice at a glance (base case)

**140 adults × $100/month**, 30 hr/wk × 39 weeks, evenings/weekends
protected, ~13 weeks/year away:

| | |
|---|---|
| Monthly recurring revenue | **$14,000** |
| Annual revenue (after ~5% payment friction) | **~$160k** |
| Overhead (scenario — lines UNSET) | ~$22k |
| **Pre-tax practice income** | **~$137k** |
| **Take-home (after-tax, TX, CPA band)** | **≈ $95–110k → the ~$100k goal** |
| Hours available per patient per year | **~5.6** |
| Weekly rhythm (working weeks) | ~11 hr visits (≈15–18 visits) · ~6 hr messaging/results · ~3 hr per-patient admin · ~6 hr practice admin ≈ 26–27 hr + slack |
| Visit capacity | ~700 visit-equivalents/yr ≈ 5/patient average |
| Home visits | ~2–2.5 hr each incl. travel = ~40% of one patient's annual budget — clinically indicated and clustered, not an on-demand amenity |
| Churn at researched 20% | ~28 replacements/yr — acquisition is permanent |
| Break-even panel | **~19 adults** (overhead only) |
| Capacity ceiling context | ~275–360 adults possible at volume-DPC intensity — the 140 panel uses about half, which is where the extra time per patient comes from |

**Market position (researched 2026-08):** $100/month *is* the researched
center of the market — national DPC average $98.46, Austin average ~$106,
verified Texas practices $65–99. This price requires no pioneering; the
market has already validated it. What the practice must justify is not the
number but the *depth* delivered at that number.

## 2. Panel required per take-home tier

After-tax targets translated through the CPA-variable band (Texas, no
state income tax; filing status / QBI / entity structure unresolved —
Q-18):

| Take-home | Pre-tax needed | Panel needed | Hr/patient | Reading |
|---|---|---|---|---|
| $50k | $58–66k | **70–77** | 10–11 | rich-attention small practice |
| $75k | $88–100k | **96–107** | 7–8 | comfortable middle |
| **$100k (goal)** | $125–145k | **~129–146** | **5.3–6.1** | the base case |
| $125k | $160–185k | 160–182 | 4.3–4.9 | thinning attention |
| $150k | $195–225k | 190–217 | 3.6–4.1 | approaching volume-DPC intensity |

The frontier is smooth and every tier is inside capacity — but each $25k
of income costs ~35–40 patients and ~1 hour of annual attention per
patient. **The $100k goal is the sweet spot of this architecture:** met
with real margin, at half the capacity ceiling, with enough
hours-per-patient to keep the medicine recognizably yours.

## 3. Utilization variability — the pressure test (the finding that matters most)

The flat rate's sustainability condition: **panel-mean hours ≤ ~5.6
hr/patient/yr.** Individual patients can and will vary enormously around
that mean — the question is the mix.

| Panel mix | Heavy+very-heavy share | Panel mean | Result |
|---|---|---|---|
| Boundary-sustainable (default): 55% light / 36% moderate / 6% heavy / 3% very heavy | **~9%** | ~5.5 hr | 99% of capacity — holds |
| Untangler-attracting mix: 35/40/18/7 | **25%** | ~7.5 hr | **135% of capacity — breaks** |

(Intensity priors from the archived archetype work: light ~3.5 hr,
moderate ~6, heavy ~14, very heavy ~20.)

**The rule of thumb:** each very-heavy patient (~20 hr) consumes ~3.6
average patients' budgets and must be balanced by ~7 light ones. At a flat
$100/month, **the practice can carry heavy/very-heavy patients as roughly
1 in 8–10 of the panel — not 1 in 4.**

This collides directly with the practice's clinical identity (D-014's
overwhelmed signature patient) and with adverse selection: marketing that
attracts people who need untangling, at an affordable flat price, will
skew the panel heavy — *most strongly during the ramp, when every
enrollee is welcome.* The answer is **panel management, not price
complexity** (D-029 stands):

1. **Enrollment gate** — the onboarding conversations (D-016) now serve as
   the capacity check: can this person be served well *within the model,
   at the panel's current mix*? "Not yet / not me / let me refer you well"
   are legitimate outcomes.
2. **Utilization tracked per patient from day one** — the old
   estimate-vs-actual discipline (R-08) becomes simple utilization
   monitoring; the EHR/tooling requirement survives unchanged.
3. **Intensive phases are expected to be phases** — active problems get
   active care; what the model cannot absorb is a *quarter of the panel in
   permanent crisis*. Renewal conversations re-scope sustained outliers
   honestly (including referral to more intensive care settings when that
   is what they clinically need).
4. **Resource-intensive carve-outs in the Practice Terms** (Q-19): a
   short, patient-friendly list of things outside the subscription
   (e.g., extensive medico-legal paperwork, home visits beyond clinical
   indication, care requiring near-daily contact for months) — designed
   once, stated up front, so boundaries never arrive as surprises.
5. **Mix-aware growth** — during ramp, balance recruitment channels so the
   panel doesn't fill with only the heaviest seekers; employer
   memberships (typically lighter average utilization, lowest churn) are
   the natural counterweight.

## 4. Ramp

At researched part-time benchmarks (~8–12 net adds/month; average DPC
fill time 20–21 months; 20% churn):

| Milestone | Panel | Month | MRR |
|---|---|---|---|
| Break-even | ~19 | ~2 | ~$1,900 |
| Half panel | ~70 | ~8 | $7,000 |
| **Target** | **~140** | **~14–18** | **$14,000** |

Sobriety attached (R-03): only ~17% of DPC physicians reach their target
panel, and low-price individual members churn hardest (30–40%). The
target being 140 rather than 600 improves the odds materially; the $20k
prep ceiling, near-zero fixed costs, and continued moonlighting income
make the ramp survivable; employer contracts shortcut it.

## 5. Sensitivity (tool section 6)

- **Churn 20→30%:** +14 replacements/yr of acquisition work; revenue holds
  only if replacement keeps pace.
- **Utilization 85→75%:** service thins to ~4.9 hr/patient; revenue
  unchanged — utilization softness shows up as thinner care, not less
  money, which makes it easy to miss. Track it.
- **Overhead +$10k:** pre-tax −$10k, or ~9 more patients.
- **Mix +5pp very-heavy:** panel mean +~0.8 hr — §3 is the binding
  constraint long before revenue is.
- **Fee $100→$90:** −$16k pre-tax at the same panel — price integrity
  matters; discounts are panel-mix and mission decisions (X-10), not
  casual accommodations.

## 6. What this retires

Individualized pricing, complexity multipliers, uncertainty allowances,
per-engagement pricing, archetype price cards, and tier structures — all
archived (`docs/archive/`). The time-based *thinking* survives in exactly
one place: the intensity mix in §3, which is how the flat-rate practice
stays honest about where its hours go.
