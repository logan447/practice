"""What each PSLF full-time pathway requires, in clinic days.

34 CFR 685.219(b)(11)(i):
  (A) a minimum AVERAGE of 30 hours/week during the period certified
  (B) a minimum of 30 hours/week THROUGHOUT a contractual or employment
      period of at least 8 months in a 12-month period
"""
WEEKS = 52.1786
MONTHS8 = 8/12 * WEEKS

print(f"8 months = {MONTHS8:.1f} weeks, x30 = {MONTHS8*30:,.0f} hours\n")
for h in (10, 12):
    print(f"--- {h}-hour clinic days")
    print(f"  (A) no leave credit: {WEEKS*30:,.0f} h -> {WEEKS*30/h:.0f} days")
    for L in (0, 8, 12):
        work_wk = WEEKS - L
        print(f"  (A) {L:>2} wks paid leave credited: {work_wk*30:,.0f} h "
              f"over {work_wk:.0f} wks -> {work_wk*30/h:.0f} days")
    print(f"  (B) 3 clinic days every week, 8 months -> {3*MONTHS8:.0f} days")
    admin = (30 - 2*h) * MONTHS8
    print(f"  (B) 2 clinic days/wk + admin to 30 -> {2*MONTHS8:.0f} days "
          f"+ {admin:,.0f} admin hours ({30-2*h:.0f} h/wk)\n")

print("CURRENT PROPOSAL")
for h in (10, 12):
    print(f"  83 x {h}h = {83*h:,} hours = {83*h/WEEKS:.1f} h/week over 52 weeks")
