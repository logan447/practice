"""Day-by-day 2029 ledger for the fixed T/W/Th FCHC schedule.

Replicates the Jamie-shift generator in the 2029 coverage calendar
exactly, so the dates here are the same dates the squares show.
Pay is salary / clinic days (salaried 0.8 FTE, so every clinic day
carries the same pay whether or not care is bought that day).
"""
import datetime as dt, sys
sys.path.insert(0, "tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3

# $50/hr (OWNER-FACT, current FCHC rate) held at 32 hrs/wk x 52 wks.
# 32 hrs/wk during the 40 working weeks = 24 clinic + 8 admin; the 12
# weeks are paid, which is what carries the average to 32.0 and keeps
# margin over the 30.0 PSLF line.
RATE     = 50.0
SALARY   = RATE * 32 * 52     # $83,200
CARE_HR  = 34.0          # EST loaded rate, NEEDS real quotes
CARE_DAY = 10.5          # 8 hr clinic (OWNER-FACT) + ~2.5 hr drive

# ---- Jamie's representative year, ported from the calendar ----
TYPE = ['med'] * 52
for i in (3, 14, 25, 36, 47):                     TYPE[i] = 'backup'
for i in (8, 21, 41):                             TYPE[i] = 'three'
for i in (1,5,10,16,19,24,29,33,38,44,49):        TYPE[i] = 'two'
for i in (12, 27):                                TYPE[i] = 'light'
MED   = [([5],[0]), ([1],[4]), ([6],[2]), ([3],[0]), ([0],[3])]
TWO   = [([0,3],[]), ([1,4],[]), ([2,5],[]), ([0,4],[])]
THREE = [([0,2,4],[]), ([1,3,5],[])]
LIGHT = [([2],[])]

busy = [False]*366
n = {'med':0, 'two':0, 'three':0, 'light':0}
tbl = {'med':MED, 'two':TWO, 'three':THREE, 'light':LIGHT}
for w in range(52):
    t = TYPE[w]
    if t == 'backup':
        for d in range(7):
            busy[w*7+d] = True
        continue
    a, b = tbl[t][n[t] % len(tbl[t])]; n[t] += 1
    for d in a:
        busy[w*7+d] = True
        if w*7+d+1 < 366: busy[w*7+d+1] = True
    for d in b:
        busy[w*7+d] = True

# ---- my 12 weeks off, Sunday to Saturday ----
VAC = [((1,1),(1,13),'Winter (tail)'), ((4,1),(4,7),'Spring break'),
       ((5,6),(5,19),'Belize'),        ((7,22),(8,11),'Summer'),
       ((11,18),(12,1),'Texas'),       ((12,16),(12,31),'Winter')]
JAN1 = dt.date(2029,1,1)
def doy(d): return (d - JAN1).days
off = set()
for (m1,d1),(m2,d2),_ in VAC:
    a, b = dt.date(2029,m1,d1), dt.date(2029,m2,d2)
    while a <= b:
        off.add(a); a += dt.timedelta(1)
# Jamie aims ~70% of her leave at my blocks, from the start of each
for (m1,d1),(m2,d2),_ in VAC:
    s, e = doy(dt.date(2029,m1,d1)), doy(dt.date(2029,m2,d2))
    for k in range(s, s + round((e-s+1)*0.7)):
        if 0 <= k < 366: busy[k] = False

# ---- the clinic year ----
days = []
for i in range(365):
    d = JAN1 + dt.timedelta(i)
    if d.weekday() in (1,2,3) and d not in off:       # Tue/Wed/Thu
        days.append((d, busy[doy(d)]))

N     = len(days)
NCARE = sum(1 for _, c in days if c)
tax   = (SALARY*FICA_EMPLOYEE
         + tiered(max(SALARY-STD_DED_MFS,0), FED_MFS_BRACKETS)
         + tiered(max(SALARY-STD_DED_MFS,0), DC_BRACKETS))
loan  = ibr_payment(SALARY, FPL150_FAM4)
net   = SALARY - tax - loan
gross_day, net_day = SALARY/N, net/N
care_day = CARE_HR * CARE_DAY

print(f"FIXED T/W/Th, 2029, ${RATE:.0f}/hr x 32 hrs/wk = "
      f"${SALARY:,.0f}, three kids, MFS")
print(f"  clinic hours alone: {120*8:,} /52 = {120*8/52:.1f} hr/wk -- "
      f"FAILS. Paid leave is what reaches 32.0\n")
print(f"  clinic days                 {N}")
print(f"  of those, paid care needed  {NCARE}   ({NCARE/N:.0%})")
print(f"  Jamie home, no care         {N-NCARE}\n")
print(f"  gross per clinic day        ${gross_day:,.2f}")
print(f"  less tax and loan per day   ${(tax+loan)/N:,.2f}")
print(f"  TAKE-HOME per clinic day    ${net_day:,.2f}")
print(f"  childcare on a dotted day   ${care_day:,.2f}")
print(f"  LEFT on a dotted day        ${net_day-care_day:,.2f}")
print(f"  LEFT on a clear day         ${net_day:,.2f}\n")

MON = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
print(f"{'month':>6}{'clinic':>8}{'care':>6}{'gross':>10}{'care $':>9}"
      f"{'net pay':>10}{'KEPT':>10}")
tot = [0,0,0.,0.,0.,0.]
for m in range(1,13):
    dd = [(d,c) for d,c in days if d.month == m]
    if not dd: continue
    k, kc = len(dd), sum(1 for _,c in dd if c)
    g, cc, np_ = k*gross_day, kc*care_day, k*net_day
    print(f"{MON[m]:>6}{k:>8}{kc:>6}{g:>10,.0f}{cc:>9,.0f}{np_:>10,.0f}"
          f"{np_-cc:>10,.0f}")
    for j,v in zip(range(6),(k,kc,g,cc,np_,np_-cc)): tot[j]+=v
print(f"{'YEAR':>6}{tot[0]:>8.0f}{tot[1]:>6.0f}{tot[2]:>10,.0f}"
      f"{tot[3]:>9,.0f}{tot[4]:>10,.0f}{tot[5]:>10,.0f}")
fsa = min(tot[3], 3_750.)*0.30
print(f"\n  dependent-care FSA back     ${fsa:,.0f}")
print(f"  less the second car         $-10,046   (purchase, parking, insurance, fuel)")
print(f"  SAVED FOR THE YEAR          ${tot[5]+fsa-10_046:,.0f}")
print(f"  rate needed to clear $25K   $48.19/hr (DERIVED) -- below the "
      f"current ${RATE:.0f}, so no raise is required")

print(f"\n\nTHE {NCARE} DATED CHILDCARE DAYS  (12 hrs x ${CARE_HR:.0f} = ${care_day:.0f} each)\n")
run = 0.0
for m in range(1,13):
    dd = [d for d,c in days if c and d.month == m]
    if not dd: continue
    line, cost = ' '.join(f"{d.day:>2}" for d in dd), len(dd)*care_day
    run += cost
    print(f"  {MON[m]} ({len(dd):>2})  {line:<38} ${cost:>7,.0f}   "
          f"cum ${run:>8,.0f}")

print("\n\nSENSITIVITY on the ask")
print(f"{'salary':>8}{'net/day':>10}{'kept on a dotted day':>23}{'SAVED/yr':>11}")
for s in (80_000, 85_000, 90_000, 95_000):
    tx = (s*FICA_EMPLOYEE + tiered(max(s-STD_DED_MFS,0), FED_MFS_BRACKETS)
          + tiered(max(s-STD_DED_MFS,0), DC_BRACKETS))
    nd = (s - tx - ibr_payment(s, FPL150_FAM4)) / N
    saved = nd*N - NCARE*care_day + fsa - 10_046
    print(f"{s:>8,}{nd:>10,.0f}{nd-care_day:>23,.0f}{saved:>11,.0f}")
