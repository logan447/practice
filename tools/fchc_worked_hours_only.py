"""1,560 WORKED hours. No leave counted. FCHC only, $50/hr clocked.

Once PSLF fixes the hours, income is fixed too: 1,560 x $50 = $78,000
whatever shape the week takes. The only thing that moves is childcare
and the car -- and both get CHEAPER with longer days, because the
2.5-hour round-trip commute is amortised over fewer trips.
"""
import datetime as dt, sys
sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS=3
COMMUTE, CARE_HR, FLOOR, RATE = 2.5, 28.0, 25_000., 50.0

TYPE=['med']*52
for i in (3,14,25,36,47):                  TYPE[i]='backup'
for i in (8,21,41):                        TYPE[i]='three'
for i in (1,5,10,16,19,24,29,33,38,44,49): TYPE[i]='two'
for i in (12,27):                          TYPE[i]='light'
TBL={'med':[([5],[0]),([1],[4]),([6],[2]),([3],[0]),([0],[3])],
     'two':[([0,3],[]),([1,4],[]),([2,5],[]),([0,4],[])],
     'three':[([0,2,4],[]),([1,3,5],[])],'light':[([2],[])]}
busy,n=[False]*366,{k:0 for k in TBL}; BACKUP=[]
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
JAN1=dt.date(2029,1,1); off=set()
for (m1,d1),(m2,d2) in VAC:
    a,b=dt.date(2029,m1,d1),dt.date(2029,m2,d2)
    while a<=b: off.add(a); a+=dt.timedelta(1)
def prep(k):
    bz=busy[:]
    for w in BACKUP[:k]:
        for d in range(7): bz[w*7+d]=False
    for (m1,d1),(m2,d2) in VAC:
        s,e=(dt.date(2029,m1,d1)-JAN1).days,(dt.date(2029,m2,d2)-JAN1).days
        for j in range(s,s+round((e-s+1)*0.7)):
            if 0<=j<366: bz[j]=False
    return bz
def count(wd,bz):
    ds=[(JAN1+dt.timedelta(i)) for i in range(365)
        if (JAN1+dt.timedelta(i)).weekday() in wd
        and (JAN1+dt.timedelta(i)) not in off]
    return len(ds), sum(1 for d in ds if bz[(d-JAN1).days])
def car(days):
    mi=110.*days
    return mi/30*3.20+mi*0.09+1_750.+4_200.+1_500.
def econ(hrs_day, days, ncare, care_hr=CARE_HR, rate=RATE):
    inc=days*hrs_day*rate
    care=ncare*(hrs_day+COMMUTE)*care_hr
    tx=(inc*FICA_EMPLOYEE+tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
        +tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
    other=8_460.-1_200.+10.*days
    return inc, care, inc-tx-ibr_payment(inc,FPL150_FAM4)-care-car(days)-other \
           + min(care,3_750.)*0.30

print("WHAT REACHES 30 hrs/wk ON WORKED HOURS ALONE\n")
print(f"{'days/wk':>8}{'hrs/day':>8}{'wks worked':>11}{'WKS OFF':>9}"
      f"{'clinic days':>12}{'worked hrs':>11}{'avg/wk':>8}{'away':>7}")
SHAPES=[((1,2,3),3,10),((1,2,3),3,13),((0,1,2,3),4,10),((0,1,2,3),4,9),
        ((0,1,2,3,4),5,8),((0,1,2,3,4),5,10)]
for wd,dpw,h in SHAPES:
    d,_=count(wd,prep(0))
    hrs=d*h; avg=hrs/52
    print(f"{dpw:>8}{h:>8}{d/dpw:>11.0f}{52-d/dpw:>9.0f}{d:>12}"
          f"{hrs:>11,}{avg:>8.2f}{h+COMMUTE:>7.1f}"
          + ("  PASS" if avg>=30 else "  fail"))

print("\n  3 days cannot reach 30 at 10 hrs (23.1). It needs 13-hour days.")
print("  4 days x 10 hrs = 30.77 with the 12 weeks off intact. PASS.\n")

print("THE COUNTERINTUITIVE PART: longer days make childcare CHEAPER")
print("  care = (care days) x (hrs away) x rate, and the 2.5-hr commute")
print("  is paid once per trip, so fewer-longer days means fewer trips.\n")
print(f"{'shape':>14}{'days':>6}{'care days':>11}{'away':>7}"
      f"{'care/day':>10}{'care/yr':>10}{'car':>9}")
for wd,dpw,h in SHAPES:
    d,c=count(wd,prep(0))
    if d*h/52 < 30: continue
    print(f"{f'{dpw} x {h}h':>14}{d:>6}{c:>11}{h+COMMUTE:>7.1f}"
          f"{(h+COMMUTE)*CARE_HR:>10,.0f}{c*(h+COMMUTE)*CARE_HR:>10,.0f}"
          f"{car(d):>9,.0f}")

print("\n\nSAVED AT $50/hr, worked hours only  (* clears $25,000)")
print(f"{'shape':>14}{'income':>9}" + "".join(f"{f'move {k}':>11}" for k in (0,2,4)))
for wd,dpw,h in SHAPES:
    d0,_=count(wd,prep(0))
    if d0*h/52 < 30: continue
    row=f"{f'{dpw} x {h}h':>14}{d0*h*RATE:>9,.0f}"
    for k in (0,2,4):
        d,c=count(wd,prep(k))
        s=econ(h,d,c)[2]
        row+=f"{s:>10,.0f}"+("*" if s>=FLOOR else " ")
    print(row)

print("\n\nTHE 4 x 10 YEAR IN FULL, 12 weeks off, 4 backup weeks moved")
wd=(0,1,2,3); d,c=count(wd,prep(4))
inc,care,sv=econ(10.,d,c)
tx=(inc*FICA_EMPLOYEE+tiered(max(inc-STD_DED_MFS,0),FED_MFS_BRACKETS)
    +tiered(max(inc-STD_DED_MFS,0),DC_BRACKETS))
loan=ibr_payment(inc,FPL150_FAM4)
print(f"  worked hours {d} days x 10 = {d*10:,} -> {d*10/52:.2f} hr/wk, "
      f"no leave needed")
for lab,v in [(f"{d} days x 10 hrs x $50",inc),("tax + FICA",-tx),
              ("IBR",-loan),(f"childcare {c} x ${12.5*CARE_HR:.0f}",-care),
              (f"car, {110*d:,.0f} mi",-car(d)),
              ("tolls/disability/life/licence/backup/meals",
               -(8_460.-1_200.+10.*d)),
              ("FSA back",min(care,3_750.)*0.30)]:
    print(f"  {lab:<44}{v:>10,.0f}")
print(f"  {'SAVED':<44}{sv:>10,.0f}")
print(f"  {'vs the $25,000 floor':<44}{sv-FLOOR:>+10,.0f}")
nd=(inc-tx-loan)/d
print(f"\n  take-home/clinic day ${nd:,.0f}   care ${12.5*CARE_HR:,.0f}   "
      f"kept on a care day ${nd-12.5*CARE_HR:,.0f}")

print("\nRATE NEEDED, 4 x 10, by backup weeks moved and care rate")
print(f"{'care $/hr':>10}{'move 0':>10}{'move 2':>10}{'move 4':>10}")
for ch in (28.,26.,24.):
    row=f"{ch:>10.0f}"
    for k in (0,2,4):
        d,c=count(wd,prep(k))
        lo,hi=40.,200.
        for _ in range(80):
            m=(lo+hi)/2
            if econ(10.,d,c,ch,m)[2]<FLOOR: lo=m
            else: hi=m
        row+=f"{hi:>10.2f}"
    print(row)
print("  (director's implied rate is $66.97/hr)")
