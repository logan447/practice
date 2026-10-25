"""Rate is what gets compared to a colleague. Hours are what pay the bills.

The owner does not want a higher hourly rate than the other physician
at FCHC, ideally lower (~$60). That is a constraint on the RATE, not on
total pay. So the question becomes: at a low rate, which hours are
paid?
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
DAYS, CLIN_H, AWAY = 120, 10.0, 12.5
NCARE, CARE_HR, CAR, FLOOR = 68, 34.0, 10_046., 25_000.
NET_ENC, ENC, EMP_TAX = 102.97, 20, 0.09
COLL_YR = ENC*NET_ENC*DAYS

def row(rate, paid_hrs, ncare=NCARE):
    sal  = rate*paid_hrs
    care = ncare*AWAY*CARE_HR
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan = ibr_payment(sal, FPL150_FAM4)
    sv = sal-tx-loan-care-CAR+min(care,3_750.)*0.30
    return sal, (sal-tx-loan)/DAYS, sv, sal*(1+EMP_TAX)/COLL_YR

print(f"THE TRAP AT $60/hr IF ONLY CLINIC HOURS ARE PAID\n")
for r in (50, 55, 60, 65, 74.25):
    sal, nd, sv, pc = row(r, DAYS*CLIN_H)
    loss = nd - AWAY*CARE_HR
    print(f"  ${r:>6.2f}/hr x 1,200 clinic hrs = ${sal:>7,.0f}   "
          f"take-home/day ${nd:>5,.0f}   care ${AWAY*CARE_HR:.0f}   "
          f"net on a care day ${loss:>+5,.0f}   saved ${sv:>7,.0f}")
print(f"\n  At $60 a clinic day brings home less than the sitter costs on")
print(f"  {NCARE} of {DAYS} days. Adding days cannot fix it: each extra day")
print(f"  nets about $70 once 57% of them carry $425 of childcare.")
lo, hi = 50., 120.
for _ in range(70):
    m = (lo+hi)/2
    if row(m, DAYS*CLIN_H)[1] < AWAY*CARE_HR: lo = m
    else: hi = m
print(f"  Rate where a care day stops losing money: ${hi:.2f}/hr")

print("\n\nTHE WAY OUT: KEEP THE RATE LOW, GET THE ADMIN HOURS PAID\n")
print("  1,200 clinic hrs + 360 admin hrs = 1,560 PAID hrs = 30.00/wk")
print("  360 admin hrs = 9 hrs/week over 40 weeks, which is the notes and")
print("  inbox a 20-encounter panel already generates. Honest, not padding.\n")
print(f"{'rate':>8}{'paid hrs':>10}{'PAY':>9}{'take-home/day':>15}"
      f"{'SAVED':>9}{'vs floor':>10}{'cost to FCHC':>14}")
for r, h, lab in ((50., 1_560, ''), (55., 1_560, ''), (60., 1_560, '  <= your number'),
                  (65., 1_560, ''), (74.25, 1_200, '  <= the old ask')):
    sal, nd, sv, pc = row(r, h)
    print(f"{r:>8.2f}{h:>10,}{sal:>9,.0f}{nd:>15,.0f}{sv:>9,.0f}"
          f"{sv-FLOOR:>+10,.0f}{pc:>13.0%}{lab}")

print(f"\n  Collections at {ENC} enc/day: ${COLL_YR:,.0f}/yr.")
print("  Normal primary care puts physician cost at 35-45% of that.")

print("\n\nWHY THIS IS A BETTER ASK THAN $74.25")
a_sal, _, a_sv, a_pc = row(74.25, 1_200)
c_sal, _, c_sv, c_pc = row(60., 1_560)
print(f"  $74.25 x 1,200:  pay ${a_sal:,.0f}, saved ${a_sv:,.0f}, "
      f"FCHC cost {a_pc:.0%} of collections")
print(f"  $60.00 x 1,560:  pay ${c_sal:,.0f}, saved ${c_sv:,.0f}, "
      f"FCHC cost {c_pc:.0%} of collections")
print(f"  difference to FCHC: ${c_sal*1.09 - a_sal*1.09:+,.0f}/yr\n")
print("  1. The RATE is $60, below your colleague's, which was the point.")
print("  2. PSLF no longer depends on unpaid leave counting as hours --")
print("     1,560 hours are actually PAID, so box 8 is unambiguous.")
print("  3. You stop working 6-9 hrs/week for free.")
print("  4. You are asking to be paid for work you already do, which is")
print("     an easier conversation than asking for a premium rate.")

print("\n\nIF FCHC WILL ONLY PAY FOR 6 ADMIN HRS/WEEK, NOT 9")
for adm_wk in (9, 8, 7, 6, 5, 4):
    h = DAYS*CLIN_H + adm_wk*40
    lo2, hi2 = 40., 160.
    for _ in range(70):
        m = (lo2+hi2)/2
        if row(m, h)[2] < FLOOR: lo2 = m
        else: hi2 = m
    avg = h/52
    ok = "PASS" if avg >= 30 else "FAIL"
    print(f"  {adm_wk} admin hrs/wk -> {h:,} paid hrs, avg {avg:.2f}/wk {ok}, "
          f"min rate ${hi2:>6.2f}")
