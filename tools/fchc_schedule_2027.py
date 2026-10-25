"""The 2027 schedule: the same contract, with the day picks reversed.

In 2029, with kids, clinic days go where Jamie is home, so somebody is
already doing childcare. In 2027 there are no kids, so the preference
flips: clinic days go where Jamie is already working, so their off time
lines up and one car covers both of them.

Two preferences, in order (owner, 2026-10-25):
  1. go in on days Jamie is already working, so their off time lines up
  2. keep one car enough, so a clinic day should not be a day she drives
     in and keeps the car overnight

Her 24s break rule 2: she drives in in the morning and is not back until
the next day. So a clinic day prefers her post-call day or a 12, which
are days she is working AND the car is home. Where a week cannot give
two of those, the pick falls back to her 24 days, then to days she is
off. ASSUMPTION, owner to confirm: that riding in together is even
possible, which needs her hospital and the clinic to be a shared trip.

The contract shape does not change. 35 Service Weeks, two clinic days a
week, 15 clocked hours a day. Only which weekdays get used changes.
"""
import datetime as dt, json, importlib.util
from collections import Counter

spec=importlib.util.spec_from_file_location("js","tools/jamie_schedule.py")
js=importlib.util.module_from_spec(spec); spec.loader.exec_module(js)

MON0=dt.date(2027,1,4)                   # first Monday of 2027
YR0=dt.date(2027,1,1); YR1=dt.date(2027,12,31)
NDAYS=(YR1-YR0).days+1                   # 365

# Time off, same anchors as the 2029 plan, on 2027's weeks.
VAC=[((1,1),(1,17)),      # New Year's
     ((3,27),(4,4)),      # Logan birthday / spring break
     ((5,8),(5,23)),      # Belize
     ((7,24),(8,15)),     # summer break
     ((11,20),(12,5)),    # Thanksgiving
     ((12,18),(12,31))]   # Christmas
# Whole weeks outside the contract (Monday dates).
OFFC=[(2,8),(4,5),(6,28),(10,4),(10,11)]

busy,TYPE=js.build()
isbusy, state = {}, {}
for i,b in enumerate(busy):
    d=MON0+dt.timedelta(i)
    isbusy[d]=b; state[d]=js.STATE.get(i)

off=set()
for (m1,d1),(m2,d2) in VAC:
    a=dt.date(2027,m1,d1); b=dt.date(2027,m2,d2)
    k=a
    while k<=b: off.add(k); k+=dt.timedelta(1)
offc=set()
for m,d in OFFC:
    a=dt.date(2027,m,d)
    for j in range(7): offc.add(a+dt.timedelta(j))

def week_mon(d):
    return d-dt.timedelta(d.weekday())

clinic=set()
wk={}
d=YR0
while d<=YR1:
    if d.weekday()<5 and d not in off and d not in offc:
        wk.setdefault(week_mon(d),[]).append(d)
    d+=dt.timedelta(1)

for mon,cand in sorted(wk.items()):
    # prefer days Jamie is already working; fall back to any open weekday
    good=[x for x in cand if state.get(x) not in (None,'start24')]
    ok  =[x for x in cand if state.get(x)=='start24']
    rest=[x for x in cand if state.get(x) is None]
    pool=good if len(good)>=2 else (good+ok if len(good+ok)>=2 else good+ok+rest)
    # among the available days, take the pair that sits furthest apart, so
    # the two 15-hour days are not back to back
    pick=max(((a,b) for i,a in enumerate(pool) for b in pool[i+1:]),
             key=lambda ab:(ab[1]-ab[0]).days, default=None)
    pick=list(pick) if pick else pool[:2]
    if len(pick)<2:                      # a stub week carries no clinic day
        continue
    clinic.update(pick)

SERVICE=sorted({week_mon(x) for x in clinic})
WEEKS=len(SERVICE); DAYS=len(clinic)
HOURS=round(30*WEEKS/DAYS,2)
RATE=40.

days=[]
d=YR0
while d<=YR1:
    if   d in clinic:                     t='cl'
    elif d.weekday()>=5:                  t='off'
    elif d in off or d in offc:           t='off'
    elif week_mon(d) in SERVICE:          t='in'
    else:                                 t='off'
    days.append([d.isoformat(),t]); d+=dt.timedelta(1)

if __name__=='__main__':
    json.dump({'days':days},open('/tmp/claude-0/-home-user-practice/'
        'cb0efbd4-86a9-5914-b87a-ee6040c6100c/scratchpad/appx27.json','w'))
    print(f"clinic days      {DAYS}")
    print(f"Service Period   {WEEKS} weeks = {WEEKS/52.1786*12:.2f} months")
    print(f"clocked h/day    {HOURS} to average 30 h/week")
    print(f"total hours      {DAYS*HOURS:,.0f}   pay ${DAYS*HOURS*RATE:,.0f}")
    per=Counter(week_mon(x) for x in clinic)
    print(f"days per week    {dict(sorted(Counter(per.values()).items()))}")
    jw=sum(1 for x in clinic if isbusy.get(x))
    print(f"on Jamie's working days  {jw} of {DAYS}  ({jw/DAYS:.0%})")
    car=sum(1 for x in clinic if state.get(x)=='start24')
    print(f"car away overnight       {car} of {DAYS}")
    print("  "+str(dict(Counter(state.get(x) or 'off' for x in clinic))))
    print(Counter(t for _,t in days))
