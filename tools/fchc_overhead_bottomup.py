"""What overhead actually applies to two added clinic days a week.

The 40 percent figure used throughout is MARGINAL overhead: what one
more session costs the clinic. Published benchmarks (55-70 percent of
revenue for family medicine) are AVERAGE overhead, which includes rent,
management and the front desk. Those do not change because one
physician is there on a Tuesday, so they are the wrong number here.

76 clinic days, 1,216 encounters, $100 blended = $121,600 collected.
"""
ENC, COLL = 1216, 121_600.
def pct(x): return f"{x/COLL:.0%}"
print(f"{'item':<34}{'low':>10}{'high':>10}   what drives it")
rows=[
 ("Medical assistant on clinic days", 0, 19_950,
  "zero if the clinic is already staffed those days"),
 ("Front desk",                       0,  4_000,
  "zero if already open; part of a post if not"),
 ("Rent, utilities, management",      0,      0,
  "unchanged by one more session"),
 ("Malpractice, part-time primary care", 5_000, 9_000, "a real added policy"),
 ("EMR licence, per provider",        3_600,  8_400, "per-seat, so marginal"),
 ("Clinical supplies and vaccines",   9_728, 18_240, "$8 to $15 an encounter"),
 ("Billing and revenue cycle",        4_864,  7_296, "4 to 6 percent of collections"),
]
lo=hi=0
for n,a,b,why in rows:
    lo+=a; hi+=b
    print(f"{n:<34}{a:>10,}{b:>10,}   {why}")
print(f"{'TOTAL':<34}{lo:>10,}{hi:>10,}")
print(f"{'as marginal overhead':<34}{pct(lo):>10}{pct(hi):>10}")
print(f"\n  Midpoint {(lo+hi)/2:,.0f}, which is {(lo+hi)/2/COLL:.0%}. The 40 percent")
print("  used throughout sits just above the middle of that range.\n")
print("THE QUESTION THAT DECIDES IT")
print("  Not 'what is your overhead' but 'will I be working on days you")
print("  are already open with staff present?' If yes, the MA and front")
print(f"  desk lines go to zero and marginal overhead is {pct(lo)}. If the")
print(f"  clinic has to staff up for him, it is {pct(hi)}.\n")
print("WHAT EACH MEANS AT $45 AN HOUR (cost $45.98 an encounter)")
for o,lbl in ((lo/COLL,'low, already staffed'),(0.40,'the 40% used here'),
              (hi/COLL,'high, dedicated staffing')):
    print(f"  {lbl:<26} overhead {o:>4.0%}  ->  clinic return "
          f"{(100*(1-o)-45.98)/45.98:>5.0%} at $100 blended")
print("\nFCHC'S OWN FILING (FY2024, Form 990)")
print("  revenue $1,643,163, of which program services $950,079 and")
print("  contributions $578,732. Expenses $1,622,030: medical director")
print("  $139,293 (8.6%), other salaries $849,390 (52.4%), everything")
print("  else $633,347 (39%).")
print("  Clinical revenue does not cover clinical cost there. Donations")
print("  close the gap. So a clinician who covers his own cost is")
print("  already helping, which is a different argument from ROI.")
