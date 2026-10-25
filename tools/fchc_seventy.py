"""70 clinic days under PSLF pathway (B), against Jamie's 2029 schedule.

34 CFR 685.219(b)(11)(i)(B) requires "a minimum of 30 hours per week
THROUGHOUT a contractual or employment period of at least 8 months".
At 12-hour days that is 2 clinic days plus ~6 admin hours in EVERY week
of the window. A week with one clinic day is 12 hours and breaks it.

Question: can 2 clinic days a week, every week, for 35 consecutive
weeks, be placed only on weekdays Jamie is already home?
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
# free weekday = Mon-Fri and Jamie is home
free=[0]*52
for w in range(52):
    for d in range(7):
        i=w*7+d
        if i>=365: continue
        day=JAN1+dt.timedelta(i)
        if day.weekday()<5 and not busy[i]: free[w]+=1

WIN, NEED, HRS, RATE, CARE_HR = 35, 2, 12, 50.0, 28.0
print(f"Free weekdays per week (Jamie home), 2029: total {sum(free)}")
print("  " + " ".join(str(f) for f in free))
print(f"  weeks with 0: {free.count(0)}   with 1: {free.count(1)}   "
      f"with >=2: {sum(1 for f in free if f>=NEED)}\n")

print(f"PATHWAY (B): {WIN} consecutive weeks, {NEED} clinic days every week")
best=None
for s in range(52):
    win=[free[(s+i)%52] for i in range(WIN)]
    short=sum(max(0,NEED-f) for f in win)
    bad=sum(1 for f in win if f<NEED)
    if best is None or short<best[0]: best=(short,bad,s,win)
short,bad,s,win=best
print(f"  best window starts week {s+1} ({(JAN1+dt.timedelta(s*7)).strftime('%d %b')})")
print(f"  weeks that cannot supply {NEED} free weekdays: {bad} of {WIN}")
print(f"  clinic days needing PAID CHILDCARE: {short}")
print(f"  childcare cost: {short} x {HRS}h x ${CARE_HR:.0f} = ${short*HRS*CARE_HR:,.0f}")
days=WIN*NEED
print(f"\n  clinic days in the window: {days}  ({days*HRS:,} hours)")
print(f"  gross at ${RATE:.0f}/h: ${days*HRS*RATE:,.0f}")
print(f"  admin needed to reach 30 h/week: {(30-NEED*HRS)*WIN:,} hours "
      f"({30-NEED*HRS} h/week), unpaid at an hourly rate")
print(f"  net of childcare: ${days*HRS*RATE - short*HRS*CARE_HR:,.0f}")

print(f"\nFOR COMPARISON: 70 days spread over 12 months")
print(f"  {70*HRS:,} hours / 52.18 weeks = {70*HRS/52.1786:.1f} h per week")
print(f"  pathway (A) needs 30 h/week average. This fails by "
      f"{30-70*HRS/52.1786:.1f} h/week.")
print(f"  gross: ${70*HRS*RATE:,.0f}")

# ---- what the 8-month window costs in vacation -------------------------
VAC=[((1,1),(1,13)),((4,1),(4,7)),((5,6),(5,19)),
     ((7,22),(8,11)),((11,18),(12,1)),((12,16),(12,31))]
NAMES=["New Year","Spring break","May","Summer","Thanksgiving","Christmas"]
offwk={}
for (a,b),nm in zip(VAC,NAMES):
    d,e=dt.date(2029,*a),dt.date(2029,*b)
    while d<=e:
        offwk.setdefault((d-JAN1).days//7,set()).add(nm)
        d+=dt.timedelta(1)

print("\nWHAT THE 8-MONTH WINDOW COSTS IN TIME OFF")
print("  Every week in the window needs 30 hours, so no week off inside it.")
rows=[]
for s in range(52):
    wks=[(s+i)%52 for i in range(WIN)]
    short=sum(max(0,NEED-free[w]) for w in wks)
    lost=set()
    for w in wks: lost |= offwk.get(w,set())
    rows.append((short,len(lost),s,sorted(lost)))
for short,nlost,s,lost in sorted(rows)[:4]:
    start=JAN1+dt.timedelta(s*7); end=start+dt.timedelta(WIN*7-1)
    print(f"  {start:%d %b} to {end:%d %b}: {short:>2} childcare days, "
          f"gives up {nlost} of 6 blocks -> {', '.join(lost) if lost else 'none'}")

print("\nPATHWAY (A) ON THE SAME CALENDAR, for scale")
need=round(30*52.1786)
print(f"  average 30 h/week over 52 weeks = {need:,} hours = "
      f"{need/HRS:.0f} twelve-hour days")
print(f"  weekdays Jamie is home all year: {sum(free)}")
print(f"  so {need/HRS:.0f} clinic days needs "
      f"{max(0,round(need/HRS)-sum(free))} days of paid childcare "
      f"and leaves no time off at all")

# ---- the four options side by side -------------------------------------
offdays=set()
for (a,b) in VAC:
    d,e=dt.date(2029,*a),dt.date(2029,*b)
    while d<=e: offdays.add(d); d+=dt.timedelta(1)
free_out=sum(1 for i in range(365)
             if (JAN1+dt.timedelta(i)).weekday()<5 and not busy[i]
             and (JAN1+dt.timedelta(i)) not in offdays)

print("\n" + "="*64)
print("FOUR OPTIONS, 12-hour days at $50/hour")
print("="*64)
print(f"Weekdays Jamie is home: {sum(free)} all year, {free_out} outside his 12 weeks off\n")

def line(name, days, care, weeks_off, admin, qualifies):
    gross=days*HRS*RATE; cc=care*HRS*CARE_HR
    print(f"{name}")
    print(f"   clinic days {days:>3}   gross ${gross:>7,.0f}   "
          f"childcare {care:>2} days (${cc:,.0f})   net ${gross-cc:>7,.0f}")
    print(f"   weeks off {weeks_off:>5}   extra admin {admin:>4} h/yr   PSLF: {qualifies}\n")

line("1. The pitch as described: 70 days spread over the year",
     70, max(0,70-free_out), 12, 0, "NO. 16.1 h/week against a 30 h/week test.")
line("2. Pathway (B): 70 days packed into 35 straight weeks",
     70, 11, 6, 210, "Only on an untested reading of (B). No week may dip.")
need_leave=round((52.1786-12)*30)
d_leave=round(need_leave/HRS)
line("3. Pathway (A) with paid leave credited: 100 days, keep the 12 weeks",
     d_leave, max(0,d_leave-free_out), 12, 0,
     "Yes IF leave counts. That clause is no longer in the regulation.")
d_noleave=round(30*52.1786/HRS)
line("4. Pathway (A) with no leave credit: every hour worked",
     d_noleave, max(0,d_noleave-sum(free)), 0, 0,
     "Yes, cleanly. Nothing to argue about.")
