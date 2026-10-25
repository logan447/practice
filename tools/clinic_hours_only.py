"""FCHC pays clinic hours only. Charting, inbox and calls are unpaid.

The form's leave sentence does not say "paid":
  "Vacation or leave time provided by the employer or leave taken for a
   condition that is a qualifying reason for leave under the Family and
   Medical Leave Act of 1993 ... is equivalent to hours worked in
   qualifying employment."
So employer-GRANTED leave appears to count as hours whether or not it
is paid. That is the only structure left once charting is unpaid.
NEEDS-COUNSEL: confirm in writing before relying on it.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
RATE, CARE_HR, COMMUTE, CAR, FLOOR = 50.0, 34.0, 2.5, 10_046., 25_000.
N, NCARE, WORKWK, OFFWK = 120, 68, 40, 12

def econ(sal, care):
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    fsa = min(care, 3_750.)*0.30
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-care-CAR+fsa, tx

print("PAID FOR CLINIC HOURS ONLY. Charting/inbox/calls unpaid.\n")
print(f"{'clin/d':>7}{'clin/wk':>9}{'clinic hrs':>11}{'leave hrs':>10}"
      f"{'TOTAL':>8}{'avg/wk':>8}{'PAY':>9}{'care':>9}{'SAVED':>9}{'':>3}")
for ch in (8,9,10,11,12):
    clin_wk = 3*ch
    clin_h  = N*ch
    leave_h = OFFWK*clin_wk          # 12 wks of employer-granted leave
    tot     = clin_h + leave_h
    avg     = tot/52
    pay     = clin_h*RATE            # paid for clinic hours only
    care    = NCARE*(ch+COMMUTE)*CARE_HR
    sv, _   = econ(pay, care)
    ok = "PASS" if avg >= 30 else "FAIL"
    star = " *" if (avg>=30 and sv>=FLOOR) else ""
    print(f"{ch:>7}{clin_wk:>9.0f}{clin_h:>11,.0f}{leave_h:>10,.0f}"
          f"{tot:>8,.0f}{avg:>8.2f}{pay:>9,.0f}{care:>9,.0f}{sv:>9,.0f}"
          f"  {ok}{star}")
print("\n  avg/wk = (clinic hours + employer-granted leave hours) / 52")
print("  PAY = clinic hours x $50 only. Leave is unpaid, so it adds")
print("  HOURS for the form but no money.  * = passes 30 and clears floor\n")

print("THE 10-HOUR-DAY YEAR IN FULL")
ch = 10
pay  = N*ch*RATE
care = NCARE*(ch+COMMUTE)*CARE_HR
sv, tx = econ(pay, care)
loan = ibr_payment(pay, FPL150_FAM4)
for lab,v in [("paid: 1,200 clinic hours x $50", pay),
              ("federal + DC tax + FICA", -tx), ("student loan, IBR", -loan),
              (f"childcare, {NCARE} days x ${(ch+COMMUTE)*CARE_HR:.0f}", -care),
              ("second car, all in", -CAR),
              ("dependent-care FSA back", min(care,3_750.)*0.30)]:
    print(f"  {lab:<36}{v:>11,.0f}")
print(f"  {'SAVED':<36}{sv:>11,.0f}")
print(f"  {'vs the $25,000 floor':<36}{sv-FLOOR:>+11,.0f}")
nd = (pay-tx-loan)/N
print(f"\n  take-home per clinic day   ${nd:,.0f}")
print(f"  childcare on a care day    ${(ch+COMMUTE)*CARE_HR:,.0f}")
print(f"  KEPT on a care day         ${nd-(ch+COMMUTE)*CARE_HR:,.0f}  "
      f"({NCARE} of {N} days)")

print("\n\nWHAT RATE WOULD CLEAR THE FLOOR, 10-hr days, clinic hours only")
lo, hi = 50., 400.
for _ in range(80):
    mid = (lo+hi)/2
    sv2,_ = econ(N*ch*mid, care)
    if sv2 < FLOOR: lo = mid
    else: hi = mid
print(f"  ${hi:,.2f}/hr  (pay ${N*ch*hi:,.0f} for 1,200 clinic hours)")
print(f"  that is {hi/RATE:.2f}x the current $50")

print("\nIF THE UNPAID LEAVE DOES NOT COUNT")
for ch2 in (10,13):
    print(f"  {ch2}-hr days, clinic hours only: "
          f"{N*ch2:,} hrs / 52 = {N*ch2/52:.1f} avg -> "
          f"{'PASS' if N*ch2/52>=30 else 'FAIL'}")
need = 30*52
print(f"  hours needed: {need:,}. At 10 hrs that is {need/10:.0f} clinic")
print(f"  days = {need/10/3:.1f} weeks of T/W/Th, i.e. ZERO weeks off.")
