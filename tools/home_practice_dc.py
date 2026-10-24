#!/usr/bin/env python3
"""DC home-visit practice billing Medicare/Medicaid. No membership fee.

Built 2026-10-24. Replaces the subscription framing: the owner wants a
Medicare/Medicaid home-visit practice for elderly patients near the
Wharf, driving Jamie's car on days she is off, so childcare and vehicle
costs fall toward zero.

CF $33.40 VERIFIED CY2026 non-QP. RVUs VERIFIED (PALTmed table, used
earlier in tools/home_visit_model.py). Panel mix, no-show rate, payer
mix and overhead are EST and owner-facing assumptions.
"""
CF = 33.40
RVU = {"99347":1.38,"99348":2.35,"99349":3.96,"99350":5.78,
       "99344":4.42,"99345":6.29}
RATE = {c: round(r*CF,2) for c,r in RVU.items()}
G2211 = 16.57
AWV_SUBSEQ = 137.61          # G0439 VERIFIED
TCM_MOD = 207.00             # 99495 EST CY2026
MEDICAID_INDEX = 0.815       # EST DC Medicaid vs Medicare

# Visit mix for a homebound elderly panel, EST
MIX = {"99349":0.45, "99350":0.30, "99348":0.15, "99344":0.10}
MEDICAID_SHARE = 0.25        # EST; duals bill Medicare primary


def avg_visit():
    base = sum(RATE[c]*w for c,w in MIX.items()) + G2211
    blend = base * (1-MEDICAID_SHARE) + base*MEDICAID_INDEX*MEDICAID_SHARE
    return base, blend


def year(days, visits_day, panel, overhead_fixed=12_000., billing=0.06):
    base, blend = avg_visit()
    visits = days * visits_day
    v_rev = visits * blend
    awv = panel * 0.8 * AWV_SUBSEQ          # EST 80% get one a year
    tcm = panel * 0.25 * TCM_MOD            # EST 1 in 4 discharged/yr
    gross = v_rev + awv + tcm
    net = gross - overhead_fixed - gross*billing
    return visits, gross, net


if __name__ == "__main__":
    base, blend = avg_visit()
    print("Per-visit economics, homebound elderly panel")
    for c,w in sorted(MIX.items()):
        print(f"   {c}  {RATE[c]:7.2f}  x{w:.0%}")
    print(f"   + G2211 {G2211:.2f}")
    print(f"   average visit, Medicare       ${base:7.2f}")
    print(f"   blended w/ {MEDICAID_SHARE:.0%} Medicaid      ${blend:7.2f}")
    print(f"\n   G0439 annual wellness ${AWV_SUBSEQ:.2f} | "
          f"99495 TCM ${TCM_MOD:.2f}")

    print(f"\n{'scenario':34s} {'days':>5s} {'visits':>7s} "
          f"{'gross':>10s} {'net':>10s}")
    for name, days, vd, panel in (
        ("A only when Jamie is off (24 wk)", 72, 6, 120),
        ("B 3 d/wk, 40 wk, clustered bldgs", 120, 6, 200),
        ("C 3 d/wk, 40 wk, 8/day clustered", 120, 8, 260),
        ("D 4 d/wk, 40 wk, 8/day", 160, 8, 320),
    ):
        v,g,n = year(days, vd, panel)
        print(f"   {name:31s} {days:5d} {v:7d} {g:10,.0f} {n:10,.0f}")
