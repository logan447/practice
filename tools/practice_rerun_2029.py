"""Solo DC home-visit practice, re-run 2029 with the two-car floor
and the cost lines the earlier $65,348 figure left out.

What the old number missed: the second car is a household safety floor
(OWNER-FACT: nobody home alone with three children and no vehicle), and
disability, term life and backup care were never charged. Malpractice
and licences/DEA/CME ARE charged here, inside practice overhead, so
they are not double-counted in the household block.
"""
import sys; sys.path.insert(0,"tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M
from home_practice_dc import avg_visit, AWV_SUBSEQ, TCM_MOD
M.DEPENDENTS = 3
FLOOR = 25_000.

BASE, BLEND = avg_visit()
FIXED = {"EMR (Cerbo)":3_360., "Clearinghouse":1_500.,
         "Malpractice (NEEDS-BROKER)":7_500., "Comms (Spruce)":288.,
         "Accounting":2_400., "Registration + domain":156.,
         "Licences, DEA, CME":1_200.}
FIXED_YR = sum(FIXED.values())
SUPPLIES, MI_VISIT, IRS_MI = 4.0, 15.6, 0.70
GAS_MI, MAINT_MI = 3.20/30, 0.09          # actual cash per mile
# household lines the practice does NOT cover
CAR_FIXED = 1_750.+4_200.+1_500.          # depreciation, parking, insurance
OTHER_HH  = 2_800.+900.+600.              # disability, term life, backup care
CARE_DAY  = 10.5*28.                      # a bought care day, no commute

def run(days, visits_day, panel, care_days=0):
    visits = days*visits_day
    gross  = visits*BLEND + panel*0.8*AWV_SUBSEQ + panel*0.25*TCM_MOD
    miles  = visits*MI_VISIT
    var    = visits*SUPPLIES + miles*(GAS_MI+MAINT_MI)
    prac   = FIXED_YR + var
    net_se = gross - prac
    # SE tax on 92.35% of net, half deductible
    se     = net_se*0.9235*0.153
    agi    = net_se - se/2
    tax    = (tiered(max(agi-STD_DED_MFS,0),FED_MFS_BRACKETS)
              + tiered(max(agi-STD_DED_MFS,0),DC_BRACKETS))
    loan   = ibr_payment(agi, FPL150_FAM4)
    care   = care_days*CARE_DAY
    fsa    = min(care,3_750.)*0.30
    saved  = net_se - se - tax - loan - care - CAR_FIXED - OTHER_HH + fsa
    return dict(visits=visits, gross=gross, prac=prac, net_se=net_se,
                se=se, tax=tax, loan=loan, care=care, saved=saved,
                miles=miles, ded=miles*IRS_MI)

print(f"Average home visit: ${BASE:.2f} Medicare, ${BLEND:.2f} blended "
      f"(25% Medicaid)\n")
print("PRACTICE OVERHEAD, annual")
for k,v in FIXED.items(): print(f"  {k:<32}{v:>9,.0f}")
print(f"  {'fixed total':<32}{FIXED_YR:>9,.0f}")
print(f"  plus ${SUPPLIES:.0f}/visit supplies and {MI_VISIT} mi/visit "
      f"of driving\n")

SC = [("A  83 green days, 8 visits  (no childcare)", 83, 8, 260, 0),
      ("B  83 green days, 10 visits (no childcare)", 83,10, 320, 0),
      ("C  120 days, 8 visits, buy care on 37",     120, 8, 320, 37),
      ("D  141 days, 8 visits, buy care on 58",     141, 8, 360, 58)]
print(f"{'scenario':<42}{'visits':>7}{'gross':>10}{'practice':>10}"
      f"{'SE+tax':>9}{'IBR':>7}{'care':>8}{'SAVED':>9}")
for lab,d,v,p,cd in SC:
    r=run(d,v,p,cd)
    print(f"{lab:<42}{r['visits']:>7,}{r['gross']:>10,.0f}{r['prac']:>10,.0f}"
          f"{r['se']+r['tax']:>9,.0f}{r['loan']:>7,.0f}{r['care']:>8,.0f}"
          f"{r['saved']:>9,.0f}"+("  *" if r['saved']>=FLOOR else ""))

print("\nFULL LEDGER, scenario A (the no-childcare version)")
r=run(83,8,260,0)
for lab,val in [("collections (visits + AWV + TCM)", r['gross']),
                ("practice overhead and driving", -r['prac']),
                ("net self-employment income", r['net_se']),
                ("self-employment tax 15.3%", -r['se']),
                ("federal MFS + DC income tax", -r['tax']),
                ("student loan, IBR (no forgiveness)", -r['loan']),
                ("childcare", -r['care']),
                ("second car: depreciation, parking, insurance", -CAR_FIXED),
                ("disability, term life, backup care", -OTHER_HH)]:
    print(f"  {lab:<46}{val:>10,.0f}")
print(f"  {'SAVED':<46}{r['saved']:>10,.0f}")
print(f"  {'vs the $25,000 floor':<46}{r['saved']-FLOOR:>+10,.0f}")
print(f"\n  {r['miles']:,.0f} business miles, ${r['ded']:,.0f} of mileage")
print(f"  deduction available if actual costs are lower (not taken above)")

print("\n\nTHE COMPARISON THAT MATTERS")
fchc = 25_000.
print(f"  FCHC, alternating 3/4 wks, 12 hrs, $62.25/hr   saved ${fchc:>7,.0f}")
for lab,d,v,p,cd in SC[:1]+SC[2:3]:
    r2=run(d,v,p,cd)
    print(f"  practice, {lab[3:].strip():<40} saved ${r2['saved']:>7,.0f}")
print("\n  AND THE LOAN, which is the whole point:")
print(f"    FCHC path:     ~$13,420 paid, ~$490,000 forgiven tax-free")
print(f"    practice path: ~$589,396 lifetime "
      f"($220,749 paid + $368,647 tax bomb) on pre-2014 IBR")
print(f"    difference:    ~$576,000 in the FCHC path's favour")
rA=run(83,8,260,0)
gap=rA['saved']-fchc
print(f"\n  practice beats FCHC by ${gap:,.0f}/yr on cash.")
print(f"  Over the 8.3 years to forgiveness that is ${gap*8.33:,.0f},")
print(f"  against ~$576,000 of loan cost. FCHC wins by "
      f"~${576_000-gap*8.33:,.0f}.")
print("\n  Not modelled, favours the practice: a solo 401(k) opens ~$70,000")
print("  of pre-tax savings space FCHC does not. At a 35% marginal rate")
print("  that is real money, but it funds retirement rather than cash.")
