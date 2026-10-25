"""FCHC pays 8 scheduled-patient hours per clinic day at $50 = $400/day.

That is the real contract (OWNER-FACT 2026-10-25). It breaks the
30-hour test structurally, not marginally:

  3 days x 8 paid hrs = 24 hrs in a working week.
  Leave counts at the contracted weekly rate, also 24.
  W weeks worked x 24 + (52-W) weeks leave x 24 = 1,248 ALWAYS.
  1,248 / 52 = 24.00 hrs/week, for ANY number of weeks off.

So no vacation arrangement reaches 30. Only more days per week, or a
second qualifying employer, can.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
RATE, CLIN_H, COMMUTE = 50.0, 8.0, 2.5
AWAY, FLOOR = CLIN_H+COMMUTE, 25_000.
CARE_SHARE, CARE_HR = 56/120, 28.0      # backup wks moved; shared care
OTHER_BASE = 8_460.                     # tolls/disability/life/licence/etc

def car(days):
    mi = 110.*days
    return mi/30*3.20 + mi*0.09 + 1_750. + 4_200. + 1_500.

def econ(income, ncare, days, extra_care_hrs=0.0):
    care = ncare*AWAY*CARE_HR + extra_care_hrs*CARE_HR
    tx = (income*FICA_EMPLOYEE
          + tiered(max(income-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(income-STD_DED_MFS,0),DC_BRACKETS))
    other = OTHER_BASE - 1_200. + 10.*days      # tolls scale with days
    return (income - tx - ibr_payment(income,FPL150_FAM4) - care
            - car(days) - other + min(care,3_750.)*0.30)

print("WHY 3 DAYS x 8 PAID HOURS CAN NEVER REACH 30\n")
for wks_off in (0, 6, 12, 20):
    w = 52-wks_off
    tot = w*24 + wks_off*24
    print(f"  {wks_off:>2} weeks off: {w} worked x 24 + {wks_off} leave x 24"
          f" = {tot:,} hrs / 52 = {tot/52:.2f} hr/wk")
print("  The leave counts at the same weekly rate as the work, so the")
print("  average is 24.00 regardless. Vacation is NOT the lever.\n")
print(f"  days/week needed: 30 / 8 = {30/8} days. 3 gives 24, 4 gives 32.\n")

print("WHAT $400/DAY ACTUALLY LEAVES YOU")
inc = 120*400.
tx = (inc*FICA_EMPLOYEE + tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
      + tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
nd = (inc - tx - ibr_payment(inc,FPL150_FAM4))/120
print(f"  120 days x $400 = ${inc:,.0f}/yr")
print(f"  take-home per clinic day            ${nd:>7,.2f}")
print(f"  shared childcare, 10.5 hrs x $28    ${AWAY*CARE_HR:>7,.2f}")
print(f"  LEFT on a childcare day             ${nd-AWAY*CARE_HR:>7,.2f}")
print(f"  saved for the year (PSLF FAILS)     ${econ(inc,56,120):>7,.0f}\n")

print("OPTION A: stay 3 days at FCHC, add a 2nd qualifying 501(c)(3)")
print("  FCHC 1,248 hrs + 312 hrs elsewhere (6 hrs/wk) = 1,560 = 30.00")
print("  Form: 'employed in more than one qualifying part-time job")
print("  ... combined average of at least 30 hours per week'. And with")
print("  two employers the employer's-own-definition clause DROPS OUT,")
print("  so the Full-Time/Part-Time checkbox risk goes away too.\n")
print(f"{'2nd job $/hr':>13}{'2nd job pay':>12}{'total income':>14}"
      f"{'SAVED':>9}{'':>3}")
for r2 in (60., 75., 90., 100., 120.):
    inc2 = 312*r2
    s = econ(inc+inc2, 56, 120)
    print(f"{r2:>13.0f}{inc2:>12,.0f}{inc+inc2:>14,.0f}{s:>9,.0f}"
          + ("  *" if s>=FLOOR else ""))
print("  (2nd job assumed DC-based or telehealth: no extra commute, and")
print("   6 hrs/wk assumed coverable without extra paid childcare)")

print("\nOPTION B: 4 clinic days/week at FCHC, 8 hrs, 40 weeks")
d = 160
print(f"  {d} clinic days x 8 = 1,280 worked + 12 wks x 32 = 1,664 hrs")
print(f"  1,664 / 52 = {1664/52:.2f} hr/wk -- PASSES, and still 12 weeks off")
nc = round(d*CARE_SHARE)
print(f"  but breaks the 3-day rule, and care days go {round(120*CARE_SHARE)} -> {nc}")
inc_b = d*400.
print(f"  income {d} x $400 = ${inc_b:,.0f}")
print(f"  childcare {nc} x ${AWAY*CARE_HR:.0f} = ${nc*AWAY*CARE_HR:,.0f}")
print(f"  SAVED ${econ(inc_b,nc,d):,.0f}  "
      f"({econ(inc_b,nc,d)-FLOOR:+,.0f} vs floor)")
for r in (50., 60., 65.):
    print(f"    at ${r:.0f}/hr instead: income ${d*8*r:,.0f}, "
          f"saved ${econ(d*8*r,nc,d):,.0f}")

print("\nOPTION C: 3 days at FCHC + a 4th day at a DC nonprofit")
print("  3 x 8 FCHC (24) + 1 x 6 in DC (6) = 30.00 hr/wk")
for r2 in (75., 90., 100.):
    inc2 = 6*52*r2
    nc2 = 56 + round(40*CARE_SHARE)      # 4th day adds care days
    s = econ(inc+inc2, nc2, 120)
    print(f"    DC day at ${r2:.0f}/hr: +${inc2:,.0f}, "
          f"{nc2} care days, saved ${s:,.0f}"
          + ("  *" if s>=FLOOR else ""))
