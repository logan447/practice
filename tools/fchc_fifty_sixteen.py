"""$50/hr, 10-hour days, 16 patients. 83 Jamie-free days, zero childcare.

Two readings of "$50 an hour" in a salaried 0.75 FTE:
  (a) the FTE rate: $50 x 1,560 paid hours = $78,000
  (b) clinic hours only: $50 x 830 worked clinic hours = $41,500
Both are priced below, along with what FCHC can actually fund.
"""
import sys, datetime as dt; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
from phase2_personal_model import FPL150_FAM4
bz=prep(0); FLOOR=25_000.; OH=0.50; EMP=1.09
FREE=[JAN1+dt.timedelta(i) for i in range(365)
      if (JAN1+dt.timedelta(i)).weekday()<5
      and (JAN1+dt.timedelta(i)) not in off and not bz[i]]
D=len(FREE); H=10.0
def saved(sal):
    mi=110.*D
    carc=mi/30*3.20+mi*0.09+1_750.+4_200.+1_500.
    other=8_460.-1_200.+10.*D
    tx=(sal*FICA_EMPLOYEE+tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    return sal-tx-ibr_payment(sal,FPL150_FAM4)-carc-other
def affordable(pts, ev, share=0.40):
    """Salary FCHC can fund at `share` of collections."""
    return D*pts*ev*share/EMP

print(f"{D} clinic days x {H:.0f} hrs = {D*H:,.0f} clinic hours")
print(f"16 patients in {H:.0f} hours = {H*60/16:.1f} min slots\n")
print("THE TWO READINGS OF '$50 AN HOUR'")
for lab,sal in (("FTE rate: $50 x 1,560 paid hrs", 78_000.),
                ("clinic hours only: $50 x 830", 41_500.)):
    enc=D*16; L=sal*EMP
    print(f"  {lab:<34} ${sal:>7,.0f}   you save ${saved(sal):>7,.0f}"
          f"  ({saved(sal)-FLOOR:+,.0f})")
    print(f"  {'':<34} FCHC: ${L/enc:>6.2f}/enc = "
          + "  ".join(f"{L/(enc*ev):>3.0%} @${ev:.0f}" for ev in (90.,102.97)))

print(f"\nTHE PROBLEM: {D} days x 16 patients is only {D*16:,} encounters")
for ev in (90.,102.97):
    coll=D*16*ev
    print(f"  at ${ev:.2f}/enc that is ${coll:,.0f} of collections,")
    print(f"  so at 50% overhead there is ${coll*0.5:,.0f} for the physician,")
    print(f"  i.e. a salary of at most ${coll*0.5/EMP:,.0f} before they lose money.")

print(f"\nWHAT FCHC CAN FUND at 40% of collections (normal band)")
print(f"{'pts/day':>8}{'slot':>7}{'encounters':>12}{'@$90':>10}{'@$103':>10}"
      f"{'clears your floor?':>20}")
for pts in (16,18,20,22,24,28):
    a90, a103 = affordable(pts,90.), affordable(pts,102.97)
    ok = ("yes at $90" if a90>=53_096 else
          "yes at $103 only" if a103>=53_096 else "no")
    print(f"{pts:>8}{H*60/pts:>6.0f}m{D*pts:>12,}{a90:>10,.0f}{a103:>10,.0f}"
          f"{ok:>20}")
print(f"\n  your floor needs a salary of $53,096 (zero childcare)")

print("\nSALARY vs PATIENTS: what works for BOTH")
print(f"{'salary':>9}{'$/hr FTE':>10}{'you save':>10}" +
      "".join(f"{f'{p} pts':>9}" for p in (16,20,24)))
for sal in (45_000.,50_000.,53_096.,55_000.,60_000.,78_000.):
    row=f"{sal:>9,.0f}{sal/1560:>10.2f}{saved(sal):>10,.0f}"
    for pts in (16,20,24):
        sh=sal*EMP/(D*pts*90)
        row+=f"{sh:>8.0%}" + ("*" if sh<=0.45 and saved(sal)>=FLOOR else " ")
    print(row)
print("  * in the 35-45% band at $90/encounter AND clears your floor")

print("\nTHE HONEST READ")
print(f"  16 patients in 10 hours is {H*60/16:.1f}-minute slots, which is more")
print("  generous than the clinic needs and is what breaks the economics.")
print(f"  At 20 patients (30-minute slots) FCHC can fund "
      f"${affordable(20,90.):,.0f} at $90 and ${affordable(20,102.97):,.0f}")
print(f"  at $103, either of which clears your $53,096 floor.")
