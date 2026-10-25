"""1,560 WORKED hours with no paid leave counted at all.

Then the whole 30-hour average has to come from hours actually worked.
1,560 / 40 working weeks = 39 paid hours in every week worked.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
RATE, CARE_HR, COMMUTE, CAR, FLOOR = 50.0, 34.0, 2.5, 10_046., 25_000.
TARGET_H, CARE_SHARE = 30.0*52, 68/120        # 1,560 hrs; 57% need care

def econ(sal, care):
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    fsa = min(care, 3_750.)*0.30
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-care-CAR+fsa

print("NO PAID LEAVE. Every one of the 1,560 hours must be worked.\n")
print("=== ROUTE A: keep 3 clinic days and 12 weeks off, add paid admin ===")
print(f"  1,560 / 40 working weeks = 39.0 paid hours in every week worked\n")
print(f"{'clinic/d':>9}{'clinic/wk':>10}{'ADMIN/wk':>10}{'days':>6}"
      f"{'away':>7}{'care/d':>8}{'care/yr':>9}{'SAVED':>9}{'':>3}")
best = None
for ch in (8,9,10,11,12,13):
    clin_wk = 3*ch
    adm = 39.0 - clin_wk
    if adm < 0: continue
    days = 120                                 # T/W/Th x 40 weeks
    ncare = round(days*CARE_SHARE)
    care = ncare*(ch+COMMUTE)*CARE_HR
    sal = TARGET_H*RATE
    sv = econ(sal, care)
    flag = " *" if sv >= FLOOR else ""
    print(f"{ch:>9}{clin_wk:>10.0f}{adm:>10.1f}{days:>6}{ch+COMMUTE:>7.1f}"
          f"{(ch+COMMUTE)*CARE_HR:>8,.0f}{care:>9,.0f}{sv:>9,.0f}{flag}")
print(f"\n  salary is ${TARGET_H*RATE:,.0f} in every row -- 1,560 hrs x ${RATE:.0f}.")
print("  The admin column is the whole negotiation: FCHC must PAY for")
print("  charting, inbox and calls, not just for clinic sessions.")
print("  * clears the $25,000 floor.\n")

print("=== ROUTE B: no admin paid. Then the hours come from days ===")
print(f"{'days/wk':>8}{'hrs/day':>9}{'days':>6}{'wks worked':>12}"
      f"{'WKS OFF':>9}{'away':>7}{'care/yr':>9}{'SAVED':>9}")
for dpw in (3,4):
    for ch in (8,10,11,12,13):
        days = TARGET_H/ch
        wks = days/dpw
        if wks > 52: continue
        ncare = round(days*CARE_SHARE)
        care = ncare*(ch+COMMUTE)*CARE_HR
        sv = econ(TARGET_H*RATE, care)
        print(f"{dpw:>8}{ch:>9}{days:>6.0f}{wks:>12.1f}{52-wks:>9.1f}"
              f"{ch+COMMUTE:>7.1f}{care:>9,.0f}{sv:>9,.0f}")
print("\n  No row here both keeps 12 weeks off and stays at 3 days with a")
print("  humane day. 3x13 keeps the weeks but is 15.5 hrs away from home.")

print("\n=== ROUTE C: unpaid leave, certify only the months worked ===")
wk_off = 12
mo_qual = (52-wk_off)/52*12
print(f"  40 of 52 weeks worked = {mo_qual:.2f} qualifying months per year")
print(f"  100 remaining payments / {mo_qual:.2f} = "
      f"{100/mo_qual:.1f} years to forgiveness")
print(f"  versus {100/12:.1f} years if all 12 months certify")
print(f"  cost of this route: {100/mo_qual - 100/12:.1f} extra years")
print("  and months with a partial leave block average under 30 and")
print("  fail individually, so the blocks would have to be re-cut to")
print("  land on whole months. Messy, and it does not help the floor.")

print("\n=== BOTTOM LINE ===")
sv_a = econ(TARGET_H*RATE, round(120*CARE_SHARE)*(8+COMMUTE)*CARE_HR)
print(f"  Best no-paid-leave option that keeps all three constraints:")
print(f"  8-hour clinic days + 15 PAID admin hrs/week, ${TARGET_H*RATE:,.0f},")
print(f"  saved ${sv_a:,.0f} ({sv_a-FLOOR:+,.0f} vs the floor).")
print("  Paid leave was not a perk. It was the only thing making")
print("  3 days, 12 weeks off, and 30 hours mutually compatible.")
