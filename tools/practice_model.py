#!/usr/bin/env python3
"""Arrangement-based economics model for a solo, individualized primary care
practice.

The model matches docs/strategy/unit-economics.md: each patient relationship
is a small customized clinical contract, priced from a defensible framework —

    price = expected physician time x complexity-adjusted hourly rate
            + direct resources, sanity-checked against value

The tool answers, in order:
  1. How many patient-attributable hours exist?           (capacity)
  2. What must an hour earn to sustain the practice?      (required rate)
  3. What does each arrangement archetype cost at a rate? (pricing framework)
  4. Does a given mix of arrangements reach the target?   (mix evaluation)

Design principle: the tool never invents a number. Cost inputs default to
zero and are reported UNSET. Archetype hours are illustrative placeholders —
edit ARCHETYPES below as proposal-stage estimates and measured actuals
accumulate. Provenance of key inputs prints on every run.

    python3 tools/practice_model.py
    python3 tools/practice_model.py --hourly-rate 200 --mix 10,15,8,5
    python3 tools/practice_model.py --help

No dependencies. Python 3.8+.
"""

import argparse
import sys
from dataclasses import dataclass, fields

# --------------------------------------------------------------------------
# Arrangement archetypes — ILLUSTRATIVE. Hours per engagement over its
# duration; complexity is a bounded multiplier applied to the rate (D-002:
# defined inputs — disease complexity, scope, coordination, intensity).
# Edit freely; keep `key` stable for --mix ordering.
# --------------------------------------------------------------------------
ARCHETYPES = [
    dict(key="P", name="Prevention & longitudinal guidance",
         sync=3.5, async_=2.5, travel=0.0, admin=1.0,
         complexity=0.9, space_sessions=1),
    dict(key="S", name="Stable chronic (1-2 conditions)",
         sync=5.0, async_=4.0, travel=0.0, admin=1.5,
         complexity=1.0, space_sessions=1),
    dict(key="M", name="Active metabolic/lifestyle work",
         sync=8.0, async_=6.0, travel=0.0, admin=2.0,
         complexity=1.1, space_sessions=1),
    dict(key="C", name="Complex medical untangler (year 1)",
         sync=10.0, async_=8.0, travel=3.0, admin=2.5,
         complexity=1.3, space_sessions=2),
    dict(key="U", name="Whole-life untangler (signature)",
         sync=9.0, async_=7.0, travel=0.0, admin=2.5,
         complexity=1.2, space_sessions=1),
]

# Cost inputs. Default zero, reported as UNSET. Never guessed.
COST_FIELDS = [
    ("malpractice", "Malpractice premium (VA historicals as reference; TX at runway)"),
    ("disability_insurance", "Own-occupation disability premium (R-05)"),
    ("licensure", "Licensure, DEA, credentialing, CME"),
    ("ehr_platforms", "EHR, telemedicine, website, subscriptions (D-021 stack)"),
    ("space_costs", "Rented clinical space, annual total (X-05)"),
    ("legal_accounting", "Legal and accounting"),
    ("marketing", "Marketing (grassroots default, D-022)"),
    ("physician_benefits", "Health insurance, retirement, payroll taxes"),
    ("other_fixed", "Other fixed costs"),
]

PROVENANCE = [
    ("hourly_rate", "SCENARIO or derived — the defensible anchor (D-002); "
                    "derived = (target_low + costs) / (available hrs x utilization)"),
    ("target incomes", "D-018 (~$130k-$175k target; >$100k meaningful minimum)"),
    ("archetype hours", "ILLUSTRATIVE — replace with proposal estimates, then actuals (R-08)"),
    ("complexity multipliers", "ILLUSTRATIVE bounds — calibration is open work (Q-14)"),
    ("capacity inputs", "ILLUSTRATIVE — includes D-017 availability model by construction"),
    ("utilization", "ILLUSTRATIVE — how many available hours actually fill"),
]


@dataclass
class Inputs:
    # --- Capacity (D-017 availability is inside these numbers) -----------
    weeks_worked: float = 46.0            # illustrative
    clinical_hours_per_week: float = 30.0  # illustrative
    fixed_admin_hours: float = 250.0       # illustrative: practice-level admin

    # --- Rate framework ---------------------------------------------------
    hourly_rate: float = 0.0     # 0 => derive from target_low at `utilization`
    utilization: float = 0.75    # illustrative share of available hours that fill

    # --- Targets (D-018) --------------------------------------------------
    target_floor: float = 100000.0
    target_income_low: float = 130000.0
    target_income_high: float = 175000.0

    # --- Direct resources -------------------------------------------------
    space_session_cost: float = 0.0   # UNSET — per rented session, pass-through

    # --- Practice costs (all UNSET by design) -----------------------------
    malpractice: float = 0.0
    disability_insurance: float = 0.0
    licensure: float = 0.0
    ehr_platforms: float = 0.0
    space_costs: float = 0.0
    legal_accounting: float = 0.0
    marketing: float = 0.0
    physician_benefits: float = 0.0
    other_fixed: float = 0.0

    # --- Mix (counts per archetype, in ARCHETYPES order) ------------------
    mix: str = "12,20,10,6,8"   # the example mature practice (unit-econ §5)

    # --- Derived ----------------------------------------------------------
    @property
    def available_hours(self) -> float:
        return self.weeks_worked * self.clinical_hours_per_week - self.fixed_admin_hours

    @property
    def fixed_costs(self) -> float:
        return sum(getattr(self, name) for name, _ in COST_FIELDS)

    @property
    def unset_costs(self):
        return [(n, d) for n, d in COST_FIELDS if getattr(self, n) == 0.0]

    def required_rate(self, target: float, utilization: float) -> float:
        filled = self.available_hours * utilization
        if filled <= 0:
            return float("inf")
        return (target + self.fixed_costs) / filled

    def effective_rate(self) -> float:
        """The rate used for pricing: explicit, or derived from target_low."""
        if self.hourly_rate > 0:
            return self.hourly_rate
        return self.required_rate(self.target_income_low, self.utilization)

    def rate_is_derived(self) -> bool:
        return self.hourly_rate <= 0


def arrangement_hours(a: dict) -> float:
    return a["sync"] + a["async_"] + a["travel"] + a["admin"]


def arrangement_price(a: dict, rate: float, space_session_cost: float) -> float:
    time_component = arrangement_hours(a) * rate * a["complexity"]
    resources = a["space_sessions"] * space_session_cost
    return time_component + resources


def money(x: float) -> str:
    return f"${x:,.0f}"


def rule(char: str = "-", width: int = 76) -> str:
    return char * width


def report_unset(i: Inputs) -> None:
    unset = i.unset_costs
    if not unset and i.space_session_cost > 0:
        return
    print(rule("!"))
    print("UNSET COST INPUTS — deliberately zero; no figure has been invented")
    print(rule("!"))
    for name, desc in unset:
        print(f"  [ ] --{name.replace('_', '-'):<22} {desc}")
    if i.space_session_cost == 0.0:
        print(f"  [ ] --space-session-cost     Per-session rented space pass-through")
    print()
    print("  Required rates below therefore cover INCOME ONLY. Real costs raise")
    print("  them. Fill each from an actual quote; the chain recomputes.")
    print()


def report_capacity(i: Inputs) -> None:
    print(rule("="))
    print("1 · CAPACITY — patient-attributable hours")
    print(rule("="))
    print(f"  {i.weeks_worked:.0f} wk x {i.clinical_hours_per_week:.0f} hr"
          f"  −  {i.fixed_admin_hours:.0f} hr practice admin"
          f"  =  {i.available_hours:,.0f} hr/yr available")
    print(f"  Assumed utilization (share that fills): {i.utilization:.0%}"
          f"  →  ~{i.available_hours * i.utilization:,.0f} hr of arrangements")
    print("  The D-017 availability model (bounded hours, substantial time off)")
    print("  is inside these inputs by construction.")
    print()


def report_required_rate(i: Inputs) -> None:
    print(rule("="))
    print("2 · REQUIRED BLENDED RATE — what an hour must earn (the anchor)")
    print(rule("="))
    print("  rate = (target income + practice costs) / (available hrs x utilization)")
    print()
    targets = [("floor >$100k", i.target_floor),
               (f"low   {money(i.target_income_low)}", i.target_income_low),
               (f"high  {money(i.target_income_high)}", i.target_income_high)]
    utils = [0.50, 0.75, 1.00]
    header = "  " + f"{'target':<18}" + "".join(f"{f'{u:.0%} util':>14}" for u in utils)
    print(header)
    print("  " + rule("-", len(header) - 2))
    for label, t in targets:
        row = f"  {label:<18}"
        for u in utils:
            row += f"{'$' + format(i.required_rate(t, u), ',.0f') + '/hr':>14}"
        print(row)
    print()
    rate = i.effective_rate()
    src = (f"derived from low target at {i.utilization:.0%} utilization"
           if i.rate_is_derived() else "set via --hourly-rate (scenario)")
    print(f"  >> PRICING RATE USED BELOW: ${rate:,.0f}/hr  ({src})")
    print()


def report_archetypes(i: Inputs) -> None:
    rate = i.effective_rate()
    print(rule("="))
    print("3 · ARRANGEMENT PRICING — the framework applied to the archetype library")
    print(rule("="))
    print("  price = hours x rate x complexity + direct resources   (then value-check)")
    print()
    header = (f"  {'':<3}{'archetype':<36}{'hours':>6}{'cmplx':>7}"
              f"{'time comp':>11}{'resources':>11}{'price':>10}")
    print(header)
    print("  " + rule("-", len(header) - 2))
    for a in ARCHETYPES:
        hrs = arrangement_hours(a)
        time_comp = hrs * rate * a["complexity"]
        res = a["space_sessions"] * i.space_session_cost
        price = time_comp + res
        res_str = money(res) if res else ("UNSET" if a["space_sessions"] else "—")
        print(f"  {a['key']:<3}{a['name']:<36}{hrs:>6.1f}{a['complexity']:>7.2f}"
              f"{money(time_comp):>11}{res_str:>11}{money(price):>10}")
    print()
    print("  Archetype hours are ILLUSTRATIVE. The real library is built from")
    print("  proposal-stage estimates and corrected by measured actuals (R-08).")
    print()


def report_mix(i: Inputs, counts) -> None:
    rate = i.effective_rate()
    print(rule("="))
    print("4 · MIX EVALUATION — does this portfolio reach the target?")
    print(rule("="))
    total_hours = 0.0
    total_income = 0.0
    header = (f"  {'':<3}{'archetype':<36}{'count':>6}{'hours':>8}{'income':>11}")
    print(header)
    print("  " + rule("-", len(header) - 2))
    for a, n in zip(ARCHETYPES, counts):
        hrs = arrangement_hours(a) * n
        inc = arrangement_price(a, rate, i.space_session_cost) * n
        total_hours += hrs
        total_income += inc
        print(f"  {a['key']:<3}{a['name']:<36}{n:>6}{hrs:>8.0f}{money(inc):>11}")
    print("  " + rule("-", len(header) - 2))
    util = total_hours / i.available_hours if i.available_hours else float("inf")
    print(f"  {'':<3}{'TOTAL':<36}{sum(counts):>6}{total_hours:>8.0f}"
          f"{money(total_income):>11}")
    print()
    print(f"  Capacity used: {util:.0%} of {i.available_hours:,.0f} available hours")
    net_note = "" if i.fixed_costs > 0 else "  (costs UNSET — gross ≈ income)"
    net = total_income - i.fixed_costs
    print(f"  Income after costs: {money(net)}{net_note}")
    for label, t in (("floor >$100k", i.target_floor),
                     ("target low", i.target_income_low),
                     ("target high", i.target_income_high)):
        mark = "reached" if net >= t else f"short by {money(t - net)}"
        print(f"    vs {label:<14} {mark}")
    if util > 1.0:
        print("  !! MIX EXCEEDS CAPACITY — this portfolio cannot be delivered.")
    print()
    print("  Structural slack between the mix and 100% capacity is what funds")
    print("  reduced-fee arrangements (D-003), estimate overruns, the slow ramp,")
    print("  and time off. Slack is a feature, not waste.")
    print()


def report_provenance() -> None:
    print(rule("~"))
    print("PROVENANCE OF KEY INPUTS")
    print(rule("~"))
    for name, note in PROVENANCE:
        print(f"  {name:<24} {note}")
    print()
    print("  Nothing above is a market benchmark. Treat all conclusions as")
    print("  conditional on the labeled placeholders.")
    print()


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Arrangement-based economics model for a solo practice.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    d = Inputs()

    cap = p.add_argument_group("capacity")
    cap.add_argument("--weeks-worked", type=float, default=d.weeks_worked)
    cap.add_argument("--clinical-hours-per-week", type=float,
                     default=d.clinical_hours_per_week)
    cap.add_argument("--fixed-admin-hours", type=float, default=d.fixed_admin_hours)

    r = p.add_argument_group("rate framework")
    r.add_argument("--hourly-rate", type=float, default=d.hourly_rate,
                   help="Blended $/hr for pricing; 0 derives it from the low "
                        "target at --utilization")
    r.add_argument("--utilization", type=float, default=d.utilization,
                   help="Share of available hours assumed to fill (0-1)")

    t = p.add_argument_group("targets (D-018)")
    t.add_argument("--target-floor", type=float, default=d.target_floor)
    t.add_argument("--target-income-low", type=float, default=d.target_income_low)
    t.add_argument("--target-income-high", type=float, default=d.target_income_high)

    res = p.add_argument_group("direct resources")
    res.add_argument("--space-session-cost", type=float, default=0.0,
                     help="Per-session rented space cost (UNSET by default)")

    c = p.add_argument_group("practice costs (all default to UNSET)")
    for name, desc in COST_FIELDS:
        c.add_argument(f"--{name.replace('_', '-')}", type=float, default=0.0,
                       help=desc)

    m = p.add_argument_group("mix")
    m.add_argument("--mix", type=str, default=d.mix,
                   help="Comma-separated counts per archetype, in "
                        + "/".join(a["key"] for a in ARCHETYPES) + " order")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    valid = {f.name for f in fields(Inputs)}
    i = Inputs(**{k: v for k, v in vars(args).items() if k in valid})

    if not (0 < i.utilization <= 1.0):
        print("error: --utilization must be in (0, 1]", file=sys.stderr)
        return 2
    if i.available_hours <= 0:
        print("error: fixed admin hours exceed clinical capacity", file=sys.stderr)
        return 2
    try:
        counts = [int(x) for x in i.mix.split(",") if x.strip() != ""]
    except ValueError:
        print("error: --mix must be comma-separated integers", file=sys.stderr)
        return 2
    if len(counts) != len(ARCHETYPES):
        print(f"error: --mix needs {len(ARCHETYPES)} counts "
              f"({'/'.join(a['key'] for a in ARCHETYPES)})", file=sys.stderr)
        return 2

    print()
    report_unset(i)
    report_capacity(i)
    report_required_rate(i)
    report_archetypes(i)
    report_mix(i, counts)
    report_provenance()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
