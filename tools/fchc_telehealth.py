"""Telehealth days from the Wharf, with a sitter in the house.

He is present, so this is a babysitter with a parent home rather than
a nanny in sole charge. DC rates for that run below nanny rates.
Telehealth days are ADDITIVE: they fall on weekdays he currently does
not work at all because Jamie is on shift.
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
from phase2_personal_model import FPL150_FAM4
bz=prep(0); FLOOR=25_000.
JAN=JAN1
GREEN=[JAN+dt.timedelta(i) for i in range(365)
       if (JAN+dt.timedelta(i)).weekday()<5
       and (JAN+dt.timedelta(i)) not in off and not bz[i]]
AMBER=[JAN+dt.timedelta(i) for i in range(365)
       if (JAN+dt.timedelta(i)).weekday()<5
       and (JAN+dt.timedelta(i)) not in off and bz[i]]
D, A = len(GREEN), len(AMBER)
RATE, IN_H, TELE_H, SIT_H = 50.0, 10.0, 8.0, 9.5
print(f"{D} in-person days (Jamie home)   {A} weekdays she is working")
print(f"Telehealth day: {TELE_H:.0f} paid hours, sitter {SIT_H} hours "
      f"(7:30 to 5), no commute\n")

print("A SINGLE TELEHEALTH DAY, BEFORE TAX")
print(f"{'sitter $/hr':>12}{'sitter/day':>12}{'earned':>9}{'kept':>8}"
      f"{'effective $/hr':>16}")
for s in (18.,20.,22.,24.):
    cost=s*SIT_H; earn=RATE*TELE_H
    print(f"{s:>12.0f}{cost:>12,.0f}{earn:>9,.0f}{earn-cost:>8,.0f}"
          f"{(earn-cost)/TELE_H:>16.2f}")
print(f"\n  An in-person day earns ${RATE*IN_H:,.0f} over {IN_H:.0f} paid hours")
print(f"  with no sitter, so ${RATE:.2f}/hr. A telehealth day at a $20")
print(f"  sitter nets ${(RATE*TELE_H-20*SIT_H)/TELE_H:.2f}/hr. Roughly half.")
print(f"  But it is additive: these are days currently worked at all = 0.\n")

def year(tele_days, sit=20., rate=RATE):
    hrs_in  = D*IN_H
    hrs_tel = tele_days*TELE_H
    paid    = hrs_in + hrs_tel
    sal     = paid*rate
    sitter  = tele_days*sit*SIT_H
    mi      = 110.*D
    car     = mi/30*3.20 + mi*0.09 + 1_750. + 4_200. + 1_500.
    other   = 8_460. - 1_200. + 10.*D
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan=ibr_payment(sal,FPL150_FAM4)
    fsa=min(sitter,3_750.)*0.30
    return paid, sal, sitter, sal-tx-loan-sitter-car-other+fsa

print("THE YEAR, by how many telehealth days")
print(f"{'tele days':>10}{'per wk':>8}{'paid hrs':>10}{'avg/wk':>8}"
      f"{'salary':>9}{'sitter':>9}{'SAVED':>9}{'vs floor':>10}")
for td in (0, 20, 40, 60, 80, 91, 118):
    paid,sal,sit,sv = year(td)
    print(f"{td:>10}{td/40:>8.1f}{paid:>10,.0f}{paid/52:>8.2f}{sal:>9,.0f}"
          f"{sit:>9,.0f}{sv:>9,.0f}{sv-FLOOR:>+10,.0f}"
          + ("  *" if sv>=FLOOR else "")
          + ("  PSLF on worked hours" if paid>=1560 else ""))
print("\n  * clears the $25,000 floor.  avg/wk is worked hours only,")
print("  before any leave is counted.")

print(f"\nTHE HOURS FINDING")
need=(1_560.-D*IN_H)/TELE_H
print(f"  1,560 worked hours needs {need:.0f} telehealth days "
      f"({need/40:.1f} a week).")
print(f"  {A} are available. At that point PSLF rests on hours actually")
print(f"  worked and nothing depends on leave counting at all.")

print("\nSENSITIVITY TO THE SITTER RATE, at 1 and 2 days a week")
print(f"{'sitter $/hr':>12}" + "".join(f"{f'{t} days':>12}" for t in (40,80)))
for s in (18.,20.,22.,24.,28.):
    row=f"{s:>12.0f}"
    for td in (40,80):
        row+=f"{year(td,s)[3]:>12,.0f}"
    print(row)
