"""Jamie's representative year, SMOOTHED to two free weekdays a week.

Owner's description (2026-10-25):
  - usually 1 to 2 24s a week; on a one-24 week, usually a 12 as well
  - a 24 lands on a Saturday or Sunday only a few times a year
  - very rarely 3 24s in a week
  - about 2 weeks of backup a year
  - about 2 weeks of regular Monday-to-Friday daytime a year

A 24 takes that day and the next (post-call). A 12 takes one day.
Backup and regular weeks take every weekday.

This version DESIGNS each working week to leave exactly two free
weekdays, rather than letting a rotation produce 1-day and 4-day
weeks. That is a request of her rota, not a prediction of it.

  med : 24 on Mon-Thu (2 weekdays) + 12 on another weekday = 3 used
  two : 24 on Mon (Mon+Tue) + 24 on Fri (Fri+Sat)          = 3 used

Both leave two. Day 0 = Monday.
"""
import datetime as dt
from collections import Counter

# (24-hour shift days, 12-hour shift days) -> exactly 2 free weekdays
MED = [([0],[3]), ([1],[4]), ([2],[0]), ([3],[1]), ([0],[2]),
       ([1],[3]), ([2],[4]), ([3],[0]), ([1],[4]), ([2],[0])]
TWO = [([0,4],[]), ([1,4],[]), ([2,4],[]), ([1,4],[]), ([0,4],[]), ([2,4],[])]

def build(backup=1, regular=1, two=16, empty_weeks=(6,39), verbose=False):
    """empty_weeks: the weeks with no coverage at all (backup / regular)."""
    TYPE=[None]*52
    for i,w in enumerate(empty_weeks):
        TYPE[w] = 'backup' if i < backup else 'regular'
    free = [w for w in range(52) if TYPE[w] is None]
    for i,w in enumerate(free):
        TYPE[w] = 'two' if (i % (len(free)//two or 1) == 0 and
                            sum(1 for t in TYPE if t=='two') < two) else 'med'
    busy=[False]*366; n={'med':0,'two':0}; s24=s12=wknd=0
    for w in range(52):
        t=TYPE[w]
        if t in ('backup','regular'):
            for d in range(7 if t=='backup' else 5): busy[w*7+d]=True
            continue
        tbl = MED if t=='med' else TWO
        a,b = tbl[n[t] % len(tbl)]; n[t]+=1
        s24+=len(a); s12+=len(b); wknd+=sum(1 for d in a+b if d>=5)
        for d in a:
            busy[w*7+d]=True
            if w*7+d+1 < 366: busy[w*7+d+1]=True
        for d in b: busy[w*7+d]=True
    if verbose:
        print(f"  weeks: {dict(Counter(TYPE))}")
        print(f"  24s {s24}   12s {s12}   weekend shifts {wknd}")
    return busy, TYPE

if __name__=='__main__':
    JAN1=dt.date(2029,1,1)
    VAC=[((1,1),(1,13)),((4,1),(4,7)),((5,6),(5,19)),
         ((7,22),(8,11)),((11,18),(12,1)),((12,16),(12,31))]
    busy,TYPE=build(verbose=True)
    off=[False]*366
    for (m1,d1),(m2,d2) in VAC:
        s=(dt.date(2029,m1,d1)-JAN1).days; e=(dt.date(2029,m2,d2)-JAN1).days
        for k in range(s,e+1): off[k]=True
        for k in range(s,s+round((e-s+1)*0.7)): busy[k]=False
    opend=[i for i in range(365)
           if (JAN1+dt.timedelta(i)).weekday()<5 and not off[i] and not busy[i]]
    wk=Counter(i//7 for i in opend)
    print(f"\n  open weekdays: {len(opend)}   weeks with days: {len(wk)}")
    print(f"  per-week spread: {dict(sorted(Counter(wk.values()).items()))}")
    for w in sorted(wk):
        if wk[w]!=2:
            print(f"    week w/c {JAN1+dt.timedelta(w*7):%-d %b}: {wk[w]} day(s)")
