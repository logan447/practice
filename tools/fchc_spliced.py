"""Owner's method: all in-town open days, divided by 8 months of weeks.

Only the original 12 weeks are blocked. Every other weekday Jamie is
home is offered, in all 12 months. Total hours / (0.66 x 52) weeks.
"""
import datetime as dt
exec(open('tools/fchc_open_days.py').read().split('HRS, RATE, WIN')[0])
HRS, RATE = 12, 50.
OPEN=[JAN1+dt.timedelta(i) for i in range(365)
      if (JAN1+dt.timedelta(i)).weekday()<5 and not busy[i]
      and (JAN1+dt.timedelta(i)) not in off]
MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
cnt=[0]*12
for d in OPEN: cnt[d.month-1]+=1
print("Open days by month (Jamie home, in town, not a blocked week):")
print("  "+"  ".join(f"{MON[i]} {cnt[i]}" for i in range(12)))
print(f"  total {sum(cnt)}   of which Nov+Dec+Jan+Feb = "
      f"{cnt[10]+cnt[11]+cnt[0]+cnt[1]}\n")

W8 = 0.66*52                       # owner's denominator
need = 30*W8
hrs = len(OPEN)*HRS
wk=[0]*53
for d in OPEN: wk[(d-JAN1).days//7]+=1
wk=wk[:52]
active=sum(1 for x in wk if x>0)
print(f"OWNER'S CALCULATION")
print(f"  {len(OPEN)} days x {HRS} h = {hrs:,} hours")
print(f"  8 months of weeks = 0.66 x 52 = {W8:.2f}")
print(f"  {hrs:,} / {W8:.2f} = {hrs/W8:.2f} h per week")
print(f"  needs {need:,.0f} h -> {'MEETS IT' if hrs>=need else f'short {need-hrs:,.0f} h'}")
print(f"\n  weeks with at least one clinic day: {active}")
print(f"  {hrs:,} / {active} actual working weeks = {hrs/active:.2f} h/week")
gap=need-hrs
print(f"\nCLOSING THE {gap:,.0f}-HOUR GAP, any one of:")
print(f"  - {gap/HRS:.1f} more clinic days -> 3 sitter days, ${3*HRS*28:,.0f}")
print(f"  - {need/len(OPEN):.2f} clocked hours per day instead of {HRS} "
      f"(a {need/len(OPEN)-HRS:.1f} h longer day)")
print(f"  - {gap/active:.1f} h/week of paid admin across the {active} working weeks "
      f"({gap:,.0f} h/yr)")
print(f"\nAt ${RATE:.0f}/h, {need:,.0f} paid hours = ${need*RATE:,.0f}")
