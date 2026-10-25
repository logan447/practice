"""Can FCHC justify $74/hr for a three-day clinic physician?

This is the CLINIC's side of the ledger, not the household's.
Everything about FCHC's actual payer mix, collections and overhead is
UNSET, so this is built as a break-even surface rather than a forecast:
it says what would have to be true, not what is true.
"""
CF       = 33.40          # VERIFIED CY2026 conversion factor
G2211    = 16.57          # VERIFIED, billable with office E&M
NET_COLL = 0.93           # EST denials, write-offs, uncollected patient share
RATE_HR  = 74.25          # DERIVED: the rate that clears the household floor
CLIN_H   = 10.0           # OWNER-FACT clinic hours per day
DAYS     = 120            # T/W/Th x 40 weeks
EMP_TAX  = 0.09           # EST FICA + FUTA + DC UI + workers comp

# Total (non-facility) RVUs, CY2026. EST: values move yearly, REFRESH-AT-RUNWAY
TRVU = {"99212":1.29, "99213":2.19, "99214":3.12, "99215":4.28}
AWV  = 137.61             # VERIFIED G0439 subsequent AWV

comp_day  = RATE_HR * CLIN_H
loaded    = comp_day * (1 + EMP_TAX)
comp_yr   = comp_day * DAYS
loaded_yr = loaded * DAYS

print(f"WHAT $74.25/hr COSTS FCHC\n")
print(f"  {RATE_HR:.2f}/hr x {CLIN_H:.0f} hrs       = ${comp_day:,.2f} per clinic day")
print(f"  + employer tax {EMP_TAX:.0%}        = ${loaded:,.2f} per clinic day")
print(f"  x {DAYS} clinic days       = ${loaded_yr:,.0f} per year "
      f"(${comp_yr:,.0f} in wages)\n")
print("  No benefits, no paid leave, no paid admin time. They buy")
print(f"  {DAYS} days of physician time and nothing else.\n")

print("WHAT A COMMERCIAL / MEDICARE FEE-FOR-SERVICE VISIT PAYS")
for c, r in TRVU.items():
    print(f"  {c}  {r:>4.2f} RVU x ${CF}  = ${r*CF:>6,.2f}"
          f"   (+G2211 = ${r*CF+G2211:>6,.2f})")
print(f"  G0439 annual wellness visit        = ${AWV:,.2f}")
mix = {"99213":0.35, "99214":0.50, "99215":0.10, "99212":0.05}
avg = sum(TRVU[c]*CF*w for c, w in mix.items()) + G2211
print(f"\n  EST mix 35/50/10/5 across 99213/14/15/12, all with G2211:")
print(f"  gross ${avg:,.2f}/encounter, net of collections "
      f"${avg*NET_COLL:,.2f}\n")

print("BREAK-EVEN SURFACE")
print("  Rows: encounters per 10-hour clinic day.")
print("  Cols: average NET collection per encounter.")
print("  Cell: clinic contribution per day AFTER paying the physician")
print("        but BEFORE clinic overhead.  Negative = unaffordable.\n")
cols = (70, 90, 110, 130, 150, 190, 230)
print(f"{'enc/day':>8}" + "".join(f"{c:>9}" for c in cols))
for enc in (12, 14, 16, 18, 20, 22):
    row = f"{enc:>8}"
    for c in cols:
        row += f"{enc*c - loaded:>9,.0f}"
    print(row)

print("\n  Same grid, as physician cost / collections. Primary care")
print("  usually runs physician comp at 35-45% of collections.\n")
print(f"{'enc/day':>8}" + "".join(f"{c:>9}" for c in cols))
for enc in (12, 14, 16, 18, 20, 22):
    row = f"{enc:>8}"
    for c in cols:
        row += f"{loaded/(enc*c):>8.0%} "
    print(row)

print("\nTHE THRESHOLDS THAT MATTER")
for pct, lab in ((0.45, "comp at 45% of collections (generous to FCHC)"),
                 (0.40, "comp at 40% (typical)"),
                 (0.35, "comp at 35% (lean)")):
    need = loaded / pct
    print(f"  {lab}")
    print(f"    collections needed: ${need:,.0f}/day "
          f"(${need*DAYS:,.0f}/yr)")
    for enc in (14, 16, 18, 20):
        print(f"      at {enc} enc/day -> ${need/enc:,.0f} per encounter")
    print()

print("IF FCHC IS AN FQHC OR LOOK-ALIKE  <-- decisive, and UNSET")
print("  FQHCs are paid a per-visit PPS rate, not RVUs. EST ranges:")
for lab, lo, hi in (("Medicare FQHC PPS", 185, 215),
                    ("DC Medicaid FQHC PPS", 150, 260)):
    print(f"    {lab:<22} ${lo}-${hi}/visit")
for r in (150, 185, 215, 260):
    for enc in (14, 18):
        pass
print("  At $185/visit and 16 encounters: ${:,.0f}/day collections,"
      .format(185*16))
print("  physician cost is {:.0%} of that. Comfortable."
      .format(loaded/(185*16)))
print("  At $100/visit and 14 encounters: ${:,.0f}/day,".format(100*14))
print("  physician cost is {:.0%}. Not affordable."
      .format(loaded/(100*14)))

print("\nWHAT HE GENERATES OVER THE YEAR, at 16 enc/day")
for c in (90, 110, 130, 185):
    coll = 16 * c * DAYS
    print(f"  ${c}/encounter -> ${coll:,.0f} collections, "
          f"physician cost {loaded_yr/coll:>4.0%}, "
          f"contribution ${coll-loaded_yr:,.0f}")
