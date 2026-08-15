#!/usr/bin/env python3
"""Capacity and economics model for a solo, individualized primary care practice.

Given how much time you have and how much time each patient consumes: how
large can the panel be, what is it worth, and — the governing question under
D-018 — how many patients reach the income target within the workload
envelope? Per-patient inputs are averages over heterogeneous arrangements
(D-014); price is a scenario input while X-09 is open.

Design principle: this tool never invents a number. Every cost input defaults
to zero and is reported as UNSET until you supply a real figure. Time and
behavior inputs default to values drawn from the working model where a decision
exists (quarterly contact, annual in-person visit, $5,000 price) and to clearly
labeled illustrative placeholders where none does.

    python3 tools/practice_model.py
    python3 tools/practice_model.py --ramp
    python3 tools/practice_model.py --async-hours 6.5 --conversion 0.18
    python3 tools/practice_model.py --help

No dependencies. Python 3.8+.
"""

import argparse
import sys
from dataclasses import dataclass, field, fields

# Provenance of key inputs, per docs/charter/decision-log.md.
# 2026-08-15 reframe (D-014/D-015): pricing and cadence are no longer decided
# — those inputs describe one SCENARIO archetype ("typical ongoing patient"),
# not the practice. Arrangements are individualized per patient (D-016); the
# per-patient time inputs are averages across heterogeneous arrangements.
GROUNDED = {
    "price": "SCENARIO — pricing is open (X-09); D-002 superseded",
    "routine_contacts": "SCENARIO archetype — no universal cadence (D-014)",
    "comprehensive_visit_hours": "SCENARIO archetype — no universal in-person cadence (D-014)",
    "prospect_hours": "D-016 (complimentary conversations + records review + proposal)",
    "target_income_low/high": "D-018 (~$130k-$175k; >$100k meaningful minimum)",
}

# Cost inputs. Default zero, reported as UNSET. Never guessed.
COST_FIELDS = [
    ("malpractice", "Malpractice premium (Q-08, broker quote)"),
    ("disability_insurance", "Own-occupation disability premium (R-05)"),
    ("licensure", "Licensure, DEA, credentialing, CME"),
    ("ehr_platforms", "EHR, portal, telehealth, subscriptions"),
    ("space", "In-person space and equipment (Q-04)"),
    ("legal_accounting", "Legal and accounting"),
    ("marketing", "Marketing and acquisition spend"),
    ("physician_benefits", "Health insurance, retirement, payroll taxes"),
    ("other_fixed", "Other fixed costs"),
]


@dataclass
class Inputs:
    # --- Capacity -------------------------------------------------------
    weeks_worked: float = 46.0            # illustrative
    clinical_hours_per_week: float = 30.0  # illustrative
    fixed_admin_hours: float = 250.0       # illustrative: business ops, CME, QI

    # --- Time per patient per year --------------------------------------
    comprehensive_visit_hours: float = 2.5   # D-006, contact + prep + doc
    routine_contacts: float = 3.0            # D-005, beyond the in-person visit
    hours_per_routine_contact: float = 1.0   # illustrative
    async_hours: float = 4.0                 # ILLUSTRATIVE — dominant unknown
    acute_hours: float = 1.0                 # illustrative

    # --- Acquisition -----------------------------------------------------
    conversion: float = 0.30      # ILLUSTRATIVE — no credible source
    prospect_hours: float = 1.5   # D-008
    attrition: float = 0.10       # ILLUSTRATIVE

    # --- Revenue ---------------------------------------------------------
    price: float = 5000.0             # SCENARIO — pricing open (X-09)
    reduced_fee_share: float = 0.10   # mechanism deferred (X-10) — illustrative
    reduced_fee_discount: float = 0.40  # illustrative
    processing_rate: float = 0.029      # illustrative; verify with processor

    # --- Target income (D-018) -------------------------------------------
    target_income_low: float = 130000.0
    target_income_high: float = 175000.0

    # --- Costs (all UNSET by design) -------------------------------------
    malpractice: float = 0.0
    disability_insurance: float = 0.0
    licensure: float = 0.0
    ehr_platforms: float = 0.0
    space: float = 0.0
    legal_accounting: float = 0.0
    marketing: float = 0.0
    physician_benefits: float = 0.0
    other_fixed: float = 0.0

    # --- Ramp ------------------------------------------------------------
    ramp_years: int = 5
    ramp_adds: list = field(default_factory=lambda: [30, 30, 25, 20, 15])

    # --- Derived ---------------------------------------------------------
    @property
    def annual_capacity(self) -> float:
        return self.weeks_worked * self.clinical_hours_per_week

    @property
    def available_hours(self) -> float:
        return self.annual_capacity - self.fixed_admin_hours

    @property
    def hours_per_patient(self) -> float:
        return (
            self.comprehensive_visit_hours
            + self.routine_contacts * self.hours_per_routine_contact
            + self.async_hours
            + self.acute_hours
        )

    @property
    def acquisition_hours_per_patient(self) -> float:
        """Steady-state acquisition time amortized per panel member per year.

        Each year, attrition * panel patients must be replaced. Each
        replacement costs (1 / conversion) consultations.
        """
        if self.conversion <= 0:
            return float("inf")
        return self.attrition * self.prospect_hours / self.conversion

    @property
    def effective_price(self) -> float:
        """Price after reduced-fee memberships and payment processing."""
        after_discount = self.price * (
            1 - self.reduced_fee_share * self.reduced_fee_discount
        )
        return after_discount * (1 - self.processing_rate)

    @property
    def fixed_costs(self) -> float:
        return sum(getattr(self, name) for name, _ in COST_FIELDS)

    @property
    def unset_costs(self):
        return [(n, d) for n, d in COST_FIELDS if getattr(self, n) == 0.0]

    def panel_capacity(self) -> float:
        """Largest panel one physician can serve at steady state.

        Solved as a fixed point: acquisition load scales with panel size, so
        panel appears on both sides. Rearranged to closed form.
        """
        denom = self.hours_per_patient + self.acquisition_hours_per_patient
        if denom <= 0:
            return 0.0
        return max(0.0, self.available_hours / denom)

    def break_even_panel(self):
        """Patients needed to cover fixed costs. None if no costs are set."""
        if self.fixed_costs <= 0 or self.effective_price <= 0:
            return None
        return self.fixed_costs / self.effective_price


def money(x: float) -> str:
    return f"${x:,.0f}"


def rule(char: str = "-", width: int = 74) -> str:
    return char * width


def report_steady_state(i: Inputs) -> None:
    panel = i.panel_capacity()
    revenue = panel * i.effective_price

    print(rule("="))
    print("STEADY-STATE CAPACITY")
    print(rule("="))
    print(f"  Annual clinical capacity     {i.annual_capacity:>10,.0f} hr"
          f"   ({i.weeks_worked:.0f} wk x {i.clinical_hours_per_week:.0f} hr)")
    print(f"  Less fixed admin             {i.fixed_admin_hours:>10,.0f} hr")
    print(f"  Available for patients       {i.available_hours:>10,.0f} hr")
    print()
    print("  Time per patient per year:")
    print(f"    Comprehensive in-person    {i.comprehensive_visit_hours:>10.2f} hr   [D-006]")
    print(f"    Routine contacts ({i.routine_contacts:.0f})        "
          f"{i.routine_contacts * i.hours_per_routine_contact:>10.2f} hr   [D-005]")
    print(f"    Asynchronous care          {i.async_hours:>10.2f} hr   <-- dominant unknown")
    print(f"    Acute episodes             {i.acute_hours:>10.2f} hr")
    print(f"    {'':<26} {'':>10}      {rule('-', 8)}")
    print(f"    Subtotal                   {i.hours_per_patient:>10.2f} hr")
    print(f"    Acquisition (amortized)    {i.acquisition_hours_per_patient:>10.2f} hr"
          f"   [{i.attrition:.0%} attrition / {i.conversion:.0%} conversion]")
    print(f"    TOTAL                      "
          f"{i.hours_per_patient + i.acquisition_hours_per_patient:>10.2f} hr")
    print()
    print(f"  >> PANEL CEILING             {panel:>10,.0f} patients")
    print()
    print(f"  List price                   {money(i.price):>13}   [D-002]")
    print(f"  Effective per patient        {money(i.effective_price):>13}"
          f"   (after reduced-fee + processing)")
    print(f"  >> GROSS REVENUE AT CEILING  {money(revenue):>13}")
    print()

    be = i.break_even_panel()
    if be is None:
        print(f"  Fixed costs                  {'UNSET':>13}")
        print(f"  Break-even panel             {'not computable':>13}")
    else:
        print(f"  Fixed costs                  {money(i.fixed_costs):>13}")
        print(f"  Break-even panel             {be:>10,.0f} patients")
        print(f"  Margin at ceiling            {money(revenue - i.fixed_costs):>13}")
        if panel > 0:
            print(f"  Capacity used at break-even  {be / panel:>12.0%}")
    print()

    print(rule("="))
    print("TARGET INCOME CHECK (D-018: reach the target, don't maximize)")
    print(rule("="))
    costs_note = "" if i.fixed_costs > 0 else "   (+ break-even patients once costs are set)"
    for label, target in (("floor  >$100k", 100000.0),
                          (f"low    {money(i.target_income_low)}", i.target_income_low),
                          (f"high   {money(i.target_income_high)}", i.target_income_high)):
        needed_gross = target + i.fixed_costs
        pts = needed_gross / i.effective_price if i.effective_price > 0 else float("inf")
        hrs = pts * (i.hours_per_patient + i.acquisition_hours_per_patient)
        share = pts / panel if panel > 0 else float("inf")
        print(f"  {label:<22} {pts:>5,.0f} patients{costs_note}"
              f"   ~{hrs:>5,.0f} hr/yr   {share:>4.0%} of capacity")
    if i.fixed_costs <= 0:
        print("  NOTE: fixed costs UNSET — patient counts above cover income only.")
    print()
    print("  At this scenario's price, the target sits well below the capacity")
    print("  ceiling — slack available for lower prices, complex patients,")
    print("  reduced-fee care, vacation, or less work. That slack is what makes")
    print("  the individualized model (D-014) economically affordable.")
    print()


def report_sensitivity(i: Inputs) -> None:
    print(rule("="))
    print("SENSITIVITY — asynchronous hours per patient per year")
    print(rule("="))
    print("The one input most likely to be wrong, and the one that moves the")
    print("answer most. Currently unmeasured. Instrument it from patient one.")
    print()
    print(f"  {'async hr':>9}  {'total hr':>9}  {'panel':>7}  {'gross':>12}  {'margin':>12}")
    print(f"  {rule('-', 9)}  {rule('-', 9)}  {rule('-', 7)}  {rule('-', 12)}  {rule('-', 12)}")

    base = i.async_hours
    for async_hr in (2.0, 4.0, 6.0, 8.0, 10.0):
        i.async_hours = async_hr
        panel = i.panel_capacity()
        gross = panel * i.effective_price
        margin = money(gross - i.fixed_costs) if i.fixed_costs > 0 else "n/a"
        marker = "  <-- current" if abs(async_hr - base) < 1e-9 else ""
        print(f"  {async_hr:>9.1f}  {i.hours_per_patient:>9.2f}  {panel:>7,.0f}  "
              f"{money(gross):>12}  {margin:>12}{marker}")
    i.async_hours = base
    print()


def report_ramp(i: Inputs) -> None:
    print(rule("="))
    print("RAMP")
    print(rule("="))
    print("Adds per year are YOUR input, not a forecast. The model checks")
    print("whether each year fits inside capacity and what it earns.")
    print()

    adds = list(i.ramp_adds)[: i.ramp_years]
    while len(adds) < i.ramp_years:
        adds.append(0)

    header = (f"  {'yr':>3}  {'start':>6}  {'add':>5}  {'lost':>5}  {'end':>6}  "
              f"{'consults':>9}  {'hours':>7}  {'cap%':>5}  {'revenue':>11}")
    print(header)
    print("  " + rule("-", len(header) - 2))

    panel = 0.0
    ceiling = i.panel_capacity()
    for year, add in enumerate(adds, start=1):
        start = panel
        lost = start * i.attrition
        end = start - lost + add
        avg = (start + end) / 2

        # Consultations must cover both growth and attrition replacement.
        gross_adds = add + lost
        consults = gross_adds / i.conversion if i.conversion > 0 else float("inf")

        care_hours = avg * i.hours_per_patient
        acq_hours = consults * i.prospect_hours
        total_hours = care_hours + acq_hours + i.fixed_admin_hours
        cap_pct = total_hours / i.annual_capacity if i.annual_capacity else 0.0
        revenue = avg * i.effective_price

        flag = "  OVER CAPACITY" if cap_pct > 1.0 else ""
        print(f"  {year:>3}  {start:>6,.0f}  {add:>5,.0f}  {lost:>5,.1f}  {end:>6,.0f}  "
              f"{consults:>9,.0f}  {total_hours:>7,.0f}  {cap_pct:>4.0%}  "
              f"{money(revenue):>11}{flag}")
        panel = end

    print()
    print(f"  Panel ceiling for reference: {ceiling:,.0f} patients")
    if i.fixed_costs > 0:
        be = i.break_even_panel()
        print(f"  Break-even panel:            {be:,.0f} patients")
    else:
        print("  Break-even:                  not computable (costs UNSET)")
    print()
    print("  Note: in early years the binding constraint is lead flow, not")
    print("  physician time. At steady state it inverts. Plan them separately.")
    print()


def report_unset(i: Inputs) -> None:
    unset = i.unset_costs
    if not unset:
        return
    print(rule("!"))
    print("UNSET COST INPUTS — profitability below is NOT computable")
    print(rule("!"))
    print("These are deliberately zero. No figure has been invented for them.")
    print("Fill each from an actual quote; the model gets real as you do.")
    print()
    for name, desc in unset:
        print(f"  [ ] --{name.replace('_', '-'):<22} {desc}")
    print()


def report_illustrative(i: Inputs) -> None:
    print(rule("~"))
    print("PROVENANCE OF INPUTS")
    print(rule("~"))
    print("  Key inputs and their status:")
    for key, source in GROUNDED.items():
        print(f"    {key:<28} {source}")
    print()
    print("  Illustrative placeholders — replace with your own figures:")
    for name in ("weeks_worked", "clinical_hours_per_week", "fixed_admin_hours",
                 "hours_per_routine_contact", "async_hours", "acute_hours",
                 "conversion", "attrition", "reduced_fee_share",
                 "reduced_fee_discount", "processing_rate"):
        print(f"    {name:<28} {getattr(i, name)}")
    print()
    print("  None of the above is a market benchmark. They demonstrate the")
    print("  structure of the model. Treat conclusions as conditional on them.")
    print()


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Capacity and economics model for a solo concierge practice.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    d = Inputs()

    cap = p.add_argument_group("capacity")
    cap.add_argument("--weeks-worked", type=float, default=d.weeks_worked)
    cap.add_argument("--clinical-hours-per-week", type=float,
                     default=d.clinical_hours_per_week)
    cap.add_argument("--fixed-admin-hours", type=float, default=d.fixed_admin_hours)

    t = p.add_argument_group("time per patient per year")
    t.add_argument("--comprehensive-visit-hours", type=float,
                   default=d.comprehensive_visit_hours)
    t.add_argument("--routine-contacts", type=float, default=d.routine_contacts)
    t.add_argument("--hours-per-routine-contact", type=float,
                   default=d.hours_per_routine_contact)
    t.add_argument("--async-hours", type=float, default=d.async_hours,
                   help="Messaging, results, refills, coordination. Dominant unknown.")
    t.add_argument("--acute-hours", type=float, default=d.acute_hours)

    a = p.add_argument_group("acquisition")
    a.add_argument("--conversion", type=float, default=d.conversion)
    a.add_argument("--prospect-hours", type=float, default=d.prospect_hours)
    a.add_argument("--attrition", type=float, default=d.attrition)

    r = p.add_argument_group("revenue")
    r.add_argument("--price", type=float, default=d.price,
                   help="SCENARIO input — pricing model is open (X-09)")
    r.add_argument("--target-income-low", type=float, default=d.target_income_low)
    r.add_argument("--target-income-high", type=float, default=d.target_income_high)
    r.add_argument("--reduced-fee-share", type=float, default=d.reduced_fee_share)
    r.add_argument("--reduced-fee-discount", type=float, default=d.reduced_fee_discount)
    r.add_argument("--processing-rate", type=float, default=d.processing_rate)

    c = p.add_argument_group("costs (all default to UNSET)")
    for name, desc in COST_FIELDS:
        c.add_argument(f"--{name.replace('_', '-')}", type=float, default=0.0, help=desc)

    m = p.add_argument_group("ramp")
    m.add_argument("--ramp", action="store_true", help="Show year-by-year ramp")
    m.add_argument("--ramp-years", type=int, default=d.ramp_years)
    m.add_argument("--ramp-adds", type=str, default=",".join(str(x) for x in d.ramp_adds),
                   help="Comma-separated new patients per year")

    p.add_argument("--no-sensitivity", action="store_true")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)

    valid = {f.name for f in fields(Inputs)}
    kwargs = {k: v for k, v in vars(args).items()
              if k in valid and k != "ramp_adds"}
    try:
        kwargs["ramp_adds"] = [int(x) for x in args.ramp_adds.split(",") if x.strip()]
    except ValueError:
        print("error: --ramp-adds must be comma-separated integers", file=sys.stderr)
        return 2

    i = Inputs(**kwargs)

    if i.conversion <= 0:
        print("error: --conversion must be greater than 0", file=sys.stderr)
        return 2
    if i.annual_capacity <= i.fixed_admin_hours:
        print("error: fixed admin hours exceed annual clinical capacity",
              file=sys.stderr)
        return 2

    print()
    report_unset(i)
    report_steady_state(i)
    if not args.no_sensitivity:
        report_sensitivity(i)
    if args.ramp:
        report_ramp(i)
    report_illustrative(i)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
