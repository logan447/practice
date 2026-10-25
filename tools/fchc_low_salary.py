"""$33,200 at 0.75 FTE: $0 IBR payments, but the household goes negative.

The structural find: $33,200 sits below 150% of poverty for a family of
four, so the income-driven payment is $0 -- and a $0 payment still
counts as a qualifying PSLF payment. Forgiveness would be reached
having paid nothing. It only works if this is the ONLY income and
married-filing-separately holds, because other income raises AGI and
the payment comes straight back.
"""
import sys, datetime as dt; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
from phase2_personal_model import FPL150_FAM4
bz=prep(0); FLOOR=25_000.
DAYS = [JAN1+dt.timedelta(i) for i in range(365)
        if (JAN1+dt.timedelta(i)) not in off
        and (JAN1+dt.timedelta(i)).weekday() in (1,2,3)]   # fixed Tue-Thu

def run(sal, hrs, care_hr):
    D=len(DAYS); b=sum(1 for d in DAYS if bz[(d-JAN1).days])
    care=b*(hrs+2.5)*care_hr
    mi=110.*D; carc=mi/30*3.20+mi*0.09+1_750.+4_200.+1_500.
    other=8_460.-1_200.+10.*D
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan=ibr_payment(sal,FPL150_FAM4)
    return dict(D=D,b=b,care=care,tx=tx,loan=loan,car=carc,other=other,
                res=sal-tx-loan-care-carc-other+min(care,3_750.)*0.30)

SAL=33_200.
print(f"${SAL:,.0f} / 1,560 paid hours = ${SAL/1560:.2f}/hour")
print(f"PSLF unchanged: 40 x 30 + 12 x 30 = 1,560 = 30.00 hr/wk\n")
print(f"150% FPL, family of 4 (EST 2026)  ${FPL150_FAM4:,.0f}")
print(f"income ${SAL:,.0f} is below it, so IBR = "
      f"${ibr_payment(SAL,FPL150_FAM4):,.0f}")
print("A $0 payment still counts as a qualifying payment.\n")
print("LOAN PAID BEFORE FORGIVENESS, by salary")
for s,p in ((33_200.,0.),(65_000.,1_678.),(89_026.,3_600.),(95_583.,4_200.)):
    print(f"  ${s:>7,.0f}: ${p:>6,.0f}/yr x 8.33 = ${p*8.33:>8,.0f}")

print("\nHOUSEHOLD, fixed Tue-Thu x 10 hrs")
r=run(SAL,10.,24.)
print(f"{'care $/hr':>10}{'care days':>11}{'care $':>9}{'RESULT':>10}")
for ch in (28.,24.,20.):
    x=run(SAL,10.,ch)
    print(f"{ch:>10.0f}{x['b']:>11}{x['care']:>9,.0f}{x['res']:>10,.0f}")
print(f"\n  childcare at $24 is {r['care']/SAL:.0%} of the salary;")
print(f"  childcare + car (${r['care']+r['car']:,.0f}) exceeds it.")
print(f"  before any childcare: ${SAL-r['tx']-r['car']-r['other']:,.0f} "
      f"against {r['b']} care days needed.")
print(f"  **The $25,000 floor is unreachable at any childcare price.**")

print("\nFCHC'S SIDE, 120 days x 24 patients")
ENC=r['D']*24; L=SAL*1.09
print(f"  loaded ${L:,.0f} / {ENC:,} encounters = ${L/ENC:.2f}/encounter")
for ev in (90.,102.97):
    coll=ENC*ev
    print(f"    ${ev:.2f}/enc: physician {L/coll:.0%}, "
          f"surplus after 50% overhead ${coll*0.5-L:,.0f} "
          f"({(coll*0.5-L)/21_133:.1f}x their FY2024 total)")

print("\nTHE OPEN QUESTION")
print("  Is $33,200 the ONLY income? If yes this is coherent: contribute")
print(f"  ~${r['res']:,.0f}/yr, Jamie's $185,000 carries the household,")
print(f"  pay $0 on the loan, collect ~$490,000 in 2037. About")
print(f"  ${abs(r['res'])*8.33:,.0f} of drag for half a million.")
print("  Requires MFS to hold, and the $25,000 floor to become a")
print("  HOUSEHOLD figure rather than his own contribution.")
print("  If there IS other income, AGI rises, the payment returns, and")
print("  the whole advantage of the low salary disappears.")
