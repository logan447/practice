"""Lowest hourly rate that still satisfies the owner's minimums.

Minimums: >= $25,000 saved after everything; PSLF-qualifying (30 hr/wk
average); T/W/Th only; 12 weeks off; no move from the Wharf.

Encounters per day do NOT enter the household math -- pay is rate x
hours. Volume only changes what the CLINIC can afford. So the lever
that lowers the rate is childcare, and the cheapest childcare lever is
where Jamie's four backup weeks land.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
CLIN_H, DAYS, HRS = 10.0, 120, 1_200
CARE_HR, AWAY, CAR, FLOOR = 34.0, 12.5, 10_046., 25_000.
NET_ENC, EMP_TAX = 102.97, 0.09          # EST mix net of collections

def saved(rate, ncare):
    sal  = HRS*rate
    care = ncare*AWAY*CARE_HR
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-care-CAR+min(care,3_750.)*0.30

def min_rate(ncare, target=FLOOR):
    lo, hi = 40., 200.
    for _ in range(80):
        mid = (lo+hi)/2
        if saved(mid, ncare) < target: lo = mid
        else: hi = mid
    return hi

print("LOWEST RATE THAT STILL CLEARS $25,000, AT 20 ENCOUNTERS/DAY\n")
coll_day = 20*NET_ENC
print(f"  collections: 20 x ${NET_ENC:.2f} = ${coll_day:,.0f}/day, "
      f"${coll_day*DAYS:,.0f}/yr\n")
print(f"{'care days':>10}{'backup wks moved':>18}{'MIN RATE':>10}{'pay':>9}"
      f"{'% of coll':>11}{'saved':>9}")
for nc, moved in ((68,'none'), (62,'2 of 4'), (56,'all 4')):
    r = min_rate(nc)
    loaded = r*CLIN_H*(1+EMP_TAX)
    print(f"{nc:>10}{moved:>18}{r:>10.2f}{HRS*r:>9,.0f}"
          f"{loaded/coll_day:>10.0%} {saved(r,nc):>9,.0f}")

print("\n\nTHE CLINIC AT EACH OF THOSE RATES, 20 enc/day")
print(f"{'rate':>8}{'loaded/day':>12}{'% coll':>8}"
      + "".join(f"{f'OH {o:.0%}':>10}" for o in (0.45,0.50,0.55,0.60)))
for nc in (68,62,56):
    r = min_rate(nc); loaded = r*CLIN_H*(1+EMP_TAX)
    row = f"{r:>8.2f}{loaded:>12,.0f}{loaded/coll_day:>8.0%}"
    for o in (0.45,0.50,0.55,0.60):
        row += f"{coll_day*(1-o)-loaded:>10,.0f}"
    print(row)
print("  (cells = clinic contribution per day after physician AND overhead)")

print("\n\n18 vs 20 ENCOUNTERS: what the extra two buy the clinic")
r = min_rate(62)
loaded = r*CLIN_H*(1+EMP_TAX)
print(f"  at the ${r:.2f}/hr rate (2 backup weeks moved):")
for enc in (16,18,20,22):
    cd = enc*NET_ENC
    print(f"    {enc} enc: ${cd:>6,.0f}/day coll, physician {loaded/cd:>4.0%}, "
          f"margin at 55% OH ${cd*0.45-loaded:>6,.0f}/day "
          f"(${(cd*0.45-loaded)*DAYS:>8,.0f}/yr)")

print("\n\nTHE PACE AND THE UNPAID PART AT 20/DAY")
print(f"  20 encounters in {CLIN_H:.0f} hrs = {CLIN_H*60/20:.0f} min each, "
      f"door to door")
for h in (2.0, 2.5, 3.0):
    print(f"    {h} hr/day of notes+inbox -> {h*3:.1f} unpaid hrs/wk, "
          f"effective ${HRS*r/(HRS+h*3*40):.2f}/hr, "
          f"{3*AWAY+h*3:.1f} hr working week")

print("\n\nSANITY: PSLF unchanged by any of this")
print(f"  {DAYS*CLIN_H:,.0f} clinic hrs + {12*30} leave hrs = "
      f"{DAYS*CLIN_H+360:,.0f} / 52 = {(DAYS*CLIN_H+360)/52:.2f} hr/wk")
