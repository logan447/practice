"""Strictly 30.0 paid hours per week at FCHC, $50/hr, 2029.

Same T/W/Th calendar and same Jamie schedule as the coverage artifact.
Everything here is built from the 30-hour contract, not solved
backwards from the savings target.
"""
import datetime as dt, sys
sys.path.insert(0, "tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3

RATE, HRS_WK  = 50.0, 30.0        # OWNER-FACT rate; the fixed ask
CLIN_H        = 8.0              # OWNER-FACT clinic hrs per working day
COMMUTE_H     = 2.5
CARE_HR       = 34.0             # EST loaded rate, NEEDS real quotes
CARE_DAY      = CLIN_H + COMMUTE_H
SALARY        = RATE * HRS_WK * 52
CAR_FULL      = 10_046.
FLOOR         = 25_000.

# ---- Jamie's representative year (same generator as the calendar) ----
TYPE = ['med']*52
for i in (3,14,25,36,47):                  TYPE[i] = 'backup'
for i in (8,21,41):                        TYPE[i] = 'three'
for i in (1,5,10,16,19,24,29,33,38,44,49): TYPE[i] = 'two'
for i in (12,27):                          TYPE[i] = 'light'
TBL = {'med':[([5],[0]),([1],[4]),([6],[2]),([3],[0]),([0],[3])],
       'two':[([0,3],[]),([1,4],[]),([2,5],[]),([0,4],[])],
       'three':[([0,2,4],[]),([1,3,5],[])], 'light':[([2],[])]}
busy, n = [False]*366, {k:0 for k in TBL}
BACKUP_WEEKS = []
for w in range(52):
    t = TYPE[w]
    if t == 'backup':
        BACKUP_WEEKS.append(w)
        for d in range(7): busy[w*7+d] = True
        continue
    a, b = TBL[t][n[t] % len(TBL[t])]; n[t] += 1
    for d in a:
        busy[w*7+d] = True
        if w*7+d+1 < 366: busy[w*7+d+1] = True
    for d in b: busy[w*7+d] = True

VAC = [((1,1),(1,13)), ((4,1),(4,7)), ((5,6),(5,19)),
       ((7,22),(8,11)), ((11,18),(12,1)), ((12,16),(12,31))]
JAN1 = dt.date(2029,1,1)
def doy(d): return (d-JAN1).days
off = set()
for (m1,d1),(m2,d2) in VAC:
    a,b = dt.date(2029,m1,d1), dt.date(2029,m2,d2)
    while a <= b: off.add(a); a += dt.timedelta(1)
for (m1,d1),(m2,d2) in VAC:            # 70% leave sync
    s,e = doy(dt.date(2029,m1,d1)), doy(dt.date(2029,m2,d2))
    for k in range(s, s+round((e-s+1)*0.7)):
        if 0 <= k < 366: busy[k] = False

days = [(JAN1+dt.timedelta(i), busy[i]) for i in range(365)
        if (JAN1+dt.timedelta(i)).weekday() in (1,2,3)
        and (JAN1+dt.timedelta(i)) not in off]
N      = len(days)
NCARE  = sum(1 for _,c in days if c)
WORKWK = N/3

def net_of(sal):
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    return tx, ibr_payment(sal, FPL150_FAM4)

print(f"STRICTLY 30.0 PAID HOURS PER WEEK  --  ${RATE:.0f}/hr, 2029\n")
print("HOW 30.0 IS BUILT")
print(f"  clinic                {N} days x {CLIN_H:.0f} hrs"
      f"            = {N*CLIN_H:>6,.0f} hrs")
adm_wk = HRS_WK - 3*CLIN_H
print(f"  admin, working weeks  {WORKWK:.0f} wks x {adm_wk:.0f} hrs"
      f"             = {WORKWK*adm_wk:>6,.0f} hrs")
leave_h = 12*HRS_WK
print(f"  paid leave            12 wks x {HRS_WK:.0f} hrs"
      f"            = {leave_h:>6,.0f} hrs")
tot_h = N*CLIN_H + WORKWK*adm_wk + leave_h
print(f"  {'':<22}{'TOTAL PAID':<22}  {tot_h:>6,.0f} hrs")
print(f"  {tot_h:,.0f} / 52 weeks = {tot_h/52:.2f} hrs/week   "
      f"-> qualifies at exactly 30.00")
print(f"  salary {HRS_WK:.0f} x 52 x ${RATE:.0f} = ${SALARY:,.0f}\n")

tx, loan = net_of(SALARY)
care_yr  = NCARE*CARE_DAY*CARE_HR
fsa      = min(care_yr, 3_750.)*0.30
saved    = SALARY - tx - loan - care_yr - CAR_FULL + fsa
print("THE YEAR")
for lab, v in [("gross salary", SALARY), ("federal + DC tax + FICA", -tx),
               ("student loan, IBR", -loan),
               (f"childcare, {NCARE} days x ${CARE_DAY*CARE_HR:.0f}", -care_yr),
               ("second car, all in", -CAR_FULL),
               ("dependent-care FSA back", fsa)]:
    print(f"  {lab:<34}{v:>12,.0f}")
print(f"  {'SAVED':<34}{saved:>12,.0f}")
print(f"  {'against the $25,000 floor':<34}{saved-FLOOR:>+12,.0f}\n")

print("PER CLINIC DAY")
nd = (SALARY - tx - loan)/N
print(f"  gross to FCHC                 ${SALARY/N:>8,.2f}"
      f"   (${SALARY*1.09/N:,.0f} fully loaded)")
print(f"  take-home                     ${nd:>8,.2f}")
print(f"  childcare on a care day       ${CARE_DAY*CARE_HR:>8,.2f}")
print(f"  kept on a care day            ${nd-CARE_DAY*CARE_HR:>8,.2f}"
      f"   ({NCARE} days)")
print(f"  kept on a Jamie-home day      ${nd:>8,.2f}   ({N-NCARE} days)\n")

MON=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
print(f"{'month':>6}{'clinic':>8}{'care':>6}{'gross':>9}{'care $':>9}"
      f"{'net pay':>9}{'KEPT':>9}")
T=[0,0,0.,0.,0.,0.]
for m in range(1,13):
    dd=[(d,c) for d,c in days if d.month==m]
    if not dd: continue
    k,kc=len(dd),sum(1 for _,c in dd if c)
    g,cc,np_=k*SALARY/N, kc*CARE_DAY*CARE_HR, k*nd
    print(f"{MON[m]:>6}{k:>8}{kc:>6}{g:>9,.0f}{cc:>9,.0f}{np_:>9,.0f}{np_-cc:>9,.0f}")
    for j,v in zip(range(6),(k,kc,g,cc,np_,np_-cc)): T[j]+=v
print(f"{'YEAR':>6}{T[0]:>8.0f}{T[1]:>6.0f}{T[2]:>9,.0f}{T[3]:>9,.0f}"
      f"{T[4]:>9,.0f}{T[5]:>9,.0f}")

print(f"\n\nCLOSING THE ${FLOOR-saved:,.0f} GAP WITHOUT TOUCHING THE 30 HOURS\n")
cd = CARE_DAY*CARE_HR
need = (FLOOR-saved)/cd
print(f"  care days that must go away: {need:.1f}  "
      f"(${cd:.0f} each, {NCARE} today)\n")
print(f"  Jamie's 5 backup weeks hold these clinic days:")
tot_bu = 0
for w in BACKUP_WEEKS:
    ds=[d for d,_ in days if 0 <= doy(d)-w*7 < 7]
    if ds:
        tot_bu += len(ds)
        print(f"    week {w:>2}: " + ", ".join(d.strftime('%b %-d') for d in ds)
              + f"   ${len(ds)*cd:,.0f}")
print(f"    {tot_bu} days, ${tot_bu*cd:,.0f} -- all known a year ahead\n")
for k in (1,2,3):
    moved = min(3*k, tot_bu)
    print(f"  move {k} backup week(s) into my off-blocks: "
          f"-{moved} care days, saved ${saved+moved*cd:,.0f}"
          f"  ({saved+moved*cd-FLOOR:+,.0f})")
print()
for r in (34,32,30,28):
    s2 = SALARY - tx - loan - NCARE*CARE_DAY*r - CAR_FULL \
         + min(NCARE*CARE_DAY*r,3_750.)*0.30
    print(f"  sitter at ${r}/hr instead of $34: saved ${s2:,.0f}"
          f"  ({s2-FLOOR:+,.0f})")

print("\n\nWHAT EXACTLY 30.00 EXPOSES YOU TO")
print("  Salaried, it is robust to a cancelled clinic: pay does not")
print("  drop, and the form asks what you were PAID for.")
print("  It is NOT robust to any of these, each of which drops you")
print("  below 30 and voids the year:")
print("    - one unpaid week off                 -> 29.4 hrs/wk")
print(f"    - FCHC certifying from timesheets")
print(f"      instead of the contract            -> {(N*CLIN_H+WORKWK*adm_wk)/52:.1f} hrs/wk")
print("    - any month at reduced pay")
print("  Protection: the contract states '30 hours per week' as a")
print("  number, and no unpaid leave is ever taken.")
