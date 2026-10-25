"""Do the FCHC contract and a 0.75 FTE at Olera both fit in one year?

Owner's plan, 2026-10-25:
  FCHC   35 contract weeks, 2 clinic days, 15 clocked hours = 30 h/week
  Olera  0.75 FTE, which he states as an average of 30 h/week over 48
         weeks of the year
  In a contract week he does both, capped at 60 hours.
  He makes up Olera hours in three of the weeks FCHC is not running.

This checks whether the hours actually land.
"""
FCHC_WKS, FCHC_H = 35, 30.0          # 2 days x 15 clocked hours
OLERA_WKS, OLERA_H = 48, 30.0
NEED = OLERA_WKS*OLERA_H
CAP = 60.0
OFF_WKS = 52-FCHC_WKS                # 17: twelve blocks plus five off contract

in_contract = CAP-FCHC_H             # Olera hours that fit beside FCHC
base = FCHC_WKS*in_contract
print(f"Olera needs {OLERA_WKS} x {OLERA_H:.0f} = {NEED:,.0f} hours a year\n")
print(f"In a contract week, a {CAP:.0f}-hour cap leaves "
      f"{in_contract:.0f} h for Olera (3 days x {in_contract/3:.0f}).")
print(f"  {FCHC_WKS} contract weeks x {in_contract:.0f} = {base:,.0f} hours\n")

for n,label in ((3,'the three weeks he named'),):
    got = base + n*CAP
    print(f"Plus {n} full {CAP:.0f}-hour Olera weeks ({label}): "
          f"{n*CAP:,.0f} hours")
    print(f"  TOTAL {got:,.0f} against {NEED:,.0f}  ->  SHORT {NEED-got:,.0f} hours\n")

gap = NEED-base
print("WHAT ACTUALLY CLOSES IT, using the 17 weeks FCHC is not running:")
for h in (60,50,40,30):
    w = gap/h
    print(f"  {w:.1f} weeks at {h} h   ({OFF_WKS-w:.1f} of the 17 still fully off)")
print()
print("OR raise the Olera day inside a contract week:")
for d in (10,11,12):
    wk = FCHC_H + 3*d
    tot = FCHC_WKS*3*d + 3*CAP
    print(f"  3 days x {d} h = {3*d} h  ->  {wk:.0f}-hour contract weeks, "
          f"{tot:,.0f} h with the three catch-up weeks"
          + ("  MEETS IT" if tot>=NEED else f"  short {NEED-tot:,.0f}"))
print()
print("The three weeks he named are 2029 dates. In 2027 the off-contract")
print("weeks are 8 Feb, 5 Apr, 28 Jun, 4 Oct and 11 Oct.")
