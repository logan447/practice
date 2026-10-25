"""Jamie's representative year, built from the owner's description.

Owner, 2026-10-25:
  - usually 1 to 2 24s a week
  - on a one-24 week she usually has a 12 somewhere
  - rarely works weekends, maybe one weekend a month, a 12 or a 24
  - very rarely 3 24s in a week
  - about 2 weeks of backup a year
  - about 2 weeks of regular Monday-to-Friday daytime a year
  - occasionally 12-hour nights

A 24 takes that day and the next (post-call). A 12 takes one day. A
backup week takes all seven. A regular M-F week takes all five
weekdays, because a 9-to-5 cannot cover a 15.5-hour absence.
Day 0 = Monday.
"""
import datetime as dt
from collections import Counter

def build(backup=2, regular=2, three=2, two=16, light=0, verbose=False):
    med = 52 - backup - regular - three - two - light
    types = (['backup']*backup + ['regular']*regular + ['three']*three +
             ['two']*two + ['light']*light + ['med']*med)
    # spread the special weeks through the year instead of clustering
    order=[]; step=len(types)
    idx=sorted(range(52), key=lambda i:((i*7)%52, i))
    for slot,t in zip(idx, types): order.append((slot,t))
    TYPE=[None]*52
    for slot,t in order: TYPE[slot]=t
    # one weekend 24 roughly once a month, the rest on weekdays
    MED=[([0],[3]),([1],[4]),([2],[0]),([3],[1]),([5],[2]),  # Sat 24 1-in-5
         ([0],[2]),([1],[3]),([3],[0]),([2],[4]),([6],[1])]  # Sun 24 1-in-10
    TWO=[([0,3],[]),([1,4],[]),([0,2],[]),([1,3],[]),([2,4],[]),([3,5],[])]
    THREE=[([0,2,4],[]),([1,3,5],[])]
    LIGHT=[([2],[])]
    TBL={'med':MED,'two':TWO,'three':THREE,'light':LIGHT}
    busy=[False]*366; n={k:0 for k in TBL}; s24=s12=wknd=0
    for w in range(52):
        t=TYPE[w]
        if t=='backup':
            for d in range(7): busy[w*7+d]=True
            continue
        if t=='regular':
            for d in range(5): busy[w*7+d]=True
            continue
        a,b=TBL[t][n[t]%len(TBL[t])]; n[t]+=1
        s24+=len(a); s12+=len(b); wknd+=sum(1 for d in a+b if d>=5)
        for d in a:
            busy[w*7+d]=True
            if w*7+d+1<366: busy[w*7+d+1]=True
        for d in b: busy[w*7+d]=True
    if verbose:
        print(f"  weeks: {dict(Counter(TYPE))}")
        print(f"  24s {s24}   12s {s12}   weekend shifts {wknd} "
              f"({wknd/12:.1f} a month)")
    return busy, TYPE

if __name__=='__main__':
    JAN1=dt.date(2029,1,1)
    VAC=[((1,1),(1,13)),((4,1),(4,7)),((5,6),(5,19)),
         ((7,22),(8,11)),((11,18),(12,1)),((12,16),(12,31))]
    print("CORRECTED to the owner's description:\n")
    busy,TYPE=build(verbose=True)
    off=[False]*366
    for (m1,d1),(m2,d2) in VAC:
        s=(dt.date(2029,m1,d1)-JAN1).days; e=(dt.date(2029,m2,d2)-JAN1).days
        for k in range(s,e+1): off[k]=True
        for k in range(s,s+round((e-s+1)*0.7)): busy[k]=False
    opend=[i for i in range(365)
           if (JAN1+dt.timedelta(i)).weekday()<5 and not off[i] and not busy[i]]
    wk=Counter(i//7 for i in opend)
    empt=[w for w in range(52) if wk.get(w,0)==0
          and not any(off[w*7+j] for j in range(7) if w*7+j<365)]
    print(f"\n  open weekdays in the year: {len(opend)}  (model previously 83)")
    print(f"  weeks with at least one open day: {sum(1 for w in range(52) if wk.get(w,0))}")
    print(f"  per-week spread: {dict(sorted(Counter(wk.values()).items()))}")
    print(f"  Jamie-driven empty weeks: {len(empt)}")
