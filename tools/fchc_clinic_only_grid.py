"""Clinic hours only, rate capped at the medical director's. Does it close?

Constraints now: (a) paid for clinic hours only -- no paid admin,
(b) hourly rate at or below the medical director's, ideally ~$60,
(c) >= $25,000 saved, (d) T/W/Th, (e) 12 weeks off.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
DAYS, CLIN_H, AWAY, HRS = 120, 10.0, 12.5, 1_200
CAR, FLOOR = 10_046., 25_000.
DIR_W2 = 139_293.                 # FACT, Form 990 Part VII, FY2024
DIR_HR_FT, DIR_HR_PTO = DIR_W2/2_080, DIR_W2/1_920

def saved(rate, ncare, care_hr):
    sal  = HRS*rate
    care = ncare*AWAY*care_hr
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-care-CAR+min(care,3_750.)*0.30

print(f"THE RATE CEILING: director's W-2 ${DIR_W2:,.0f}")
print(f"  = ${DIR_HR_FT:.2f}/hr at 2,080 hrs   "
      f"${DIR_HR_PTO:.2f}/hr at 1,920 hrs\n")

print("PSLF, with admin unpaid")
print(f"  {HRS:,} paid clinic hrs + 360 employer-granted leave hrs = 1,560")
print(f"  1,560 / 52 = 30.00 hr/wk -- PASSES, but ONLY on the reading")
print(f"  that employer-granted UNPAID leave counts as hours.")
print(f"  Paid hours alone: {HRS/52:.1f} hr/wk. Fails.\n")

print("SAVED, by rate x childcare arrangement  (* clears $25,000)")
print("  rows: hourly rate.  cols: childcare scenario.")
cols = [("68 days @ $34", 68, 34.), ("62 days @ $34", 62, 34.),
        ("56 days @ $34", 56, 34.), ("68 days @ $28", 68, 28.),
        ("68 days @ $24", 68, 24.), ("56 days @ $28", 56, 28.)]
print(f"{'rate':>7}{'pay':>9}" + "".join(f"{c[0]:>15}" for c in cols))
for r in (60., 63., 65., DIR_HR_FT, DIR_HR_PTO):
    row = f"{r:>7.2f}{HRS*r:>9,.0f}"
    for _, nc, chr_ in cols:
        s = saved(r, nc, chr_)
        row += f"{s:>14,.0f}" + ("*" if s >= FLOOR else " ")
    print(row)
print(f"\n  '56 days' = all four of Jamie's backup weeks moved into my")
print(f"  off-blocks. '$28/hr' or '$24/hr' = a shared nanny or in-home")
print(f"  daycare instead of a solo sitter. Both are real changes.\n")

print("WHAT $60/hr NEEDS, HOLDING EVERYTHING ELSE")
base = saved(60., 68, 34.)
print(f"  as asked: ${base:,.0f}, short ${FLOOR-base:,.0f}")
for nc in (68, 62, 56):
    lo, hi = 10., 34.
    for _ in range(70):
        m = (lo+hi)/2
        if saved(60., nc, m) >= FLOOR: lo = m
        else: hi = m
    print(f"    at {nc} care days, childcare must fall to "
          f"${lo:.2f}/hr (${lo*AWAY:.0f}/day) -- "
          + ("plausible" if lo >= 22 else "not realistic in DC"))

print("\nTHE MAXIMUM REACHABLE UNDER THE RATE CAP")
best = saved(DIR_HR_FT, 56, 34.)
print(f"  ${DIR_HR_FT:.2f}/hr (exactly the director's rate) + all 4 backup")
print(f"  weeks moved, sitter still $34: ${best:,.0f} "
      f"({best-FLOOR:+,.0f} vs floor)")
b60 = saved(60., 56, 34.)
print(f"  $60.00/hr + all 4 backup weeks moved: ${b60:,.0f} "
      f"({b60-FLOOR:+,.0f})")

print("\nTOTAL-COST COMPARISON (the fairer one, since I take no benefits)")
print(f"  me at $60/hr x 1,200 hrs, +9% employer tax: "
      f"${HRS*60*1.09:,.0f}/yr, no benefits")
print(f"  director W-2 ${DIR_W2:,.0f} + employer tax and benefits")
print(f"  (UNSET: Part VII 'other compensation' column not retrieved)")
for b in (0.0, 0.10, 0.20):
    tot = DIR_W2*(1.09+b)
    print(f"    at +{b:.0%} benefits -> ${tot:,.0f}/yr, "
          f"${tot/2_080:.2f}/hr all-in vs my ${60*1.09:.2f}/hr")
