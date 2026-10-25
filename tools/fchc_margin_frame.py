"""Frame the ask as the surplus FCHC keeps, not as an hourly rate.

Structure (owner's framing 2026-10-25):
    collections - 50% overhead - physician cost = FCHC surplus

At 50% overhead the "physician + surplus" pool is exactly half of
collections. So physician share and clinic surplus are complements:
physician at 40% of collections leaves the clinic 10%.

Config: alternating 3/4-day weeks, 12 clocked hrs, 141 clinic days,
2,820 encounters, 1,692 worked hours, 81 childcare days.
"""
import sys; sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
import datetime as dt
FLOOR, DIR, OH, EMP = 25_000., 66.97, 0.50, 1.09
DAYS, H, ENC, HRS = 141, 12.0, 20, 1_692
NCARE = 81
ORG_MARGIN = 0.013      # FACT: FCHC FY2024 $21,133 on $1,622,030

def saved(rate, care_hr=24.):
    inc=HRS*rate; care=NCARE*(H+2.5)*care_hr
    tx=(inc*FICA_EMPLOYEE+tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
    other=8_460.-1_200.+10.*DAYS
    return inc-tx-ibr_payment(inc,FPL150_FAM4)-care-car(DAYS)-other \
           + min(care,3_750.)*0.30

def rate_for_margin(ev, margin):
    """Hourly rate that leaves FCHC `margin` share of collections."""
    coll = DAYS*ENC*ev
    phys_loaded = coll*(1-OH-margin)
    return phys_loaded/EMP/HRS, coll, coll*margin

print("THE STRUCTURE\n")
print("  collections  - 50% overhead - physician = FCHC surplus")
print("  At 50% overhead the pool is half of collections, so physician")
print("  share and clinic surplus are complements:\n")
for ps in (0.35,0.40,0.44,0.50):
    print(f"    physician at {ps:.0%} of collections -> clinic keeps "
          f"{0.50-ps:+.0%}")
print(f"\n  FCHC's whole-organisation margin, FY2024: {ORG_MARGIN:.1%}")
print(f"  ($21,133 surplus on $1,622,030 of expenses). So any book")
print(f"  running 5%+ is several times their current rate.\n")

print("YOUR RATE, SOLVED FROM THEIR MARGIN")
print("  rows: what FCHC collects per encounter (UNSET -- the key input)")
print("  cols: surplus FCHC keeps, as a share of collections\n")
cols=(0.05,0.08,0.10,0.12,0.15)
print(f"{'$/enc':>7}{'collections':>13}" + "".join(f"{m:>12.0%}" for m in cols))
for ev in (80.,90.,100.,103.,110.):
    row=f"{ev:>7.0f}{DAYS*ENC*ev:>13,.0f}"
    for m in cols:
        r,_,_=rate_for_margin(ev,m)
        row+=f"{r:>11.2f}" + ("*" if saved(r)>=FLOOR and r<=DIR else
                              "!" if r>DIR else " ")
    print(row)
print("\n  * clears your $25,000 floor AND stays under the director")
print("  ! would exceed the director's $66.97/hr")

print("\n\nTHE SURPLUS IN DOLLARS, at the rates that work for you")
print(f"{'$/enc':>7}{'rate':>8}{'your pay':>11}{'loaded':>11}"
      f"{'overhead':>11}{'FCHC SURPLUS':>14}{'as % coll':>11}{'you save':>10}")
for ev in (90.,100.,103.,110.):
    lo,hi=40.,200.
    for _ in range(80):
        m=(lo+hi)/2
        if saved(m)<FLOOR: lo=m
        else: hi=m
    r=hi
    coll=DAYS*ENC*ev; loaded=HRS*r*EMP; ohd=coll*OH
    surp=coll-ohd-loaded
    print(f"{ev:>7.0f}{r:>8.2f}{HRS*r:>11,.0f}{loaded:>11,.0f}"
          f"{ohd:>11,.0f}{surp:>14,.0f}{surp/coll:>11.1%}"
          f"{saved(r):>10,.0f}")
print("\n  (rate column = the minimum that clears your $25,000 floor,")
print("   so these rows show the LEAST you can take and the MOST")
print("   surplus that leaves FCHC)")

print("\n\nWHAT THEY GET AT EACH ASK, assuming $100/encounter")
ev=100.; coll=DAYS*ENC*ev
print(f"  collections ${coll:,.0f}, overhead ${coll*OH:,.0f}, "
      f"pool ${coll*(1-OH):,.0f}")
print(f"{'rate':>8}{'your pay':>11}{'loaded':>11}{'FCHC SURPLUS':>14}"
      f"{'% coll':>9}{'you save':>10}{'vs dir':>9}")
for r in (55.,60.,62.25,64.,66.97):
    loaded=HRS*r*EMP; surp=coll-coll*OH-loaded
    print(f"{r:>8.2f}{HRS*r:>11,.0f}{loaded:>11,.0f}{surp:>14,.0f}"
          f"{surp/coll:>9.1%}{saved(r):>10,.0f}{r-DIR:>+9.2f}")
