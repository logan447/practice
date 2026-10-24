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


# =====================================================================
# PSLF + filing status, added 2026-10-24 with owner's real numbers.
# =====================================================================
BALANCE = 319_221.0          # VERIFIED owner-stated, 2026-10-24
PAYMENTS_MADE = 22           # VERIFIED owner-stated
PAYMENTS_NEEDED = 120
LOAN_RATE = 0.065            # EST  <-- OWNER-FACT: weighted rate
# Kid timeline, VERIFIED owner-stated 2026-10-24: first 2029,
# second 2032, possible third 2034-35. No children today.
KID_BIRTH_YEARS = [2029, 2032, 2034]       # third is "maybe"
DEPENDENTS = 2               # legacy default, overridden per year
JAMIE_AGI = None             # UNSET <-- OWNER-FACT: decides the MFJ column
JAMIE_AGI_EST = 300_000.0    # EST placeholder for the comparison only

FPL150_FAM3 = 39_975.0       # VERIFIED 2025 HHS table x1.5 (REFRESH)
FPL150_FAM4 = 48_225.0       # VERIFIED 2025 HHS table x1.5 (REFRESH)


def rap_payment(agi):
    """RAP: % of AGI by $10k band, 1% at $10-20k rising to 10% over
    $100k, minus $50/month per dependent, floor $10/month. VERIFIED
    structure from FSA's RAP page."""
    if agi <= 10_000:
        annual = 120.0
    else:
        band = min(int((agi - 1) // 10_000), 10)      # 1..10
        annual = agi * band / 100.0
    monthly = annual / 12 - 50.0 * DEPENDENTS
    return max(monthly, 10.0) * 12


def ibr_payment(agi, fpl150):
    """IBR: 10% of AGI above 150% FPL. Cap at the 10-yr standard
    payment ignored here (it does not bind at these balances)."""
    return max(agi - fpl150, 0) * 0.10


def pslf_block():
    left = PAYMENTS_NEEDED - PAYMENTS_MADE
    print(f"\n{'=' * 62}\nPSLF with the real numbers\n{'=' * 62}")
    print(f"  balance                        ${BALANCE:12,.0f}  VERIFIED")
    print(f"  qualifying payments so far      {PAYMENTS_MADE:12d}  VERIFIED")
    print(f"  remaining                       {left:12d}"
          f"  = {left / 12:.1f} years")
    print(f"  clock starts                        July 2028"
          f"  (1 day/wk earns none)")
    print(f"  forgiveness lands               "
          f"{'Sep 2036':>12s}  EST")

    sep_rap = rap_payment(SALARY)
    sep_ibr3 = ibr_payment(SALARY, FPL150_FAM3)
    sep_ibr4 = ibr_payment(SALARY, FPL150_FAM4)
    joint = SALARY + JAMIE_AGI_EST
    joint_rap = rap_payment(joint)
    joint_ibr = ibr_payment(joint, FPL150_FAM4)

    print(f"\n  --- monthly loan payment, by filing status ---")
    print(f"  {'':34s} {'per month':>12s} {'over 98 mo':>13s}")
    for label, yr in (
        ("SEPARATE, RAP (his AGI only)", sep_rap),
        ("SEPARATE, IBR (family of 3)", sep_ibr3),
        ("SEPARATE, IBR (family of 4)", sep_ibr4),
        (f"JOINT, RAP (+${JAMIE_AGI_EST:,.0f} EST)", joint_rap),
        (f"JOINT, IBR (+${JAMIE_AGI_EST:,.0f} EST)", joint_ibr),
    ):
        print(f"  {label:34s} {yr / 12:12,.0f} {yr / 12 * left:13,.0f}")

    print(f"\n  --- what gets forgiven (tax-free, IRC 108(f)(1)) ---")
    for label, yr in (("SEPARATE, IBR fam 4", sep_ibr4),
                      (f"JOINT, IBR", joint_ibr)):
        bal = BALANCE
        for _ in range(int(left / 12 * 12)):
            bal += bal * LOAN_RATE / 12 - yr / 12
            bal = max(bal, 0.0)
        print(f"  {label:34s} forgiven ${bal:12,.0f}"
              f"   (paid ${yr / 12 * left:,.0f})")
    print("\n  NEEDS-CPA: filing separately raises the household's own")
    print("  tax bill and cuts the dependent-care FSA cap to $3,750. The")
    print("  swing above is far larger than any salary question here.")


if __name__ == "__main__":
    pslf_block()


# =====================================================================
# Year-by-year, added after the kid timeline landed (2026-10-24).
# =====================================================================
STD_DED_MFS = 16_100.0        # EST 2026 (post-OBBBA). NEEDS-CPA.
FED_MFS_BRACKETS = [(12_400, .10), (50_400, .12), (105_700, .22)]  # EST
DC_BRACKETS = [(10_000, .04), (40_000, .06), (60_000, .065),
               (250_000, .085)]            # VERIFIED DC structure

# Marginal DC childcare, per child per year, by age. EST bands for
# 3-day-a-week care; NEEDS real quotes, and the share actually caused
# by HIS job depends on Jamie's schedule (UNSET).
CARE_BY_AGE = {0: 24_000., 1: 24_000., 2: 22_000., 3: 18_000.,
               4: 18_000., 5: 4_000.}      # 5+ = school + aftercare
MARGINAL_SHARE = 0.50         # EST  <-- OWNER-FACT: Jamie's weekdays


def tiered(amount, brackets):
    tax, last = 0.0, 0.0
    for cap, rate in brackets:
        if amount <= last:
            break
        tax += (min(amount, cap) - last) * rate
        last = cap
    if amount > last:
        tax += (amount - last) * brackets[-1][1]
    return tax


def care_cost(year):
    total = 0.0
    for born in KID_BIRTH_YEARS:
        age = year - born
        if age < 0:
            continue
        total += CARE_BY_AGE.get(min(age, 5), CARE_BY_AGE[5])
    return total * MARGINAL_SHARE


def deps(year):
    return sum(1 for b in KID_BIRTH_YEARS if year >= b)


def year_row(year, salary=SALARY):
    global DEPENDENTS
    DEPENDENTS = deps(year)
    fica = salary * FICA_EMPLOYEE
    fed = tiered(max(salary - STD_DED_MFS, 0), FED_MFS_BRACKETS)
    dc = tiered(max(salary - STD_DED_MFS, 0), DC_BRACKETS)
    fpl = FPL150_FAM4 if DEPENDENTS >= 2 else FPL150_FAM3
    loan = ibr_payment(salary, fpl)
    car = car_cost_year()["TOTAL"]
    care = care_cost(year)
    dcfsa = min(care, 3_750.0) * 0.30      # MFS cap, EST rate
    net = salary - fica - fed - dc - loan - car - care + dcfsa
    return (year, DEPENDENTS, fica + fed + dc, loan, car, care, net)


def itemize(year, salary=SALARY):
    y, d, tax, loan, car, care, net = year_row(year, salary)
    print(f"\n{'=' * 58}\n{y} — filing SEPARATELY, salary ${salary:,.0f}, "
          f"{d} child(ren)\n{'=' * 58}")
    rows = [("Gross salary", salary), ("FICA + federal + DC tax", -tax),
            ("Student loan payment (IBR)", -loan),
            ("Car, parking, commute", -car),
            ("Childcare (marginal)", -care)]
    run = 0.0
    for label, v in rows:
        run = v if label.startswith("Gross") else run + v
        print(f"  {label:34s} {v:12,.0f} {run:12,.0f}")
    print(f"  {'Dependent-care FSA offset':34s} "
          f"{min(care, 3750.) * .30:12,.0f} {net:12,.0f}")
    print(f"  {'LEFT TO SAVE':34s} {'':12s} {net:12,.0f}")


if __name__ == "__main__":
    itemize(2029)
    itemize(2029, ALT_SALARY)
    print(f"\n{'=' * 58}\nAcross the PSLF run, at ${SALARY:,.0f}"
          f"\n{'=' * 58}")
    print(f"  {'yr':>4s} {'kids':>5s} {'tax':>9s} {'loan':>8s} "
          f"{'car':>8s} {'childcare':>10s} {'LEFT':>9s}")
    tot = 0.0
    for y in range(2029, 2037):
        r = year_row(y)
        tot += r[6]
        print(f"  {r[0]:4d} {r[1]:5d} {r[2]:9,.0f} {r[3]:8,.0f} "
              f"{r[4]:8,.0f} {r[5]:10,.0f} {r[6]:9,.0f}")
    print(f"  {'8-yr total left to save':>47s} {tot:9,.0f}")
    print(f"  {'+ forgiven, tax-free, Sep 2036':>47s} {523_998:9,.0f}")
