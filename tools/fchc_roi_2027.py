"""What FCHC gets back on the 35-week contract at $40 an hour, from January 2027.

Cost  : 70 days x 15 clocked hours x $40 = $42,000
Volume: 70 clinic days at 16 patients. The hourly rate buys HOURS, not
        encounters, so patients per day is the lever on the return.
Blended collection per visit is UNSET; $90 and $100 bracket the guess.
"""
DAYS, HRS, RATE, EMP = 70, 15.0, 40.0, 1.09
PAY, LOADED = DAYS*HRS*RATE, DAYS*HRS*RATE*EMP
print(f"Pay          ${PAY:,.0f}")
print(f"With payroll ${LOADED:,.0f}  (employer burden {EMP-1:.0%})")
print(f"Clinic days  {DAYS}   clocked hours {DAYS*HRS:,.0f}   "
      f"{DAYS*HRS/35:.1f} h a contract week\n")

print("Patient-facing minutes per day (15h clocked, 60 min of breaks):")
for p in (16,20):
    print(f"  {p} patients -> {(HRS*60-60)/p:.0f} min each")

print("\nMarginal overhead, bottom-up in tools/fchc_overhead_bottomup.py.")
print("The question is not 'what is your overhead' but 'will I be working")
print("on days you are already open and staffed'.\n")
for oh,label in ((0.19,'already staffed those days'),
                 (0.40,'central estimate'),
                 (0.55,'dedicated staffing')):
    print(f"  overhead {oh:.0%}  ({label})")
    for e in (90.,100.):
        for p in (16,20):
            enc=DAYS*p; keep=enc*e*(1-oh)-LOADED
            print(f"     {p}/day at ${e:.0f}: {enc:,} visits, "
                  f"collects ${enc*e:,.0f}, clinic keeps ${keep:,.0f} "
                  f"({keep/LOADED:+.0%})")
    print()

enc=DAYS*16
print(f"At 16 a day ({enc:,} visits a year):")
print(f"  my loaded cost per visit   ${LOADED/enc:,.2f}")
for e in (90.,100.):
    print(f"  my share of ${e:.0f} collections  {LOADED/(enc*e):.0%}")
for e in (90.,100.):
    print(f"  break-even overhead at ${e:.0f}  {1-LOADED/(enc*e):.0%}")
