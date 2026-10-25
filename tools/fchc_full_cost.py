"""Complete cost stack for the FCHC configuration. Nothing omitted.

Configuration (all owner-stated): T/W/Th, 10-hr clinic days, 120
clinic days, 20 patients/day, all 12 weeks off, 2029, three kids,
married filing separately, no paid admin, rate at or below the
medical director's. Unpaid-leave-counts-as-hours treated as SETTLED
per owner 2026-10-25.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
DAYS, CLIN_H, COMMUTE, HRS = 120, 10.0, 2.5, 1_200
AWAY   = CLIN_H + COMMUTE          # 12.5 hrs out of the house
FLOOR  = 25_000.
DIR_HR = 139_293./2_080            # $66.97, FACT-derived from Form 990

# ---- car, 120 days x 110 mi round trip ----
CAR = {"gas, 13,200 mi @30mpg @$3.20": 1_408., "maintenance and tires": 1_188.,
       "depreciation ($20K cash, $6K at 8 yrs)": 1_750.,
       "parking at the Wharf, $350/mo": 4_200.,
       "insurance, second car": 1_500.}
# ---- everything previously left out ----
OTHER = {
 "I-95 tolls, EST $10/day (reverse commute, so modest)": 1_200.,
 "own-occupation disability insurance (NEEDS-BROKER)":    2_800.,
 "term life, parent of 3 with debt (NEEDS-BROKER)":         900.,
 "VA license + DEA + CME (UNSET: may be FCHC-covered)":   2_000.,
 "backup care when the sitter is sick, EST 5 days":         600.,
 "meals and incidentals, EST $8 x 120 days":                960.,
}
ZERO = {
 "malpractice": "FCHC employee; $0. If FTCA-deemed, federal. VERIFY.",
 "health insurance": "on Jamie's hospitalist plan; $0 marginal. VERIFY.",
 "FCHC parking": "Fredericksburg, assumed free.",
}

def stack(rate, care_hr, ncare):
    sal  = HRS*rate
    care = ncare*AWAY*care_hr
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan = ibr_payment(sal, FPL150_FAM4)
    fsa  = min(care, 3_750.)*0.30
    out  = tx+loan+care+sum(CAR.values())+sum(OTHER.values())
    return sal, care, tx, loan, fsa, sal-out+fsa

print("COSTS THE MODEL HAD BEEN MISSING\n")
for k,v in OTHER.items(): print(f"  {k:<54}{v:>8,.0f}")
print(f"  {'':<54}{'-'*8}")
print(f"  {'added to every year':<54}{sum(OTHER.values()):>8,.0f}\n")
print("  Correctly zero, but verify each:")
for k,v in ZERO.items(): print(f"    {k}: {v}")

print("\n\nTHE FULL YEAR at the director's rate, shared care at $28/hr\n")
sal, care, tx, loan, fsa, sv = stack(DIR_HR, 28., 56)
print(f"  {'IN: 1,200 clinic hrs x $'+format(DIR_HR,'.2f'):<54}{sal:>8,.0f}")
print(f"  {'federal MFS + DC + FICA':<54}{-tx:>8,.0f}")
print(f"  {'student loan, IBR':<54}{-loan:>8,.0f}")
print(f"  {'childcare, 56 days x 12.5 hrs x $28':<54}{-care:>8,.0f}")
for k,v in CAR.items():   print(f"  {k:<54}{-v:>8,.0f}")
for k,v in OTHER.items(): print(f"  {k:<54}{-v:>8,.0f}")
print(f"  {'dependent-care FSA back (MFS cap $3,750)':<54}{fsa:>8,.0f}")
print(f"  {'':<54}{'-'*8}")
print(f"  {'SAVED':<54}{sv:>8,.0f}")
print(f"  {'vs the $25,000 floor':<54}{sv-FLOOR:>+8,.0f}")

print("\n\nSAVED, full costs, by rate x childcare  (* clears $25,000)")
cols = [("56d @$24",56,24.), ("56d @$28",56,28.), ("68d @$28",68,28.),
        ("56d @$34",56,34.), ("68d @$34",68,34.)]
print(f"{'rate':>8}{'pay':>9}" + "".join(f"{c[0]:>11}" for c in cols))
for r in (60., 63., DIR_HR, 70., 75., 78.):
    row = f"{r:>8.2f}{HRS*r:>9,.0f}"
    for _,nc,ch in cols:
        s = stack(r,ch,nc)[5]
        row += f"{s:>10,.0f}" + ("*" if s>=FLOOR else " ")
    print(row + ("   <= director's rate" if abs(r-DIR_HR)<.01 else ""))

print("\n\nWHAT RATE IS ACTUALLY REQUIRED")
for lab,nc,ch in (("best case: 56 care days @ $24/hr", 56,24.),
                  ("realistic: 56 days @ $28", 56,28.),
                  ("no schedule help: 68 days @ $28", 68,28.),
                  ("solo sitter: 68 days @ $34", 68,34.)):
    lo,hi = 50., 200.
    for _ in range(80):
        m=(lo+hi)/2
        if stack(m,ch,nc)[5] < FLOOR: lo=m
        else: hi=m
    over = hi - DIR_HR
    print(f"  {lab:<36}${hi:>6.2f}/hr  "
          f"({over:+.2f} vs director)  pay ${HRS*hi:>7,.0f}")

print("\n\nCHILDCARE BUDGET THAT WORKS, BY RATE")
for r in (60., 63., DIR_HR):
    print(f"  at ${r:.2f}/hr:")
    for nc in (56, 68):
        lo,hi = 2., 40.
        for _ in range(80):
            m=(lo+hi)/2
            if stack(r,m,nc)[5] >= FLOOR: lo=m
            else: hi=m
        verdict = ("plausible" if lo>=22 else
                   "below any DC care option" if lo>0 else "impossible")
        print(f"    {nc} care days -> ${lo:>5.2f}/hr "
              f"(${lo*AWAY:>6.0f}/day)   {verdict}")
