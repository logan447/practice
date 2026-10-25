"""13 clocked hours a day, 16 to 20 patients. What it does to both sides.

The hours that make PSLF work are the same hours that dilute the
clinic's return, because clocked admin time generates no encounters.
"""
DAYS, WKS, RATE, EMP, OH = 83, 35, 50.0, 1.09, 0.40
FLOOR = 30*WKS/DAYS
print(f"Minimum clocked hours to average 30 h/week over {WKS} weeks: "
      f"{FLOOR:.2f} a day\n")
print(f"{'clocked h':>10} {'total h':>9} {'h/week':>7} {'pay':>10} {'loaded':>10} "
      f"{'PSLF':>6}")
for h in (12.0, 12.65, 12.75, 13.0, 14.0):
    t=DAYS*h; pay=t*RATE
    print(f"{h:>10} {t:>9,.0f} {t/WKS:>7.2f} ${pay:>9,.0f} ${pay*EMP:>9,.0f} "
          f"{'OK' if t/WKS>=30 else 'short':>6}")

H=13.0
LOADED=DAYS*H*RATE*EMP
print(f"\nAT {H} CLOCKED HOURS  ({DAYS*H:,.0f} h, {DAYS*H/WKS:.2f} h/week, "
      f"pay ${DAYS*H*RATE:,.0f}, loaded ${LOADED:,.0f})\n")
print(f"{'patients/day':>13} {'encounters':>11} {'min each':>9} "
      f"{'at $90 keeps':>14} {'ret':>5} {'at $103 keeps':>15} {'ret':>5}")
for pts in (16,20):
    enc=DAYS*pts; mins=(H*60-45)/pts; row=f"{pts:>13} {enc:>11,} {mins:>9.0f}"
    for e in (90.,102.97):
        keep=enc*e*(1-OH)-LOADED
        row+=f"{keep:>14,.0f}{keep/LOADED:>6.0%}" if e==90. else f"{keep:>15,.0f}{keep/LOADED:>6.0%}"
    print(row)
print(f"\nBREAK-EVEN per visit at {H} clocked hours:")
for pts in (16,20):
    enc=DAYS*pts
    print(f"  {pts} a day: ${LOADED/(enc*(1-OH)):,.2f}")
print(f"\nWHAT EACH EXTRA CLOCKED HOUR COSTS THE CLINIC")
print(f"  ${RATE*EMP:,.2f} an hour, {DAYS} days a year = "
      f"${DAYS*RATE*EMP:,.0f} per hour added to the day, and no new encounters.")
print(f"  Going from {FLOOR:.2f} h (the PSLF floor) to {H} h costs them "
      f"${(H-FLOOR)*DAYS*RATE*EMP:,.0f} and pays me "
      f"${(H-FLOOR)*DAYS*RATE:,.0f} more.")
print(f"\nLABOUR COST PER VISIT at {H} clocked hours:")
for pts in (16,20):
    print(f"  {pts} a day: ${LOADED/(DAYS*pts):,.2f} a visit")
