"""Salaried 0.75 FTE: all work counts, not just clocked patient hours.

"FCHC does not pay for admin" was true of the HOURLY arrangement:
they clocked scheduled-patient time only. A salaried 0.75 FTE is
different. The salary buys 30 hours a week of a physician's work, and
charting, inbox, results and calls are that work. They do not need to
be separately purchased; they are inside the FTE.

That changes the leave requirement a lot, because worked hours are no
longer just clinic hours.
"""
import sys, datetime as dt; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
from phase2_personal_model import FPL150_FAM4
bz=prep(0); FLOOR=25_000.; TARGET=1_560.
FREE=[JAN1+dt.timedelta(i) for i in range(365)
      if (JAN1+dt.timedelta(i)).weekday()<5
      and (JAN1+dt.timedelta(i)) not in off and not bz[i]]
D=len(FREE)
print(f"{D} Jamie-free weekdays. Notice period: THREE MONTHS "
      f"(OWNER-FACT 2026-10-25).\n")

print("LEAVE NEEDED, if admin counts as worked time (it does, salaried)")
print(f"{'clinic hrs/day':>15}{'clinic hrs':>12}{'admin/clinic day':>18}"
      f"{'inbox/wk':>10}{'worked':>8}{'leave hrs':>11}{'LEAVE WKS':>11}")
for h in (10.,12.):
    for adm in (0.,1.5,2.,2.5):
        for inbox in (0.,2.):
            clinic=D*h; a=D*adm; ib=inbox*40
            worked=clinic+a+ib; leave=TARGET-worked
            if leave < 0: continue
            print(f"{h:>15.0f}{clinic:>12,.0f}{adm:>18.1f}{inbox:>10.0f}"
                  f"{worked:>8,.0f}{leave:>11,.0f}{leave/30:>11.1f}")
    print()
print("  The owner wants 12 weeks of leave, i.e. 360 leave hours and")
print(f"  1,200 worked. At {D} clinic days that is "
      f"{1200/D:.1f} worked hours per clinic day,")
print("  however the day divides between patients and paperwork.\n")

print("WHAT 12 WEEKS OF LEAVE REQUIRES, by clinic-day length")
for h in (10.,11.,12.,13.):
    clinic=D*h; rest=1_200.-clinic
    print(f"  {h:.0f} clinic hrs/day -> {clinic:,.0f} clinic hrs, "
          f"{rest:>5,.0f} hrs of charting and inbox "
          f"({rest/D:>4.1f} per clinic day, {rest/40:>4.1f} per working week)"
          + ("  plausible" if 0 <= rest/D <= 3.5 else "  not credible"))

def econ(sal, days=D, hrs=12.):
    mi=110.*days
    carc=mi/30*3.20+mi*0.09+1_750.+4_200.+1_500.
    other=8_460.-1_200.+10.*days
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-carc-other

print("\nMONEY (unchanged by the leave framing: zero childcare either way)")
print(f"{'salary':>9}{'$/hr':>8}{'SAVED':>10}{'vs floor':>11}")
for s in (45_000.,53_096.,55_000.,60_000.,65_000.):
    sv=econ(s)
    print(f"{s:>9,.0f}{s/1560:>8.2f}{sv:>10,.0f}{sv-FLOOR:>+11,.0f}"
          + ("  *" if sv>=FLOOR else ""))

print("\nFCHC'S SIDE, 83 clinic days")
for pts in (20,24):
    for s in (55_000.,60_000.):
        enc=D*pts; L=s*1.09
        print(f"  ${s:,.0f}, {pts} pts/day: {enc:,} encounters, "
              f"${L/enc:.2f}/enc, "
              + "  ".join(f"{L/(enc*ev):.0%} @${ev:.0f}" for ev in (90.,102.97)))
print("\nWHAT THREE MONTHS' NOTICE FIXES")
print("  The schedule objection. A quarter ahead is inside the window")
print("  routine primary care books in, so FCHC can place patients")
print("  against my days and can see the empty weeks coming instead of")
print("  discovering them. That was the largest non-money obstacle to")
print("  this version and it is now much smaller.")
