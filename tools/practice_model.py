#!/usr/bin/env python3
"""Subscription economics model for a solo, direct-pay practice at a flat
monthly rate (D-029: $100/month per adult patient).

Answers, in order:
  1. CAPACITY   - deliverable patient-attributable hours
  2. PANEL MATH - what a given panel earns and what each patient gets
  3. TAKE-HOME  - panel required for each take-home tier (after-tax bands)
  4. UTILIZATION VARIABILITY - does a heavy-user tail break the flat rate?
  5. RAMP       - months to target panel at researched add/churn rates
  6. SENSITIVITY- churn, utilization, overhead, mix intensity

Design principle: the tool never invents a number. Cost inputs default to
zero and are reported UNSET. Tax translation is a labeled CPA-variable band,
not advice. Benchmarks cited from the 2026-08 research (docs/agreements/
payment-landscape.md and archived payment-architecture.md).

    python3 tools/practice_model.py
    python3 tools/practice_model.py --panel 170 --churn 0.25
    python3 tools/practice_model.py --help

No dependencies. Python 3.8+.
"""

import argparse
import sys
from dataclasses import dataclass, fields

# Cost inputs. Default zero, reported as UNSET. Never guessed.
COST_FIELDS = [
    ("malpractice", "Malpractice premium (TX quotes at runway; VA historicals as reference)"),
    ("disability_insurance", "Own-occupation disability premium"),
    ("licensure", "Licensure, DEA, credentialing, CME"),
    ("ehr_platforms", "EHR, telemedicine, website, membership billing platform"),
    ("space_costs", "Rented clinical space, annual total"),
    ("travel_costs", "Home-visit travel hard costs"),
    ("legal_accounting", "Legal and accounting"),
    ("marketing", "Marketing (grassroots default)"),
    ("physician_benefits", "Health insurance, retirement match, etc."),
    ("other_fixed", "Other fixed costs"),
]

# After-tax -> pre-tax translation bands. TX has no state income tax.
# Bands reflect filing-status / QBI / SE-tax / entity-structure uncertainty.
# NEEDS-CPA (Q-18). (low, high) pre-tax profit needed per after-tax target.
TAKE_HOME_TIERS = [
    (50_000, (58_000, 66_000)),
    (75_000, (88_000, 100_000)),
    (100_000, (125_000, 145_000)),
    (125_000, (160_000, 185_000)),
    (150_000, (195_000, 225_000)),
]

# Intensity mix archetypes (hours/patient/yr, UNPRICED - D-029 flat rate).
# Descended from the archived archetype library; illustrative priors to be
# replaced by measured utilization from patient one.
INTENSITY_MIX = [
    ("light (prevention, stable)", 3.5),
    ("moderate (1-2 active issues)", 6.0),
    ("heavy (active mgmt / untangling)", 14.0),
    ("very heavy (complex year)", 20.0),
]


@dataclass
class Inputs:
    # --- Price (D-029) ----------------------------------------------------
    monthly_fee: float = 100.0

    # --- Capacity (D-017 availability inside these numbers) ---------------
    weeks_worked: float = 39.0
    clinical_hours_per_week: float = 30.0
    fixed_admin_hours: float = 250.0   # illustrative practice-level admin
    utilization: float = 0.85          # share of patient-attributable hours that fill

    # --- Panel & dynamics -------------------------------------------------
    panel: int = 140                   # scenario panel (adults)
    churn: float = 0.20                # researched DPC average
    net_adds_per_month: float = 10.0   # researched part-time ramp band 8-12
    payment_friction: float = 0.05     # processing ~3% + failed payments/bad debt ~2%

    # --- Intensity mix (share of panel per INTENSITY_MIX row) -------------
    # Default = boundary-sustainable mix (~99% of filled hours). Try
    # "0.35,0.40,0.18,0.07" to see how a heavy-skewed panel breaks the rate.
    mix_shares: str = "0.55,0.36,0.06,0.03"

    # --- Costs (all UNSET by design) --------------------------------------
    malpractice: float = 0.0
    disability_insurance: float = 0.0
    licensure: float = 0.0
    ehr_platforms: float = 0.0
    space_costs: float = 0.0
    travel_costs: float = 0.0
    legal_accounting: float = 0.0
    marketing: float = 0.0
    physician_benefits: float = 0.0
    other_fixed: float = 0.0
    overhead_scenario: float = 22_000.0  # used ONLY when cost lines are all unset

    # --- Derived ----------------------------------------------------------
    @property
    def annual_fee(self) -> float:
        return self.monthly_fee * 12

    @property
    def attributable_hours(self) -> float:
        return self.weeks_worked * self.clinical_hours_per_week - self.fixed_admin_hours

    @property
    def filled_hours(self) -> float:
        return self.attributable_hours * self.utilization

    @property
    def entered_costs(self) -> float:
        return sum(getattr(self, name) for name, _ in COST_FIELDS)

    @property
    def overhead(self) -> float:
        return self.entered_costs if self.entered_costs > 0 else self.overhead_scenario

    @property
    def overhead_is_scenario(self) -> bool:
        return self.entered_costs <= 0

    def revenue(self, panel: int) -> float:
        return panel * self.annual_fee * (1 - self.payment_friction)

    def pretax(self, panel: int) -> float:
        return self.revenue(panel) - self.overhead

    def panel_for_pretax(self, pretax_target: float) -> float:
        return (pretax_target + self.overhead) / (self.annual_fee * (1 - self.payment_friction))

    def breakeven_panel(self) -> float:
        return self.panel_for_pretax(0.0)


def money(x: float) -> str:
    return f"${x:,.0f}"


def rule(c: str = "-", w: int = 76) -> str:
    return c * w


def report_unset(i: Inputs) -> None:
    unset = [(n, d) for n, d in COST_FIELDS if getattr(i, n) == 0.0]
    if not unset:
        return
    print(rule("!"))
    print("UNSET COST INPUTS - no figure invented for any of these")
    print(rule("!"))
    for name, desc in unset:
        print(f"  [ ] --{name.replace('_', '-'):<22} {desc}")
    if i.overhead_is_scenario:
        print(f"\n  Using SCENARIO overhead of {money(i.overhead_scenario)} until real quotes exist")
        print("  (micropractice research band: ~$20-30k lean, no staff).")
    print()


def report_capacity(i: Inputs) -> None:
    print(rule("="))
    print("1 - CAPACITY")
    print(rule("="))
    print(f"  {i.weeks_worked:.0f} wk x {i.clinical_hours_per_week:.0f} hr = "
          f"{i.weeks_worked * i.clinical_hours_per_week:,.0f} total working hr/yr")
    print(f"  - {i.fixed_admin_hours:.0f} practice admin = "
          f"{i.attributable_hours:,.0f} patient-attributable hr")
    print(f"  x {i.utilization:.0%} utilization = {i.filled_hours:,.0f} filled hr/yr")
    print("  (13 weeks/yr away and protected evenings/weekends are inside these")
    print("   inputs by construction - D-017)")
    print()


def report_panel(i: Inputs) -> None:
    p = i.panel
    rev = i.revenue(p)
    pretax = i.pretax(p)
    hrs = i.filled_hours / p if p else 0
    # rough weekly picture
    pt_hr_wk = i.filled_hours / i.weeks_worked
    sync_share, async_share, admin_share = 0.55, 0.30, 0.15  # illustrative split
    print(rule("="))
    print(f"2 - PANEL MATH at {p} adults x {money(i.monthly_fee)}/mo (D-029)")
    print(rule("="))
    print(f"  MRR {money(p * i.monthly_fee):>10}    ARR {money(p * i.annual_fee):>10}"
          f"    after {i.payment_friction:.0%} friction: {money(rev)}")
    ohn = " (SCENARIO)" if i.overhead_is_scenario else ""
    print(f"  Overhead {money(i.overhead)}{ohn}  ->  PRE-TAX {money(pretax)}")
    print(f"  Hours available per patient-year: {hrs:.1f}")
    print(f"  Weekly during working weeks: ~{pt_hr_wk:.0f} patient hr "
          f"(~{pt_hr_wk*sync_share:.0f} visits/sync, ~{pt_hr_wk*async_share:.0f} async, "
          f"~{pt_hr_wk*admin_share:.0f} per-patient admin) + "
          f"{i.fixed_admin_hours/i.weeks_worked:.0f} practice admin")
    visits = i.filled_hours * sync_share / 0.6  # ~35min visit + wrap
    print(f"  Visit capacity: ~{visits:,.0f} visit-equivalents/yr "
          f"(~{visits/p:.1f}/patient avg); home visits (~2-2.5 hr each incl travel)")
    print(f"  consume ~{2.25/hrs*100:.0f}% of one patient's annual budget per visit -")
    print("  clinically-indicated and clustered, not an on-demand amenity")
    print(f"  Churn at {i.churn:.0%}: ~{p*i.churn:.0f} replacements/yr to hold the panel")
    print(f"  Break-even panel (overhead only): ~{i.breakeven_panel():.0f} adults")
    print()


def report_takehome(i: Inputs) -> None:
    print(rule("="))
    print("3 - PANEL REQUIRED PER TAKE-HOME TIER (after-tax; TX; band = CPA variables)")
    print(rule("="))
    print(f"  {'take-home':>10}  {'pre-tax needed':>16}  {'panel needed':>13}  "
          f"{'hr/patient':>10}  {'note':<24}")
    print("  " + rule("-", 74))
    ceiling = 340  # researched 0.55-0.6 FTE DPC-intensity ceiling midpoint-high
    for target, (lo, hi) in TAKE_HOME_TIERS:
        p_lo, p_hi = i.panel_for_pretax(lo), i.panel_for_pretax(hi)
        h_lo, h_hi = i.filled_hours / p_hi, i.filled_hours / p_lo
        note = ""
        if p_hi > ceiling:
            note = "exceeds ~340 capacity ceiling"
        elif h_lo < 4.0:
            note = "approaching volume-DPC intensity"
        print(f"  {money(target):>10}  {money(lo):>7}-{money(hi):<8}  "
              f"{p_lo:>5.0f}-{p_hi:<6.0f}  {h_lo:>4.1f}-{h_hi:<4.1f}  {note:<24}")
    print()
    print("  >> The $100k tier lands at ~127-153 adults with ~5-6 hr/patient -")
    print("     about half the researched part-time capacity ceiling.")
    print()


def report_variability(i: Inputs, shares) -> None:
    print(rule("="))
    print("4 - UTILIZATION VARIABILITY - does the heavy tail break the flat rate?")
    print(rule("="))
    p = i.panel
    budget = i.filled_hours / p
    total = 0.0
    print(f"  Sustainability condition: panel-mean hours <= {budget:.1f} hr/patient")
    print(f"  {'segment':<36}{'share':>7}{'patients':>10}{'hr each':>9}{'hours':>8}")
    print("  " + rule("-", 70))
    for (name, hrs), share in zip(INTENSITY_MIX, shares):
        n = p * share
        total += n * hrs
        print(f"  {name:<36}{share:>6.0%}{n:>10.0f}{hrs:>9.1f}{n*hrs:>8.0f}")
    mean = total / p
    print("  " + rule("-", 70))
    print(f"  {'PANEL MEAN':<36}{'':>7}{p:>10.0f}{mean:>9.1f}{total:>8.0f}"
          f"   vs {i.filled_hours:,.0f} available")
    status = "SUSTAINABLE" if total <= i.filled_hours else "OVER CAPACITY"
    print(f"  => {status} ({total/i.filled_hours:.0%} of filled hours)")
    # how many very-heavy patients fit
    vh = INTENSITY_MIX[-1][1]
    light = INTENSITY_MIX[0][1]
    print(f"\n  Rule of thumb: each very-heavy patient ({vh:.0f} hr) consumes the budget")
    print(f"  of ~{vh/budget:.1f} average patients; sustainable only while balanced by")
    print(f"  ~{(vh-budget)/(budget-light):.1f} light patients ({light:.0f} hr) each. Manage the MIX, not the price:")
    print("  enrollment gate (D-016), utilization tracked per patient from day one,")
    print("  renewal conversations for sustained outliers, resource-intensive")
    print("  carve-outs in the Practice Terms (Q-19).")
    print()


def report_ramp(i: Inputs) -> None:
    print(rule("="))
    print("5 - RAMP (researched: part-time adds ~8-12/mo; avg fill 20-21 mo; churn ~20%)")
    print(rule("="))
    target = i.panel
    p, months = 0.0, 0
    milestones = {}
    while p < target and months < 60:
        months += 1
        p += i.net_adds_per_month - p * (i.churn / 12)
        for m in (i.breakeven_panel(), target * 0.5, target):
            if p >= m and m not in milestones:
                milestones[m] = months
    for m, mo in sorted(milestones.items()):
        label = ("break-even" if abs(m - i.breakeven_panel()) < 1 else
                 "half panel" if abs(m - target * 0.5) < 1 else "target panel")
        print(f"  {label:<12} ~{m:>4.0f} adults  ->  month {mo:>2}  "
              f"(MRR {money(m * i.monthly_fee)})")
    if target not in [round(k) for k in milestones]:
        pass
    print(f"  Steady state: ~{target * i.churn:.0f} replacements/yr; acquisition is a")
    print("  permanent function, not a launch phase. Employer memberships (58% of")
    print("  the national DPC market, lowest churn) are the fastest de-risking lane.")
    print()


def report_sensitivity(i: Inputs) -> None:
    print(rule("="))
    print("6 - SENSITIVITY around the base panel")
    print(rule("="))
    base = i.pretax(i.panel)
    rows = [
        ("churn 20% -> 30%", f"+{i.panel*0.10:.0f} replacements/yr acquisition load (revenue unchanged if replaced; ramp slows if not)"),
        ("utilization 85% -> 75%", f"hours/patient {i.filled_hours/i.panel:.1f} -> {(i.attributable_hours*0.75)/i.panel:.1f} (service thins, revenue unchanged)"),
        ("overhead +$10k", f"pre-tax {money(base)} -> {money(base-10_000)} (or +{10_000/(i.annual_fee*(1-i.payment_friction)):.0f} patients)"),
        ("fee $100 -> $90", f"pre-tax {money(base)} -> {money(i.revenue(i.panel)*0.9 - i.overhead)} at same panel"),
        ("mix shifts heavy (+5pp very-heavy)", "panel mean +~0.8 hr/pt -> mean can exceed budget; see section 4"),
    ]
    for k, v in rows:
        print(f"  {k:<32} {v}")
    print()


def report_provenance() -> None:
    print(rule("~"))
    print("PROVENANCE")
    print(rule("~"))
    print("  $100/mo flat, adults only     D-029/D-030 (decided baseline)")
    print("  churn 20%, adds 8-12/mo       researched DPC benchmarks (2026-08, dated)")
    print("  utilization, admin hours      ILLUSTRATIVE - replace with measured actuals")
    print("  intensity mix                 ILLUSTRATIVE priors from archived archetypes")
    print("  after-tax bands               CPA VARIABLES (Q-18) - mechanism only")
    print("  cost lines                    UNSET until real quotes (scenario $22k)")
    print()


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Subscription economics for a solo direct-pay practice.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    d = Inputs()
    g = p.add_argument_group("model")
    g.add_argument("--monthly-fee", type=float, default=d.monthly_fee)
    g.add_argument("--panel", type=int, default=d.panel)
    g.add_argument("--churn", type=float, default=d.churn)
    g.add_argument("--net-adds-per-month", type=float, default=d.net_adds_per_month)
    g.add_argument("--payment-friction", type=float, default=d.payment_friction)
    g.add_argument("--mix-shares", type=str, default=d.mix_shares,
                   help="Panel shares for light/moderate/heavy/very-heavy")
    c = p.add_argument_group("capacity")
    c.add_argument("--weeks-worked", type=float, default=d.weeks_worked)
    c.add_argument("--clinical-hours-per-week", type=float, default=d.clinical_hours_per_week)
    c.add_argument("--fixed-admin-hours", type=float, default=d.fixed_admin_hours)
    c.add_argument("--utilization", type=float, default=d.utilization)
    o = p.add_argument_group("costs (UNSET by default; scenario overhead used if none set)")
    o.add_argument("--overhead-scenario", type=float, default=d.overhead_scenario)
    for name, desc in COST_FIELDS:
        o.add_argument(f"--{name.replace('_', '-')}", type=float, default=0.0, help=desc)
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    valid = {f.name for f in fields(Inputs)}
    i = Inputs(**{k: v for k, v in vars(args).items() if k in valid})
    try:
        shares = [float(x) for x in i.mix_shares.split(",")]
    except ValueError:
        print("error: --mix-shares must be comma-separated numbers", file=sys.stderr)
        return 2
    if len(shares) != len(INTENSITY_MIX) or abs(sum(shares) - 1.0) > 0.01:
        print(f"error: --mix-shares needs {len(INTENSITY_MIX)} values summing to 1.0",
              file=sys.stderr)
        return 2
    if not (0 < i.utilization <= 1.0) or i.attributable_hours <= 0 or i.panel <= 0:
        print("error: check --utilization, capacity inputs, and --panel", file=sys.stderr)
        return 2

    print()
    report_unset(i)
    report_capacity(i)
    report_panel(i)
    report_takehome(i)
    report_variability(i, shares)
    report_ramp(i)
    report_sensitivity(i)
    report_provenance()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
