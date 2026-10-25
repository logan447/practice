"""Return on salary: what the clinic keeps per dollar it pays him.

contribution = collections - marginal overhead - his loaded cost
return       = contribution / his loaded cost
"""
D, SAL, EMP, OH = 83, 41_500., 1.09, 0.40
LOADED = SAL*EMP
print(f"Loaded cost ${LOADED:,.0f}. Marginal overhead {OH:.0%}.\n")
print(f"{'':>14}" + "".join(f"{f'at ${e}':>24}" for e in (90,103)))
print(f"{'':>14}" + "  collections  keeps  return"*2)
for pts in (16,20):
    row=f"{pts} patients".rjust(14)
    for e in (90.,102.97):
        coll=D*pts*e; keep=coll*(1-OH)-LOADED
        row += f"{coll:>13,.0f}{keep:>8,.0f}{keep/LOADED:>8.0%}"
    print(row)
print(f"\nPer dollar paid, the clinic keeps:")
for pts in (16,20):
    for e in (90.,102.97):
        coll=D*pts*e; keep=coll*(1-OH)-LOADED
        print(f"  {pts} patients at ${e:.0f}: {keep/LOADED:>5.0%}  "
              f"(${keep/LOADED:.2f} on every $1.00)")
print("\nWHAT HIS COST IS AS A SHARE OF THE COLLECTIONS HE GENERATES")
for pts in (16,20):
    for e in (90.,102.97):
        print(f"  {pts} at ${e:.0f}: {LOADED/(D*pts*e):>5.1%}")
print("\nTHE SAME ARITHMETIC AT OTHER COST SHARES (overhead held at 40%)")
print("  This is not a claim about what physicians earn. It is what the")
print("  return would be if the role cost a given share of collections.")
print(f"{'cost share':>12}{'return per $1':>16}")
for s in (0.25,0.30,0.35,0.40,0.45,0.50):
    print(f"{s:>11.0%}{(1-OH-s)/s:>16.0%}")

print("\nBREAK-EVEN: what the clinic must collect per visit to cover me")
print("  (collections * (1 - overhead) * encounters = loaded cost)")
for pts in (16,20):
    enc = D*pts
    be  = LOADED/(enc*(1-OH))
    print(f"  {pts} patients a day: {enc:,} encounters, break-even ${be:,.2f} a visit")
print(f"  My cost per encounter at 16 a day: ${LOADED/(D*16):,.2f}")
