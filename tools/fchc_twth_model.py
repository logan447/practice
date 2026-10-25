import sys
sys.path.insert(0, "tools")
from phase2_personal_model import (tiered, ibr_payment, FICA_EMPLOYEE,
    STD_DED_MFS, FED_MFS_BRACKETS, DC_BRACKETS, FPL150_FAM4)
import phase2_personal_model as M

# ---- T/W/Th fixed-schedule structure (DERIVED) ----
WEEKS_WORKED   = 40          # 52 - 12 off
DAYS           = WEEKS_WORKED * 3            # 120 clinic days
CLINIC_HRS     = 10.0
PAID_WK_HRS    = 32.0                        # contracted FTE
CARE_HR        = 34.0        # EST loaded nanny/sitter rate, 1-3 kids
CARE_DAY_HRS   = 12.0        # 10 clinic + ~2.5 commute, rounded
GREEN_SHARE    = 0.41        # DERIVED from the 2029 calendar: 83 green
                             # weekdays / 201 non-vacation weekdays

# car: Option B was 156 days / 17,160 mi -> 110 mi/day round trip
MI_DAY = 110.0
def car(days):
    gas  = 1830.0  * days/156
    maint= 1544.0  * days/156
    dep  = 1373.0  * days/156
    return gas + maint + dep

def tax_of(sal):
    return (sal*FICA_EMPLOYEE
            + tiered(max(sal-STD_DED_MFS,0), FED_MFS_BRACKETS)
            + tiered(max(sal-STD_DED_MFS,0), DC_BRACKETS))

def row(sal, green_share=GREEN_SHARE, days=DAYS,
        care_hr=CARE_HR, day_hrs=CARE_DAY_HRS):
    M.DEPENDENTS = 3
    bought = round(days * (1 - green_share))
    care   = bought * day_hrs * care_hr
    dcfsa  = min(care, 3_750.0) * 0.30
    t      = tax_of(sal)
    loan   = ibr_payment(sal, FPL150_FAM4)
    c      = car(days)
    saved  = sal - t - loan - care - c + dcfsa
    return bought, t, loan, care, c, dcfsa, saved

print("T/W/Th, 40 wks, 120 clinic days, 32 hr/wk contracted, 3 kids, 2029")
print("hours: 120 x 10 = 1,200 worked + 12 wks paid leave @32 = 1,584 paid")
print("       1,584 / 52 = 30.5 hr/wk  -> PSLF qualifies, small margin\n")
print(f"{'salary':>8}{'bought':>8}{'tax':>9}{'IBR':>7}{'care':>9}{'car':>7}{'FSA':>7}{'SAVED':>9}")
for s in (65_000, 70_000, 75_000, 80_000, 85_000, 90_000):
    b,t,l,ca,c,f,sv = row(s)
    print(f"{s:>8,}{b:>8}{t:>9,.0f}{l:>7,.0f}{ca:>9,.0f}{c:>7,.0f}{f:>7,.0f}{sv:>9,.0f}")

print("\n--- CAN $65,000 WORK? what has to change ---")
print("need SAVED >= 25,000 at salary 65,000\n")
b,t,l,ca,c,f,sv = row(65_000)
print(f"as modelled:                       saved {sv:>8,.0f}  gap {sv-25_000:>+8,.0f}")

# lever 1: Jamie steers shifts off T/W/Th
for g in (0.50, 0.55, 0.60, 0.65, 0.70):
    b,t,l,ca,c,f,sv = row(65_000, green_share=g)
    print(f"Jamie covers {g:.0%} of T/W/Th ({b:>2} bought)  saved {sv:>8,.0f}  gap {sv-25_000:>+8,.0f}")

print()
# lever 2: shorter absence (no Fredericksburg commute / 8hr clinic)
for h in (12, 11, 10, 9):
    b,t,l,ca,c,f,sv = row(65_000, day_hrs=h)
    print(f"care day {h} hrs                      saved {sv:>8,.0f}  gap {sv-25_000:>+8,.0f}")

print()
# lever 3: cheaper care
for r in (34, 30, 26, 22):
    b,t,l,ca,c,f,sv = row(65_000, care_hr=r)
    print(f"care ${r}/hr                          saved {sv:>8,.0f}  gap {sv-25_000:>+8,.0f}")

print("\n--- combination: Jamie at 55% green + 11-hr care day ---")
b,t,l,ca,c,f,sv = row(65_000, green_share=0.55, day_hrs=11)
print(f"  bought {b} days, care ${ca:,.0f}, saved ${sv:,.0f}")
