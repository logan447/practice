"""What FCHC gets back on the 35-week contract.

Cost  : 83 days x 12.75 clocked hours x $50 = $52,912.50
Volume: 83 clinic days. The hourly rate buys HOURS, not encounters,
        so patients per day is the lever that moves the return.
"""
DAYS, HRS, RATE, EMP, OH = 83, 12.75, 50.0, 1.09, 0.40
PAY   = DAYS*HRS*RATE
LOADED= PAY*EMP
print(f"Pay          ${PAY:,.0f}")
print(f"With payroll ${LOADED:,.0f}  (employer burden {EMP-1:.0%})")
print(f"Clinic days  {DAYS}   clocked hours {DAYS*HRS:,.0f}\n")

print("Patient-facing minutes available per day:")
for pts in (16,20,24):
    print(f"  {pts} patients -> {(HRS*60-45)/pts:.0f} min each "
          f"(12h45m clocked, 45 min for breaks)")

print(f"\nOverhead is MARGINAL at {OH:.0%} of collections: rent, records,")
print("management and the front desk do not change because I am there.\n")
print(f"{'patients/day':>13} {'encounters':>11} {'at $90':>22} {'at $103':>22}")
print(f"{'':>13} {'':>11} {'collects   keeps  return':>22} {'collects   keeps  return':>22}")
for pts in (16,20,24):
    enc=DAYS*pts; row=f"{pts:>13} {enc:>11,}"
    for e in (90.,102.97):
        coll=enc*e; keep=coll*(1-OH)-LOADED
        row+=f"{coll:>10,.0f}{keep:>8,.0f}{keep/LOADED:>8.0%}"
    print(row)

print(f"\nBREAK-EVEN: what the clinic must collect per visit to cover me")
for pts in (16,20,24):
    enc=DAYS*pts
    print(f"  {pts} patients a day ({enc:,} encounters): ${LOADED/(enc*(1-OH)):,.2f} a visit")

print(f"\nMY COST AS A SHARE OF THE COLLECTIONS I GENERATE")
for pts in (16,20,24):
    enc=DAYS*pts
    print(f"  {pts}/day: {LOADED/(enc*90):.0%} at $90, {LOADED/(enc*102.97):.0%} at $103")
