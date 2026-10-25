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

# ---- the denominator is the whole ballgame ----------------------------
print("\n" + "="*66)
print("A LONGER CONTRACT PERIOD RAISES THE BAR. It does not lower it.")
print("="*66)
TOT=len(OPEN)*12.5
print(f"83 days at 12.5 clocked hours = {TOT:,.1f} hours.\n")
for wks,lbl in [(34.32,"8 months, aggregated working weeks"),
                (40,"9 months / 40 weeks"),
                (52.18,"the whole year")]:
    need=30*wks
    print(f"  {lbl:<36} needs {need:>6,.0f} h -> {TOT/wks:>5.1f} h/wk "
          f"{'OK' if TOT>=need else 'SHORT by %.0f h'%(need-TOT)}")
print("\n  Eight months is a FLOOR on how long the period must be.")
print("  It is not a divisor to choose. Whatever the contract says the")
print("  period is, that is what the hours are averaged over, so the")
print("  shortest period that still clears 8 months is the best one.")

# ---- excluding the weeks Jamie cannot cover ---------------------------
print("\n" + "="*66)
print("EXCLUDING EMPTY WEEKS: right direction, but there is a floor")
print("="*66)
wkc=[0]*53
for d in OPEN: wkc[(d-JAN1).days//7]+=1
wkc=wkc[:52]
zero=[w for w in range(52) if wkc[w]==0]
vacw=[w for w in zero if any((JAN1+dt.timedelta(w*7+i)) in off for i in range(7))]
jamiew=[w for w in zero if w not in vacw]
print(f"  weeks with zero coverage: {len(zero)} "
      f"({len(vacw)} my time off, {len(jamiew)} Jamie-driven)")
print(f"  Jamie-driven empty weeks (1-indexed): {[w+1 for w in jamiew]}")
print(f"  weeks with at least one clinic day: {sum(1 for x in wkc if x>0)}\n")
TOT=len(OPEN)*12.5
print(f"  83 days at 12.5 clocked hours = {TOT:,.1f} h\n")
print(f"  {'weeks':>6} {'months':>7} {'needs':>8} {'h/week':>8}  verdict")
for w in (34, 34.32, 35, 36, 40):
    mo=w/52.1786*12; need=30*w
    v=('BELOW THE 8-MONTH FLOOR' if mo<8 else
       ('OK' if TOT>=need else f'short {need-TOT:,.0f} h'))
    print(f"  {w:>6} {mo:>7.2f} {need:>8,.0f} {TOT/w:>8.2f}  {v}")
print("\n  Shortest whole-week period that still clears 8 months: 35 weeks.")
print("  Five of the six empty weeks can come out; taking all six lands")
print("  at 34 weeks, which is 7.82 months and fails the minimum.\n")
for d,h in ((83,12.5),(83,12.75),(84,12.5)):
    t=d*h
    print(f"  {d} days x {h} h = {t:>7,.1f} -> {t/35:>5.2f} h/wk over 35 wks "
          f"{'OK' if t>=1050 else 'short':<6} ${t*50:,.0f}")
