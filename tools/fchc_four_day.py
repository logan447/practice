"""FCHC only. Four clinic days a week, 8 paid hours, $50/hr, $400/day.

Care days counted off the same generated 2029 Jamie schedule the
coverage calendar uses, not estimated from a ratio.
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
CLIN_H, COMMUTE, CARE_HR, FLOOR = 8.0, 2.5, 28.0, 25_000.
AWAY = CLIN_H + COMMUTE

# ---- Jamie's representative year (same generator as the calendar) ----
TYPE = ['med']*52
for i in (3,14,25,36,47):                  TYPE[i]='backup'
for i in (8,21,41):                        TYPE[i]='three'
for i in (1,5,10,16,19,24,29,33,38,44,49): TYPE[i]='two'
for i in (12,27):                          TYPE[i]='light'
TBL={'med':[([5],[0]),([1],[4]),([6],[2]),([3],[0]),([0],[3])],
     'two':[([0,3],[]),([1,4],[]),([2,5],[]),([0,4],[])],
     'three':[([0,2,4],[]),([1,3,5],[])],'light':[([2],[])]}
busy,n=[False]*366,{k:0 for k in TBL}
BACKUP=[]
for w in range(52):
    t=TYPE[w]
    if t=='backup':
        BACKUP.append(w)
        for d in range(7): busy[w*7+d]=True
        continue
    a,b=TBL[t][n[t]%len(TBL[t])]; n[t]+=1
    for d in a:
        busy[w*7+d]=True
        if w*7+d+1<366: busy[w*7+d+1]=True
    for d in b: busy[w*7+d]=True
VAC=[((1,1),(1,13)),((4,1),(4,7)),((5,6),(5,19)),
     ((7,22),(8,11)),((11,18),(12,1)),((12,16),(12,31))]
JAN1=dt.date(2029,1,1)
off=set()
for (m1,d1),(m2,d2) in VAC:
    a,b=dt.date(2029,m1,d1),dt.date(2029,m2,d2)
    while a<=b: off.add(a); a+=dt.timedelta(1)
def sync(bz):
    bz=bz[:]
    for (m1,d1),(m2,d2) in VAC:
        s,e=(dt.date(2029,m1,d1)-JAN1).days,(dt.date(2029,m2,d2)-JAN1).days
        for k in range(s,s+round((e-s+1)*0.7)):
            if 0<=k<366: bz[k]=False
    return bz
def move_backup(bz,k):
    """Move k backup weeks into my off-blocks: clear their busy flags."""
    bz=bz[:]
    for w in BACKUP[:k]:
        for d in range(7): bz[w*7+d]=False
    return bz

def count(weekdays, bz):
    days=[]
    for i in range(365):
        d=JAN1+dt.timedelta(i)
        if d.weekday() in weekdays and d not in off:
            days.append((d,bz[i]))
    return len(days), sum(1 for _,c in days if c)

def car(days):
    mi=110.*days
    return mi/30*3.20 + mi*0.09 + 1_750. + 4_200. + 1_500.
def econ(rate, days, ncare):
    inc=days*CLIN_H*rate
    care=ncare*AWAY*CARE_HR
    tx=(inc*FICA_EMPLOYEE+tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
    other=8_460.-1_200.+10.*days
    return inc, inc-tx-ibr_payment(inc,FPL150_FAM4)-care-car(days)-other \
           + min(care,3_750.)*0.30

base=sync(busy)
print("PSLF at 4 days x 8 paid hours")
print("  4 x 8 = 32 hrs in a working week")
print("  40 working weeks x 32 = 1,280 + 12 leave weeks x 32 = 384")
print("  = 1,664 hrs / 52 = 32.00 hr/wk  ->  PASSES, with 2 hrs of margin")
print("  and the 12 weeks off survive: 160 clinic days / 4 = 40 weeks\n")

print("WHICH 4TH DAY, counted off the 2029 schedule")
for lab,wd in (("T/W/Th + Monday",(0,1,2,3)),("T/W/Th + Friday",(1,2,3,4))):
    d,c=count(wd,base)
    print(f"  {lab:<18} {d} clinic days, {c} need paid care "
          f"({c/d:.0%})   care ${c*AWAY*CARE_HR:,.0f}")
d3,c3=count((1,2,3),base)
print(f"  {'T/W/Th only':<18} {d3} clinic days, {c3} need paid care "
      f"({c3/d3:.0%})   care ${c3*AWAY*CARE_HR:,.0f}")

best=min(((count(w,base),l) for l,w in
          (("Monday",(0,1,2,3)),("Friday",(1,2,3,4)))), key=lambda x:x[0][1])
(DAYS,NCARE),WHICH = best
print(f"\n  cheaper 4th day: {WHICH}  ({DAYS} days, {NCARE} care days)\n")

print(f"THE YEAR, 4 days, $50/hr, {NCARE} care days @ $28")
inc,sv=econ(50.,DAYS,NCARE)
tx=(inc*FICA_EMPLOYEE+tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
    +tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
loan=ibr_payment(inc,FPL150_FAM4)
care=NCARE*AWAY*CARE_HR
for lab,v in [(f"{DAYS} days x $400",inc),("tax + FICA",-tx),("IBR",-loan),
              (f"childcare {NCARE} x ${AWAY*CARE_HR:.0f}",-care),
              (f"car, {110*DAYS:,.0f} mi",-car(DAYS)),
              ("tolls/disability/life/licence/backup/meals",
               -(8_460.-1_200.+10.*DAYS)),
              ("dependent-care FSA back",min(care,3_750.)*0.30)]:
    print(f"  {lab:<44}{v:>10,.0f}")
print(f"  {'SAVED':<44}{sv:>10,.0f}")
print(f"  {'vs the $25,000 floor':<44}{sv-FLOOR:>+10,.0f}")
nd=(inc-tx-loan)/DAYS
print(f"\n  take-home per clinic day  ${nd:,.2f}")
print(f"  childcare on a care day   ${AWAY*CARE_HR:,.2f}")
print(f"  kept on a care day        ${nd-AWAY*CARE_HR:,.2f}")

print("\n4 DAYS, BY RATE AND BY HOW MANY BACKUP WEEKS MOVE")
print(f"{'rate':>7}{'income':>9}" + "".join(
      f"{f'move {k}':>11}" for k in (0,2,4)))
for r in (50.,55.,60.,66.97,70.):
    row=f"{r:>7.2f}{DAYS*CLIN_H*r:>9,.0f}"
    for k in (0,2,4):
        wd=(0,1,2,3) if WHICH=="Monday" else (1,2,3,4)
        dd,cc=count(wd,sync(move_backup(busy,k)))
        s=econ(r,dd,cc)[1]
        row+=f"{s:>10,.0f}"+("*" if s>=FLOOR else " ")
    print(row+("   <= director's rate" if abs(r-66.97)<.01 else ""))

print("\nRATE NEEDED AT 4 DAYS")
for k in (0,2,4):
    wd=(0,1,2,3) if WHICH=="Monday" else (1,2,3,4)
    dd,cc=count(wd,sync(move_backup(busy,k)))
    lo,hi=40.,200.
    for _ in range(80):
        m=(lo+hi)/2
        if econ(m,dd,cc)[1]<FLOOR: lo=m
        else: hi=m
    print(f"  {k} backup weeks moved ({cc} care days): ${hi:>6.2f}/hr  "
          f"income ${dd*CLIN_H*hi:>8,.0f}   ({hi-66.97:+.2f} vs director)")

print("\nTHE CLINIC SIDE AT 4 DAYS, 20 patients/day")
for enc_val in (90.,102.97):
    coll=DAYS*20*enc_val
    cost=DAYS*CLIN_H*50.*1.09
    print(f"  at ${enc_val:.2f}/encounter: {DAYS*20:,} encounters, "
          f"${coll:,.0f} collections")
    print(f"    physician at $50/hr costs ${cost:,.0f} = {cost/coll:.0%} "
          f"of collections")
    for r in (60.,66.97):
        c2=DAYS*CLIN_H*r*1.09
        print(f"    at ${r:.2f}/hr: ${c2:,.0f} = {c2/coll:.0%}")
