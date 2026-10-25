"""0.75 FTE salaried, 30 hr/wk average, ZERO childcare.

Work only the 83 weekdays Jamie is already home. Paid leave makes up
the difference to 1,560 paid hours, so PSLF still reads 30.00/week.
No sitter is ever hired.

The cost is not money: the schedule becomes flexible, because her
calendar lands a month out, not a year.
"""
import sys, datetime as dt; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
from phase2_personal_model import FPL150_FAM4
bz=prep(0); FLOOR=25_000.
FREE=[JAN1+dt.timedelta(i) for i in range(365)
      if (JAN1+dt.timedelta(i)).weekday()<5
      and (JAN1+dt.timedelta(i)) not in off and not bz[i]]
D=len(FREE)
print(f"Jamie is home on {D} weekdays outside the 12-week blocks.")
print(f"Work only those. No childcare, ever.\n")

print("HOW THE HOURS CLOSE, with no sitter")
print(f"{'hrs/day':>8}{'worked':>8}{'leave hrs':>11}{'leave wks':>11}"
      f"{'total':>8}{'avg/wk':>8}{'away':>7}{'days/wk':>9}")
for h in (10.,12.,13.,14.5):
    w=D*h; need=1_560.-w
    print(f"{h:>8.1f}{w:>8,.0f}{need:>11,.0f}{need/30:>11.1f}"
          f"{w+need:>8,.0f}{(w+need)/52:>8.2f}{h+2.5:>7.1f}"
          f"{D/(52-need/30):>9.1f}")
print("\n  'leave wks' is the paid leave the contract has to grant.")
print("  12 weeks only works at 14.5-hour days. Shorter days need more")
print("  leave: 19 weeks at 12 hours, 24 weeks at 10.\n")

def econ(sal, days=D, hrs=12.):
    mi=110.*days
    carc=mi/30*3.20+mi*0.09+1_750.+4_200.+1_500.
    other=8_460.-1_200.+10.*days
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan=ibr_payment(sal,FPL150_FAM4)
    return tx,loan,carc,other,sal-tx-loan-carc-other

print("SAVED, zero childcare, by salary")
print(f"{'salary':>9}{'$/hr':>8}{'tax':>9}{'IBR':>8}{'car':>9}{'other':>8}"
      f"{'SAVED':>10}{'vs floor':>11}")
for s in (33_200.,45_000.,55_000.,65_000.,75_000.,89_026.):
    tx,loan,carc,other,sv=econ(s)
    print(f"{s:>9,.0f}{s/1560:>8.2f}{tx:>9,.0f}{loan:>8,.0f}{carc:>9,.0f}"
          f"{other:>8,.0f}{sv:>10,.0f}{sv-FLOOR:>+11,.0f}"
          + ("  *" if sv>=FLOOR else ""))
lo,hi=30_000.,120_000.
for _ in range(80):
    m=(lo+hi)/2
    if econ(m)[4]<FLOOR: lo=m
    else: hi=m
print(f"\n  salary needed to clear $25,000 with no childcare: "
      f"${hi:,.0f} (${hi/1560:.2f}/hr)")
print(f"  and the IBR payment is $0 up to ${FPL150_FAM4:,.0f} of income.")

print(f"\nFULL LEDGER at $33,200, 12-hour days, no childcare")
tx,loan,carc,other,sv=econ(33_200.)
for k,v in [("salary, 0.75 FTE with approved leave",33_200.),
            ("federal MFS + DC + FICA",-tx),("student loan, IBR",-loan),
            ("childcare",0.),(f"second car, {110*D:,.0f} mi",-carc),
            ("disability, life, licence, tolls, meals",-other)]:
    print(f"  {k:<44}{v:>10,.0f}")
print(f"  {'SAVED':<44}{sv:>10,.0f}")
print(f"  {'vs the $25,000 floor':<44}{sv-FLOOR:>+10,.0f}")

print("\nFCHC'S SIDE, 83 days")
for pts in (20,24):
    for s in (33_200.,55_000.,65_000.):
        enc=D*pts; L=s*1.09
        print(f"  ${s:>7,.0f}, {pts} pts/day: {enc:,} encounters, "
              f"${L/enc:>6.2f}/enc, "
              + "  ".join(f"{L/(enc*ev):>3.0%} @${ev:.0f}" for ev in (90.,102.97)))
    print()
print("THE REAL COST OF THIS VERSION")
print("  Not money. The schedule. Jamie's calendar lands ONE MONTH out,")
print("  so FCHC would get my days a month ahead rather than a year.")
print("  Routine primary care is often booked 2-6 weeks out, so a month")
print("  may be workable -- but it is their call, not an assumption I")
print("  can make for them. It also means 6 weeks a year with no clinic")
print("  at all, and weeks ranging from 0 to 5 clinic days.")
