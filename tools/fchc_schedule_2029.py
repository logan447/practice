"""The 2029 schedule, from the corrected model of Jamie's year.

Jamie's assumptions live in tools/jamie_schedule.py and come from the
owner's own description. The Service Period is the set of weeks in
which clinic days actually fall, so it is not chosen, it is counted.
"""
import datetime as dt, json, importlib.util
from collections import Counter

spec=importlib.util.spec_from_file_location("js","tools/jamie_schedule.py")
js=importlib.util.module_from_spec(spec); spec.loader.exec_module(js)

JAN1=dt.date(2029,1,1)
VAC=[((1,1),(1,13)),((4,1),(4,7)),((5,6),(5,19)),
     ((7,22),(8,11)),((11,18),(12,1)),((12,16),(12,31))]
busy,TYPE=js.build()
off=[False]*366
for (m1,d1),(m2,d2) in VAC:
    s=(dt.date(2029,m1,d1)-JAN1).days; e=(dt.date(2029,m2,d2)-JAN1).days
    for k in range(s,e+1): off[k]=True
    for k in range(s,s+round((e-s+1)*0.7)): busy[k]=False

clinic=[i for i in range(365)
        if (JAN1+dt.timedelta(i)).weekday()<5 and not off[i] and not busy[i]]
wkc=Counter(i//7 for i in clinic)
SERVICE=sorted(wkc)                      # weeks with at least one clinic day
WEEKS=len(SERVICE); DAYS=len(clinic)
HOURS=round(30*WEEKS/DAYS, 2)            # clocked hours needed to average 30
RATE=50.

days=[]
for i in range(365):
    d=JAN1+dt.timedelta(i)
    if   i in clinic:      t='cl'
    elif d.weekday()>=5:   t='off'
    elif off[i]:           t='off'
    elif i//7 in SERVICE:  t='in'        # in town, Jamie on shift
    else:                  t='off'       # week outside the Service Period
    days.append([d.isoformat(),t])

if __name__=='__main__':
    json.dump({'days':days},open('/tmp/claude-0/-home-user-practice/'
        'cb0efbd4-86a9-5914-b87a-ee6040c6100c/scratchpad/appx.json','w'))
    print(f"clinic days      {DAYS}")
    print(f"Service Period   {WEEKS} weeks = {WEEKS/52.1786*12:.2f} months")
    print(f"clocked h/day    {HOURS} to average 30 h/week")
    print(f"total hours      {DAYS*HOURS:,.0f}   pay ${DAYS*HOURS*RATE:,.0f}")
    print(f"days per week    {dict(sorted(Counter(wkc.values()).items()))}")
    print(f"avg days/week    {DAYS/WEEKS:.2f}")
    print(Counter(t for _,t in days))
