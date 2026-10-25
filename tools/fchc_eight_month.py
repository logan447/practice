"""8-month contract window: work every weekday Jamie is home, take the
other 4 months off entirely.

(B) needs an average of 30 h/week across the window. The 4 months
outside the window are the time off, so no vacation sits inside it.
Question: does Jamie's schedule supply enough weekdays in the window?
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
WIN=35; W8=WIN; NEED=30*WIN; HRS=12; RATE=50.; CARE=28.

def window(s):
    """weekdays Jamie is home inside a 35-week window starting week s"""
    out=[]
    for i in range(WIN*7):
        j=(s*7+i)%364
        day=JAN1+dt.timedelta(j)
        if day.weekday()<5 and not busy[j]: out.append(day)
    return out

print(f"8-month window = {WIN} weeks. 30 h/week x {WIN} = {NEED:,} hours.")
print(f"At {HRS}-hour days that is {NEED/HRS:.0f} clinic days, "
      f"{NEED/HRS/WIN:.2f} a week.\n")
print(f"{'window':>17} {'off months':>17} {'days':>5} {'hours':>7} "
      f"{'h/wk':>6} {'admin':>7} {'gross':>9}")
rows=[]
for s in range(52):
    d=len(window(s))
    hrs=d*HRS
    admin=max(0, NEED-hrs)
    start=JAN1+dt.timedelta(s*7); end=start+dt.timedelta(WIN*7-1)
    offs=end+dt.timedelta(1); offe=start+dt.timedelta(363)
    rows.append((admin,-d,s,d,hrs,start,end,offs,offe))
for admin,negd,s,d,hrs,start,end,offs,offe in sorted(rows)[:6]:
    print(f"{start:%d %b}-{end:%d %b} {offs:%d %b}-{offe:%d %b} "
          f"{d:>5} {hrs:>7,} {hrs/WIN:>6.1f} {admin:>6,}h ${d*HRS*RATE:>8,.0f}")
