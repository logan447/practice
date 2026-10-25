"""Open every day Jamie can cover, then test the 8-month average.

Rule: 12 weeks off as already planned. In the other ~9 months, offer
the clinic EVERY weekday Jamie is home. 12 clocked hours each.
Question: does any 8-month window of those days average 30 h/week?
"""
import datetime as dt

TYPE=['med']*52
for i in (3,14,25,36,47):                  TYPE[i]='backup'
for i in (8,21,41):                        TYPE[i]='three'
for i in (1,5,10,16,19,24,29,33,38,44,49): TYPE[i]='two'
for i in (12,27):                          TYPE[i]='light'
TBL={'med':[([5],[0]),([1],[4]),([6],[2]),([3],[0]),([0],[3])],
     'two':[([0,3],[]),([1,4],[]),([2,5],[]),([0,4],[])],
     'three':[([0,2,4],[]),([1,3,5],[])],'light':[([2],[])]}
busy,n=[False]*366,{k:0 for k in TBL}
for w in range(52):
    t=TYPE[w]
    if t=='backup':
        for d in range(7): busy[w*7+d]=True
        continue
    a,b=TBL[t][n[t]%len(TBL[t])]; n[t]+=1
    for d in a:
        busy[w*7+d]=True
        if w*7+d+1<366: busy[w*7+d+1]=True
    for d in b: busy[w*7+d]=True

JAN1=dt.date(2029,1,1)
VAC=[((1,1),(1,13)),((4,1),(4,7)),((5,6),(5,19)),
     ((7,22),(8,11)),((11,18),(12,1)),((12,16),(12,31))]
off=set()
for a,b in VAC:
    d,e=dt.date(2029,*a),dt.date(2029,*b)
    while d<=e: off.add(d); d+=dt.timedelta(1)

HRS, RATE, WIN = 12, 50., 35          # 35 weeks = 8 months
OPEN=[JAN1+dt.timedelta(i) for i in range(365)
      if (JAN1+dt.timedelta(i)).weekday()<5
      and not busy[i]
      and (JAN1+dt.timedelta(i)) not in off]
print(f"Weeks off kept: 12. In-town weekdays offered to the clinic: {len(OPEN)}")
print(f"That is {len(OPEN)*HRS:,} clocked hours a year "
      f"({len(OPEN)*HRS/52.1786:.1f} h/week over 12 months).\n")

need=30*WIN
print(f"8-month test: {WIN} weeks x 30 h = {need:,} hours "
      f"= {need/HRS:.0f} twelve-hour days inside one window.\n")
best=[]
for s in range(52):
    st=JAN1+dt.timedelta(s*7); en=st+dt.timedelta(WIN*7-1)
    inside=[d for d in OPEN if st<=d<=en]
    best.append((len(inside),s,st,en))
best.sort(reverse=True)
print(f"{'window':>17} {'days in it':>11} {'hours':>8} {'h/week':>8} {'vs 30':>8}")
for nd,s,st,en in best[:5]:
    h=nd*HRS
    print(f"{st:%d %b}-{en:%d %b} {nd:>11} {h:>8,} {h/WIN:>8.1f} {h/WIN-30:>+8.1f}")
nd,s,st,en=best[0]
gap=need-nd*HRS
print(f"\nBest window {st:%d %b} to {en:%d %b}: {nd} days, {nd*HRS:,} hours, "
      f"{nd*HRS/WIN:.1f} h/week.")
print(f"ANSWER: {'MEETS' if gap<=0 else f'SHORT by {gap:,} hours ({gap/WIN:.1f} h/week)'}")
if gap>0:
    print(f"\nTo close {gap:,} hours inside that window, any one of:")
    print(f"  - {gap/HRS:.0f} more clinic days, on days Jamie cannot cover "
          f"-> {gap/HRS:.0f} sitter days, ${gap/HRS*HRS*28:,.0f}")
    print(f"  - {gap/WIN:.1f} h/week of counted admin ({gap:,} h/yr)")
    print(f"  - longer days: {need/nd:.1f} clocked hours on each of the {nd} days")

# ---- non-consecutive reading: count weeks that reach 30 h on their own --
print("\n" + "="*66)
print("NON-CONSECUTIVE READING: count the weeks that reach 30 h by themselves")
print("="*66)
wk=[0]*52
for d in OPEN: wk[(d-JAN1).days//7]+=1
need_days = 30/HRS            # 2.5 twelve-hour days
hit=[w for w in range(52) if wk[w]*HRS>=30]
print(f"A week needs {need_days:.1f} twelve-hour days to reach 30 h, "
      f"so 3 days in practice.")
print("  open days per week: "+" ".join(str(x) for x in wk))
print(f"  weeks reaching 30 h on open days alone: {len(hit)} of 52")
print(f"  8 months of weeks = {8/12*52.1786:.1f}. "
      f"{'MEETS' if len(hit)>=34.8 else f'SHORT by {34.8-len(hit):.1f} weeks'}")
tot=sum(min(wk[w],3)*HRS for w in hit)
print(f"  hours in those weeks: {tot:,}")
print(f"\n  weeks with 0 open days: {wk.count(0)}   1 day: {wk.count(1)}   "
      f"2 days: {wk.count(2)}   3+: {sum(1 for x in wk if x>=3)}")

# ---- week-by-week counting, with admin lifting the 2-day weeks ---------
allwk=[0]*53; openwk=[0]*53
for i in range(364):
    d=JAN1+dt.timedelta(i)
    if d.weekday()<5 and not busy[i]:
        allwk[i//7]+=1
        if d not in off: openwk[i//7]+=1
allwk, openwk = allwk[:52], openwk[:52]
NEEDW=8/12*52.1786
print(f"\nIf each counted week must reach 30 h on its own "
      f"(need {NEEDW:.1f} such weeks):")
for adm,lbl in ((0,'no admin'),(6,'6 h/wk admin')):
    dn=(30-adm)/12
    a=sum(1 for x in openwk if x>=dn-1e-9)
    b=sum(1 for x in allwk  if x>=dn-1e-9)
    print(f"  {lbl:<13} week needs {dn:.2f} clinic days | "
          f"all 12 wks off kept: {a:>2} weeks | "
          f"working through vacation: {b:>2} weeks")
print("\n  Averaging across one window beats counting weeks one by one:")
print("  under an average the 4-day weeks carry the 2-day weeks, and")
print("  all 12 weeks off survive. Counting week by week, every counted")
print("  week has to stand alone, so about 4 weeks of vacation go.")
