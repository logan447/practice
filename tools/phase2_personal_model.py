#!/usr/bin/env python3
"""Phase II (FCHC, 30 hr/wk) — what the job nets AFTER the costs it creates.

Built 2026-10-24. The clinic-side economics live in
tools/home_visit_model.py and the proposal doc; this one is the
household side: what actually lands in the account after tax, the
second car, DC parking, the commute, and childcare.

LABELS: VERIFIED = owner-stated or primary source. EST = derived,
assumption owned. UNSET = owner has not supplied it; the model shows
a range instead of inventing one. REFRESH-AT-RUNWAY on all 2026
prices. NEEDS-CPA on every tax figure.

Run: python3 tools/phase2_personal_model.py
"""

# ---- The job ---------------------------------------------------------
SALARY = 65_000.0          # VERIFIED owner's current ask (floor)
ALT_SALARY = 80_000.0      # the earlier ask, kept for comparison
HOURS_PER_WEEK = 30        # VERIFIED (PSLF needs the 52-week average)
CLINIC_DAYS_WK = 3         # VERIFIED T/W/Th
WORK_WEEKS = 40            # VERIFIED (12 weeks of PAID leave)
PAID_HOURS_YR = HOURS_PER_WEEK * 52      # 1,560 — the PSLF number
WORKED_HOURS_YR = HOURS_PER_WEEK * WORK_WEEKS   # 1,200 actually worked

# ---- Tax -------------------------------------------------------------
# Household files with a physician spouse, so this salary sits on top of
# Jamie's income and is taxed at the margin, not from the bottom up.
MARGINAL_INCOME_TAX = 0.35   # EST fed + DC combined. NEEDS-CPA.
FICA_EMPLOYEE = 0.0765       # VERIFIED statutory (SS 6.2 + Med 1.45)

# ---- Car (bought because of this job; they are a one-car household) --
CAR_CASH = 20_000.0        # VERIFIED owner's budget, cash
CAR_HOLD_YEARS = 8         # EST = the PSLF horizon
CAR_RESIDUAL = 6_000.0     # EST resale after 8 yrs / ~105k added miles
PARKING_MO = 350.0         # VERIFIED owner-stated, DC
MILES_ONE_WAY = 55.0       # EST  <-- OWNER-FACT: confirm door to door
MPG = 30.0                 # EST
GAS_PER_GAL = 3.20         # EST REFRESH-AT-RUNWAY
MAINT_PER_MILE = 0.09      # EST tires/brakes/fluids/repairs, used car
INSURANCE_DELTA_YR = 1_500.0   # EST adding a 2nd car in DC. NEEDS-BROKER.
TOLLS_PER_DAY = 0.0        # UNSET: I-95 express lanes if used at peak

# ---- Childcare: UNSET, so the model runs a ladder --------------------
# Needed only on T/W/Th when Jamie is on shift OR post-call. Drivers:
# ages in 2028, Jamie's weekday count, whether Olera continues.
CHILDCARE_LADDER = [0.0, 6_000.0, 12_000.0, 20_000.0]
DCFSA_CAP = 7_500.0        # VERIFIED 2026 cap (OBBBA, up from $5,000);
                           # employer must adopt it. Jamie's hospital
                           # is the likely plan, not FCHC.

# ---- PSLF: the dominant term, and it is UNSET ------------------------
LOAN_BALANCE = None        # UNSET  <-- OWNER-FACT: studentaid.gov
QUALIFYING_PAYMENTS = None # UNSET  <-- OWNER-FACT


def car_cost_year():
    miles = MILES_ONE_WAY * 2 * CLINIC_DAYS_WK * WORK_WEEKS
    gas = miles / MPG * GAS_PER_GAL
    maint = miles * MAINT_PER_MILE
    depr = (CAR_CASH - CAR_RESIDUAL) / CAR_HOLD_YEARS
    parking = PARKING_MO * 12
    tolls = TOLLS_PER_DAY * CLINIC_DAYS_WK * WORK_WEEKS
    return {
        "miles driven": miles,
        "gas": gas,
        "maintenance + tires": maint,
        "insurance (2nd car)": INSURANCE_DELTA_YR,
        "parking": parking,
        "tolls": tolls,
        "depreciation": depr,
        "TOTAL": gas + maint + INSURANCE_DELTA_YR + parking + tolls + depr,
    }


def after_tax(salary):
    return salary * (1 - MARGINAL_INCOME_TAX - FICA_EMPLOYEE)


def report(salary):
    car = car_cost_year()
    net = after_tax(salary)
    print(f"\n=== Salary ${salary:,.0f} ===")
    print(f"  gross                                   {salary:12,.0f}")
    print(f"  less income tax @ {MARGINAL_INCOME_TAX:.0%} + FICA {FICA_EMPLOYEE:.2%}"
          f"       {-(salary - net):12,.0f}")
    print(f"  after tax                               {net:12,.0f}")
    print(f"  less car + parking + commute            {-car['TOTAL']:12,.0f}")
    base = net - car['TOTAL']
    print(f"  = before childcare                      {base:12,.0f}")
    print(f"\n  {'childcare':>12s} {'DCFSA saves':>12s} {'NET CASH':>12s} "
          f"{'per worked hr':>14s}")
    for cc in CHILDCARE_LADDER:
        shelter = min(cc, DCFSA_CAP)
        saved = shelter * (MARGINAL_INCOME_TAX + FICA_EMPLOYEE)
        n = base - cc + saved
        print(f"  {cc:12,.0f} {saved:12,.0f} {n:12,.0f} "
              f"{n / WORKED_HOURS_YR:14,.2f}")


if __name__ == "__main__":
    print("Phase II household economics — 2026-10-24")
    print(f"  {WORK_WEEKS} weeks x {CLINIC_DAYS_WK} days = "
          f"{WORK_WEEKS * CLINIC_DAYS_WK} clinic days/yr; "
          f"{WORKED_HOURS_YR:,.0f} hours worked, "
          f"{PAID_HOURS_YR:,.0f} paid (PSLF counts the paid number)")
    car = car_cost_year()
    print("\n--- Car + commute (all attributed to this job: one-car "
          "household today) ---")
    for k, v in car.items():
        unit = "" if k == "miles driven" else "$"
        print(f"  {k:36s} {unit}{v:10,.0f}")
    print(f"  per clinic day                       "
          f"${car['TOTAL'] / (WORK_WEEKS * CLINIC_DAYS_WK):10,.2f}")
    print("\n  NOTE: commuting is NOT deductible, and unreimbursed")
    print("  employee expenses stayed suspended after OBBBA. There is")
    print("  no tax relief on any of this. NEEDS-CPA if a home-office")
    print("  principal-place-of-business argument is ever worth testing.")
    for s in (SALARY, ALT_SALARY):
        report(s)
    print("\n--- The term that decides it is still UNSET ---")
    print("  PSLF forgiveness is tax-free (IRC 108(f)(1)) and lands as")
    print("  a lump at payment 120. Spread over the 10 years it is worth")
    print("  (balance / 10) a year, tax-free, which likely exceeds every")
    print("  number above. Pull the balance and the payment count from")
    print("  studentaid.gov before deciding anything about salary.")
