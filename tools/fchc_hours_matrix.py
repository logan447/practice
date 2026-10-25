import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
M.DEPENDENTS = 3
RATE, N, NCARE, WORKWK = 50.0, 120, 68, 40
COMMUTE, CARE_HR, CAR, FLOOR = 2.5, 34.0, 10_046., 25_000.

def run(clin_h, hrs_wk):
    sal   = RATE * hrs_wk * 52
    paid  = hrs_wk * 52
    clin  = N * clin_h
    adm_wk = hrs_wk - 3*clin_h              # admin per working week
    leave = 12 * hrs_wk
    care  = NCARE * (clin_h + COMMUTE) * CARE_HR
    fsa   = min(care, 3_750.)*0.30
    tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
          + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
    loan = ibr_payment(sal, FPL150_FAM4)
    return dict(sal=sal, paid=paid, clin=clin, adm_wk=adm_wk, leave=leave,
                care=care, saved=sal-tx-loan-care-CAR+fsa,
                away=clin_h+COMMUTE, careday=(clin_h+COMMUTE)*CARE_HR,
                netday=(sal-tx-loan)/N)

print("=== $50/hr, 10-HOUR CLINIC DAYS, STRICTLY 30 HRS/WEEK ===\n")
r = run(10, 30)
print("HOW 30.0 IS BUILT  (nothing to claim beyond clinic time)")
print(f"  3 clinic days x 10 hrs            = 30 hrs in a working week")
print(f"  {WORKWK} working weeks x 30         = {N*10:>6,.0f} hrs")
print(f"  12 paid leave weeks x 30        = {r['leave']:>6,.0f} hrs")
print(f"  TOTAL PAID                      = {r['paid']:>6,.0f} hrs")
print(f"  {r['paid']:,.0f} / 52 = 30.00 hrs/week   admin hrs needed: "
      f"{r['adm_wk']:.0f}")
print(f"  salary = ${r['sal']:,.0f}\n")
print("THE YEAR")
sal, care = r['sal'], r['care']
tx = (sal*FICA_EMPLOYEE + tiered(max(sal-STD_DED_MFS,0),FED_MFS_BRACKETS)
      + tiered(max(sal-STD_DED_MFS,0),DC_BRACKETS))
loan = ibr_payment(sal, FPL150_FAM4)
for lab,v in [("gross salary",sal),("tax + FICA",-tx),("IBR",-loan),
              (f"childcare, {NCARE} x ${r['careday']:.0f}",-care),
              ("second car",-CAR),("FSA back",min(care,3750.)*0.30)]:
    print(f"  {lab:<32}{v:>12,.0f}")
print(f"  {'SAVED':<32}{r['saved']:>12,.0f}")
print(f"  {'vs the $25,000 floor':<32}{r['saved']-FLOOR:>+12,.0f}")
print(f"\n  away from home per clinic day   {r['away']:.1f} hrs")
print(f"  take-home per clinic day        ${r['netday']:,.0f}")
print(f"  kept on a care day              ${r['netday']-r['careday']:,.0f}")

print("\n\n=== WHY THE 10-HOUR DAY COSTS YOU: 8 vs 10, both at 30 hrs/wk ===\n")
print(f"{'clinic/day':>11}{'admin/wk':>10}{'away':>7}{'care/day':>10}"
      f"{'care/yr':>10}{'salary':>9}{'SAVED':>9}")
for ch in (8,10):
    x = run(ch,30)
    print(f"{ch:>11}{x['adm_wk']:>10.0f}{x['away']:>7.1f}"
          f"{x['careday']:>10,.0f}{x['care']:>10,.0f}"
          f"{x['sal']:>9,.0f}{x['saved']:>9,.0f}")
d = run(8,30)['saved'] - run(10,30)['saved']
print(f"\n  Same salary, same 30 hrs. The 8-hour day is worth ${d:,.0f}/yr,")
print(f"  because 6 of the 30 hrs become admin you do at home instead of")
print(f"  clinic hours you pay a sitter to cover.")

print("\n\n=== FULL MATRIX: clinic hrs/day x contracted hrs/week ===")
print("    (cells are SAVED/yr; * = clears the $25,000 floor)\n")
hdr = "".join(f"{h:>12}" for h in (30,32,34,36,38))
print(f"{'clinic/day':>11}{hdr}")
for ch in (8,9,10):
    row = f"{ch:>11}"
    for hw in (30,32,34,36,38):
        x = run(ch,hw)
        if x['adm_wk'] < 0: row += f"{'n/a':>12}"; continue
        row += f"{x['saved']:>11,.0f}" + ("*" if x['saved']>=FLOOR else " ")
    print(row)
print("\n  (n/a = contracted hours below clinic hours, impossible)")
print("\n  salary at each column:", "  ".join(
    f"{h}hr=${RATE*h*52:,.0f}" for h in (30,32,34,36,38)))

print("\n\n=== 10-HOUR DAYS: what it takes to clear the floor ===\n")
r10 = run(10,30)
gap = FLOOR - r10['saved']
print(f"  gap at 30 hrs/wk: ${gap:,.0f}  "
      f"= {gap/r10['careday']:.1f} care days at ${r10['careday']:.0f}")
print(f"  Jamie's 4 usable backup weeks hold 12 care days "
      f"= ${12*r10['careday']:,.0f}")
print(f"  moving all 4 into my off-blocks: saved "
      f"${r10['saved']+12*r10['careday']:,.0f} "
      f"({r10['saved']+12*r10['careday']-FLOOR:+,.0f})\n")
for hw in (30,32,34,36):
    x = run(10,hw)
    print(f"  {hw} hrs/wk (${x['sal']:,.0f}), {x['adm_wk']:.0f} admin hrs/wk: "
          f"saved ${x['saved']:,.0f} ({x['saved']-FLOOR:+,.0f})")
