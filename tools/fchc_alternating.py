"""Alternating 3-day and 4-day weeks, 12 clocked hours, $60/hr.

3-day weeks are Tue/Wed/Thu; 4-day weeks add Friday. Alternating gives
an average of 3.5 clinic days a week. Care days counted off the same
generated 2029 Jamie schedule, no backup weeks moved (owner declined).
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
FLOOR, DIR, RATE, H = 25_000., 66.97, 60.0, 12.0
bz = prep(0)

def alt_days(fri_on_even=True):
    """Tue-Thu every week; Friday only on alternate weeks."""
    out=[]
    for i in range(365):
        d=JAN1+dt.timedelta(i)
        if d in off: continue
        wd=d.weekday()
        wk=i//7
        if wd in (1,2,3): out.append(d)
        elif wd==4 and (wk%2==0)==fri_on_even: out.append(d)
    return out

for parity,lab in ((True,"Friday on even weeks"),(False,"Friday on odd weeks")):
    ds=alt_days(parity)
    nc=sum(1 for d in ds if bz[(d-JAN1).days])
    print(f"  {lab}: {len(ds)} clinic days, {nc} need paid care")
ds=alt_days(True); d=len(ds)
c=sum(1 for x in ds if bz[(x-JAN1).days])

print(f"\nALTERNATING 3/4 DAY WEEKS, {H:.0f} CLOCKED HRS, ${RATE:.0f}/hr\n")
print("PSLF")
wks=d/3.5
print(f"  {d} clinic days x {H:.0f} hrs = {d*H:,.0f} worked hours")
print(f"  {d*H:,.0f} / 52 = {d*H/52:.2f} hr/wk  ->  "
      + ("PASSES" if d*H/52>=30 else "FAILS")
      + f" by {d*H/52-30:+.2f} hrs, no leave counted")
print(f"  ~{wks:.0f} working weeks, so ~{52-wks:.0f} weeks off\n")

print("HOUSEHOLD")
print(f"{'care $/hr':>10}{'care/day':>10}{'care/yr':>10}{'SAVED':>10}{'vs floor':>11}")
for ch in (28.,26.,24.,22.):
    inc,care,sv=econ(H,d,c,ch,RATE)
    print(f"{ch:>10.0f}{(H+2.5)*ch:>10,.0f}{care:>10,.0f}{sv:>10,.0f}"
          f"{sv-FLOOR:>+11,.0f}"+("  *" if sv>=FLOOR else ""))

print(f"\nSIDE BY SIDE at ${RATE:.0f}/hr, care $24")
d4,c4=count((1,2,3,4),bz); d3,c3=count((1,2,3),bz)
for lab,dd,cc,hh in (("3 days/wk, 12h",d3,c3,12.),
                     ("alternating 3/4, 12h",d,c,12.),
                     ("4 days/wk, 12h",d4,c4,12.),
                     ("4 days/wk, 10h",d4,c4,10.)):
    inc,care,sv=econ(hh,dd,cc,24.,RATE)
    avg=dd*hh/52
    print(f"  {lab:<22} {dd:>3} days {dd*hh:>6,.0f} hrs  {avg:>5.2f}/wk "
          + ("pass" if avg>=30 else "FAIL")
          + f"  income ${inc:>8,.0f}  saved ${sv:>7,.0f} ({sv-FLOOR:+,.0f})")

print(f"\nRATE NEEDED, alternating 3/4 at {H:.0f} hrs")
for ch in (24.,26.,28.):
    lo,hi=40.,200.
    for _ in range(80):
        m=(lo+hi)/2
        if econ(H,d,c,ch,m)[2]<FLOOR: lo=m
        else: hi=m
    print(f"  care ${ch:.0f}/hr -> ${hi:>6.2f}/hr  "
          + ("under the director" if hi<=DIR else "ABOVE the director")
          + f"   income ${d*H*hi:>8,.0f}")

print(f"\nFCHC'S SIDE, 20 patients/day")
loaded=d*H*RATE*1.09
print(f"  {d*20:,} encounters, loaded cost ${loaded:,.0f}")
for ev in (90.,102.97):
    print(f"    at ${ev:.2f}/enc: ${d*20*ev:>9,.0f} collections -> "
          f"{loaded/(d*20*ev):.0%} of collections")
print(f"  per encounter: ${loaded/(d*20):.2f}  (they pay $21.80 today)")
print(f"  vs director: ${RATE:.2f}/hr is ${RATE-DIR:+.2f}; "
      f"total ${d*H*RATE:,.0f} vs $139,293")

print("\nWHAT THE ALTERNATION BUYS")
print(f"  ~{52-wks:.0f} weeks off, and in ~20 of the 40 working weeks a")
print(f"  second weekday at home (Monday AND Friday) instead of one.")
print(f"  Away {H+2.5:.1f} hrs on clinic days: ~5:45am to 8:15pm.")
