#!/usr/bin/env python3
"""Four paths to the same four goals, with the IDR route included.

Built 2026-10-24 after the owner correctly pointed out that the earlier
comparison assumed 10-year standard repayment if he leaves nonprofit
work. It does not have to be. IBR's 20-year forgiveness is the real
fallback, which changes the bar enormously.

Owner facts (VERIFIED 2026-10-24): balance $319,221; 22 qualifying
payments; Jamie $185k -> $205k in 2031; kids 2029-2031; Wharf; wants
T/W/Th in person; wants >= $25,000 saved a year.

A car is assumed in EVERY path (owner, 2026-10-24).
"""
FICA = .0765; SE = .153; SD = 16_100.
FED = [(12_400,.10),(50_400,.12),(105_700,.22),(201_775,.24),(256_225,.32)]
DCT = [(10_000,.04),(40_000,.06),(60_000,.065),(250_000,.085)]
BAL = 319_221.; RATE = .065; FPL5 = 56_475.
IDR_YEARS_LEFT = (240 - 22) / 12          # IBR, new borrower = 20 yrs
NANNY3 = 34.                               # $/hr, 3 kids, DC EST


def tax(a, b):
    t_, last = 0., 0.
    for cap, r in b:
        if a <= last: break
        t_ += (min(a, cap) - last) * r; last = cap
    return t_ + (a - last) * b[-1][1] if a > last else t_


def care(hrs_week):
    wk = min(hrs_week,40)*NANNY3 + max(hrs_week-40,0)*NANNY3*1.5
    return wk * 52 * 1.09


def car(commute_miles):
    gas = commute_miles / 30 * 3.20
    maint = commute_miles * .09
    resid = 6_000. if commute_miles > 10_000 else 9_000.
    return gas + maint + 1_500. + 4_200. + (20_000. - resid) / 8


def idr_endgame(avg_payment):
    """Balance at year-20 forgiveness, the tax on it, and the annual
    sinking fund needed to be ready for it. Forgiveness is TAXABLE
    from 2026 (ARPA exclusion lapsed); DC conforms."""
    r, n = 1 + RATE, IDR_YEARS_LEFT
    bal = BAL * r**n - avg_payment * (r**n - 1) / RATE
    bomb = bal * .40                       # EST top fed + DC. NEEDS-CPA
    fund = bomb * .05 / ((1.05)**n - 1)    # EST 5% real return
    return bal, bomb, fund


def w2_path(salary, commute_miles, care_hrs):
    t_ = tax(max(salary-SD,0),FED) + tax(max(salary-SD,0),DCT) + salary*FICA
    loan = max(salary - FPL5, 0) * .10
    return salary - t_ - loan - car(commute_miles) - care(care_hrs) + 1_125


def solo_path(net_biz, commute_miles, care_hrs, pslf):
    se = net_biz * .9235 * SE
    agi = net_biz - se / 2
    t_ = tax(max(agi-SD,0),FED) + tax(max(agi-SD,0),DCT) + se
    loan = max(agi - FPL5, 0) * .10
    fund = 0. if pslf else idr_endgame(loan)[2]
    return net_biz - t_ - loan - car(commute_miles) - care(care_hrs) - fund


if __name__ == "__main__":
    print("2031 — three kids under five, the worst year. Target: $25,000 saved.\n")
    print("PATH A/B — FCHC, 8-hr clinic days, 11-hr absence, 33 hrs of care")
    for s in (65_000., 80_000.):
        print(f"   ${s:,.0f} salary, Jamie covers 0 days   "
              f"${w2_path(s,13_200,33):>10,.0f}")
    for days in (1, 2):
        hrs = 33 - 11*days
        print(f"   $80,000, Jamie covers {days} day/wk      "
              f"${w2_path(80_000.,13_200,hrs):>10,.0f}")

    print("\nPATH C — Wharf practice, IBR 20-yr forgiveness (TAXABLE ~2045)")
    bal, bomb, fund = idr_endgame(7_000.)
    print(f"   balance at forgiveness  ${bal:>12,.0f}")
    print(f"   tax due that year       ${bomb:>12,.0f}  EST 40%")
    print(f"   sinking fund needed     ${fund:>12,.0f}/yr for "
          f"{IDR_YEARS_LEFT:.0f} yrs")
    print(f"   {'hrs/wk':>7s} {'visits/yr':>10s} {'members':>8s} "
          f"{'revenue':>10s} {'SAVED':>10s}")
    for H in (6, 7, 8):
        hrs = 3 * (H + 1)                  # +1 hr/day of buffer
        visits = (H // 2) * 3 * 40
        for M in (40, 60, 80):
            rev = visits * 130 + M * 100 * 12 * .96
            net = solo_path(rev - 18_000., 4_000, hrs, pslf=False)
            flag = "  <-- clears $25k" if net >= 25_000 else ""
            print(f"   {hrs:7d} {visits:10d} {M:8d} {rev:10,.0f} "
                  f"{net:10,.0f}{flag}")

    print("\nPATH D — same practice as a 501(c)(3), he is its employee, PSLF")
    for s in (110_000., 130_000., 150_000.):
        print(f"   ${s:,.0f} salary, 18 hrs of care   "
              f"${w2_path(s,4_000,21):>10,.0f}")


# =====================================================================
# Fallbacks if PSLF is off the table. Added 2026-10-24 after the owner
# flagged he is likely a PRE-2014 borrower (IBR = 15% / 25 yrs, not
# 10% / 20) and may end up on RAP (30 yrs).
#
# THE SURPRISE: RAP wins despite being the longest, because its
# interest subsidy stops the balance ballooning, and the balance is
# what the year-30 tax bill is charged on. IDR forgiveness has been
# taxable again since 2026 (ARPA exclusion lapsed; DC conforms).
#
#   plan                      total paid   forgiven      tax    TOTAL
#   IBR pre-2014  (25 yr)       220,749     921,617   368,647   589,396
#   IBR post-2014 (20 yr)       115,404     816,849   326,739   442,143
#   RAP           (30 yr)       287,300     302,321   120,928   408,228
#   PSLF          (10 yr)        13,420     524,000         0    13,420
#
# PSLF is worth ~$395,000 more than the best fallback, and ends at 41
# instead of 59. But the NEAR-TERM cash cost of giving it up is only
# about $11,000/yr ($8,921 more in payments + $2,072 of sinking fund
# for the tax bill). Those two numbers point in opposite directions
# and the choice is really about which horizon he is optimizing.
#
# OWNER-FACT to settle this: did he carry an outstanding FFEL/Direct
# balance on 2014-07-01? That decides 15%/25yr vs 10%/20yr. Also which
# IDR plan he is on NOW, since that is what his 22 payments sit under.
# =====================================================================
