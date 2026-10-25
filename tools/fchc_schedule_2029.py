"""The 2029 schedule, matching the coverage artifact exactly.

Emits a day-by-day classification for the clinic-facing calendar:
  cl  = in clinic
  in  = in town, not in clinic
  off = weekends, my 12 weeks off, and the 5 weeks outside the contract
"""
import datetime as dt, json

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
off=[False]*366
for (m1,d1),(m2,d2) in VAC:
    s=(dt.date(2029,m1,d1)-JAN1).days; e=(dt.date(2029,m2,d2)-JAN1).days
    for k in range(s,e+1): off[k]=True
    for k in range(s, s+round((e-s+1)*0.7)): busy[k]=False   # Jamie syncs leave

BWK, TWK = 12, 8          # birthday week out, its days move to 26 Feb
moved=[q for q in range(5) if not busy[BWK*7+q]]
for q in range(7): busy[BWK*7+q]=True
for q in moved: busy[TWK*7+q]=False

EXCL={12,14,25,36,41}
CONTRACT_WEEKS, HOURS, RATE = 35, 13, 50.

days=[]
for i in range(365):
    d=JAN1+dt.timedelta(i); w=i//7
    if d.weekday()>=5:                       t='off'
    elif off[i] or w in EXCL:                t='off'
    elif not busy[i]:                        t='cl'
    else:                                    t='in'
    days.append([d.isoformat(),t])
nc=sum(1 for _,t in days if t=='cl')
if __name__=='__main__':
    json.dump({'days':days},open('/tmp/claude-0/-home-user-practice/'
        'cb0efbd4-86a9-5914-b87a-ee6040c6100c/scratchpad/appx.json','w'))
    print(f"clinic days {nc}  hours {nc*HOURS:,}  "
          f"{nc*HOURS/CONTRACT_WEEKS:.2f} h/week over {CONTRACT_WEEKS} weeks  "
          f"pay ${nc*HOURS*RATE:,.0f}")
    from collections import Counter; print(Counter(t for _,t in days))
