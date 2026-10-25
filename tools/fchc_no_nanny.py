"""Three days a week, 12 patients, $50/hr, 12 clocked hours,
ONLY on days Jamie's schedule leaves her with the children.
No paid childcare at all.
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
src=open("tools/fchc_worked_hours_only.py").read()
exec(src.split('print("WHAT REACHES')[0])
RATE, H, PTS, FLOOR = 50.0, 12.0, 12, 25_000.
bz = prep(0)

# clinic only where Jamie is free, capped at 3 weekdays per week
days, per_week = [], {}
for i in range(365):
    d = JAN1+dt.timedelta(i)
    if d in off or d.weekday() > 4: continue
    if bz[i]: continue                       # Jamie working -> I have the kids
    wk = i//7
    if per_week.get(wk,0) >= 3: continue     # cap at 3 days
    per_week[wk] = per_week.get(wk,0)+1
    days.append(d)
D = len(days)
wks_used = len(per_week)
print("HOW MANY DAYS DOES JAMIE'S SCHEDULE ACTUALLY LEAVE?\n")
print(f"  weekdays outside my 12 weeks off          201")
print(f"  of those, Jamie is free (no shift/post-call/backup)  "
      f"{sum(1 for i in range(365) if (JAN1+dt.timedelta(i)).weekday()<5 and (JAN1+dt.timedelta(i)) not in off and not bz[i])}")
print(f"  capped at 3 a week                        {D} clinic days")
print(f"  spread over {wks_used} weeks, average {D/40:.1f} a working week")
from collections import Counter
dist=Counter(per_week.values())
print(f"  weeks with 3 days: {dist.get(3,0)}   2 days: {dist.get(2,0)}   "
      f"1 day: {dist.get(1,0)}   0 days: {40-wks_used}")

print("\nPSLF")
hrs = D*H
print(f"  {D} clinic days x {H:.0f} clocked hrs = {hrs:,.0f} worked hours")
print(f"  {hrs:,.0f} / 52 = {hrs/52:.2f} hr/wk   -> needs 30.00")
print(f"  *** FAILS by {30-hrs/52:.2f} hrs/week ***")
print(f"  hours/day that WOULD reach 1,560 on {D} days: {1560/D:.1f}")
print(f"  days needed at {H:.0f} hrs: {1560/H:.0f}, but Jamie only frees {D}")

print("\nHOUSEHOLD (no childcare at all)")
inc = D*H*RATE
tx=(inc*FICA_EMPLOYEE+tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
    +tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
loan=ibr_payment(inc,FPL150_FAM4)
carc=car(D); other=8_460.-1_200.+10.*D
sv=inc-tx-loan-carc-other
for lab,v in [(f"{D} days x {H:.0f} hrs x ${RATE:.0f}",inc),
              ("tax + FICA",-tx),("IBR",-loan),
              ("childcare",0.),(f"car, {110*D:,.0f} mi",-carc),
              ("tolls/disability/life/licence/meals",-other)]:
    print(f"  {lab:<40}{v:>10,.0f}")
print(f"  {'SAVED':<40}{sv:>10,.0f}")
print(f"  {'vs the $25,000 floor':<40}{sv-FLOOR:>+10,.0f}")
print(f"\n  take-home per clinic day  ${(inc-tx-loan)/D:,.0f}  "
      f"and you keep all of it")

print("\nFCHC'S SIDE -- can they pay this?")
loaded=H*RATE*1.09
print(f"  {PTS} patients in {H:.0f} hours = {H*60/PTS:.0f} min slots")
print(f"  your loaded cost ${loaded:,.0f}/day / {PTS} patients = "
      f"${loaded/PTS:.2f} per encounter")
for ev in (90.,102.97):
    print(f"    at ${ev:.2f}/encounter: {loaded/(PTS*ev):.0%} of collections"
          + ("  -- far above the 35-45% band" if loaded/(PTS*ev)>0.45 else ""))
print(f"  annual: {D*PTS:,} encounters, ${D*PTS*90:,.0f}-${D*PTS*102.97:,.0f} "
      f"collections, your cost ${D*loaded:,.0f}")
print(f"  at 50% overhead their surplus is "
      f"${D*PTS*90*0.5-D*loaded:,.0f} to ${D*PTS*102.97*0.5-D*loaded:,.0f}")

print("\nWHAT RATE / SLOTS FCHC COULD ACTUALLY AFFORD HERE")
for ev in (90.,102.97):
    for share in (0.40,0.45):
        aff=PTS*ev*share/1.09/H
        print(f"  at ${ev:.0f}/enc and {share:.0%} physician share: "
              f"${aff:.2f}/hr for a {H:.0f}-hr day")
for pts in (16,20,24):
    loaded2=H*RATE*1.09
    print(f"  {pts} patients in {H:.0f} hrs ({H*60/pts:.0f} min): "
          f"${loaded2/pts:.2f}/enc = "
          f"{loaded2/(pts*90):.0%}-{loaded2/(pts*102.97):.0%} of collections")
