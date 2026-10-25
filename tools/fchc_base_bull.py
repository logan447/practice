"""Base case 16 patients a day, bull case 20. Salary fixed at $41,500.

The salary does not move between cases. Only the encounter count does,
so the whole upside of growing the panel lands on the clinic's side of
the ledger. That is the argument for saying yes to 16 now.
"""
import sys, datetime as dt; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
from phase2_personal_model import FPL150_FAM4
bz=prep(0); FLOOR=25_000.
FREE=[JAN1+dt.timedelta(i) for i in range(365)
      if (JAN1+dt.timedelta(i)).weekday()<5
      and (JAN1+dt.timedelta(i)) not in off and not bz[i]]
D=len(FREE); H=10.; SAL=41_500.; OH=0.50; EMP=1.09
LOADED=SAL*EMP

def household(sal):
    mi=110.*D
    carc=mi/30*3.20+mi*0.09+1_750.+4_200.+1_500.
    other=8_460.-1_200.+10.*D
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-carc-other

print(f"{D} clinic days x {H:.0f} hours. Salary fixed at ${SAL:,.0f}.")
print(f"Household saves ${household(SAL):,.0f} in BOTH cases -- the")
print(f"patient count does not change my pay.\n")

print("THE TWO CASES")
print(f"{'case':>6}{'pts/day':>9}{'slot':>7}{'encounters':>12}{'$/enc':>8}"
      + "".join(f"{f'% @${e:.0f}':>9}" for e in (90.,102.97)))
for lab,pts in (("BASE",16),("BULL",20)):
    enc=D*pts
    print(f"{lab:>6}{pts:>9}{H*60/pts:>6.0f}m{enc:>12,}{LOADED/enc:>8.2f}"
          + "".join(f"{LOADED/(enc*e):>8.0%} " for e in (90.,102.97)))

print("\nWHAT THE CLINIC KEEPS, after 50% overhead and my salary")
print(f"{'case':>6}{'enc':>7}" + "".join(f"{f'coll @${e:.0f}':>13}{'surplus':>10}"
      for e in (90.,102.97)))
for lab,pts in (("BASE",16),("BULL",20)):
    enc=D*pts; row=f"{lab:>6}{enc:>7,}"
    for e in (90.,102.97):
        coll=enc*e; row+=f"{coll:>13,.0f}{coll*(1-OH)-LOADED:>10,.0f}"
    print(row)
b16=D*16*90*(1-OH)-LOADED; b20=D*20*90*(1-OH)-LOADED
h16=D*16*102.97*(1-OH)-LOADED; h20=D*20*102.97*(1-OH)-LOADED
print(f"\n  Growing 16 -> 20 adds ${b20-b16:,.0f} of surplus at $90 and "
      f"${h20-h16:,.0f} at $103,")
print(f"  and costs the clinic nothing, because my salary is fixed.")
print(f"  Their whole-organisation surplus last year was $21,133, so")
print(f"  the bull case alone is {b20/21_133:.1f}x to {h20/21_133:.1f}x that.")

print("\nIF WE REACH 20, WHAT THE CLINIC COULD THEN AFFORD")
for e in (90.,102.97):
    for share in (0.40,0.45):
        print(f"  at ${e:.2f}/enc and {share:.0%} physician share: "
              f"${D*20*e*share/EMP:>8,.0f} salary "
              f"({D*20*e*share/EMP-SAL:+,.0f} vs today)")
print(f"\n  So 20 a day creates room for a raise later without the clinic")
print(f"  giving up margin. At $90 and 40% that is "
      f"${D*20*90*0.40/EMP:,.0f}, which would also clear the $25,000 floor")
print(f"  (household would save ${household(D*20*90*0.40/EMP):,.0f}).")

print("\nGROWING THE PANEL IS THE ONLY THING THAT HAS TO CHANGE")
print(f"  16 -> 20 a day on {D} days is {D*4:,} more encounters a year.")
print(f"  Slots go from {H*60/16:.0f} to {H*60/20:.0f} minutes, both normal.")
print(f"  It is a demand question, not a pace question.")
